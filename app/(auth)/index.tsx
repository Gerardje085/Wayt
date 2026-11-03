import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../src/lib/supabase';
import { useThema } from '../../src/context/ThemeContext';
import PrimaryButton from '../../src/components/ui/PrimaryButton';

type Modus = 'inloggen' | 'registreren';

export default function AuthScreen() {
  const { kleuren } = useThema();
  const [modus, setModus] = useState<Modus>('inloggen');
  const [email, setEmail] = useState('');
  const [wachtwoord, setWw] = useState('');
  const [laden, setLaden] = useState(false);

  async function handleInloggen() {
    if (!email || !wachtwoord) { Alert.alert('Vul alle velden in'); return; }
    setLaden(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(), password: wachtwoord,
    });
    setLaden(false);
    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Inloggen mislukt', error.message);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  async function handleRegistreren() {
    if (!email || !wachtwoord) { Alert.alert('Vul alle velden in'); return; }
    if (wachtwoord.length < 6) { Alert.alert('Wachtwoord te kort', 'Gebruik minimaal 6 tekens.'); return; }
    setLaden(true);

    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: wachtwoord,
    });
    setLaden(false);
    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Registratie mislukt', error.message);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Account aangemaakt', 'Je bent automatisch ingedeeld in een onderzoeksgroep. Na het inloggen zie je welke.');
    }
  }

  const invoerStijl = {
    backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand,
    color: kleuren.tekst,
  };

  const middenTint = kleuren.isDark ? kleuren.accent + '18' : kleuren.accent + '12';

  return (
    <LinearGradient colors={[kleuren.achtergrond, middenTint, kleuren.achtergrond]} style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={stijlen.scroll} keyboardShouldPersistTaps="handled">

          <View style={stijlen.logoContainer}>
            <Text style={[stijlen.logo, { color: kleuren.tekstSecundair }]}>Wayt</Text>
            <Text style={[stijlen.tagline, { color: kleuren.tekstGedimpt }]}>PROGRESSIVE OVERLOAD TRACKER</Text>
          </View>

          <View style={[stijlen.kaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>

            <View style={[stijlen.tabRij, { backgroundColor: kleuren.achtergrond }]}>
              {(['inloggen', 'registreren'] as Modus[]).map((m) => (
                <TouchableOpacity key={m} style={[stijlen.tab, modus === m && { backgroundColor: kleuren.accent }]}
                  onPress={() => setModus(m)} accessibilityLabel={`${m} tab`}>
                  <Text style={[stijlen.tabTekst, { color: modus === m ? '#FFFFFF' : kleuren.tekstGedimpt }]}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={stijlen.veld}>
              <Text style={[stijlen.veldLabel, { color: kleuren.tekstGedimpt }]}>E-mailadres</Text>
              <TextInput style={[stijlen.invoer, invoerStijl]} value={email} onChangeText={setEmail}
                placeholder="jouw@email.nl" placeholderTextColor={kleuren.tekstGedimpt}
                keyboardType="email-address" autoCapitalize="none" accessibilityLabel="E-mail invoer" />
            </View>

            <View style={stijlen.veld}>
              <Text style={[stijlen.veldLabel, { color: kleuren.tekstGedimpt }]}>Wachtwoord</Text>
              <TextInput style={[stijlen.invoer, invoerStijl]} value={wachtwoord} onChangeText={setWw}
                placeholder="••••••••" placeholderTextColor={kleuren.tekstGedimpt}
                secureTextEntry accessibilityLabel="Wachtwoord invoer" />
            </View>

            {modus === 'registreren' && (
              <View style={[stijlen.groepInfo, { backgroundColor: kleuren.accentGedimpt, borderColor: kleuren.accent + '44' }]}>
                <Text style={[stijlen.groepInfoTekst, { color: kleuren.tekstSecundair }]}>
                  Je wordt automatisch aan een van de twee onderzoeksgroepen toegewezen zodra je account is aangemaakt.
                </Text>
              </View>
            )}

            <View style={{ marginTop: 8 }}>
              <PrimaryButton
                titel={modus === 'inloggen' ? 'Inloggen' : 'Account aanmaken'}
                onPress={modus === 'inloggen' ? handleInloggen : handleRegistreren}
                bezig={laden}
              />
            </View>

            <TouchableOpacity onPress={() => setModus(modus === 'inloggen' ? 'registreren' : 'inloggen')}
              style={stijlen.wissel} accessibilityLabel="Wissel modus">
              <Text style={[stijlen.wisselTekst, { color: kleuren.accentTekst }]}>
                {modus === 'inloggen' ? 'Nog geen account? Registreer hier' : 'Terug naar inloggen'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[stijlen.voet, { color: kleuren.kaartRand }]}>
            Aangedreven door Supabase · React Native · Expo
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const stijlen = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 56, fontWeight: '900', fontFamily: 'Inter_900Black', letterSpacing: -3 },
  tagline: { fontSize: 11, letterSpacing: 3, fontFamily: 'Inter_600SemiBold', marginTop: 4 },
  kaart: { borderRadius: 24, padding: 24, borderWidth: 1, elevation: 12 },
  tabRij: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 24 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabTekst: { fontWeight: '600', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  veld: { marginBottom: 16 },
  veldLabel: { fontSize: 12, fontWeight: '600', fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase' },
  invoer: { borderRadius: 12, borderWidth: 1, fontSize: 16, paddingVertical: 14, paddingHorizontal: 16, fontFamily: 'Inter_400Regular' },
  groepInfo: { borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1 },
  groepInfoTekst: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  wissel: { alignItems: 'center', marginTop: 16, padding: 8 },
  wisselTekst: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  voet: { textAlign: 'center', fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 24 },
});
