import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView,
  TouchableOpacity, TextInput, Modal, Alert, KeyboardAvoidingView, Platform, Image, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TerugKnop from '../src/components/ui/TerugKnop';
import { useRouter } from 'expo-router';
import { useThema } from '../src/context/ThemeContext';
import {
  OEFENINGEN_DB,
  type OefeningDef,
  type Spiergroep,
  type Apparaat,
  type OefeningType,
  getMediaUrl,
  formatEquipmentDutch,
  formatTargetDutch,
  formatCategoryDutch,
} from '../src/data/exercises';
import { GROEP_KLEUR } from '../src/theme/groepKleuren';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CUSTOM_KEY = '@wayt_custom_exercises';

const SPIERGROEPEN: Spiergroep[] = [
  'Borst', 'Rug', 'Benen', 'Kuiten', 'Schouders', 'Armen', 'Core', 'Cardio', 'Nek',
];

const APPARATEN: Apparaat[] = [
  'Barbell', 'Dumbbell', 'Kabel', 'Machine', 'Lichaamsgewicht', 'Kettlebell', 'Weerstandsband', 'Overig',
];

const POPULAIRE_DOELEN = [
  { id: 'abs', label: 'Buikspieren' },
  { id: 'pectorals', label: 'Borstspier' },
  { id: 'lats', label: 'Brede rug (Lats)' },
  { id: 'quads', label: 'Bovenbenen (Quads)' },
  { id: 'glutes', label: 'Bilspieren' },
  { id: 'hamstrings', label: 'Hamstrings' },
  { id: 'delts', label: 'Schouders (Delts)' },
  { id: 'biceps', label: 'Biceps' },
  { id: 'triceps', label: 'Triceps' },
  { id: 'calves', label: 'Kuiten' },
];

const OEFENING_TYPEN: Array<{ type: OefeningType; label: string }> = [
  { type: 'gewicht', label: 'Gewicht' },
  { type: 'lichaamsgewicht', label: 'Lichaamsgewicht' },
  { type: 'tijd', label: 'Tijd' },
];

type SorteerModus = 'alfabetisch' | 'groep' | 'apparaat';

