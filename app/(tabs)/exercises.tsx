import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Image,
  ScrollView,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThema } from '../../src/context/ThemeContext';
import { useLiveWorkout } from '../../src/context/LiveWorkoutContext';
import {
  OEFENINGEN_DB,
  type OefeningDef,
  type Spiergroep,
  type Apparaat,
  type OefeningType,
  getMediaUrl,
  formatEquipmentDutch,
  formatTargetDutch,
} from '../../src/data/exercises';
import { GROEP_KLEUR } from '../../src/theme/groepKleuren';
import {
  BREAKPOINTS,
  NAV_METRICS,
  RADIUS,
  SHADOWS,
  SPACING,
  useResponsive,
} from '../../src/theme/designTokens';
import ResponsiveContainer from '../../src/components/ui/ResponsiveContainer';
import ScreenHeader from '../../src/components/ui/ScreenHeader';
import BottomSheet from '../../src/components/ui/BottomSheet';
import PrimaryButton from '../../src/components/ui/PrimaryButton';
import EmptyState from '../../src/components/ui/EmptyState';
import type { ThemaKleuren } from '../../src/types';

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

const SORTEER_LABELS: Record<SorteerModus, string> = {
  alfabetisch: 'A-Z',
  groep: 'Spiergroep',
  apparaat: 'Apparaat',
};

