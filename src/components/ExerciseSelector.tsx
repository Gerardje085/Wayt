// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Enhanced Exercise Selector Modal
// Universal exercise selector with full multi-attribute search and filter drawer.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, Pressable,
  FlatList, TextInput, KeyboardAvoidingView, Platform, Image, ScrollView, type ViewStyle,
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
import { RADIUS, SHADOWS, useResponsive } from '../theme/designTokens';

const WEB_POINTER = Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : undefined;

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
  const { isDesktop, isTablet, height } = useResponsive();
  const isDialog = isDesktop || isTablet;

  useEffect(() => {
    if (!zichtbaar || Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSluiten();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zichtbaar, onSluiten]);

  return (
    <Modal
      visible={zichtbaar}
      animationType={Platform.OS === 'web' || isDialog ? 'fade' : 'slide'}
      transparent
      onRequestClose={onSluiten}
      statusBarTranslucent
    >
      <View style={[stijlen.overlay, isDialog ? stijlen.overlayDialog : stijlen.overlaySheet]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onSluiten} />
        <View
          style={[
            fm.container,
            {
              backgroundColor: kleuren.achtergrond,
              borderColor: kleuren.kaartRand,
              height: isDialog ? Math.min(height * 0.84, 720) : '90%',
            },
            isDialog ? fm.dialogContainer : fm.sheetContainer,
            SHADOWS.forTheme(kleuren.isDark, 'lg'),
          ]}
        >
          {!isDialog && (
            <View style={stijlen.handvatWrap}>
              <View style={[stijlen.handvat, { backgroundColor: kleuren.kaartRand }]} />
            </View>
          )}

          <View style={[fm.header, { borderBottomColor: kleuren.kaartRand }]}>
            <TouchableOpacity
              onPress={onSluiten}
              style={[fm.sluitKnop, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }, WEB_POINTER]}
            >
              <Ionicons name="close" size={18} color={kleuren.tekstSecundair} />
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={[fm.headerTitel, { color: kleuren.tekst }]}>Filters & Sorteren</Text>
              {aantalActieveFilters > 0 && (
                <Text style={[fm.filterBadgeTekst, { color: kleuren.accentLicht }]}>
                  {aantalActieveFilters} filter{aantalActieveFilters > 1 ? 's' : ''} actief
                </Text>
              )}
            </View>
            {aantalActieveFilters > 0 ? (
              <TouchableOpacity onPress={onReset} style={WEB_POINTER}>
                <Text style={{ color: kleuren.fout, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Reset</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 34 }} />
            )}
          </View>

          <ScrollView style={fm.inhoud} showsVerticalScrollIndicator={false}>
            <Text style={[fm.sectieTitel, { color: kleuren.tekstGedimpt }]}>SPIERGROEP</Text>
            <View style={fm.chipGrid}>
              <TouchableOpacity
                style={[
                  fm.chip,
                  {
                    backgroundColor: !actieveGroep ? kleuren.accent : kleuren.kaart,
                    borderColor: !actieveGroep ? kleuren.accent : kleuren.kaartRand,
                  },
                  WEB_POINTER,
                ]}
                onPress={() => setActieveGroep(null)}
              >
                <Text style={[fm.chipTekst, { color: !actieveGroep ? '#FFFFFF' : kleuren.tekstSecundair }]}>Alles</Text>
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
                      WEB_POINTER,
                    ]}
                    onPress={() => setActieveGroep(actief ? null : g)}
                  >
                    <Text style={[fm.chipTekst, { color: actief ? '#FFFFFF' : kleuren.tekstSecundair }]}>{g}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[fm.sectieTitel, { color: kleuren.tekstGedimpt }]}>APPARAAT / MATERIAAL</Text>
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
                      WEB_POINTER,
                    ]}
                    onPress={() => setActiefApparaat(app.waarde)}
                  >
                    <Text style={[fm.chipTekst, { color: actief ? '#FFFFFF' : kleuren.tekstSecundair }]}>{app.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[fm.sectieTitel, { color: kleuren.tekstGedimpt }]}>DOELSPIER</Text>
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
                      WEB_POINTER,
                    ]}
                    onPress={() => setActiefDoel(d.target)}
                  >
                    <Text style={[fm.chipTekst, { color: actief ? '#FFFFFF' : kleuren.tekstSecundair }]}>{d.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[fm.sectieTitel, { color: kleuren.tekstGedimpt }]}>SORTEER OP</Text>
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
                      WEB_POINTER,
                    ]}
                    onPress={() => setSortering(opt.id as SorteerOptie)}
                  >
                    <Ionicons
                      name={opt.icoon as any}
                      size={18}
                      color={actief ? kleuren.accentLicht : kleuren.tekstGedimpt}
                      style={{ marginRight: 10 }}
                    />
                    <Text style={[fm.sorteerTekst, { color: actief ? kleuren.tekst : kleuren.tekstSecundair }]}>
                      {opt.label}
                    </Text>
                    {actief && <Ionicons name="checkmark-circle" size={18} color={kleuren.accentLicht} style={{ marginLeft: 'auto' }} />}
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={{ height: 32 }} />
          </ScrollView>

          <View style={[fm.footer, { borderTopColor: kleuren.kaartRand, backgroundColor: kleuren.achtergrond }]}>
            <TouchableOpacity style={[fm.toepasKnop, { backgroundColor: kleuren.accent }, WEB_POINTER]} onPress={onSluiten}>
              <Text style={fm.toepasTekst}>Toon {totaalResultaten} oefeningen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function ExerciseSelector({ zichtbaar, huidigeSelectie, onSelecteer, onSluiten }: ExerciseSelectorProps) {
  const { kleuren } = useThema();
  const { isDesktop, isTablet, height } = useResponsive();
  const isDialog = isDesktop || isTablet;

  const [zoekterm, setZoekterm] = useState('');
  const [actieveGroep, setActieveGroep] = useState<Spiergroep | null>(null);
  const [actiefApparaat, setActiefApparaat] = useState<Apparaat | null>(null);
  const [actiefDoel, setActiefDoel] = useState<string | null>(null);
  const [sortering, setSortering] = useState<SorteerOptie>('naam_az');
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  useEffect(() => {
    if (!zichtbaar || filterModalOpen || Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSluiten();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zichtbaar, filterModalOpen, onSluiten]);

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
    <Modal
      visible={zichtbaar}
      animationType={Platform.OS === 'web' || isDialog ? 'fade' : 'slide'}
      transparent
      onRequestClose={onSluiten}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[stijlen.overlay, isDialog ? stijlen.overlayDialog : stijlen.overlaySheet]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onSluiten} />

        <View
          style={[
            stijlen.modalContainer,
            {
              backgroundColor: kleuren.achtergrond,
              borderColor: kleuren.kaartRand,
              height: isDialog ? Math.min(height * 0.86, 780) : '88%',
            },
            isDialog ? stijlen.dialogContainer : stijlen.sheetContainer,
            SHADOWS.forTheme(kleuren.isDark, 'lg'),
          ]}
        >
          {!isDialog && (
            <View style={stijlen.handvatWrap}>
              <View style={[stijlen.handvat, { backgroundColor: kleuren.kaartRand }]} />
            </View>
          )}

          <View style={[stijlen.header, { borderBottomColor: kleuren.kaartRand }]}>
            <View>
              <Text style={[stijlen.headerTitel, { color: kleuren.tekst }]}>Kies een oefening</Text>
              <Text style={[stijlen.headerSub, { color: kleuren.tekstSecundair }]}>
                {gefilterdeOefeningen.length} van {OEFENINGEN_DB.length} oefeningen
              </Text>
            </View>
            <TouchableOpacity
              onPress={onSluiten}
              style={[
                stijlen.sluitKnop,
                { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand },
                WEB_POINTER,
              ]}
              accessibilityLabel="Sluiten"
            >
              <Ionicons name="close" size={18} color={kleuren.tekstSecundair} />
            </TouchableOpacity>
          </View>

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
                WEB_POINTER,
              ]}
              onPress={() => setFilterModalOpen(true)}
            >
              <Ionicons name="options-outline" size={20} color={aantalActieveFilters > 0 ? '#FFFFFF' : kleuren.tekst} />
              {aantalActieveFilters > 0 && (
                <View style={[stijlen.filterBadge, { backgroundColor: '#FFFFFF' }]}>
                  <Text style={[stijlen.filterBadgeTekst, { color: kleuren.accent }]}>{aantalActieveFilters}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

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
                      WEB_POINTER,
                    ]}
                    onPress={() => setActieveGroep(isAlles ? null : (actieveGroep === g ? null : (g as Spiergroep)))}
                  >
                    <Text style={[stijlen.chipTekst, { color: isActief ? '#FFFFFF' : kleuren.tekstSecundair }]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          {aantalActieveFilters > 0 && (
            <View style={[stijlen.actieveFiltersBalk, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
              <Text style={[stijlen.actieveFiltersTekst, { color: kleuren.tekst }]} numberOfLines={1}>
                Filters:{' '}
                {actieveGroep ? <Text style={{ color: kleuren.accentLicht }}>{actieveGroep} </Text> : null}
                {actiefApparaat ? <Text style={{ color: kleuren.accentLicht }}>• {actiefApparaat} </Text> : null}
                {actiefDoel ? <Text style={{ color: kleuren.accentLicht }}>• {formatTargetDutch(actiefDoel)} </Text> : null}
                {sortering !== 'naam_az' ? <Text style={{ color: kleuren.accentLicht }}>• gesorteerd </Text> : null}
              </Text>
              <TouchableOpacity onPress={resetAlleFilters} style={WEB_POINTER}>
                <Text style={[stijlen.resetTekst, { color: kleuren.fout }]}>Wis filters</Text>
              </TouchableOpacity>
            </View>
          )}

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
                    WEB_POINTER,
                  ]}
                  onPress={() => handleSelect(item.id)}
                  activeOpacity={0.75}
                >
                  <View style={[stijlen.thumbContainer, { backgroundColor: '#FFFFFF', borderColor: kleuren.kaartRand }]}>
                    {mediaUri ? (
                      <Image source={{ uri: mediaUri }} style={stijlen.thumbImage} resizeMode="contain" />
                    ) : (
                      <Ionicons name={item.icoon as any} size={18} color={isActief ? kleuren.accent : kleuren.tekstGedimpt} />
                    )}
                  </View>
                  <View style={stijlen.tekstContainer}>
                    <Text style={[stijlen.oefeningNaam, { color: isActief ? kleuren.accentLicht : kleuren.tekst }]} numberOfLines={1}>
                      {item.naam || item.name}
                    </Text>
                    <Text style={[stijlen.oefeningGroep, { color: kleuren.tekstGedimpt }]} numberOfLines={1}>
                      {item.groep} • {formatTargetDutch(item.target)} • {formatEquipmentDutch(item.equipment)}
                    </Text>
                  </View>
                  {isActief && <Ionicons name="checkmark-circle" size={22} color={kleuren.accentLicht} />}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={stijlen.leegContainer}>
                <Ionicons name="search-outline" size={38} color={kleuren.tekstGedimpt} />
                <Text style={[stijlen.leegTekst, { color: kleuren.tekstSecundair }]}>Geen oefeningen gevonden</Text>
                {aantalActieveFilters > 0 && (
                  <TouchableOpacity
                    style={[stijlen.resetKnopGroot, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }, WEB_POINTER]}
                    onPress={resetAlleFilters}
                  >
                    <Text style={{ color: kleuren.accentLicht, fontFamily: 'Inter_600SemiBold' }}>Wis alle filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        </View>
      </KeyboardAvoidingView>

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
    backgroundColor: 'rgba(0,0,0,0.58)',
  },
  overlaySheet: {
    justifyContent: 'flex-end',
  },
  overlayDialog: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    borderWidth: 1,
    overflow: 'hidden',
  },
  sheetContainer: {
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    borderBottomWidth: 0,
  },
  dialogContainer: {
    maxWidth: 620,
    borderRadius: RADIUS.xl,
  },
  handvatWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 2,
  },
  handvat: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitel: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  sluitKnop: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoekRij: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 10,
    gap: 8,
  },
  zoekContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
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
    borderRadius: RADIUS.md,
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
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
  },
  chipTekst: {
    fontSize: 12,
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
    borderRadius: RADIUS.sm,
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
    paddingBottom: 32,
  },
  oefeningRij: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  thumbContainer: {
    width: 44,
    height: 44,
    borderRadius: 11,
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
    minWidth: 0,
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
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    marginTop: 4,
  },
});

const fm = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: 1,
    overflow: 'hidden',
  },
  sheetContainer: {
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    borderBottomWidth: 0,
  },
  dialogContainer: {
    maxWidth: 540,
    borderRadius: RADIUS.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  sluitKnop: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitel: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  filterBadgeTekst: { fontSize: 11, fontFamily: 'Inter_600SemiBold', marginTop: 2 },
  inhoud: { flex: 1, paddingHorizontal: 20, paddingTop: 14 },
  sectieTitel: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1.1, marginBottom: 10, marginTop: 14 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1 },
  chipTekst: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  sorteerLijst: { gap: 8, marginBottom: 8 },
  sorteerRij: { flexDirection: 'row', alignItems: 'center', padding: 13, borderRadius: RADIUS.md, borderWidth: 1 },
  sorteerTekst: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  footer: { padding: 16, borderTopWidth: 1 },
  toepasKnop: { paddingVertical: 14, borderRadius: RADIUS.md, alignItems: 'center' },
  toepasTekst: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Inter_700Bold' },
});
