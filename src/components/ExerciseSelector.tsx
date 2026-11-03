// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Enhanced Exercise Selector Modal
// Universal exercise selector with full multi-attribute search and filter drawer.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  FlatList, TextInput, KeyboardAvoidingView, Platform, Image, SafeAreaView, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThema } from '../context/ThemeContext';
import {
  OEFENINGEN_DB,
  findExercise,
  getMediaUrl,
  formatEquipmentDutch,
  formatTargetDutch,
  type Spiergroep,
  type Apparaat,
} from '../data/exercises';
import { GROEP_KLEUR } from '../theme/groepKleuren';

interface ExerciseSelectorProps {
  zichtbaar: boolean;
  huidigeSelectie: string;
  onSelecteer: (id: string) => void;
  onSluiten: () => void;
}

const SPIERGROEPEN: Spiergroep[] = [
  'Borst', 'Rug', 'Benen', 'Kuiten', 'Schouders', 'Armen', 'Core', 'Cardio', 'Nek',
];

const APPARATEN: Array<{ label: string; waarde: Apparaat | null }> = [
  { label: 'Alle apparaten', waarde: null },
  { label: 'Barbell', waarde: 'Barbell' },
  { label: 'Dumbbell', waarde: 'Dumbbell' },
  { label: 'Kabel', waarde: 'Kabel' },
  { label: 'Machine', waarde: 'Machine' },
  { label: 'Lichaamsgewicht', waarde: 'Lichaamsgewicht' },
  { label: 'Kettlebell', waarde: 'Kettlebell' },
  { label: 'Weerstandsband', waarde: 'Weerstandsband' },
  { label: 'Overig', waarde: 'Overig' },
];

const POPULAIRE_DOELEN = [
  { label: 'Alle doelen', target: null },
  { label: 'Buikspieren', target: 'abs' },
  { label: 'Borstspier', target: 'pectorals' },
  { label: 'Lats (Rug)', target: 'lats' },
  { label: 'Quads (Bovenbeen)', target: 'quads' },
  { label: 'Bilspieren', target: 'glutes' },
  { label: 'Hamstrings', target: 'hamstrings' },
  { label: 'Schouders (Delts)', target: 'delts' },
  { label: 'Biceps', target: 'biceps' },
  { label: 'Triceps', target: 'triceps' },
  { label: 'Kuiten', target: 'calves' },
];

type SorteerOptie = 'naam_az' | 'spiergroep' | 'apparaat';