function FilterModal({
  zichtbaar, onSluiten, actieveGroep, setActieveGroep,
  actiefApparaat, setActiefApparaat, actiefDoel, setActiefDoel,
  sorteerModus, setSorteerModus, onReset, totaalGevonden, kleuren,
}: {
  zichtbaar: boolean;
  onSluiten: () => void;
  actieveGroep: Spiergroep | null;
  setActieveGroep: (g: Spiergroep | null) => void;
  actiefApparaat: Apparaat | null;
  setActiefApparaat: (a: Apparaat | null) => void;
  actiefDoel: string | null;
  setActiefDoel: (d: string | null) => void;
  sorteerModus: SorteerModus;
  setSorteerModus: (s: SorteerModus) => void;
  onReset: () => void;
  totaalGevonden: number;
  kleuren: any;
}) {
  const aantalActieveFilters = (actieveGroep ? 1 : 0) + (actiefApparaat ? 1 : 0) + (actiefDoel ? 1 : 0);

  return (
    <Modal visible={zichtbaar} animationType="slide" presentationStyle="pageSheet" onRequestClose={onSluiten}>
      <SafeAreaView style={[fm.container, { backgroundColor: kleuren.achtergrond }]}>
        <View style={[fm.header, { borderBottomColor: kleuren.kaartRand }]}>
          <TouchableOpacity onPress={onSluiten} style={fm.sluitKnop}>
            <Ionicons name="close" size={24} color={kleuren.tekst} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={[fm.headerTitel, { color: kleuren.tekst }]}>Filters & Sorteren</Text>
            {aantalActieveFilters > 0 && (
              <Text style={[fm.filterBadgeTekst, { color: kleuren.accentTekst }]}>
                {aantalActieveFilters} filter{aantalActieveFilters > 1 ? 's' : ''} actief
              </Text>
            )}
          </View>
          {aantalActieveFilters > 0 ? (
            <TouchableOpacity onPress={onReset}>
              <Text style={{ color: kleuren.fout, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Reset</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {/* Spiergroep Filter */}
          <Text style={[fm.sectieTitel, { color: kleuren.tekstSecundair }]}>SPIERGROEP</Text>
          <View style={fm.grid}>
            <TouchableOpacity
              style={[
                fm.chip,
                {
                  backgroundColor: !actieveGroep ? kleuren.accent : kleuren.kaart,
                  borderColor: !actieveGroep ? kleuren.accent : kleuren.kaartRand,
                },
              ]}
              onPress={() => setActieveGroep(null)}
            >
              <Text style={[fm.chipTekst, { color: !actieveGroep ? '#FFF' : kleuren.tekstGedimpt }]}>Alle spiergroepen</Text>
            </TouchableOpacity>
            {SPIERGROEPEN.map(g => {
              const isActief = actieveGroep === g;
              const kleur = GROEP_KLEUR[g] || kleuren.accent;
              return (
                <TouchableOpacity
                  key={g}
                  style={[
                    fm.chip,
                    {
                      backgroundColor: isActief ? kleur : kleuren.kaart,
                      borderColor: isActief ? kleur : kleuren.kaartRand,
                    },
                  ]}
                  onPress={() => setActieveGroep(isActief ? null : g)}
                >
                  <View style={[fm.dot, { backgroundColor: isActief ? '#FFF' : kleur }]} />
                  <Text style={[fm.chipTekst, { color: isActief ? '#FFF' : kleuren.tekst }]}>{g}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Apparaat Filter */}
          <Text style={[fm.sectieTitel, { color: kleuren.tekstSecundair, marginTop: 24 }]}>APPARAAT / MATERIAAL</Text>
          <View style={fm.grid}>
            <TouchableOpacity
              style={[
                fm.chip,
                {
                  backgroundColor: !actiefApparaat ? kleuren.accent : kleuren.kaart,
                  borderColor: !actiefApparaat ? kleuren.accent : kleuren.kaartRand,
                },
              ]}
              onPress={() => setActiefApparaat(null)}
            >
              <Text style={[fm.chipTekst, { color: !actiefApparaat ? '#FFF' : kleuren.tekstGedimpt }]}>Alle apparaten</Text>
            </TouchableOpacity>
            {APPARATEN.map(a => {
              const isActief = actiefApparaat === a;
              return (
                <TouchableOpacity
                  key={a}
                  style={[
                    fm.chip,
                    {
                      backgroundColor: isActief ? kleuren.accent : kleuren.kaart,
                      borderColor: isActief ? kleuren.accent : kleuren.kaartRand,
                    },
                  ]}
                  onPress={() => setActiefApparaat(isActief ? null : a)}
                >
                  <Text style={[fm.chipTekst, { color: isActief ? '#FFF' : kleuren.tekst }]}>{a}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Doelspier Filter */}
          <Text style={[fm.sectieTitel, { color: kleuren.tekstSecundair, marginTop: 24 }]}>DOELSPIER (TARGET)</Text>
          <View style={fm.grid}>
            <TouchableOpacity
              style={[
                fm.chip,
                {
                  backgroundColor: !actiefDoel ? kleuren.accent : kleuren.kaart,
                  borderColor: !actiefDoel ? kleuren.accent : kleuren.kaartRand,
                },
              ]}
              onPress={() => setActiefDoel(null)}
            >
              <Text style={[fm.chipTekst, { color: !actiefDoel ? '#FFF' : kleuren.tekstGedimpt }]}>Alle doelspieren</Text>
            </TouchableOpacity>
            {POPULAIRE_DOELEN.map(d => {
              const isActief = actiefDoel === d.id;
              return (
                <TouchableOpacity
                  key={d.id}
                  style={[
                    fm.chip,
                    {
                      backgroundColor: isActief ? kleuren.accent : kleuren.kaart,
                      borderColor: isActief ? kleuren.accent : kleuren.kaartRand,
                    },
                  ]}
                  onPress={() => setActiefDoel(isActief ? null : d.id)}
                >
                  <Text style={[fm.chipTekst, { color: isActief ? '#FFF' : kleuren.tekst }]}>{d.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Sortering */}
          <Text style={[fm.sectieTitel, { color: kleuren.tekstSecundair, marginTop: 24 }]}>SORTERING</Text>
          <View style={fm.grid}>
            {[
              { id: 'alfabetisch', label: 'Alfabetisch (A-Z)' },
              { id: 'groep', label: 'Op Spiergroep' },
              { id: 'apparaat', label: 'Op Apparaat' },
            ].map(s => {
              const isActief = sorteerModus === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    fm.chip,
                    {
                      backgroundColor: isActief ? kleuren.accent : kleuren.kaart,
                      borderColor: isActief ? kleuren.accent : kleuren.kaartRand,
                    },
                  ]}
                  onPress={() => setSorteerModus(s.id as SorteerModus)}
                >
                  <Text style={[fm.chipTekst, { color: isActief ? '#FFF' : kleuren.tekst }]}>{s.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Toon Resultaten Knop */}
        <View style={[fm.footer, { borderTopColor: kleuren.kaartRand, backgroundColor: kleuren.kaart }]}>
          <TouchableOpacity
            style={[fm.resultatenKnop, { backgroundColor: kleuren.accent }]}
            onPress={onSluiten}
          >
            <Text style={fm.resultatenKnopTekst}>
              Toon {totaalGevonden} {totaalGevonden === 1 ? 'oefening' : 'oefeningen'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const fm = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  sluitKnop: { padding: 4 },
  headerTitel: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  filterBadgeTekst: { fontSize: 11, fontFamily: 'Inter_600SemiBold', marginTop: 2 },
  sectieTitel: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1.2, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  chipTekst: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  footer: { padding: 16, borderTopWidth: 1 },
  resultatenKnop: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultatenKnopTekst: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
});

function CustomOefeningModal({
  zichtbaar, onSluiten, onGemaakt, kleuren,
}: {
  zichtbaar: boolean; onSluiten: () => void; onGemaakt: (o: OefeningDef) => void; kleuren: any;
}) {
  const [naam, setNaam] = useState('');
  const [groep, setGroep] = useState<Spiergroep>('Borst');
  const [type, setType] = useState<OefeningType>('gewicht');

  const handleMaken = async () => {
    if (!naam.trim()) { Alert.alert('Vul een naam in'); return; }
    const custom: OefeningDef = {
      id: `custom_${Date.now()}`,
      name: naam.trim().toLowerCase(),
      naam: naam.trim(),
      category: groep.toLowerCase(),
      body_part: groep.toLowerCase(),
      equipment: type === 'lichaamsgewicht' ? 'body weight' : 'barbell',
      instructions: {
        nl: `Voer ${naam.trim()} uit met correcte techniek en controle.`,
        en: `Perform ${naam.trim()} with good form and controlled tempo.`,
      },
      instruction_steps: {
        nl: [`Voer ${naam.trim()} uit met correcte techniek en controle.`],
        en: [`Perform ${naam.trim()} with good form and controlled tempo.`],
      },
      muscle_group: groep.toLowerCase(),
      secondary_muscles: [],
      target: groep.toLowerCase(),
      image: '',
      gif_url: '',
      media_id: '',
      groep,
      type,
      apparaat: type === 'lichaamsgewicht' ? 'Lichaamsgewicht' : 'Barbell',
      icoon: type === 'tijd' ? 'timer-outline' : type === 'lichaamsgewicht' ? 'body-outline' : 'barbell-outline',
      startWaarde: type === 'tijd' ? 60 : type === 'gewicht' ? 20 : 0,
      image_url: '',
      gif_full_url: '',
    };
    const existing = await AsyncStorage.getItem(CUSTOM_KEY);
    const list: OefeningDef[] = existing ? JSON.parse(existing) : [];
    list.push(custom);
    await AsyncStorage.setItem(CUSTOM_KEY, JSON.stringify(list));
    onGemaakt(custom);
    setNaam('');
    setType('gewicht');
    setGroep('Borst');
    onSluiten();
  };

  return (
    <Modal visible={zichtbaar} animationType="slide" presentationStyle="pageSheet" onRequestClose={onSluiten}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={[cm.container, { backgroundColor: kleuren.achtergrond }]}>
          <View style={[cm.header, { borderBottomColor: kleuren.kaartRand }]}>
            <TouchableOpacity onPress={onSluiten}>
              <Ionicons name="close" size={24} color={kleuren.tekstGedimpt} />
            </TouchableOpacity>
            <Text style={[cm.titel, { color: kleuren.tekst }]}>Custom Oefening</Text>
            <TouchableOpacity onPress={handleMaken}>
              <Text style={{ color: kleuren.accentTekst, fontFamily: 'Inter_700Bold', fontSize: 16 }}>Opslaan</Text>
            </TouchableOpacity>
          </View>

          <View style={{ padding: 20 }}>
            <Text style={[cm.label, { color: kleuren.tekstGedimpt }]}>NAAM</Text>
            <TextInput
              style={[cm.input, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand, color: kleuren.tekst }]}
              value={naam}
              onChangeText={setNaam}
              placeholder="bijv. Bulgarian Split Squat"
              placeholderTextColor={kleuren.tekstGedimpt}
              autoFocus
            />

            <Text style={[cm.label, { color: kleuren.tekstGedimpt }]}>TYPE</Text>
            <View style={cm.groepRaster}>
              {OEFENING_TYPEN.map(t => (
                <TouchableOpacity
                  key={t.type}
                  style={[cm.groepKnop, {
                    backgroundColor: type === t.type ? kleuren.accentGedimpt : kleuren.kaart,
                    borderColor: type === t.type ? kleuren.accent : kleuren.kaartRand,
                  }]}
                  onPress={() => setType(t.type)}
                >
                  <Text style={{ color: type === t.type ? kleuren.accentTekst : kleuren.tekstGedimpt, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[cm.label, { color: kleuren.tekstGedimpt }]}>SPIERGROEP</Text>
            <View style={cm.groepRaster}>
              {SPIERGROEPEN.map(g => (
                <TouchableOpacity
                  key={g}
                  style={[cm.groepKnop, {
                    backgroundColor: groep === g ? (GROEP_KLEUR[g] || kleuren.accent) + '33' : kleuren.kaart,
                    borderColor: groep === g ? (GROEP_KLEUR[g] || kleuren.accent) : kleuren.kaartRand,
                  }]}
                  onPress={() => setGroep(g)}
                >
                  <Text style={{ color: groep === g ? (GROEP_KLEUR[g] || kleuren.accentTekst) : kleuren.tekstGedimpt, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const cm = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  titel: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  label: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1, marginBottom: 8, marginTop: 20, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, fontFamily: 'Inter_400Regular', marginBottom: 4 },
  groepRaster: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  groepKnop: { borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 },
});

export default function ExercisesTab() {
  const router = useRouter();
  const { kleuren } = useThema();

  const [zoekterm, setZoekterm] = useState('');
  const [actieveGroep, setActieveGroep] = useState<Spiergroep | null>(null);
  const [actiefApparaat, setActiefApparaat] = useState<Apparaat | null>(null);
  const [actiefDoel, setActiefDoel] = useState<string | null>(null);
  const [sorteerModus, setSorteerModus] = useState<SorteerModus>('alfabetisch');
  
  const [filterModal, setFilterModal] = useState(false);
  const [customModal, setCustomModal] = useState(false);
  const [customOef, setCustomOef] = useState<OefeningDef[]>([]);

  const alleOefeningen = useMemo(() => {
    return [...OEFENINGEN_DB, ...customOef];
  }, [customOef]);

  const gefilterdeOefeningen = useMemo(() => {
    const q = zoekterm.toLowerCase().trim();
    let resultaten = alleOefeningen.filter(o => {
      const matchZoek = !q ||
        o.name.toLowerCase().includes(q) ||
        o.naam.toLowerCase().includes(q) ||
        (o.target && o.target.toLowerCase().includes(q)) ||
        formatTargetDutch(o.target).toLowerCase().includes(q) ||
        (o.equipment && o.equipment.toLowerCase().includes(q)) ||
        o.apparaat.toLowerCase().includes(q) ||
        o.groep.toLowerCase().includes(q);

      const matchGroep = !actieveGroep || o.groep === actieveGroep;
      const matchApparaat = !actiefApparaat || o.apparaat === actiefApparaat;
      const matchDoel = !actiefDoel || o.target.toLowerCase() === actiefDoel.toLowerCase() || (o.secondary_muscles && o.secondary_muscles.some(m => m.toLowerCase() === actiefDoel.toLowerCase()));

      return matchZoek && matchGroep && matchApparaat && matchDoel;
    });

    // Sorteren
    if (sorteerModus === 'alfabetisch') {
      resultaten.sort((a, b) => a.naam.localeCompare(b.naam, 'nl'));
    } else if (sorteerModus === 'groep') {
      resultaten.sort((a, b) => a.groep.localeCompare(b.groep, 'nl') || a.naam.localeCompare(b.naam, 'nl'));
    } else if (sorteerModus === 'apparaat') {
      resultaten.sort((a, b) => a.apparaat.localeCompare(b.apparaat, 'nl') || a.naam.localeCompare(b.naam, 'nl'));
    }

    return resultaten;
  }, [alleOefeningen, zoekterm, actieveGroep, actiefApparaat, actiefDoel, sorteerModus]);

  const aantalActieveFilters = (actieveGroep ? 1 : 0) + (actiefApparaat ? 1 : 0) + (actiefDoel ? 1 : 0);

  const resetAlleFilters = useCallback(() => {
    setZoekterm('');
    setActieveGroep(null);
    setActiefApparaat(null);
    setActiefDoel(null);
  }, []);

  const renderOefening = useCallback(({ item }: { item: OefeningDef }) => {
    const groepKleur = GROEP_KLEUR[item.groep] || kleuren.accent;
    const mediaUri = item.image_url || getMediaUrl(item.image);

    return (
      <TouchableOpacity
        style={[s.oefeningRij, { borderBottomColor: kleuren.kaartRand }]}
        onPress={() => router.push(`/exercise/${item.id}`)}
      >
        {/* Thumbnail Preview Image */}
        <View style={[s.thumbContainer, { backgroundColor: '#FFFFFF', borderColor: kleuren.kaartRand }]}>
          {mediaUri ? (
            <Image source={{ uri: mediaUri }} style={s.thumbImage} resizeMode="contain" />
          ) : (
            <Ionicons name={item.icoon as any} size={22} color={groepKleur} />
          )}
        </View>

        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[s.oefeningNaam, { color: kleuren.tekst }]} numberOfLines={1}>
            {item.naam || item.name}
          </Text>
          <View style={s.metaRij}>
            <View style={[s.miniBadge, { backgroundColor: groepKleur + '22', borderColor: groepKleur + '55' }]}>
              <Text style={[s.miniBadgeTekst, { color: groepKleur }]}>{item.groep}</Text>
            </View>
            <Text style={[s.metaTekst, { color: kleuren.tekstGedimpt }]}>
              {formatTargetDutch(item.target)} • {formatEquipmentDutch(item.equipment)}
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={16} color={kleuren.tekstGedimpt} />
      </TouchableOpacity>
    );
  }, [kleuren, router]);

  return (
    <SafeAreaView style={[s.veilig, { backgroundColor: kleuren.achtergrond }]}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <TerugKnop label="Profiel" />
      </View>
      <View style={[s.header, { borderBottomColor: kleuren.kaartRand }]}>
        <View>
          <Text style={[s.headerTitel, { color: kleuren.tekst }]}>Oefeningen</Text>
          <Text style={[s.subTitel, { color: kleuren.tekstGedimpt }]}>
            {gefilterdeOefeningen.length} van {alleOefeningen.length} oefeningen
          </Text>
        </View>
        <TouchableOpacity
          style={[s.customKnop, { backgroundColor: kleuren.accent + '22', borderColor: kleuren.accent + '44' }]}
          onPress={() => setCustomModal(true)}
        >
          <Ionicons name="add" size={16} color={kleuren.accent} />
          <Text style={{ color: kleuren.accentTekst, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>Custom</Text>
        </TouchableOpacity>
      </View>

      {/* Geavanceerde Zoekbalk + Filter Knop */}
      <View style={s.zoekRij}>
        <View style={[s.zoekContainer, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
          <Ionicons name="search-outline" size={18} color={kleuren.tekstGedimpt} style={{ marginRight: 8 }} />
          <TextInput
            style={[s.zoekInput, { color: kleuren.tekst }]}
            placeholder="Zoek oefening, spier of apparaat..."
            placeholderTextColor={kleuren.tekstGedimpt}
            value={zoekterm}
            onChangeText={setZoekterm}
            autoCorrect={false}
          />
          {zoekterm.length > 0 && (
            <TouchableOpacity onPress={() => setZoekterm('')} style={{ padding: 2 }}>
              <Ionicons name="close-circle" size={18} color={kleuren.tekstGedimpt} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Drawer Trigger */}
        <TouchableOpacity
          style={[
            s.filterTriggerKnop,
            {
              backgroundColor: aantalActieveFilters > 0 ? kleuren.accent : kleuren.kaart,
              borderColor: aantalActieveFilters > 0 ? kleuren.accent : kleuren.kaartRand,
            },
          ]}
          onPress={() => setFilterModal(true)}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={aantalActieveFilters > 0 ? '#FFF' : kleuren.tekstSecundair}
          />
          {aantalActieveFilters > 0 && (
            <View style={s.filterTriggerBadge}>
              <Text style={s.filterTriggerBadgeTekst}>{aantalActieveFilters}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Snelle Spiergroep Horizontale Chips */}
      <View style={{ height: 42, marginBottom: 8 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['Alles', ...SPIERGROEPEN]}
          keyExtractor={item => item}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item: g }) => {
            const isAlles = g === 'Alles';
            const isActief = isAlles ? !actieveGroep : actieveGroep === g;
            const kleur = isAlles ? kleuren.accent : (GROEP_KLEUR[g as Spiergroep] || kleuren.accent);

            return (
              <TouchableOpacity
                style={[
                  s.chip,
                  {
                    backgroundColor: isActief ? kleur : kleuren.kaart,
                    borderColor: isActief ? kleur : kleuren.kaartRand,
                  },
                ]}
                onPress={() => setActieveGroep(isAlles ? null : (actieveGroep === g ? null : g as Spiergroep))}
              >
                {!isAlles && <View style={[s.chipDot, { backgroundColor: isActief ? '#FFF' : kleur }]} />}
                <Text style={[s.chipTekst, { color: isActief ? '#FFF' : kleuren.tekstGedimpt }]}>{g}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Actieve Filter Indicator Balk */}
      {(aantalActieveFilters > 0 || zoekterm.length > 0) && (
        <View style={[s.actieveFiltersBalk, { borderBottomColor: kleuren.kaartRand }]}>
          <Text style={[s.actieveFiltersTekst, { color: kleuren.tekstGedimpt }]}>
            Filters:{' '}
            {actieveGroep && <Text style={{ color: kleuren.accentTekst, fontFamily: 'Inter_600SemiBold' }}>{actieveGroep} </Text>}
            {actiefApparaat && <Text style={{ color: kleuren.tekstSecundair, fontFamily: 'Inter_600SemiBold' }}>• {actiefApparaat} </Text>}
            {actiefDoel && <Text style={{ color: kleuren.tekstSecundair, fontFamily: 'Inter_600SemiBold' }}>• {formatTargetDutch(actiefDoel)} </Text>}
            {zoekterm ? <Text style={{ color: kleuren.tekstGedimpt }}>• "{zoekterm}"</Text> : null}
          </Text>
          <TouchableOpacity onPress={resetAlleFilters}>
            <Text style={[s.resetTekst, { color: kleuren.fout }]}>Wis filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Exercise List */}
      <FlatList
        data={gefilterdeOefeningen}
        keyExtractor={item => item.id}
        renderItem={renderOefening}
        initialNumToRender={20}
        maxToRenderPerBatch={25}
        windowSize={10}
        removeClippedSubviews={Platform.OS === 'android'}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.leegContainer}>
            <Ionicons name="search-outline" size={48} color={kleuren.tekstGedimpt} />
            <Text style={[s.leegTitel, { color: kleuren.tekst }]}>Geen oefeningen gevonden</Text>
            <Text style={[s.leegSub, { color: kleuren.tekstGedimpt }]}>
              Probeer een andere zoekterm of wis je actieve filters.
            </Text>
            <TouchableOpacity
              style={[s.resetGroteKnop, { backgroundColor: kleuren.accent }]}
              onPress={resetAlleFilters}
            >
              <Text style={s.resetGroteKnopTekst}>Wis alle filters</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <FilterModal
        zichtbaar={filterModal}
        onSluiten={() => setFilterModal(false)}
        actieveGroep={actieveGroep}
        setActieveGroep={setActieveGroep}
        actiefApparaat={actiefApparaat}
        setActiefApparaat={setActiefApparaat}
        actiefDoel={actiefDoel}
        setActiefDoel={setActiefDoel}
        sorteerModus={sorteerModus}
        setSorteerModus={setSorteerModus}
        onReset={resetAlleFilters}
        totaalGevonden={gefilterdeOefeningen.length}
        kleuren={kleuren}
      />

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
  veilig: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingBottom: 12, borderBottomWidth: 1,
  },
  headerTitel: { fontSize: 28, fontFamily: 'Inter_900Black', letterSpacing: -0.5 },
  subTitel: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  customKnop: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7,
  },
  zoekRij: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  zoekContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  zoekInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  filterTriggerKnop: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterTriggerBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterTriggerBadgeTekst: {
    color: '#FFF',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
    height: 36,
  },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  chipTekst: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  actieveFiltersBalk: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  actieveFiltersTekst: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  resetTekst: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    marginLeft: 8,
  },
  oefeningRij: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, gap: 12,
  },
  thumbContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  oefeningNaam: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  metaRij: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  miniBadge: { borderRadius: 4, borderWidth: 1, paddingHorizontal: 5, paddingVertical: 1 },
  miniBadgeTekst: { fontSize: 11, fontFamily: 'Inter_700Bold', textTransform: 'uppercase' },
  metaTekst: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  leegContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 10,
    marginTop: 40,
  },
  leegTitel: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  leegSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    maxWidth: 280,
  },
  resetGroteKnop: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetGroteKnopTekst: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
});
