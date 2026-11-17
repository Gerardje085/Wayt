import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../src/lib/supabase';
import { useThema } from '../../src/context/ThemeContext';
import PrimaryButton from '../../src/components/ui/PrimaryButton';
import { vertaalFout } from '../../src/utils/errorVertaler';

type Modus = 'inloggen' | 'registreren';
type ActiefVeld = 'naam' | 'email' | 'wachtwoord' | null;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthScreen() {
  const { kleuren } = useThema();
  const [modus, setModus] = useState<Modus>('inloggen');
  const [naam, setNaam] = useState('');
  const [email, setEmail] = useState('');
  const [wachtwoord, setWw] = useState('');
  const [toonWachtwoord, setToonWachtwoord] = useState(false);
  const [actiefVeld, setActiefVeld] = useState<ActiefVeld>(null);
  const [laden, setLaden] = useState(false);
  const [herstelBezig, setHerstelBezig] = useState(false);
  const [foutMelding, setFoutMelding] = useState<string | null>(null);
  const [succesMelding, setSuccesMelding] = useState<string | null>(null);

  const emailRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const wachtwoordRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  const wisselModus = (nieuweModus: Modus) => {
    if (laden || herstelBezig) return;
    setModus(nieuweModus);
    setFoutMelding(null);
    setSuccesMelding(null);
  };

  async function handleInloggen() {
    Keyboard.dismiss();
    setFoutMelding(null);
    setSuccesMelding(null);

    const schoonEmail = email.trim().toLowerCase();
    if (!schoonEmail || !wachtwoord) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setFoutMelding('Vul je e-mailadres en wachtwoord in.');
      return;
    }
    if (!EMAIL_REGEX.test(schoonEmail)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setFoutMelding('Vul een geldig e-mailadres in, bijvoorbeeld naam@voorbeeld.nl.');
      return;
    }

    setLaden(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: schoonEmail,
        password: wachtwoord,
      });
      if (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setFoutMelding(
          vertaalFout(error, 'Inloggen is niet gelukt. Controleer je gegevens en probeer het opnieuw.')
        );
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFoutMelding(
        vertaalFout(err, 'Inloggen is niet gelukt. Controleer je internetverbinding en probeer het opnieuw.')
      );
    } finally {
      setLaden(false);
    }
  }

  async function handleRegistreren() {
    Keyboard.dismiss();
    setFoutMelding(null);
    setSuccesMelding(null);

    const schoneNaam = naam.trim();
    const schoonEmail = email.trim().toLowerCase();

    if (!schoneNaam) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setFoutMelding('Vul je naam in zodat we je in het onderzoek kunnen herkennen.');
      return;
    }
    if (!schoonEmail) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setFoutMelding('Vul je e-mailadres in.');
      return;
    }
    if (!EMAIL_REGEX.test(schoonEmail)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setFoutMelding('Dit e-mailadres lijkt niet te kloppen. Controleer op typefouten.');
      return;
    }
    if (wachtwoord.length < 6) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setFoutMelding('Kies een wachtwoord van minimaal 6 tekens.');
      return;
    }

    setLaden(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: schoonEmail,
        password: wachtwoord,
        options: { data: { group_type: 'gevoel', username: schoneNaam } },
      });

      if (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setFoutMelding(
          vertaalFout(error, 'Account aanmaken is niet gelukt. Probeer het opnieuw.')
        );
        return;
      }

      // Supabase geeft bij ingeschakelde e-mailbevestiging soms geen error maar een lege identities-lijst
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setFoutMelding('Er bestaat al een account met dit e-mailadres. Probeer in te loggen.');
        return;
      }

      if (data.user && data.session) {
        // Direct ingelogd (e-mailbevestiging uit): profiel direct synchroniseren
        await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            group_type: 'gevoel',
            username: schoneNaam,
          });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        // E-mailbevestiging vereist in Supabase
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setModus('inloggen');
        setWw('');
        setSuccesMelding(
          `Account aangemaakt! Klik op de bevestigingslink die we naar ${schoonEmail} hebben gestuurd en kom daarna terug naar deze app om in te loggen.`
        );
      }
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFoutMelding(
        vertaalFout(err, 'Account aanmaken is niet gelukt. Controleer je internetverbinding.')
      );
    } finally {
      setLaden(false);
    }
  }

  async function handleWachtwoordVergeten() {
    Keyboard.dismiss();
    setFoutMelding(null);
    setSuccesMelding(null);

    const schoonEmail = email.trim().toLowerCase();
    if (!schoonEmail || !EMAIL_REGEX.test(schoonEmail)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setFoutMelding('Vul eerst je e-mailadres in om een herstellink te ontvangen.');
      emailRef.current?.focus();
      return;
    }

    setHerstelBezig(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(schoonEmail);
      if (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setFoutMelding(
          vertaalFout(error, 'Kon geen herstelmail sturen. Probeer het later opnieuw.')
        );
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSuccesMelding(
          `Herstellink verstuurd naar ${schoonEmail}. Kijk ook even in je spammap.`
        );
      }
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFoutMelding(
        vertaalFout(err, 'Kon geen herstelmail sturen. Controleer je internetverbinding.')
      );
    } finally {
      setHerstelBezig(false);
    }
  }

  const getVeldStijl = (veld: ActiefVeld) => ({
    backgroundColor: kleuren.kaart,
    borderColor: actiefVeld === veld ? kleuren.accent : kleuren.kaartRand,
  });

  const wachtwoordGeldig = wachtwoord.length >= 6;

  return (
    <SafeAreaView style={[stijlen.veilig, { backgroundColor: kleuren.achtergrond }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={stijlen.scroll} keyboardShouldPersistTaps="handled">
          <View style={stijlen.logoContainer}>
            <Text style={[stijlen.logo, { color: kleuren.isDark ? '#FFFFFF' : kleuren.tekst }]}>Wayt</Text>
          </View>

          <View style={[stijlen.tabRij, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
            {(['inloggen', 'registreren'] as Modus[]).map((m) => {
              const actief = modus === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[stijlen.tab, actief && { backgroundColor: kleuren.accent }]}
                  onPress={() => wisselModus(m)}
                  activeOpacity={0.8}
                  disabled={laden || herstelBezig}
                  accessibilityLabel={`${m} tab`}
                >
                  <Text style={[stijlen.tabTekst, { color: actief ? '#FFFFFF' : kleuren.tekstGedimpt }]}>
                    {m === 'inloggen' ? 'Inloggen' : 'Registreren'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {modus === 'registreren' && (
            <View style={stijlen.veld}>
              <Text style={[stijlen.veldLabel, { color: kleuren.tekstSecundair }]}>Naam</Text>
              <TextInput
                style={[stijlen.invoer, getVeldStijl('naam'), { color: kleuren.tekst }]}
                value={naam}
                onChangeText={(t) => { setNaam(t); if (foutMelding) setFoutMelding(null); }}
                onFocus={() => setActiefVeld('naam')}
                onBlur={() => setActiefVeld(null)}
                placeholder="Bijv. Lisa"
                placeholderTextColor={kleuren.tekstGedimpt}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                accessibilityLabel="Naam invoer"
              />
            </View>
          )}

          <View style={stijlen.veld}>
            <Text style={[stijlen.veldLabel, { color: kleuren.tekstSecundair }]}>E-mailadres</Text>
            <TextInput
              ref={emailRef}
              style={[stijlen.invoer, getVeldStijl('email'), { color: kleuren.tekst }]}
              value={email}
              onChangeText={(t) => { setEmail(t); if (foutMelding) setFoutMelding(null); }}
              onFocus={() => setActiefVeld('email')}
              onBlur={() => setActiefVeld(null)}
              placeholder="jouw@email.nl"
              placeholderTextColor={kleuren.tekstGedimpt}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => wachtwoordRef.current?.focus()}
              accessibilityLabel="E-mail invoer"
            />
          </View>

          <View style={stijlen.veld}>
            <View style={stijlen.labelRij}>
              <Text style={[stijlen.veldLabel, { color: kleuren.tekstSecundair, marginBottom: 0 }]}>Wachtwoord</Text>
              {modus === 'inloggen' ? (
                <TouchableOpacity
                  onPress={handleWachtwoordVergeten}
                  disabled={herstelBezig || laden}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={[stijlen.vergetenTekst, { color: kleuren.accentLicht }]}>
                    {herstelBezig ? 'Versturen...' : 'Vergeten?'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={[stijlen.hintTekst, { color: wachtwoordGeldig ? kleuren.succes : kleuren.tekstGedimpt }]}>
                  {wachtwoordGeldig ? '✓ Sterk genoeg' : 'Minimaal 6 tekens'}
                </Text>
              )}
            </View>
            <View style={[stijlen.wachtwoordContainer, getVeldStijl('wachtwoord')]}>
              <TextInput
                ref={wachtwoordRef}
                style={[stijlen.wachtwoordInvoer, { color: kleuren.tekst }]}
                value={wachtwoord}
                onChangeText={(t) => { setWw(t); if (foutMelding) setFoutMelding(null); }}
                onFocus={() => setActiefVeld('wachtwoord')}
                onBlur={() => setActiefVeld(null)}
                placeholder="••••••••"
                placeholderTextColor={kleuren.tekstGedimpt}
                secureTextEntry={!toonWachtwoord}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete={modus === 'inloggen' ? 'current-password' : 'new-password'}
                textContentType={modus === 'inloggen' ? 'password' : 'newPassword'}
                returnKeyType="done"
                onSubmitEditing={modus === 'inloggen' ? handleInloggen : handleRegistreren}
                accessibilityLabel="Wachtwoord invoer"
              />
              <TouchableOpacity
                style={stijlen.oogKnop}
                onPress={() => setToonWachtwoord(v => !v)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel={toonWachtwoord ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'}
              >
                <Ionicons
                  name={toonWachtwoord ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={kleuren.tekstGedimpt}
                />
              </TouchableOpacity>
            </View>
          </View>

          {foutMelding && (
            <View style={[stijlen.meldingBox, { backgroundColor: kleuren.fout + '18', borderColor: kleuren.fout + '55' }]}>
              <Ionicons name="alert-circle-outline" size={18} color={kleuren.fout} style={{ marginTop: 1 }} />
              <Text style={[stijlen.meldingTekst, { color: kleuren.fout }]}>{foutMelding}</Text>
            </View>
          )}

          {succesMelding && (
            <View style={[stijlen.meldingBox, { backgroundColor: kleuren.succes + '18', borderColor: kleuren.succes + '55' }]}>
              <Ionicons name="checkmark-circle-outline" size={18} color={kleuren.succes} style={{ marginTop: 1 }} />
              <Text style={[stijlen.meldingTekst, { color: kleuren.succes }]}>{succesMelding}</Text>
            </View>
          )}

          <View style={stijlen.knopContainer}>
            <PrimaryButton
              titel={modus === 'inloggen' ? 'Inloggen' : 'Account aanmaken'}
              onPress={modus === 'inloggen' ? handleInloggen : handleRegistreren}
              bezig={laden}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const stijlen = StyleSheet.create({
  veilig: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 44, fontFamily: 'Inter_900Black', letterSpacing: -2 },
  tabRij: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 24,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  tabTekst: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  veld: { marginBottom: 16 },
  labelRij: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  veldLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 8 },
  vergetenTekst: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  hintTekst: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  invoer: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15,
    paddingHorizontal: 16,
    fontFamily: 'Inter_400Regular',
  },
  wachtwoordContainer: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 12,
  },
  wachtwoordInvoer: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  oogKnop: {
    padding: 4,
    marginLeft: 8,
  },
  meldingBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  meldingTekst: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  knopContainer: { marginTop: 8 },
});
