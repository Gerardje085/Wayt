import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Image,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../src/lib/supabase';
import { useThema } from '../../src/context/ThemeContext';
import PrimaryButton from '../../src/components/ui/PrimaryButton';
import { vertaalFout } from '../../src/utils/errorVertaler';
import { RADIUS, SHADOWS, SPACING, useResponsive } from '../../src/theme/designTokens';

type Modus = 'inloggen' | 'registreren';
type ActiefVeld = 'naam' | 'email' | 'wachtwoord' | null;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function triggerHaptic(type: Haptics.NotificationFeedbackType) {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(type);
  }
}

export default function AuthScreen() {
  const { kleuren } = useThema();
  const { isMobile } = useResponsive();
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

  const webPointer: ViewStyle | undefined =
    Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : undefined;

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
      triggerHaptic(Haptics.NotificationFeedbackType.Warning);
      setFoutMelding('Vul je e-mailadres en wachtwoord in.');
      return;
    }
    if (!EMAIL_REGEX.test(schoonEmail)) {
      triggerHaptic(Haptics.NotificationFeedbackType.Warning);
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
        triggerHaptic(Haptics.NotificationFeedbackType.Error);
        setFoutMelding(
          vertaalFout(error, 'Inloggen is niet gelukt. Controleer je gegevens en probeer het opnieuw.')
        );
      } else {
        triggerHaptic(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      triggerHaptic(Haptics.NotificationFeedbackType.Error);
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
      triggerHaptic(Haptics.NotificationFeedbackType.Warning);
      setFoutMelding('Vul je naam in zodat we je in het onderzoek kunnen herkennen.');
      return;
    }
    if (!schoonEmail) {
      triggerHaptic(Haptics.NotificationFeedbackType.Warning);
      setFoutMelding('Vul je e-mailadres in.');
      return;
    }
    if (!EMAIL_REGEX.test(schoonEmail)) {
      triggerHaptic(Haptics.NotificationFeedbackType.Warning);
      setFoutMelding('Dit e-mailadres lijkt niet te kloppen. Controleer op typefouten.');
      return;
    }
    if (wachtwoord.length < 6) {
      triggerHaptic(Haptics.NotificationFeedbackType.Warning);
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
        triggerHaptic(Haptics.NotificationFeedbackType.Error);
        setFoutMelding(
          vertaalFout(error, 'Account aanmaken is niet gelukt. Probeer het opnieuw.')
        );
        return;
      }

      // Supabase geeft bij ingeschakelde e-mailbevestiging soms geen error maar een lege identities-lijst
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        triggerHaptic(Haptics.NotificationFeedbackType.Warning);
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
        triggerHaptic(Haptics.NotificationFeedbackType.Success);
      } else {
        // E-mailbevestiging vereist in Supabase
        triggerHaptic(Haptics.NotificationFeedbackType.Success);
        setModus('inloggen');
        setWw('');
        setSuccesMelding(
          `Account aangemaakt! Klik op de bevestigingslink die we naar ${schoonEmail} hebben gestuurd en kom daarna terug naar deze app om in te loggen.`
        );
      }
    } catch (err) {
      triggerHaptic(Haptics.NotificationFeedbackType.Error);
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
      triggerHaptic(Haptics.NotificationFeedbackType.Warning);
      setFoutMelding('Vul eerst je e-mailadres in om een herstellink te ontvangen.');
      emailRef.current?.focus();
      return;
    }

    setHerstelBezig(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(schoonEmail);
      if (error) {
        triggerHaptic(Haptics.NotificationFeedbackType.Error);
        setFoutMelding(
          vertaalFout(error, 'Kon geen herstelmail sturen. Probeer het later opnieuw.')
        );
      } else {
        triggerHaptic(Haptics.NotificationFeedbackType.Success);
        setSuccesMelding(
          `Herstellink verstuurd naar ${schoonEmail}. Kijk ook even in je spammap.`
        );
      }
    } catch (err) {
      triggerHaptic(Haptics.NotificationFeedbackType.Error);
      setFoutMelding(
        vertaalFout(err, 'Kon geen herstelmail sturen. Controleer je internetverbinding.')
      );
    } finally {
      setHerstelBezig(false);
    }
  }

  const getVeldStijl = (veld: ActiefVeld): ViewStyle => {
    const isActief = actiefVeld === veld;
    return {
      backgroundColor: isMobile ? kleuren.kaart : kleuren.achtergrondSecundair,
      borderColor: isActief ? kleuren.accent : kleuren.kaartRand,
      borderWidth: isActief ? 1.5 : 1,
      ...(isActief
        ? {
            shadowColor: kleuren.accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: kleuren.isDark ? 0.25 : 0.14,
            shadowRadius: 8,
          }
        : {}),
    };
  };

  const wachtwoordGeldig = wachtwoord.length >= 6;
  const isDesktopKaart = !isMobile;

  return (
    <SafeAreaView style={[stijlen.veilig, { backgroundColor: kleuren.achtergrond }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={stijlen.flex}
      >
        <ScrollView
          contentContainerStyle={[
            stijlen.scroll,
            isDesktopKaart && stijlen.scrollDesktop,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Subtiele ambient glow achter de kaart op desktop web */}
          <View style={stijlen.wrapper}>
            {isDesktopKaart && Platform.OS === 'web' ? (
              <View
                pointerEvents="none"
                style={[
                  stijlen.ambientGlow,
                  {
                    backgroundColor: kleuren.accent,
                    opacity: kleuren.isDark ? 0.16 : 0.1,
                  },
                  ({ filter: 'blur(48px)' } as unknown as ViewStyle),
                ]}
              />
            ) : null}

            <View
              style={[
                stijlen.inhoudBlok,
                isDesktopKaart && [
                  stijlen.desktopKaart,
                  {
                    backgroundColor: kleuren.kaart,
                    borderColor: kleuren.kaartRand,
                  },
                  SHADOWS.forTheme(kleuren.isDark, 'lg'),
                ],
              ]}
            >
              {/* Branding */}
              <View style={stijlen.logoContainer}>
                <View
                  style={[
                    stijlen.icoonFrame,
                    {
                      backgroundColor: kleuren.accentGedimpt,
                      borderColor: kleuren.accent + '44',
                    },
                  ]}
                >
                  <Image
                    source={require('../../assets/icon.png')}
                    style={stijlen.logoAfbeelding}
                    resizeMode="cover"
                  />
                </View>

                <Text style={[stijlen.logo, { color: kleuren.tekst }]}>Wayt</Text>
                <Text style={[stijlen.tagline, { color: kleuren.tekstSecundair }]}>
                  Slimmer trainen. Sterker worden.
                </Text>
              </View>

              {/* Pill-shaped Segmented Toggle */}
              <View
                style={[
                  stijlen.tabRij,
                  {
                    backgroundColor: isDesktopKaart
                      ? kleuren.achtergrondSecundair
                      : kleuren.kaart,
                    borderColor: kleuren.kaartRand,
                  },
                ]}
              >
                {(['inloggen', 'registreren'] as Modus[]).map((m) => {
                  const actief = modus === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[
                        stijlen.tab,
                        actief && {
                          backgroundColor: kleuren.accent,
                          shadowColor: kleuren.accent,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.28,
                          shadowRadius: 6,
                        },
                        webPointer,
                      ]}
                      onPress={() => wisselModus(m)}
                      activeOpacity={0.85}
                      disabled={laden || herstelBezig}
                      accessibilityLabel={`${m} tab`}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: actief }}
                    >
                      <Text
                        style={[
                          stijlen.tabTekst,
                          { color: actief ? '#FFFFFF' : kleuren.tekstSecundair },
                        ]}
                      >
                        {m === 'inloggen' ? 'Inloggen' : 'Registreren'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Naam invoer bij registreren */}
              {modus === 'registreren' && (
                <View style={stijlen.veld}>
                  <Text style={[stijlen.veldLabel, { color: kleuren.tekstSecundair }]}>
                    Naam
                  </Text>
                  <View style={[stijlen.invoerBox, getVeldStijl('naam')]}>
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={actiefVeld === 'naam' ? kleuren.accentLicht : kleuren.tekstGedimpt}
                      style={stijlen.invoerIcoon}
                    />
                    <TextInput
                      style={[stijlen.invoerTekst, { color: kleuren.tekst }]}
                      value={naam}
                      onChangeText={(t) => {
                        setNaam(t);
                        if (foutMelding) setFoutMelding(null);
                      }}
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
                </View>
              )}

              {/* E-mail invoer */}
              <View style={stijlen.veld}>
                <Text style={[stijlen.veldLabel, { color: kleuren.tekstSecundair }]}>
                  E-mailadres
                </Text>
                <View style={[stijlen.invoerBox, getVeldStijl('email')]}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={actiefVeld === 'email' ? kleuren.accentLicht : kleuren.tekstGedimpt}
                    style={stijlen.invoerIcoon}
                  />
                  <TextInput
                    ref={emailRef}
                    style={[stijlen.invoerTekst, { color: kleuren.tekst }]}
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t);
                      if (foutMelding) setFoutMelding(null);
                    }}
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
              </View>

              {/* Wachtwoord invoer */}
              <View style={stijlen.veld}>
                <View style={stijlen.labelRij}>
                  <Text style={[stijlen.veldLabel, { color: kleuren.tekstSecundair, marginBottom: 0 }]}>
                    Wachtwoord
                  </Text>
                  {modus === 'inloggen' ? (
                    <TouchableOpacity
                      onPress={handleWachtwoordVergeten}
                      disabled={herstelBezig || laden}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      style={webPointer}
                    >
                      <Text style={[stijlen.vergetenTekst, { color: kleuren.accentLicht }]}>
                        {herstelBezig ? 'Versturen...' : 'Vergeten?'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text
                      style={[
                        stijlen.hintTekst,
                        { color: wachtwoordGeldig ? kleuren.succes : kleuren.tekstGedimpt },
                      ]}
                    >
                      {wachtwoordGeldig ? '✓ Sterk genoeg' : 'Minimaal 6 tekens'}
                    </Text>
                  )}
                </View>

                <View style={[stijlen.invoerBox, getVeldStijl('wachtwoord')]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={actiefVeld === 'wachtwoord' ? kleuren.accentLicht : kleuren.tekstGedimpt}
                    style={stijlen.invoerIcoon}
                  />
                  <TextInput
                    ref={wachtwoordRef}
                    style={[stijlen.invoerTekst, { color: kleuren.tekst }]}
                    value={wachtwoord}
                    onChangeText={(t) => {
                      setWw(t);
                      if (foutMelding) setFoutMelding(null);
                    }}
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
                    style={[stijlen.oogKnop, webPointer]}
                    onPress={() => setToonWachtwoord((v) => !v)}
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

              {/* Foutmelding banner */}
              {foutMelding && (
                <View
                  style={[
                    stijlen.meldingBox,
                    {
                      backgroundColor: kleuren.fout + '16',
                      borderColor: kleuren.fout + '44',
                    },
                  ]}
                >
                  <Ionicons
                    name="alert-circle"
                    size={18}
                    color={kleuren.fout}
                    style={stijlen.meldingIcoon}
                  />
                  <Text style={[stijlen.meldingTekst, { color: kleuren.fout }]}>
                    {foutMelding}
                  </Text>
                </View>
              )}

              {/* Succesmelding banner */}
              {succesMelding && (
                <View
                  style={[
                    stijlen.meldingBox,
                    {
                      backgroundColor: kleuren.succes + '16',
                      borderColor: kleuren.succes + '44',
                    },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={kleuren.succes}
                    style={stijlen.meldingIcoon}
                  />
                  <Text style={[stijlen.meldingTekst, { color: kleuren.succes }]}>
                    {succesMelding}
                  </Text>
                </View>
              )}

              {/* Primaire actieknop */}
              <View style={stijlen.knopContainer}>
                <PrimaryButton
                  titel={modus === 'inloggen' ? 'Inloggen' : 'Account aanmaken'}
                  icoon={modus === 'inloggen' ? 'arrow-forward' : 'person-add-outline'}
                  size="lg"
                  onPress={modus === 'inloggen' ? handleInloggen : handleRegistreren}
                  bezig={laden}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const stijlen = StyleSheet.create({
  veilig: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  scrollDesktop: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  wrapper: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    position: 'relative',
  },
  ambientGlow: {
    position: 'absolute',
    top: -28,
    left: 36,
    right: 36,
    height: 120,
    borderRadius: 999,
  },
  inhoudBlok: {
    width: '100%',
  },
  desktopKaart: {
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    padding: SPACING.xxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  icoonFrame: {
    width: 68,
    height: 68,
    borderRadius: 20,
    borderWidth: 1,
    padding: 3,
    marginBottom: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoAfbeelding: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  logo: {
    fontSize: 38,
    fontFamily: 'Inter_900Black',
    letterSpacing: -1.6,
    lineHeight: 42,
  },
  tagline: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 6,
    textAlign: 'center',
  },
  tabRij: {
    flexDirection: 'row',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabTekst: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  veld: {
    marginBottom: 16,
  },
  labelRij: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  veldLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  vergetenTekst: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  hintTekst: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  invoerBox: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  invoerIcoon: {
    marginRight: 10,
  },
  invoerTekst: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  oogKnop: {
    padding: 6,
    marginLeft: 4,
  },
  meldingBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 13,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: 14,
  },
  meldingIcoon: {
    marginTop: 1,
  },
  meldingTekst: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
  },
  knopContainer: {
    marginTop: 8,
  },
});
