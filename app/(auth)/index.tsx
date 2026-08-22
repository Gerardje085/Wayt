// ─────────────────────────────────────────────────────────────────────────────
// Wayt – AuthScreen (TypeScript + Haptic Feedback + Animaties)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../src/lib/supabase';
import { useThema } from '../../src/context/ThemeContext';

type Modus = 'inloggen' | 'registreren';
type Groep = 'app' | 'gevoel';

export default function AuthScreen() {
  const { kleuren }              = useThema();
  const [modus,      setModus]   = useState<Modus>('inloggen');
  const [email,      setEmail]   = useState('');
  const [wachtwoord, setWw]      = useState('');
  const [groep,      setGroep]   = useState<Groep>('app');
  const [laden,      setLaden]   = useState(false);

  // Knop-animatie
  const knopSchaal = useSharedValue(1);
  const knopAnim   = useAnimatedStyle(() => ({ transform: [{ scale: knopSchaal.value }] }));

  async function handleInloggen() {
    if (!email || !wachtwoord) { Alert.alert('Vul alle velden in'); return; }
    setLaden(true);
    knopSchaal.value = withSpring(0.95, { damping: 10 });
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(), password: wachtwoord,
    });
    setLaden(false);
    knopSchaal.value = withSpring(1, { damping: 10 });
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
    knopSchaal.value = withSpring(0.95, { damping: 10 });
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: wachtwoord,
      options: { data: { group_type: groep } },
    });
    setLaden(false);
    knopSchaal.value = withSpring(1, { damping: 10 });
    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Registratie mislukt', error.message);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Account aangemaakt! 🎉', 'Je bent nu ingelogd. Veel succes!');
    }
  }

  const invoerStijl = {
    backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand,
    color: kleuren.tekst,
  };

  return (
    <LinearGradient colors={[kleuren.achtergrond, kleuren.isDark ? '#1A0A2E' : '#EDE9FE', kleuren.achtergrond]} style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={stijlen.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={stijlen.logoContainer}>
            <Text style={[stijlen.logo, { color: kleuren.tekstSecundair }]}>Wayt</Text>
            <Text style={[stijlen.tagline, { color: kleuren.tekstGedimpt }]}>PROGRESSIVE OVERLOAD TRACKER</Text>
          </View>

          {/* Kaart */}
          <View style={[stijlen.kaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>

            {/* Tabs */}
            <View style={[stijlen.tabRij, { backgroundColor: kleuren.achtergrond }]}>
              {(['inloggen', 'registreren'] as Modus[]).map((m) => (
                <TouchableOpacity key={m} style={[stijlen.tab, modus === m && stijlen.tabActief]}
                  onPress={() => setModus(m)} accessibilityLabel={`${m} tab`}>
                  <Text style={[stijlen.tabTekst, { color: modus === m ? '#FFFFFF' : kleuren.tekstGedimpt }]}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Email */}
            <View style={stijlen.veld}>
              <Text style={[stijlen.veldLabel, { color: kleuren.tekstGedimpt }]}>E-mailadres</Text>
              <TextInput style={[stijlen.invoer, invoerStijl]} value={email} onChangeText={setEmail}
                placeholder="jouw@email.nl" placeholderTextColor={kleuren.tekstGedimpt}
                keyboardType="email-address" autoCapitalize="none" accessibilityLabel="E-mail invoer" />
            </View>

            {/* Wachtwoord */}
            <View style={stijlen.veld}>
              <Text style={[stijlen.veldLabel, { color: kleuren.tekstGedimpt }]}>Wachtwoord</Text>
              <TextInput style={[stijlen.invoer, invoerStijl]} value={wachtwoord} onChangeText={setWw}
                placeholder="••••••••" placeholderTextColor={kleuren.tekstGedimpt}
                secureTextEntry accessibilityLabel="Wachtwoord invoer" />
            </View>

            {/* Groep (alleen registreren) */}
            {modus === 'registreren' && (
              <View style={stijlen.veld}>
                <Text style={[stijlen.veldLabel, { color: kleuren.tekstGedimpt }]}>Testgroep</Text>
                <View style={[stijlen.pickerWrapper, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
                  <Picker selectedValue={groep} onValueChange={(v) => setGroep(v as Groep)}
                    style={{ color: kleuren.tekst, backgroundColor: kleuren.kaart }}
                    dropdownIconColor={kleuren.accent} accessibilityLabel="Testgroep picker">
                    <Picker.Item label="Algoritme-groep (Aanbevolen)" value="app" color={kleuren.tekst} />
                    <Picker.Item label="Gevoel-groep (Intuïtief)"  value="gevoel" color={kleuren.tekst} />
                  </Picker>
                </View>
                <View style={[stijlen.groepInfo, { backgroundColor: kleuren.accentGedimpt, borderColor: kleuren.accent + '44' }]}>
                  <Text style={[stijlen.groepInfoTekst, { color: kleuren.tekstSecundair }]}>
                    {groep === 'app'
                      ? 'Je ontvangt algoritmische trainingsadviezen.'
                      : 'Je logt zelf zonder advies. Jij bepaalt alles.'}
                  </Text>
                </View>
              </View>
            )}

            {/* Actieknop */}
            <Animated.View style={[stijlen.knopContainer, knopAnim]}>
              <TouchableOpacity onPress={modus === 'inloggen' ? handleInloggen : handleRegistreren}
                disabled={laden} activeOpacity={0.9} accessibilityLabel="Actieknop inloggen of registreren">
                <LinearGradient colors={['#7C3AED', '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={stijlen.knop}>
                  {laden
                    ? <ActivityIndicator color="#FFFFFF" />
                    : <Text style={stijlen.knopTekst}>{modus === 'inloggen' ? '→ Inloggen' : '✓ Account aanmaken'}</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Wissel */}
            <TouchableOpacity onPress={() => setModus(modus === 'inloggen' ? 'registreren' : 'inloggen')}
              style={stijlen.wissel} accessibilityLabel="Wissel modus">
              <Text style={[stijlen.wisselTekst, { color: kleuren.accent }]}>
                {modus === 'inloggen' ? 'Nog geen account? Registreer hier →' : '← Terug naar inloggen'}
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
  scroll:        { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logo:          { fontSize: 56, fontWeight: '900', fontFamily: 'Inter_900Black', letterSpacing: -3 },
  tagline:       { fontSize: 10, letterSpacing: 3, fontFamily: 'Inter_600SemiBold', marginTop: 4 },
  kaart:         { borderRadius: 24, padding: 24, borderWidth: 1, elevation: 12 },
  tabRij:        { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 24 },
  tab:           { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActief:     { backgroundColor: '#7C3AED' },
  tabTekst:      { fontWeight: '600', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  veld:          { marginBottom: 16 },
  veldLabel:     { fontSize: 12, fontWeight: '600', fontFamily: 'Inter_600SemiBold', letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase' },
  invoer:        { borderRadius: 12, borderWidth: 1, fontSize: 16, paddingVertical: 14, paddingHorizontal: 16, fontFamily: 'Inter_400Regular' },
  pickerWrapper: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  groepInfo:     { borderRadius: 10, padding: 12, marginTop: 8, borderWidth: 1 },
  groepInfoTekst:{ fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  knopContainer: { borderRadius: 14, overflow: 'hidden', marginTop: 8, elevation: 8 },
  knop:          { paddingVertical: 16, alignItems: 'center' },
  knopTekst:     { color: '#FFFFFF', fontSize: 16, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  wissel:        { alignItems: 'center', marginTop: 16, padding: 8 },
  wisselTekst:   { fontSize: 13, fontFamily: 'Inter_400Regular' },
  voet:          { textAlign: 'center', fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 24 },
});
