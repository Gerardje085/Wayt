// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Oefeningen Tab (Tab 3: Bibliotheek)
// Zoekbalk + filters + lijst + custom oefeningen
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, TextInput, Modal, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons }          from '@expo/vector-icons';
import { useRouter }         from 'expo-router';
import { useThema }          from '../../src/context/ThemeContext';
import { OEFENINGEN_DB, type OefeningDef, type Spiergroep } from '../../src/data/exercises';
import AsyncStorage          from '@react-native-async-storage/async-storage';

const CUSTOM_KEY = '@wayt_custom_exercises';
const SPIERGROEPEN: Spiergroep[] = ['Borst', 'Rug', 'Benen', 'Schouders', 'Armen', 'Core', 'Cardio'];

const GROEP_KLEUR: Record<string, string> = {
  Borst: '#EF4444', Rug: '#3B82F6', Benen: '#22C55E',
  Schouders: '#F59E0B', Armen: '#A855F7', Core: '#06B6D4', Cardio: '#EC4899',
};

// ─── Custom Oefening Modal ────────────────────────────────────────────────────
function CustomOefeningModal({
  zichtbaar, onSluiten, onGemaakt, kleuren
}: {
  zichtbaar: boolean; onSluiten: () => void; onGemaakt: (o: OefeningDef) => void; kleuren: any;
}) {
  const [naam, setNaam]       = useState('');
  const [groep, setGroep]     = useState<Spiergroep>('Borst');

  const handleMaken = async () => {
    if (!naam.trim()) { Alert.alert('Vul een naam in'); return; }
    const custom: OefeningDef = {
      id:          `custom_${Date.now()}`,
      naam:        naam.trim(),
      groep,
      type:        'gewicht',
      icoon:       'barbell-outline',
      startWaarde: 0,
    };
    const existing = await AsyncStorage.getItem(CUSTOM_KEY);
    const list: OefeningDef[] = existing ? JSON.parse(existing) : [];
    list.push(custom);
    await AsyncStorage.setItem(CUSTOM_KEY, JSON.stringify(list));
    onGemaakt(custom);
    setNaam('');
    onSluiten();
  };

  return (
    <Modal visible={zichtbaar} animationType="slide" presentationStyle="pageSheet" onRequestClose={onSluiten}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[cm.container, { backgroundColor: kleuren.achtergrond }]}>
          <View style={[cm.header, { borderBottomColor: kleuren.kaartRand }]}>
            <TouchableOpacity onPress={onSluiten}>
              <Ionicons name="close" size={24} color={kleuren.tekstGedimpt} />
            </TouchableOpacity>
            <Text style={[cm.titel, { color: kleuren.tekst }]}>Custom Oefening</Text>
            <TouchableOpacity onPress={handleMaken}>
              <Text style={{ color: kleuren.accent, fontFamily: 'Inter_700Bold', fontSize: 16 }}>Opslaan</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 20 }}>
            <Text style={[cm.label, { color: kleuren.tekstGedimpt }]}>NAAM</Text>
            <TextInput
              style={[cm.input, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand, color: kleuren.tekst }]}
              value={naam}
              onChangeText={setNaam}
              placeholder="bijv. Bulgarian Split Squat"
              placeholderTextColor={kleuren.tekstGedimpt}
              autoFocus
            />

            <Text style={[cm.label, { color: kleuren.tekstGedimpt }]}>SPIERGROEP</Text>
            <View style={cm.groepRaster}>
              {SPIERGROEPEN.map(g => (
                <TouchableOpacity
                  key={g}
                  style={[cm.groepKnop, {
                    backgroundColor: groep === g ? GROEP_KLEUR[g] + '33' : kleuren.kaart,
                    borderColor: groep === g ? GROEP_KLEUR[g] : kleuren.kaartRand,
                  }]}
                  onPress={() => setGroep(g)}
                >
                  <Text style={{ color: groep === g ? GROEP_KLEUR[g] : kleuren.tekstGedimpt, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const cm = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  titel:  { fontSize: 16, fontFamily: 'Inter_700Bold' },
  label:  { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1, marginBottom: 8, marginTop: 20, textTransform: 'uppercase' },
  input:  { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, fontFamily: 'Inter_400Regular', marginBottom: 4 },
  groepRaster: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  groepKnop:   { borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 },
});

// ─── Hoofd Component ──────────────────────────────────────────────────────────

export default function ExercisesTab() {
  const router      = useRouter();
  const { kleuren } = useThema();

  const [zoekterm,      setZoekterm]      = useState('');
  const [actieveGroep,  setActieveGroep]  = useState<Spiergroep | null>(null);
  const [customModal,   setCustomModal]   = useState(false);
  const [customOef,     setCustomOef]     = useState<OefeningDef[]>([]);

  const alleOefeningen = useMemo(() => {
    return [...OEFENINGEN_DB, ...customOef];
  }, [customOef]);

  const gefilterdeOefeningen = useMemo(() => {
    return alleOefeningen.filter(o => {
      const zoekMatch = o.naam.toLowerCase().includes(zoekterm.toLowerCase());
      const groepMatch = !actieveGroep || o.groep === actieveGroep;
      return zoekMatch && groepMatch;
    });
  }, [alleOefeningen, zoekterm, actieveGroep]);

  const gegroepeerd = useMemo(() => {
    const map = new Map<string, OefeningDef[]>();
    for (const o of gefilterdeOefeningen) {
      if (!map.has(o.groep)) map.set(o.groep, []);
      map.get(o.groep)!.push(o);
    }
    return Array.from(map.entries());
  }, [gefilterdeOefeningen]);

  return (
    <SafeAreaView style={[s.veilig, { backgroundColor: kleuren.achtergrond }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: kleuren.kaartRand }]}>
        <Text style={[s.headerTitel, { color: kleuren.tekst }]}>Oefeningen</Text>
        <TouchableOpacity
          style={[s.customKnop, { backgroundColor: kleuren.accent + '22', borderColor: kleuren.accent + '44' }]}
          onPress={() => setCustomModal(true)}
        >
          <Ionicons name="add" size={16} color={kleuren.accent} />
          <Text style={{ color: kleuren.accent, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>Custom</Text>
        </TouchableOpacity>
      </View>

      {/* Zoekbalk */}
      <View style={[s.zoekContainer, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
        <Ionicons name="search-outline" size={18} color={kleuren.tekstGedimpt} style={{ marginRight: 8 }} />
        <TextInput
          style={[s.zoekInput, { color: kleuren.tekst }]}
          placeholder="Zoek oefening..."
          placeholderTextColor={kleuren.tekstGedimpt}
          value={zoekterm}
          onChangeText={setZoekterm}
        />
        {zoekterm.length > 0 && (
          <TouchableOpacity onPress={() => setZoekterm('')}>
            <Ionicons name="close-circle" size={18} color={kleuren.tekstGedimpt} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        <TouchableOpacity
          style={[s.chip, { backgroundColor: !actieveGroep ? kleuren.accent : kleuren.kaart, borderColor: !actieveGroep ? kleuren.accent : kleuren.kaartRand }]}
          onPress={() => setActieveGroep(null)}
        >
          <Text style={[s.chipTekst, { color: !actieveGroep ? '#FFF' : kleuren.tekstGedimpt }]}>Alles</Text>
        </TouchableOpacity>
        {SPIERGROEPEN.map(g => (
          <TouchableOpacity
            key={g}
            style={[s.chip, {
              backgroundColor: actieveGroep === g ? GROEP_KLEUR[g] + '33' : kleuren.kaart,
              borderColor: actieveGroep === g ? GROEP_KLEUR[g] : kleuren.kaartRand,
            }]}
            onPress={() => setActieveGroep(actieveGroep === g ? null : g)}
          >
            <View style={[s.chipDot, { backgroundColor: GROEP_KLEUR[g] }]} />
            <Text style={[s.chipTekst, { color: actieveGroep === g ? GROEP_KLEUR[g] : kleuren.tekstGedimpt }]}>{g}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Oefeningen Lijst */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        {gegroepeerd.map(([groep, oefeningen]) => (
          <View key={groep}>
            <View style={[s.groepHeader, { borderBottomColor: kleuren.kaartRand }]}>
              <View style={[s.groepKleurLijn, { backgroundColor: GROEP_KLEUR[groep] }]} />
              <Text style={[s.groepNaam, { color: kleuren.tekstGedimpt }]}>{groep.toUpperCase()}</Text>
              <Text style={[s.groepAantal, { color: kleuren.tekstGedimpt }]}>{oefeningen.length}</Text>
            </View>
            {oefeningen.map(o => (
              <TouchableOpacity
                key={o.id}
                style={[s.oefeningRij, { borderBottomColor: kleuren.kaartRand }]}
                onPress={() => router.push(`/exercise/${o.id}`)}
              >
                <View style={[s.oefeningIcoonContainer, { backgroundColor: GROEP_KLEUR[o.groep] + '22' }]}>
                  <Ionicons name={o.icoon as any} size={20} color={GROEP_KLEUR[o.groep]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.oefeningNaam, { color: kleuren.tekst }]}>{o.naam}</Text>
                  <Text style={[s.oefeningType, { color: kleuren.tekstGedimpt }]}>
                    {o.type === 'gewicht' ? 'Gewicht' : o.type === 'lichaamsgewicht' ? 'Lichaamsgewicht' : 'Tijd'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={kleuren.tekstGedimpt} />
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>

      <CustomOefeningModal
        zichtbaar={customModal}
        onSluiten={() => setCustomModal(false)}
        onGemaakt={(o) => setCustomOef(prev => [...prev, o])}
        kleuren={kleuren}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  veilig:  { flex: 1 },
  header:  {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingBottom: 14, borderBottomWidth: 1,
  },
  headerTitel: { fontSize: 30, fontFamily: 'Inter_900Black', letterSpacing: -1 },
  customKnop:  {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7,
  },
  zoekContainer: {
    flexDirection: 'row', alignItems: 'center',
    margin: 16, marginBottom: 8, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12,
  },
  zoekInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular' },
  chipsScroll: { maxHeight: 52, marginBottom: 8 },
  chip:  { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipTekst: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  groepHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  groepKleurLijn: { width: 3, height: 14, borderRadius: 2 },
  groepNaam: { flex: 1, fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  groepAantal: { fontSize: 11, fontFamily: 'Inter_400Regular' },

  oefeningRij: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, gap: 14,
  },
  oefeningIcoonContainer: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  oefeningNaam: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  oefeningType: { fontSize: 12, fontFamily: 'Inter_400Regular' },
});
