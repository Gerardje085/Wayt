import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useThema } from '../src/context/ThemeContext';
import { getDefaultRestTime, setDefaultRestTime, STANDAARD_RUST_TIJD } from '../src/lib/settingsStore';

const RUST_PRESETS = [
  { label: '60s', seconden: 60 },
  { label: '90s', seconden: 90 },
  { label: '120s', seconden: 120 },
  { label: '180s', seconden: 180 },
];

export default function InstellingenScreen() {
  const { user, profile, uitloggen } = useAuth();
  const { kleuren, voorkeur, setVoorkeur } = useThema();
  const router = useRouter();

  const [standaardRust, setStandaardRust] = useState(STANDAARD_RUST_TIJD);
  const [customRustModal, setCustomRustModal] = useState(false);
  const [customRustInput, setCustomRustInput] = useState('');

  useEffect(() => {
    getDefaultRestTime().then(setStandaardRust);
  }, []);

  const handleKiesRust = async (sec: number) => {
    setStandaardRust(sec);
    await setDefaultRestTime(sec);
  };

  const handleCustomRustOpslaan = async () => {
    const val = parseInt(customRustInput.trim(), 10);
    if (isNaN(val) || val < 10 || val > 600) {
      Alert.alert('Ongeldige waarde', 'Voer een rusttijd tussen 10 en 600 seconden in.');
      return;
    }
    setStandaardRust(val);
    await setDefaultRestTime(val);
    setCustomRustModal(false);
  };

  const isCustomActief = !RUST_PRESETS.some(p => p.seconden === standaardRust);

  return (
    <SafeAreaView style={[stijlen.veilig, { backgroundColor: kleuren.achtergrond }]}>
      <ScrollView style={stijlen.scroll} contentContainerStyle={stijlen.inhoud}>
        <View style={stijlen.headerRij}>
          <TouchableOpacity
            style={[stijlen.terugKnop, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard'))}
            accessibilityLabel="Terug naar dashboard"
          >
            <Ionicons name="arrow-back" size={20} color={kleuren.tekst} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[stijlen.titel, { color: kleuren.tekst }]}>Instellingen</Text>
            <Text style={[stijlen.subtitel, { color: kleuren.tekstGedimpt }]}>
              Rusttijd, weergave en account
            </Text>
          </View>
        </View>

        <Text style={[stijlen.sectie, { color: kleuren.accent }]}>STANDAARD RUSTTIJD TUSSEN SETS</Text>
        <View style={[stijlen.kaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
          <Text style={[stijlen.kaartUitleg, { color: kleuren.tekstGedimpt }]}>
            Deze rusttijd wordt automatisch ingevuld bij nieuwe oefeningen in routines en live workouts:
          </Text>
          <View style={stijlen.rustKnoppenRij}>
            {RUST_PRESETS.map(p => {
              const actief = standaardRust === p.seconden;
              return (
                <TouchableOpacity
                  key={p.seconden}
                  style={[
                    stijlen.rustPresetKnop,
                    {
                      backgroundColor: actief ? kleuren.accent : kleuren.achtergrond,
                      borderColor: actief ? kleuren.accent : kleuren.kaartRand,
                    },
                  ]}
                  onPress={() => handleKiesRust(p.seconden)}
                >
                  <Text style={[stijlen.rustPresetTekst, { color: actief ? '#FFF' : kleuren.tekst }]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[
                stijlen.rustPresetKnop,
                {
                  backgroundColor: isCustomActief ? kleuren.accent : kleuren.achtergrond,
                  borderColor: isCustomActief ? kleuren.accent : kleuren.kaartRand,
                },
              ]}
              onPress={() => {
                setCustomRustInput(String(standaardRust));
                setCustomRustModal(true);
              }}
            >
              <Text style={[stijlen.rustPresetTekst, { color: isCustomActief ? '#FFF' : kleuren.tekst }]}>
                {isCustomActief ? `${standaardRust}s (Aangepast)` : '+ Custom'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[stijlen.sectie, { color: kleuren.accent, marginTop: 8 }]}>WEERGAVE & THEMA</Text>
        <View style={[stijlen.kaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
          <View style={stijlen.rustKnoppenRij}>
            {[
              { id: 'donker', label: 'Donker', icoon: 'moon-outline' },
              { id: 'licht', label: 'Licht', icoon: 'sunny-outline' },
              { id: 'systeem', label: 'Systeem', icoon: 'settings-outline' },
            ].map(t => {
              const actief = voorkeur === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    stijlen.rustPresetKnop,
                    {
                      backgroundColor: actief ? kleuren.accent : kleuren.achtergrond,
                      borderColor: actief ? kleuren.accent : kleuren.kaartRand,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    },
                  ]}
                  onPress={() => setVoorkeur(t.id as any)}
                >
                  <Ionicons name={t.icoon as any} size={15} color={actief ? '#FFF' : kleuren.tekst} />
                  <Text style={[stijlen.rustPresetTekst, { color: actief ? '#FFF' : kleuren.tekst }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text style={[stijlen.sectie, { color: kleuren.accent, marginTop: 8 }]}>ACCOUNT</Text>
        <View style={[stijlen.profielKaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
          {[
            { label: 'Naam', waarde: profile?.username || '—' },
            { label: 'E-mail', waarde: user?.email ?? '—' },
          ].map((r) => (
            <View key={r.label} style={stijlen.profielRij}>
              <Text style={[stijlen.profielLabel, { color: kleuren.tekstGedimpt }]}>{r.label}</Text>
              <Text style={[stijlen.profielWaarde, { color: kleuren.tekst }]}>{r.waarde}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[stijlen.uitlogKnop, { borderColor: kleuren.fout + '55', backgroundColor: kleuren.fout + '15' }]}
          onPress={uitloggen}
          accessibilityLabel="Uitloggen"
        >
          <Ionicons name="log-out-outline" size={18} color={kleuren.fout} style={{ marginRight: 8 }} />
          <Text style={[stijlen.uitlogTekst, { color: kleuren.fout }]}>Uitloggen</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={customRustModal} transparent animationType="fade" onRequestClose={() => setCustomRustModal(false)}>
        <View style={stijlen.modalOverlay}>
          <View style={[stijlen.customModalBox, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
            <Text style={[stijlen.customModalTitel, { color: kleuren.tekst }]}>Aangepaste Rusttijd</Text>
            <Text style={[stijlen.customModalSub, { color: kleuren.tekstGedimpt }]}>
              Voer de standaard rustduur tussen sets in (in seconden):
            </Text>

            <TextInput
              style={[stijlen.customInput, { backgroundColor: kleuren.achtergrond, borderColor: kleuren.kaartRand, color: kleuren.tekst }]}
              keyboardType="numeric"
              placeholder="bijv. 75"
              placeholderTextColor={kleuren.tekstGedimpt}
              value={customRustInput}
              onChangeText={setCustomRustInput}
              autoFocus
            />

            <View style={stijlen.modalKnoppenRij}>
              <TouchableOpacity
                style={[stijlen.modalKnop, { backgroundColor: kleuren.achtergrond, borderColor: kleuren.kaartRand }]}
                onPress={() => setCustomRustModal(false)}
              >
                <Text style={{ color: kleuren.tekstGedimpt, fontFamily: 'Inter_600SemiBold' }}>Annuleren</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[stijlen.modalKnop, { backgroundColor: kleuren.accent, borderColor: kleuren.accent }]}
                onPress={handleCustomRustOpslaan}
              >
                <Text style={{ color: '#FFF', fontFamily: 'Inter_700Bold' }}>Opslaan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const stijlen = StyleSheet.create({
  veilig: { flex: 1 },
  scroll: { flex: 1 },
  inhoud: { padding: 20, paddingBottom: 40 },
  headerRij: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  terugKnop: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  titel: { fontSize: 26, fontWeight: '900', fontFamily: 'Inter_900Black', letterSpacing: -0.5, marginBottom: 2 },
  subtitel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  sectie: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'Inter_700Bold', marginBottom: 10 },
  kaart: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 16 },
  kaartUitleg: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18, marginBottom: 12 },
  rustKnoppenRij: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rustPresetKnop: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 },
  rustPresetTekst: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  profielKaart: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 20 },
  profielRij: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  profielLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  profielWaarde: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  uitlogKnop: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, paddingVertical: 14, justifyContent: 'center', alignItems: 'center' },
  uitlogTekst: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  customModalBox: { width: '100%', maxWidth: 340, borderRadius: 18, borderWidth: 1, padding: 20 },
  customModalTitel: { fontSize: 17, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  customModalSub: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18, marginBottom: 16 },
  customInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 18, fontFamily: 'Inter_700Bold', textAlign: 'center', marginBottom: 16 },
  modalKnoppenRij: { flexDirection: 'row', gap: 10 },
  modalKnop: { flex: 1, borderRadius: 10, borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
});