function FilterModal({
  zichtbaar,
  onSluiten,
  actieveGroep,
  setActieveGroep,
  actiefApparaat,
  setActiefApparaat,
  actiefDoel,
  setActiefDoel,
  sortering,
  setSortering,
  onReset,
  aantalActieveFilters,
  totaalResultaten,
  kleuren,
}: {
  zichtbaar: boolean;
  onSluiten: () => void;
  actieveGroep: Spiergroep | null;
  setActieveGroep: (g: Spiergroep | null) => void;
  actiefApparaat: Apparaat | null;
  setActiefApparaat: (a: Apparaat | null) => void;
  actiefDoel: string | null;
  setActiefDoel: (d: string | null) => void;
  sortering: SorteerOptie;
  setSortering: (s: SorteerOptie) => void;
  onReset: () => void;
  aantalActieveFilters: number;
  totaalResultaten: number;
  kleuren: any;
}) {
  return (
    <Modal visible={zichtbaar} animationType="slide" presentationStyle="pageSheet" onRequestClose={onSluiten}>
      <SafeAreaView style={[fm.container, { backgroundColor: kleuren.achtergrond }]}>
        {/* Header */}
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

        <ScrollView style={fm.inhoud} showsVerticalScrollIndicator={false}>
          {/* Spiergroep */}
          <Text style={[fm.sectieTitel, { color: kleuren.accentTekst }]}>SPIERGROEP</Text>
          <View style={fm.chipGrid}>
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
              <Text style={[fm.chipTekst, { color: !actieveGroep ? '#FFF' : kleuren.tekstGedimpt }]}>Alles</Text>
            </TouchableOpacity>
            {SPIERGROEPEN.map((g) => {
              const actief = actieveGroep === g;
              const kleur = GROEP_KLEUR[g] || kleuren.accent;
              return (
                <TouchableOpacity
                  key={g}
                  style={[
                    fm.chip,
                    {
                      backgroundColor: actief ? kleur : kleuren.kaart,
                      borderColor: actief ? kleur : kleuren.kaartRand,
                    },
                  ]}
                  onPress={() => setActieveGroep(actief ? null : g)}
                >
                  <Text style={[fm.chipTekst, { color: actief ? '#FFF' : kleuren.tekstGedimpt }]}>{g}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Apparaat */}
          <Text style={[fm.sectieTitel, { color: kleuren.accentTekst }]}>APPARAAT / MATERIAAL</Text>
          <View style={fm.chipGrid}>
            {APPARATEN.map((app) => {
              const actief = actiefApparaat === app.waarde;
              return (
                <TouchableOpacity
                  key={app.label}
                  style={[
                    fm.chip,
                    {
                      backgroundColor: actief ? kleuren.accent : kleuren.kaart,
                      borderColor: actief ? kleuren.accent : kleuren.kaartRand,
                    },
                  ]}
                  onPress={() => setActiefApparaat(app.waarde)}
                >
                  <Text style={[fm.chipTekst, { color: actief ? '#FFF' : kleuren.tekstGedimpt }]}>{app.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Doelspier */}
          <Text style={[fm.sectieTitel, { color: kleuren.accentTekst }]}>DOELSPIER (TARGET)</Text>
          <View style={fm.chipGrid}>
            {POPULAIRE_DOELEN.map((d) => {
              const actief = actiefDoel === d.target;
              return (
                <TouchableOpacity
                  key={d.label}
                  style={[
                    fm.chip,
                    {
                      backgroundColor: actief ? kleuren.accent : kleuren.kaart,
                      borderColor: actief ? kleuren.accent : kleuren.kaartRand,
                    },
                  ]}
                  onPress={() => setActiefDoel(d.target)}
                >
                  <Text style={[fm.chipTekst, { color: actief ? '#FFF' : kleuren.tekstGedimpt }]}>{d.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Sortering */}
          <Text style={[fm.sectieTitel, { color: kleuren.accentTekst }]}>SORTEER OP</Text>
          <View style={fm.sorteerLijst}>
            {[
              { id: 'naam_az', label: 'Alfabetisch (A – Z)', icoon: 'text-outline' },
              { id: 'spiergroep', label: 'Op Spiergroep', icoon: 'body-outline' },
              { id: 'apparaat', label: 'Op Apparaat / Materiaal', icoon: 'barbell-outline' },
            ].map((opt) => {
              const actief = sortering === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    fm.sorteerRij,
                    {
                      backgroundColor: actief ? kleuren.accentGedimpt : kleuren.kaart,
                      borderColor: actief ? kleuren.accent : kleuren.kaartRand,
                    },
                  ]}
                  onPress={() => setSortering(opt.id as SorteerOptie)}
                >
                  <Ionicons
                    name={opt.icoon as any}
                    size={18}
                    color={actief ? kleuren.accent : kleuren.tekstGedimpt}
                    style={{ marginRight: 10 }}
                  />
                  <Text style={[fm.sorteerTekst, { color: actief ? kleuren.accentTekst : kleuren.tekst }]}>{opt.label}</Text>
                  {actief && <Ionicons name="checkmark" size={18} color={kleuren.accent} style={{ marginLeft: 'auto' }} />}
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Footer */}
        <View style={[fm.footer, { borderTopColor: kleuren.kaartRand, backgroundColor: kleuren.achtergrond }]}>
          <TouchableOpacity style={[fm.toepasKnop, { backgroundColor: kleuren.accent }]} onPress={onSluiten}>
            <Text style={fm.toepasTekst}>Toon {totaalResultaten} oefeningen</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export default function ExerciseSelector({ zichtbaar, huidigeSelectie, onSelecteer, onSluiten }: ExerciseSelectorProps) {
  const { kleuren } = useThema();
  const [zoekterm, setZoekterm] = useState('');
  const [actieveGroep, setActieveGroep] = useState<Spiergroep | null>(null);
  const [actiefApparaat, setActiefApparaat] = useState<Apparaat | null>(null);
  const [actiefDoel, setActiefDoel] = useState<string | null>(null);
  const [sortering, setSortering] = useState<SorteerOptie>('naam_az');
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const aantalActieveFilters = useMemo(() => {
    let n = 0;
    if (actieveGroep) n++;
    if (actiefApparaat) n++;
    if (actiefDoel) n++;
    if (sortering !== 'naam_az') n++;
    return n;
  }, [actieveGroep, actiefApparaat, actiefDoel, sortering]);

  const resetAlleFilters = () => {
    setActieveGroep(null);
    setActiefApparaat(null);
    setActiefDoel(null);
    setSortering('naam_az');
    setZoekterm('');
  };

  const gefilterdeOefeningen = useMemo(() => {
    const q = zoekterm.toLowerCase().trim();

    const gefilterd = OEFENINGEN_DB.filter((o) => {
      if (actieveGroep && o.groep !== actieveGroep) return false;
      if (actiefApparaat && o.apparaat !== actiefApparaat) return false;
      if (actiefDoel && o.target !== actiefDoel) return false;

      if (!q) return true;
      const targetNl = formatTargetDutch(o.target).toLowerCase();
      const equipNl = formatEquipmentDutch(o.equipment).toLowerCase();

      return (
        o.name.toLowerCase().includes(q) ||
        o.naam.toLowerCase().includes(q) ||
        (o.target && o.target.toLowerCase().includes(q)) ||
        targetNl.includes(q) ||
        (o.equipment && o.equipment.toLowerCase().includes(q)) ||
        equipNl.includes(q) ||
        o.apparaat.toLowerCase().includes(q) ||
        o.groep.toLowerCase().includes(q) ||
        (o.category && o.category.toLowerCase().includes(q))
      );
    });

    if (sortering === 'naam_az') {
      gefilterd.sort((a, b) => (a.naam || a.name).localeCompare(b.naam || b.name, 'nl'));
    } else if (sortering === 'spiergroep') {
      gefilterd.sort((a, b) => a.groep.localeCompare(b.groep, 'nl'));
    } else if (sortering === 'apparaat') {
      gefilterd.sort((a, b) => a.apparaat.localeCompare(b.apparaat, 'nl'));
    }

    return gefilterd;
  }, [zoekterm, actieveGroep, actiefApparaat, actiefDoel, sortering]);

  const actieveOefening = useMemo(() => findExercise(huidigeSelectie), [huidigeSelectie]);

  function handleSelect(id: string) {
    onSelecteer(id);
    onSluiten();
    setZoekterm('');
  }

  return (
    <Modal visible={zichtbaar} animationType="slide" transparent={true} onRequestClose={onSluiten}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={stijlen.overlay}>
        <View style={[stijlen.modalContainer, { backgroundColor: kleuren.achtergrond }]}>
          {/* Header */}
          <View style={[stijlen.header, { borderBottomColor: kleuren.kaartRand }]}>
            <View>
              <Text style={[stijlen.headerTitel, { color: kleuren.tekst }]}>Kies een Oefening</Text>
              <Text style={[stijlen.headerSub, { color: kleuren.tekstGedimpt }]}>
                {gefilterdeOefeningen.length} van {OEFENINGEN_DB.length} oefeningen
              </Text>
            </View>
            <TouchableOpacity onPress={onSluiten} style={stijlen.sluitKnop}>
              <Ionicons name="close" size={24} color={kleuren.tekstGedimpt} />
            </TouchableOpacity>
          </View>

          {/* Zoekbalk + Filter Drawer Knop */}
          <View style={stijlen.zoekRij}>
            <View style={[stijlen.zoekContainer, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
              <Ionicons name="search" size={18} color={kleuren.tekstGedimpt} style={stijlen.zoekIcoon} />
              <TextInput
                style={[stijlen.zoekInput, { color: kleuren.tekst }]}
                placeholder="Zoek op naam, spier of apparaat..."
                placeholderTextColor={kleuren.tekstGedimpt}
                value={zoekterm}
                onChangeText={setZoekterm}
                autoCorrect={false}
              />
              {zoekterm.length > 0 && (
                <TouchableOpacity onPress={() => setZoekterm('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={18} color={kleuren.tekstGedimpt} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[
                stijlen.filterKnop,
                {
                  backgroundColor: aantalActieveFilters > 0 ? kleuren.accent : kleuren.kaart,
                  borderColor: aantalActieveFilters > 0 ? kleuren.accent : kleuren.kaartRand,
                },
              ]}
              onPress={() => setFilterModalOpen(true)}
            >
              <Ionicons name="options-outline" size={20} color={aantalActieveFilters > 0 ? '#FFF' : kleuren.tekst} />
              {aantalActieveFilters > 0 && (
                <View style={[stijlen.filterBadge, { backgroundColor: '#FFF' }]}>
                  <Text style={[stijlen.filterBadgeTekst, { color: kleuren.accentTekst }]}>{aantalActieveFilters}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Horizontale Spiergroep Chips */}
          <View style={{ height: 42, marginBottom: 6 }}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={['Alles', ...SPIERGROEPEN]}
              keyExtractor={(item) => item}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
              renderItem={({ item: g }) => {
                const isAlles = g === 'Alles';
                const isActief = isAlles ? !actieveGroep : actieveGroep === g;
                const kleur = isAlles ? kleuren.accent : (GROEP_KLEUR[g as Spiergroep] || kleuren.accent);

                return (
                  <TouchableOpacity
                    style={[
                      stijlen.chip,
                      {
                        backgroundColor: isActief ? kleur : kleuren.kaart,
                        borderColor: isActief ? kleur : kleuren.kaartRand,
                      },
                    ]}
                    onPress={() => setActieveGroep(isAlles ? null : (actieveGroep === g ? null : (g as Spiergroep)))}
                  >
                    <Text style={[stijlen.chipTekst, { color: isActief ? '#FFF' : kleuren.tekstGedimpt }]}>{g}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          {/* Actieve Filter Tag Bar */}
          {aantalActieveFilters > 0 && (
            <View style={[stijlen.actieveFiltersBalk, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
              <Text style={[stijlen.actieveFiltersTekst, { color: kleuren.tekst }]} numberOfLines={1}>
                Filters:{' '}
                {actieveGroep ? <Text style={{ color: kleuren.accentTekst }}>{actieveGroep} </Text> : null}
                {actiefApparaat ? <Text style={{ color: kleuren.accentTekst }}>• {actiefApparaat} </Text> : null}
                {actiefDoel ? <Text style={{ color: kleuren.accentTekst }}>• {formatTargetDutch(actiefDoel)} </Text> : null}
                {sortering !== 'naam_az' ? <Text style={{ color: kleuren.accentTekst }}>• gesorteerd </Text> : null}
              </Text>
              <TouchableOpacity onPress={resetAlleFilters}>
                <Text style={[stijlen.resetTekst, { color: kleuren.fout }]}>Wis filters</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Lijst van Oefeningen */}
          <FlatList
            data={gefilterdeOefeningen}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={stijlen.lijstInhoud}
            initialNumToRender={20}
            maxToRenderPerBatch={25}
            windowSize={10}
            renderItem={({ item }) => {
              const isActief = item.id === huidigeSelectie || (actieveOefening && actieveOefening.id === item.id);
              const mediaUri = item.image_url || getMediaUrl(item.image);

              return (
                <TouchableOpacity
                  style={[
                    stijlen.oefeningRij,
                    { borderBottomColor: kleuren.kaartRand },
                    isActief && { backgroundColor: kleuren.accentGedimpt },
                  ]}
                  onPress={() => handleSelect(item.id)}
                >
                  <View style={[stijlen.thumbContainer, { backgroundColor: '#FFFFFF', borderColor: kleuren.kaartRand }]}>
                    {mediaUri ? (
                      <Image source={{ uri: mediaUri }} style={stijlen.thumbImage} resizeMode="contain" />
                    ) : (
                      <Ionicons name={item.icoon as any} size={18} color={isActief ? kleuren.accent : kleuren.tekstGedimpt} />
                    )}
                  </View>
                  <View style={stijlen.tekstContainer}>
                    <Text style={[stijlen.oefeningNaam, { color: isActief ? kleuren.accentTekst : kleuren.tekst }]} numberOfLines={1}>
                      {item.naam || item.name}
                    </Text>
                    <Text style={[stijlen.oefeningGroep, { color: kleuren.tekstGedimpt }]}>
                      {item.groep} • {formatTargetDutch(item.target)} • {formatEquipmentDutch(item.equipment)}
                    </Text>
                  </View>
                  {isActief && <Ionicons name="checkmark-circle" size={22} color={kleuren.accent} />}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={stijlen.leegContainer}>
                <Ionicons name="search-outline" size={40} color={kleuren.tekstGedimpt} />
                <Text style={[stijlen.leegTekst, { color: kleuren.tekstGedimpt }]}>Geen oefeningen gevonden</Text>
                {aantalActieveFilters > 0 && (
                  <TouchableOpacity style={[stijlen.resetKnopGroot, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]} onPress={resetAlleFilters}>
                    <Text style={{ color: kleuren.accentTekst, fontFamily: 'Inter_600SemiBold' }}>Wis alle filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        </View>
      </KeyboardAvoidingView>

      {/* Filter Modal Drawer */}
      <FilterModal
        zichtbaar={filterModalOpen}
        onSluiten={() => setFilterModalOpen(false)}
        actieveGroep={actieveGroep}
        setActieveGroep={setActieveGroep}
        actiefApparaat={actiefApparaat}
        setActiefApparaat={setActiefApparaat}
        actiefDoel={actiefDoel}
        setActiefDoel={setActiefDoel}
        sortering={sortering}
        setSortering={setSortering}
        onReset={resetAlleFilters}
        aantalActieveFilters={aantalActieveFilters}
        totaalResultaten={gefilterdeOefeningen.length}
        kleuren={kleuren}
      />
    </Modal>
  );
}

const stijlen = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitel: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  headerSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  sluitKnop: {
    padding: 4,
  },
  zoekRij: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
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
  zoekIcoon: {
    marginRight: 8,
  },
  zoekInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  filterKnop: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeTekst: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
  },
  chipTekst: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  actieveFiltersBalk: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  actieveFiltersTekst: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
  },
  resetTekst: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    marginLeft: 8,
  },
  lijstInhoud: {
    paddingBottom: 40,
  },
  oefeningRij: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  thumbContainer: {
    width: 44,
    height: 44,
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
  tekstContainer: {
    flex: 1,
  },
  oefeningNaam: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  oefeningGroep: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  leegContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  leegTekst: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  resetKnopGroot: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
});

const fm = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  sluitKnop: { padding: 4 },
  headerTitel: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  filterBadgeTekst: { fontSize: 11, fontFamily: 'Inter_600SemiBold', marginTop: 2 },
  inhoud: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  sectieTitel: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1, marginBottom: 10, marginTop: 14 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipTekst: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  sorteerLijst: { gap: 8, marginBottom: 8 },
  sorteerRij: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1 },
  sorteerTekst: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  footer: { padding: 16, borderTopWidth: 1 },
  toepasKnop: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  toepasTekst: { color: '#FFF', fontSize: 15, fontFamily: 'Inter_700Bold' },
});