function FilterModal({
  zichtbaar,
  onSluiten,
  actieveGroep,
  setActieveGroep,
  actiefApparaat,
  setActiefApparaat,
  actiefDoel,
  setActiefDoel,
  sorteerModus,
  setSorteerModus,
  onReset,
  totaalGevonden,
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
  sorteerModus: SorteerModus;
  setSorteerModus: (s: SorteerModus) => void;
  onReset: () => void;
  totaalGevonden: number;
  kleuren: ThemaKleuren;
}) {
  const aantalActieveFilters =
    (actieveGroep ? 1 : 0) + (actiefApparaat ? 1 : 0) + (actiefDoel ? 1 : 0);

  const webPointer: ViewStyle | undefined =
    Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : undefined;

  return (
    <BottomSheet
      visible={zichtbaar}
      onClose={onSluiten}
      title="Filters & Sorteren"
      subtitle={
        aantalActieveFilters > 0
          ? `${aantalActieveFilters} ${aantalActieveFilters === 1 ? 'filter' : 'filters'} actief`
          : 'Verfijn de oefeningenbibliotheek'
      }
      maxWidth={540}
      scrollable
    >
      <View style={fm.inhoud}>
        {/* Spiergroep Filter */}
        <Text style={[fm.sectieTitel, { color: kleuren.tekstSecundair }]}>SPIERGROEP</Text>
        <View style={fm.grid}>
          <TouchableOpacity
            style={[
              fm.chip,
              {
                backgroundColor: !actieveGroep ? kleuren.accent : kleuren.achtergrondSecundair,
                borderColor: !actieveGroep ? kleuren.accent : kleuren.kaartRand,
              },
              webPointer,
            ]}
            onPress={() => setActieveGroep(null)}
          >
            <Text style={[fm.chipTekst, { color: !actieveGroep ? '#FFFFFF' : kleuren.tekstSecundair }]}>
              Alle spiergroepen
            </Text>
          </TouchableOpacity>

          {SPIERGROEPEN.map((g) => {
            const isActief = actieveGroep === g;
            const kleur = GROEP_KLEUR[g] || kleuren.accent;
            return (
              <TouchableOpacity
                key={g}
                style={[
                  fm.chip,
                  {
                    backgroundColor: isActief ? kleur : kleuren.achtergrondSecundair,
                    borderColor: isActief ? kleur : kleuren.kaartRand,
                  },
                  webPointer,
                ]}
                onPress={() => setActieveGroep(isActief ? null : g)}
              >
                <View style={[fm.dot, { backgroundColor: isActief ? '#FFFFFF' : kleur }]} />
                <Text style={[fm.chipTekst, { color: isActief ? '#FFFFFF' : kleuren.tekst }]}>
                  {g}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Apparaat Filter */}
        <Text style={[fm.sectieTitel, { color: kleuren.tekstSecundair, marginTop: 22 }]}>
          APPARAAT / MATERIAAL
        </Text>
        <View style={fm.grid}>
          <TouchableOpacity
            style={[
              fm.chip,
              {
                backgroundColor: !actiefApparaat ? kleuren.accent : kleuren.achtergrondSecundair,
                borderColor: !actiefApparaat ? kleuren.accent : kleuren.kaartRand,
              },
              webPointer,
            ]}
            onPress={() => setActiefApparaat(null)}
          >
            <Text
              style={[fm.chipTekst, { color: !actiefApparaat ? '#FFFFFF' : kleuren.tekstSecundair }]}
            >
              Alle apparaten
            </Text>
          </TouchableOpacity>

          {APPARATEN.map((a) => {
            const isActief = actiefApparaat === a;
            return (
              <TouchableOpacity
                key={a}
                style={[
                  fm.chip,
                  {
                    backgroundColor: isActief ? kleuren.accent : kleuren.achtergrondSecundair,
                    borderColor: isActief ? kleuren.accent : kleuren.kaartRand,
                  },
                  webPointer,
                ]}
                onPress={() => setActiefApparaat(isActief ? null : a)}
              >
                <Text style={[fm.chipTekst, { color: isActief ? '#FFFFFF' : kleuren.tekst }]}>
                  {a}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Doelspier Filter */}
        <Text style={[fm.sectieTitel, { color: kleuren.tekstSecundair, marginTop: 22 }]}>
          DOELSPIER (TARGET)
        </Text>
        <View style={fm.grid}>
          <TouchableOpacity
            style={[
              fm.chip,
              {
                backgroundColor: !actiefDoel ? kleuren.accent : kleuren.achtergrondSecundair,
                borderColor: !actiefDoel ? kleuren.accent : kleuren.kaartRand,
              },
              webPointer,
            ]}
            onPress={() => setActiefDoel(null)}
          >
            <Text
              style={[fm.chipTekst, { color: !actiefDoel ? '#FFFFFF' : kleuren.tekstSecundair }]}
            >
              Alle doelspieren
            </Text>
          </TouchableOpacity>

          {POPULAIRE_DOELEN.map((d) => {
            const isActief = actiefDoel === d.id;
            return (
              <TouchableOpacity
                key={d.id}
                style={[
                  fm.chip,
                  {
                    backgroundColor: isActief ? kleuren.accent : kleuren.achtergrondSecundair,
                    borderColor: isActief ? kleuren.accent : kleuren.kaartRand,
                  },
                  webPointer,
                ]}
                onPress={() => setActiefDoel(isActief ? null : d.id)}
              >
                <Text style={[fm.chipTekst, { color: isActief ? '#FFFFFF' : kleuren.tekst }]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Sortering */}
        <Text style={[fm.sectieTitel, { color: kleuren.tekstSecundair, marginTop: 22 }]}>
          SORTERING
        </Text>
        <View style={fm.grid}>
          {(
            [
              { id: 'alfabetisch', label: 'Alfabetisch (A-Z)' },
              { id: 'groep', label: 'Op Spiergroep' },
              { id: 'apparaat', label: 'Op Apparaat' },
            ] as Array<{ id: SorteerModus; label: string }>
          ).map((item) => {
            const isActief = sorteerModus === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  fm.chip,
                  {
                    backgroundColor: isActief ? kleuren.accent : kleuren.achtergrondSecundair,
                    borderColor: isActief ? kleuren.accent : kleuren.kaartRand,
                  },
                  webPointer,
                ]}
                onPress={() => setSorteerModus(item.id)}
              >
                <Text style={[fm.chipTekst, { color: isActief ? '#FFFFFF' : kleuren.tekst }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Footer acties */}
        <View style={[fm.footer, { borderTopColor: kleuren.kaartRand }]}>
          {aantalActieveFilters > 0 ? (
            <PrimaryButton
              titel="Reset"
              variant="secondary"
              size="md"
              volledigeBreedte={false}
              onPress={onReset}
            />
          ) : null}
          <View style={{ flex: 1 }}>
            <PrimaryButton
              titel={`Toon ${totaalGevonden} ${totaalGevonden === 1 ? 'oefening' : 'oefeningen'}`}
              size="md"
              onPress={onSluiten}
            />
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}

const fm = StyleSheet.create({
  inhoud: {
    paddingBottom: 6,
  },
  sectieTitel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.1,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  chipTekst: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
});

function CustomOefeningModal({
  zichtbaar,
  onSluiten,
  onGemaakt,
  kleuren,
}: {
  zichtbaar: boolean;
  onSluiten: () => void;
  onGemaakt: (o: OefeningDef) => void;
  kleuren: ThemaKleuren;
}) {
  const [naam, setNaam] = useState('');
  const [groep, setGroep] = useState<Spiergroep>('Borst');
  const [type, setType] = useState<OefeningType>('gewicht');
  const [foutTekst, setFoutTekst] = useState<string | null>(null);

  const webPointer: ViewStyle | undefined =
    Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : undefined;

  const sluitEnReset = () => {
    setFoutTekst(null);
    onSluiten();
  };

  const handleMaken = async () => {
    if (!naam.trim()) {
      setFoutTekst('Vul eerst een naam in voor je oefening.');
      return;
    }
    setFoutTekst(null);

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
      icoon:
        type === 'tijd'
          ? 'timer-outline'
          : type === 'lichaamsgewicht'
            ? 'body-outline'
            : 'barbell-outline',
      startWaarde: type === 'tijd' ? 60 : type === 'gewicht' ? 20 : 0,
      image_url: '',
      gif_full_url: '',
    };

    try {
      const existing = await AsyncStorage.getItem(CUSTOM_KEY);
      const list: OefeningDef[] = existing ? JSON.parse(existing) : [];
      list.push(custom);
      await AsyncStorage.setItem(CUSTOM_KEY, JSON.stringify(list));
    } catch {
      // Fallback: voeg alsnog toe in geheugen
    }

    onGemaakt(custom);
    setNaam('');
    setType('gewicht');
    setGroep('Borst');
    setFoutTekst(null);
    onSluiten();
  };

  return (
    <BottomSheet
      visible={zichtbaar}
      onClose={sluitEnReset}
      title="Custom Oefening"
      subtitle="Voeg een eigen oefening toe aan je bibliotheek"
      maxWidth={540}
      scrollable
    >
      <View style={cm.inhoud}>
        <Text style={[cm.label, { color: kleuren.tekstSecundair, marginTop: 4 }]}>NAAM</Text>
        <TextInput
          style={[
            cm.input,
            {
              backgroundColor: kleuren.achtergrondSecundair,
              borderColor: foutTekst ? kleuren.fout : kleuren.kaartRand,
              color: kleuren.tekst,
            },
          ]}
          value={naam}
          onChangeText={(t) => {
            setNaam(t);
            if (foutTekst) setFoutTekst(null);
          }}
          placeholder="bijv. Bulgarian Split Squat"
          placeholderTextColor={kleuren.tekstGedimpt}
          autoFocus
        />

        {foutTekst ? (
          <View style={cm.foutRij}>
            <Ionicons name="alert-circle" size={15} color={kleuren.fout} />
            <Text style={[cm.foutTekst, { color: kleuren.fout }]}>{foutTekst}</Text>
          </View>
        ) : null}

        <Text style={[cm.label, { color: kleuren.tekstSecundair }]}>TYPE</Text>
        <View style={cm.groepRaster}>
          {OEFENING_TYPEN.map((t) => {
            const actief = type === t.type;
            return (
              <TouchableOpacity
                key={t.type}
                style={[
                  cm.groepKnop,
                  {
                    backgroundColor: actief ? kleuren.accentGedimpt : kleuren.achtergrondSecundair,
                    borderColor: actief ? kleuren.accent : kleuren.kaartRand,
                  },
                  webPointer,
                ]}
                onPress={() => setType(t.type)}
              >
                <Text
                  style={{
                    color: actief ? kleuren.accentLicht : kleuren.tekstSecundair,
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 13,
                  }}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[cm.label, { color: kleuren.tekstSecundair }]}>SPIERGROEP</Text>
        <View style={cm.groepRaster}>
          {SPIERGROEPEN.map((g) => {
            const actief = groep === g;
            const kleur = GROEP_KLEUR[g] || kleuren.accent;
            return (
              <TouchableOpacity
                key={g}
                style={[
                  cm.groepKnop,
                  {
                    backgroundColor: actief ? kleur + '24' : kleuren.achtergrondSecundair,
                    borderColor: actief ? kleur : kleuren.kaartRand,
                  },
                  webPointer,
                ]}
                onPress={() => setGroep(g)}
              >
                <View style={[cm.dot, { backgroundColor: kleur }]} />
                <Text
                  style={{
                    color: actief ? kleur : kleuren.tekstSecundair,
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 13,
                  }}
                >
                  {g}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[cm.footer, { borderTopColor: kleuren.kaartRand }]}>
          <PrimaryButton
            titel="Annuleren"
            variant="secondary"
            volledigeBreedte={false}
            onPress={sluitEnReset}
          />
          <View style={{ flex: 1 }}>
            <PrimaryButton titel="Oefening opslaan" icoon="checkmark" onPress={handleMaken} />
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}

const cm = StyleSheet.create({
  inhoud: { paddingBottom: 6 },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.1,
    marginBottom: 8,
    marginTop: 20,
    textTransform: 'uppercase',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  foutRij: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  foutTekst: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  groepRaster: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  groepKnop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingVertical: 9,
    paddingHorizontal: 13,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
});

export default function ExercisesTab() {
  const router = useRouter();
  const { kleuren } = useThema();
  const { isActief } = useLiveWorkout();
  const { width, isDesktopNav, contentPadding } = useResponsive();
  const numColumns = width >= BREAKPOINTS.sidebar ? 2 : 1;

  const [zoekterm, setZoekterm] = useState('');
  const [zoekFocus, setZoekFocus] = useState(false);
  const [actieveGroep, setActieveGroep] = useState<Spiergroep | null>(null);
  const [actiefApparaat, setActiefApparaat] = useState<Apparaat | null>(null);
  const [actiefDoel, setActiefDoel] = useState<string | null>(null);
  const [sorteerModus, setSorteerModus] = useState<SorteerModus>('alfabetisch');

  const [filterModal, setFilterModal] = useState(false);
  const [customModal, setCustomModal] = useState(false);
  const [customOef, setCustomOef] = useState<OefeningDef[]>([]);

  const webPointer: ViewStyle | undefined =
    Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : undefined;

  useEffect(() => {
    AsyncStorage.getItem(CUSTOM_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setCustomOef(parsed);
        }
      })
      .catch(() => {});
  }, []);

  const alleOefeningen = useMemo(() => {
    return [...OEFENINGEN_DB, ...customOef];
  }, [customOef]);

  const gefilterdeOefeningen = useMemo(() => {
    const q = zoekterm.toLowerCase().trim();
    const resultaten = alleOefeningen.filter((o) => {
      const matchZoek =
        !q ||
        o.name.toLowerCase().includes(q) ||
        o.naam.toLowerCase().includes(q) ||
        (o.target && o.target.toLowerCase().includes(q)) ||
        formatTargetDutch(o.target).toLowerCase().includes(q) ||
        (o.equipment && o.equipment.toLowerCase().includes(q)) ||
        o.apparaat.toLowerCase().includes(q) ||
        o.groep.toLowerCase().includes(q);

      const matchGroep = !actieveGroep || o.groep === actieveGroep;
      const matchApparaat = !actiefApparaat || o.apparaat === actiefApparaat;
      const matchDoel =
        !actiefDoel ||
        o.target.toLowerCase() === actiefDoel.toLowerCase() ||
        (o.secondary_muscles &&
          o.secondary_muscles.some((m) => m.toLowerCase() === actiefDoel.toLowerCase()));

      return matchZoek && matchGroep && matchApparaat && matchDoel;
    });

    if (sorteerModus === 'alfabetisch') {
      resultaten.sort((a, b) => a.naam.localeCompare(b.naam, 'nl'));
    } else if (sorteerModus === 'groep') {
      resultaten.sort(
        (a, b) => a.groep.localeCompare(b.groep, 'nl') || a.naam.localeCompare(b.naam, 'nl')
      );
    } else if (sorteerModus === 'apparaat') {
      resultaten.sort(
        (a, b) => a.apparaat.localeCompare(b.apparaat, 'nl') || a.naam.localeCompare(b.naam, 'nl')
      );
    }

    return resultaten;
  }, [alleOefeningen, zoekterm, actieveGroep, actiefApparaat, actiefDoel, sorteerModus]);

  const aantalActieveFilters =
    (actieveGroep ? 1 : 0) + (actiefApparaat ? 1 : 0) + (actiefDoel ? 1 : 0);

  const resetAlleFilters = useCallback(() => {
    setZoekterm('');
    setActieveGroep(null);
    setActiefApparaat(null);
    setActiefDoel(null);
  }, []);

  const renderOefening = useCallback(
    ({ item }: { item: OefeningDef }) => {
      const mediaUri = item.image_url || getMediaUrl(item.image);
      const groepKleur = GROEP_KLEUR[item.groep] || kleuren.accent;
      const equipmentLabel = formatEquipmentDutch(item.equipment);

      return (
        <View style={numColumns === 2 ? s.gridItemWrapper : s.listItemWrapper}>
          <TouchableOpacity
            style={[
              s.oefeningKaart,
              {
                backgroundColor: kleuren.kaart,
                borderColor: kleuren.kaartRand,
              },
              SHADOWS.forTheme(kleuren.isDark, 'sm'),
              webPointer,
            ]}
            onPress={() => router.push(`/exercise/${item.id}`)}
            activeOpacity={0.78}
          >
            <View
              style={[
                s.thumbContainer,
                {
                  backgroundColor: '#FFFFFF',
                  borderColor: kleuren.kaartRand,
                },
              ]}
            >
              {mediaUri ? (
                <Image source={{ uri: mediaUri }} style={s.thumbImage} resizeMode="contain" />
              ) : (
                <Ionicons name={item.icoon as any} size={20} color={groepKleur} />
              )}
            </View>

            <View style={s.oefInfo}>
              <Text style={[s.oefeningNaam, { color: kleuren.tekst }]} numberOfLines={1}>
                {item.naam || item.name}
              </Text>

              <View style={s.metaRij}>
                <View
                  style={[
                    s.groepBadge,
                    {
                      backgroundColor: groepKleur + '1A',
                      borderColor: groepKleur + '3D',
                    },
                  ]}
                >
                  <View style={[s.groepDot, { backgroundColor: groepKleur }]} />
                  <Text style={[s.groepBadgeTekst, { color: groepKleur }]} numberOfLines={1}>
                    {item.groep}
                  </Text>
                </View>

                <View
                  style={[
                    s.apparaatPill,
                    {
                      backgroundColor: kleuren.achtergrondSecundair,
                      borderColor: kleuren.kaartRand,
                    },
                  ]}
                >
                  <Text
                    style={[s.apparaatPillTekst, { color: kleuren.tekstSecundair }]}
                    numberOfLines={1}
                  >
                    {equipmentLabel}
                  </Text>
                </View>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={16} color={kleuren.tekstGedimpt} />
          </TouchableOpacity>
        </View>
      );
    },
    [kleuren, router, numColumns, webPointer]
  );

  return (
    <SafeAreaView style={[s.veilig, { backgroundColor: kleuren.achtergrond }]} edges={['top']}>
      <ResponsiveContainer
        variant="wide"
        style={[s.containerFlex, { paddingHorizontal: contentPadding }]}
      >
        <View style={s.topSectie}>
          <ScreenHeader
            title="Oefeningen"
            subtitle={`${gefilterdeOefeningen.length} ${
              gefilterdeOefeningen.length === 1 ? 'oefening' : 'oefeningen'
            } beschikbaar`}
            rightAction={
              <TouchableOpacity
                style={[
                  s.customKnop,
                  {
                    backgroundColor: kleuren.accentGedimpt,
                    borderColor: kleuren.accent + '44',
                  },
                  webPointer,
                ]}
                onPress={() => setCustomModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={16} color={kleuren.accentLicht} />
                <Text style={[s.customKnopTekst, { color: kleuren.accentLicht }]}>Custom</Text>
              </TouchableOpacity>
            }
          />

          {/* Zoekbalk */}
          <View
            style={[
              s.zoekContainer,
              {
                backgroundColor: kleuren.kaart,
                borderColor: zoekFocus ? kleuren.accent : kleuren.kaartRand,
                borderWidth: zoekFocus ? 1.5 : 1,
              },
              SHADOWS.forTheme(kleuren.isDark, 'sm'),
            ]}
          >
            <Ionicons
              name="search-outline"
              size={19}
              color={zoekFocus ? kleuren.accentLicht : kleuren.tekstGedimpt}
              style={{ marginRight: 10 }}
            />
            <TextInput
              style={[s.zoekInput, { color: kleuren.tekst }]}
              placeholder="Zoek oefening, spiergroep of apparaat..."
              placeholderTextColor={kleuren.tekstGedimpt}
              value={zoekterm}
              onChangeText={setZoekterm}
              onFocus={() => setZoekFocus(true)}
              onBlur={() => setZoekFocus(false)}
              autoCorrect={false}
            />
            {zoekterm.length > 0 && (
              <TouchableOpacity
                onPress={() => setZoekterm('')}
                style={[{ padding: 4 }, webPointer]}
                accessibilityLabel="Wis zoekterm"
              >
                <Ionicons name="close-circle" size={18} color={kleuren.tekstGedimpt} />
              </TouchableOpacity>
            )}
          </View>

          {/* Strakke pill filterrij */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.filterPillsRij}
          >
            <TouchableOpacity
              style={[
                s.filterPill,
                {
                  backgroundColor: actieveGroep ? kleuren.accentGedimpt : kleuren.kaart,
                  borderColor: actieveGroep ? kleuren.accent : kleuren.kaartRand,
                },
                webPointer,
              ]}
              onPress={() => setFilterModal(true)}
              activeOpacity={0.8}
            >
              {actieveGroep ? (
                <View
                  style={[
                    s.filterPillDot,
                    { backgroundColor: GROEP_KLEUR[actieveGroep] || kleuren.accent },
                  ]}
                />
              ) : (
                <Ionicons name="body-outline" size={14} color={kleuren.tekstSecundair} />
              )}
              <Text
                style={[
                  s.filterPillTekst,
                  { color: actieveGroep ? kleuren.accentLicht : kleuren.tekstSecundair },
                ]}
              >
                {actieveGroep ?? 'Spiergroep'}
              </Text>
              <Ionicons
                name="chevron-down"
                size={14}
                color={actieveGroep ? kleuren.accentLicht : kleuren.tekstGedimpt}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                s.filterPill,
                {
                  backgroundColor: actiefApparaat ? kleuren.accentGedimpt : kleuren.kaart,
                  borderColor: actiefApparaat ? kleuren.accent : kleuren.kaartRand,
                },
                webPointer,
              ]}
              onPress={() => setFilterModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="barbell-outline"
                size={14}
                color={actiefApparaat ? kleuren.accentLicht : kleuren.tekstSecundair}
              />
              <Text
                style={[
                  s.filterPillTekst,
                  { color: actiefApparaat ? kleuren.accentLicht : kleuren.tekstSecundair },
                ]}
              >
                {actiefApparaat ?? 'Apparaat'}
              </Text>
              <Ionicons
                name="chevron-down"
                size={14}
                color={actiefApparaat ? kleuren.accentLicht : kleuren.tekstGedimpt}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                s.filterPill,
                {
                  backgroundColor:
                    actiefDoel || sorteerModus !== 'alfabetisch'
                      ? kleuren.accentGedimpt
                      : kleuren.kaart,
                  borderColor:
                    actiefDoel || sorteerModus !== 'alfabetisch'
                      ? kleuren.accent
                      : kleuren.kaartRand,
                },
                webPointer,
              ]}
              onPress={() => setFilterModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="options-outline"
                size={14}
                color={
                  actiefDoel || sorteerModus !== 'alfabetisch'
                    ? kleuren.accentLicht
                    : kleuren.tekstSecundair
                }
              />
              <Text
                style={[
                  s.filterPillTekst,
                  {
                    color:
                      actiefDoel || sorteerModus !== 'alfabetisch'
                        ? kleuren.accentLicht
                        : kleuren.tekstSecundair,
                  },
                ]}
              >
                Sorteer: {SORTEER_LABELS[sorteerModus]}
              </Text>
              {aantalActieveFilters > 0 ? (
                <View style={[s.filterCountBadge, { backgroundColor: kleuren.accent }]}>
                  <Text style={s.filterCountTekst}>{aantalActieveFilters}</Text>
                </View>
              ) : null}
            </TouchableOpacity>

            {(aantalActieveFilters > 0 || zoekterm.length > 0) && (
              <TouchableOpacity
                style={[
                  s.resetPill,
                  {
                    backgroundColor: kleuren.fout + '14',
                    borderColor: kleuren.fout + '40',
                  },
                  webPointer,
                ]}
                onPress={resetAlleFilters}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={14} color={kleuren.fout} />
                <Text style={[s.resetPillTekst, { color: kleuren.fout }]}>Wis</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        <FlatList
          key={`col-${numColumns}`}
          data={gefilterdeOefeningen}
          numColumns={numColumns}
          keyExtractor={(item) => item.id}
          renderItem={renderOefening}
          initialNumToRender={20}
          maxToRenderPerBatch={24}
          windowSize={10}
          removeClippedSubviews={Platform.OS === 'android'}
          contentContainerStyle={[
            s.lijstInhoud,
            {
              paddingBottom: isDesktopNav
                ? isActief
                  ? 104
                  : SPACING.xxxl
                : NAV_METRICS.mobileContentBottomPadding + (isActief ? 72 : 0),
            },
          ]}
          columnWrapperStyle={numColumns === 2 ? s.gridColumnWrapper : undefined}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ marginTop: 12 }}>
              <EmptyState
                icoon="search-outline"
                titel="Geen oefeningen gevonden"
                subtekst="Probeer een andere zoekterm of wis je actieve filters om alle oefeningen te zien."
                actieTekst="Wis alle filters"
                onActie={resetAlleFilters}
              />
            </View>
          }
        />
      </ResponsiveContainer>

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
        onGemaakt={(o) => setCustomOef((prev) => [...prev, o])}
        kleuren={kleuren}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  veilig: { flex: 1 },
  containerFlex: { flex: 1 },
  topSectie: {
    paddingTop: SPACING.md,
    marginBottom: 14,
  },
  customKnop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  customKnopTekst: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
  },
  zoekContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
  },
  zoekInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  filterPillsRij: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  filterPillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  filterPillTekst: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  filterCountBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountTekst: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  resetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  resetPillTekst: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  lijstInhoud: {
    flexGrow: 1,
  },
  gridColumnWrapper: {
    marginHorizontal: -6,
  },
  gridItemWrapper: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  listItemWrapper: {
    width: '100%',
    marginBottom: 10,
  },
  oefeningKaart: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  thumbContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  oefInfo: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  oefeningNaam: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.1,
  },
  metaRij: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  groepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
  },
  groepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  groepBadgeTekst: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  apparaatPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
  },
  apparaatPillTekst: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
});
