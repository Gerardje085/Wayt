import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  Share,
  RefreshControl,
  TextInput,
  Platform,
  ActivityIndicator,
  type LayoutChangeEvent,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Line,
  Polyline,
  Polygon,
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useThema } from '../src/context/ThemeContext';
import {
  haalVolledigeOnderzoeksdata,
  haalAlleDeelnemerProfielen,
  type OnderzoeksWorkout,
  type DeelnemerProfiel,
} from '../src/hooks/useWorkouts';
import {
  SPACING,
  RADIUS,
  SHADOWS,
  useResponsive,
} from '../src/theme/designTokens';
import ResponsiveContainer from '../src/components/ui/ResponsiveContainer';
import ScreenHeader from '../src/components/ui/ScreenHeader';
import Card from '../src/components/ui/Card';
import PrimaryButton from '../src/components/ui/PrimaryButton';
import EmptyState from '../src/components/ui/EmptyState';
import Badge from '../src/components/ui/Badge';
import ErrorBanner from '../src/components/ErrorBanner';
import {
  simuleerAlgoritmeTraject,
  type SimulatieScenario,
  type SimulatieSessie,
} from '../src/utils/algorithm';
import { getStandaardSlaglengte, ZWAARTEKRACHT } from '../src/utils/physics';
import { findExercise } from '../src/data/exercises';
import { vertaalFout } from '../src/utils/errorVertaler';
import {
  groepeerNaarSessies,
  telUniekeWorkoutSessies,
  type GegroepeerdeSessie,
} from '../src/utils/sessieGroepering';
import type { ThemaKleuren } from '../src/types';

const ALLE_DEELNEMERS_ID = '__ALLE__';
type GrafiekMetriek = 'eenRM' | 'volume' | 'arbeid';
type GroepFilter = 'alle' | 'gevoel' | 'app';

const SCENARIO_KLEUREN: Record<SimulatieScenario, string> = {
  optimaal: '#10B981',
  realistisch: '#F59E0B',
  vermoeidheid: '#EF4444',
};

const SCENARIO_LABELS: Record<SimulatieScenario, string> = {
  optimaal: 'Optimaal',
  realistisch: 'Realistisch',
  vermoeidheid: 'Vermoeidheid',
};

const ECHTE_DATA_KLEUR = '#3B82F6';
const INDIGO_KLEUR = '#6366F1';

const WEB_POINTER: ViewStyle | undefined =
  Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : undefined;

const TABULAR_NUMS = { fontVariant: ['tabular-nums' as const] };

interface EchtePunt {
  sessie: number;
  gewicht: number;
  eenRM: number;
  volume: number;
  arbeid: number;
}

const ONDERZOEKS_OEFENINGEN = [
  { id: '0025', naam: 'Bench Press', standaardRom: 0.40 },
  { id: '0150', naam: 'Lat Pulldown', standaardRom: 0.60 },
  { id: '0585', naam: 'Leg Extension', standaardRom: 0.50 },
];

const formatGetal = (waarde: number, decimalen = 0): string => {
  if (!Number.isFinite(waarde)) return '0';
  return waarde.toLocaleString('nl-NL', {
    minimumFractionDigits: decimalen,
    maximumFractionDigits: decimalen,
  });
};

const formatCompact = (waarde: number): string => {
  if (!Number.isFinite(waarde)) return '0';
  if (waarde >= 10000) return `${(waarde / 1000).toFixed(1).replace('.', ',')}k`;
  return Math.round(waarde).toString();
};

const getInitialen = (naam: string): string => {
  const delen = naam.trim().split(/[\s._-]+/).filter(Boolean);
  if (delen.length === 0) return 'D';
  if (delen.length === 1) return delen[0].slice(0, 2).toUpperCase();
  return (delen[0][0] + delen[1][0]).toUpperCase();
};

const toonMelding = (titel: string, bericht: string) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${titel}\n\n${bericht}`);
  } else {
    Alert.alert(titel, bericht);
  }
};

const exporteerCSVBestand = async (csvContent: string, bestandsnaam: string) => {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', bestandsnaam);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return;
  }

  await Share.share({
    message: csvContent,
    title: bestandsnaam,
  });
};

function SimulatorVergelijkingsGrafiek({
  metriek,
  simulaties,
  echteReeks,
  focusScenario,
  kleuren,
}: {
  metriek: GrafiekMetriek;
  simulaties: { scenario: SimulatieScenario; data: SimulatieSessie[] }[];
  echteReeks: EchtePunt[];
  focusScenario: SimulatieScenario;
  kleuren: ThemaKleuren;
}) {
  const { width: vensterBreedte } = useResponsive();
  const [gemetenBreedte, setGemetenBreedte] = useState<number>(0);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const w = Math.floor(e.nativeEvent.layout.width);
    if (w > 120) {
      setGemetenBreedte((prev) => (Math.abs(prev - w) > 2 ? w : prev));
    }
  }, []);

  const CHART_W = gemetenBreedte > 0
    ? gemetenBreedte
    : Math.max(260, Math.min(680, vensterBreedte - 72));
  const CHART_H = CHART_W >= 500 ? 236 : 204;
  const PAD_L = 48;
  const PAD_R = 16;
  const PAD_T = 16;
  const PAD_B = 28;
  const PLOT_W = Math.max(120, CHART_W - PAD_L - PAD_R);
  const PLOT_H = CHART_H - PAD_T - PAD_B;

  const getSimWaarde = (s: SimulatieSessie): number => {
    if (metriek === 'eenRM') return s.geschatte1RM;
    if (metriek === 'volume') return s.volume;
    return s.arbeid;
  };
  const getEchtWaarde = (p: EchtePunt): number => {
    if (metriek === 'eenRM') return p.eenRM;
    if (metriek === 'volume') return p.volume;
    return p.arbeid;
  };

  const alleWaarden: number[] = [];
  for (const sim of simulaties) {
    for (const punt of sim.data) alleWaarden.push(getSimWaarde(punt));
  }
  for (const punt of echteReeks) {
    alleWaarden.push(getEchtWaarde(punt));
  }

  const rawMin = alleWaarden.length > 0 ? Math.min(...alleWaarden) : 0;
  const rawMax = alleWaarden.length > 0 ? Math.max(...alleWaarden) : 100;
  const span = Math.max(1, rawMax - rawMin);
  const minY = Math.max(0, Math.floor(rawMin - span * 0.1));
  const maxY = Math.ceil(rawMax + span * 0.12);
  const ySpan = Math.max(1, maxY - minY);

  const xPos = (sessie: number) => PAD_L + ((sessie - 1) / 11) * PLOT_W;
  const yPos = (val: number) => PAD_T + PLOT_H - ((val - minY) / ySpan) * PLOT_H;

  const maakPunten = (punten: { sessie: number; val: number }[]) =>
    punten.map((p) => `${xPos(p.sessie).toFixed(1)},${yPos(p.val).toFixed(1)}`).join(' ');

  const optimaalData = simulaties.find((s) => s.scenario === 'optimaal')?.data ?? [];
  const realistischData = simulaties.find((s) => s.scenario === 'realistisch')?.data ?? [];
  const vermoeidheidData = simulaties.find((s) => s.scenario === 'vermoeidheid')?.data ?? [];

  const echtePunten = echteReeks
    .filter((p) => p.sessie >= 1 && p.sessie <= 12)
    .map((p) => ({ sessie: p.sessie, val: getEchtWaarde(p) }));

  const echteAreaPunten =
    echtePunten.length > 1
      ? `${xPos(echtePunten[0].sessie).toFixed(1)},${(PAD_T + PLOT_H).toFixed(1)} ${maakPunten(echtePunten)} ${xPos(echtePunten[echtePunten.length - 1].sessie).toFixed(1)},${(PAD_T + PLOT_H).toFixed(1)}`
      : '';

  const yTicks = [0, 0.333, 0.666, 1].map((f) => ({
    y: PAD_T + PLOT_H * (1 - f),
    label: formatCompact(minY + ySpan * f),
  }));

  const scenarioStrokeWidth = (s: SimulatieScenario) => (focusScenario === s ? 2.8 : 1.7);
  const scenarioOpacity = (s: SimulatieScenario) => (focusScenario === s ? 1 : 0.62);

  return (
    <View onLayout={handleLayout} style={stijlen.grafiekContainer}>
      <Svg width={CHART_W} height={CHART_H}>
        <Defs>
          <SvgLinearGradient id="echteDataGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={ECHTE_DATA_KLEUR} stopOpacity={kleuren.isDark ? 0.24 : 0.16} />
            <Stop offset="100%" stopColor={ECHTE_DATA_KLEUR} stopOpacity={0} />
          </SvgLinearGradient>
        </Defs>

        {/* Horizontale rasterlijnen + Y-labels */}
        {yTicks.map((t, idx) => (
          <React.Fragment key={idx}>
            <Line
              x1={PAD_L}
              y1={t.y}
              x2={CHART_W - PAD_R}
              y2={t.y}
              stroke={kleuren.kaartRand}
              strokeWidth={1}
              strokeDasharray={idx === 0 ? undefined : '4,4'}
            />
            <SvgText
              x={PAD_L - 8}
              y={t.y + 3.5}
              fontSize={10}
              fill={kleuren.tekstGedimpt}
              textAnchor="end"
            >
              {t.label}
            </SvgText>
          </React.Fragment>
        ))}

        {/* X-as sessielabels (S1 t/m S12) */}
        {Array.from({ length: 12 }, (_, idx) => idx + 1).map((sessie) => (
          <SvgText
            key={sessie}
            x={xPos(sessie)}
            y={CHART_H - 7}
            fontSize={10}
            fill={kleuren.tekstGedimpt}
            textAnchor="middle"
          >
            {CHART_W >= 420 ? `S${sessie}` : String(sessie)}
          </SvgText>
        ))}

        {/* Subtiele vlakvulling onder Echte Data */}
        {echteAreaPunten.length > 0 && (
          <Polygon points={echteAreaPunten} fill="url(#echteDataGrad)" />
        )}

        {/* Vermoeidheid (Rood) */}
        {vermoeidheidData.length > 1 && (
          <Polyline
            points={maakPunten(vermoeidheidData.map((d) => ({ sessie: d.sessie, val: getSimWaarde(d) })))}
            fill="none"
            stroke={SCENARIO_KLEUREN.vermoeidheid}
            strokeWidth={scenarioStrokeWidth('vermoeidheid')}
            strokeOpacity={scenarioOpacity('vermoeidheid')}
          />
        )}

        {/* Realistisch (Amber) */}
        {realistischData.length > 1 && (
          <Polyline
            points={maakPunten(realistischData.map((d) => ({ sessie: d.sessie, val: getSimWaarde(d) })))}
            fill="none"
            stroke={SCENARIO_KLEUREN.realistisch}
            strokeWidth={scenarioStrokeWidth('realistisch')}
            strokeOpacity={scenarioOpacity('realistisch')}
          />
        )}

        {/* Optimaal (Groen gestippeld) */}
        {optimaalData.length > 1 && (
          <Polyline
            points={maakPunten(optimaalData.map((d) => ({ sessie: d.sessie, val: getSimWaarde(d) })))}
            fill="none"
            stroke={SCENARIO_KLEUREN.optimaal}
            strokeWidth={scenarioStrokeWidth('optimaal')}
            strokeOpacity={scenarioOpacity('optimaal')}
            strokeDasharray="6,4"
          />
        )}

        {/* Eindpunt-accent voor geselecteerd focus-scenario */}
        {(() => {
          const focusData = simulaties.find((s) => s.scenario === focusScenario)?.data ?? [];
          const laatste = focusData[focusData.length - 1];
          if (!laatste) return null;
          return (
            <Circle
              cx={xPos(laatste.sessie)}
              cy={yPos(getSimWaarde(laatste))}
              r={4}
              fill={SCENARIO_KLEUREN[focusScenario]}
              stroke={kleuren.kaart}
              strokeWidth={1.5}
            />
          );
        })()}

        {/* Echte Data (Dikke blauwe lijn + puntjes) */}
        {echtePunten.length > 1 && (
          <Polyline
            points={maakPunten(echtePunten)}
            fill="none"
            stroke={ECHTE_DATA_KLEUR}
            strokeWidth={3}
          />
        )}
        {echtePunten.map((p) => (
          <Circle
            key={`echt-${p.sessie}`}
            cx={xPos(p.sessie)}
            cy={yPos(p.val)}
            r={4}
            fill={ECHTE_DATA_KLEUR}
            stroke={kleuren.kaart}
            strokeWidth={1.8}
          />
        ))}
      </Svg>

      {/* Legenda */}
      <View style={[stijlen.grafiekLegenda, { borderTopColor: kleuren.kaartRand }]}>
        <View style={stijlen.legendaItem}>
          <View style={[stijlen.legendaLijn, { backgroundColor: ECHTE_DATA_KLEUR, height: 3 }]} />
          <Text style={[stijlen.legendaTekst, { color: kleuren.tekst }]}>Echte Data (Gevoel)</Text>
        </View>
        <View style={stijlen.legendaItem}>
          <Svg width={18} height={4}>
            <Line
              x1={0}
              y1={2}
              x2={18}
              y2={2}
              stroke={SCENARIO_KLEUREN.optimaal}
              strokeWidth={2}
              strokeDasharray="4,3"
            />
          </Svg>
          <Text
            style={[
              stijlen.legendaTekst,
              {
                color: focusScenario === 'optimaal' ? kleuren.tekst : kleuren.tekstSecundair,
                fontFamily: focusScenario === 'optimaal' ? 'Inter_600SemiBold' : 'Inter_400Regular',
              },
            ]}
          >
            Optimaal
          </Text>
        </View>
        <View style={stijlen.legendaItem}>
          <View style={[stijlen.legendaLijn, { backgroundColor: SCENARIO_KLEUREN.realistisch }]} />
          <Text
            style={[
              stijlen.legendaTekst,
              {
                color: focusScenario === 'realistisch' ? kleuren.tekst : kleuren.tekstSecundair,
                fontFamily: focusScenario === 'realistisch' ? 'Inter_600SemiBold' : 'Inter_400Regular',
              },
            ]}
          >
            Realistisch
          </Text>
        </View>
        <View style={stijlen.legendaItem}>
          <View style={[stijlen.legendaLijn, { backgroundColor: SCENARIO_KLEUREN.vermoeidheid }]} />
          <Text
            style={[
              stijlen.legendaTekst,
              {
                color: focusScenario === 'vermoeidheid' ? kleuren.tekst : kleuren.tekstSecundair,
                fontFamily: focusScenario === 'vermoeidheid' ? 'Inter_600SemiBold' : 'Inter_400Regular',
              },
            ]}
          >
            Vermoeidheid (deload)
          </Text>
        </View>
      </View>
    </View>
  );
}

interface KpiKaartProps {
  icoon: keyof typeof Ionicons.glyphMap;
  icoonKleur: string;
  icoonAchtergrond: string;
  label: string;
  waarde: string;
  eenheid?: string;
  sublabel: string;
}

function KpiKaart({
  icoon,
  icoonKleur,
  icoonAchtergrond,
  label,
  waarde,
  eenheid,
  sublabel,
}: KpiKaartProps) {
  const { kleuren } = useThema();

  return (
    <Card padding={18} style={stijlen.kpiKaart}>
      <View style={stijlen.kpiTopRij}>
        <Text style={[stijlen.kpiLabel, { color: kleuren.tekstSecundair }]} numberOfLines={1}>
          {label}
        </Text>
        <View style={[stijlen.kpiIcoonBadge, { backgroundColor: icoonAchtergrond }]}>
          <Ionicons name={icoon} size={17} color={icoonKleur} />
        </View>
      </View>

      <View style={stijlen.kpiWaardeRij}>
        <Text
          style={[stijlen.kpiWaarde, TABULAR_NUMS, { color: kleuren.tekst }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {waarde}
        </Text>
        {eenheid ? (
          <Text style={[stijlen.kpiEenheid, { color: kleuren.tekstGedimpt }]}>{eenheid}</Text>
        ) : null}
      </View>

      <Text style={[stijlen.kpiSublabel, { color: kleuren.tekstGedimpt }]} numberOfLines={1}>
        {sublabel}
      </Text>
    </Card>
  );
}

function GroepBadge({
  groupType,
  kleuren,
}: {
  groupType: 'app' | 'gevoel' | null;
  kleuren: ThemaKleuren;
}) {
  const accentTekst = kleuren.isDark ? kleuren.accentLicht : kleuren.accent;
  if (groupType === 'app') {
    return (
      <View
        style={[
          stijlen.groepPil,
          {
            backgroundColor: kleuren.accentGedimpt,
            borderColor: kleuren.accent + '44',
          },
        ]}
      >
        <View style={[stijlen.groepPunt, { backgroundColor: accentTekst }]} />
        <Text style={[stijlen.groepPilTekst, { color: accentTekst }]}>App</Text>
      </View>
    );
  }
  if (groupType === 'gevoel') {
    return (
      <View
        style={[
          stijlen.groepPil,
          {
            backgroundColor: kleuren.isDark ? 'rgba(245, 158, 11, 0.14)' : 'rgba(217, 119, 6, 0.10)',
            borderColor: kleuren.waarschuwing + '44',
          },
        ]}
      >
        <View style={[stijlen.groepPunt, { backgroundColor: kleuren.waarschuwing }]} />
        <Text style={[stijlen.groepPilTekst, { color: kleuren.waarschuwing }]}>Gevoel</Text>
      </View>
    );
  }
  return (
    <View
      style={[
        stijlen.groepPil,
        {
          backgroundColor: kleuren.achtergrondSecundair,
          borderColor: kleuren.kaartRand,
        },
      ]}
    >
      <Text style={[stijlen.groepPilTekst, { color: kleuren.tekstGedimpt }]}>Onbekend</Text>
    </View>
  );
}

export default function AdminScreen() {
  const { user, isAdmin, uitloggen } = useAuth();
  const { kleuren, voorkeur, setVoorkeur } = useThema();
  const { width, isMobile, isTablet } = useResponsive();

  const isDesktopLayout = width >= 960;
  const isBreedOfTablet = width >= 768;

  // Simulator & onderzoeksdata state
  const [onderzoeksWorkouts, setOnderzoeksWorkouts] = useState<OnderzoeksWorkout[]>([]);
  const [deelnemerProfielen, setDeelnemerProfielen] = useState<DeelnemerProfiel[]>([]);
  const [onderzoekLaden, setOnderzoekLaden] = useState(false);
  const [onderzoekFout, setOnderzoekFout] = useState<string | null>(null);
  const [gekozenDeelnemerId, setGekozenDeelnemerId] = useState<string>(ALLE_DEELNEMERS_ID);
  const [simOefening, setSimOefening] = useState(ONDERZOEKS_OEFENINGEN[0]);
  const [simStartGewicht, setSimStartGewicht] = useState(30);
  const [simSlaglengte, setSimSlaglengte] = useState(ONDERZOEKS_OEFENINGEN[0].standaardRom);
  const [simSlaglengteTekst, setSimSlaglengteTekst] = useState(
    ONDERZOEKS_OEFENINGEN[0].standaardRom.toFixed(2)
  );
  const [grafiekMetriek, setGrafiekMetriek] = useState<GrafiekMetriek>('eenRM');
  const [focusScenario, setFocusScenario] = useState<SimulatieScenario>('realistisch');
  const [groepFilter, setGroepFilter] = useState<GroepFilter>('alle');
  const [exportVolledigBezig, setExportVolledigBezig] = useState(false);
  const [exportSimBezig, setExportSimBezig] = useState(false);

  const laadOnderzoeksWorkouts = useCallback(async () => {
    if (!isAdmin) return;
    setOnderzoekLaden(true);
    setOnderzoekFout(null);
    try {
      const [workoutsData, profielenData] = await Promise.all([
        haalVolledigeOnderzoeksdata(),
        haalAlleDeelnemerProfielen(),
      ]);
      setOnderzoeksWorkouts(workoutsData);
      setDeelnemerProfielen(profielenData);
    } catch (err) {
      setOnderzoekFout(
        vertaalFout(err, 'Kon de onderzoeksdata niet ophalen. Probeer het opnieuw.')
      );
    } finally {
      setOnderzoekLaden(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) laadOnderzoeksWorkouts();
  }, [isAdmin, laadOnderzoeksWorkouts]);

  const matchesOefening = useCallback((exercise: string, oef: { id: string; naam: string }) => {
    const legacySlug = oef.naam.toLowerCase().replace(/ /g, '_');
    return exercise === oef.id || exercise === legacySlug;
  }, []);

  // Proefpersonenlijst opbouwen uit alle geregistreerde deelnemers + gelogde workouts
  const deelnemers = useMemo(() => {
    const map = new Map<string, { label: string; groupType: 'app' | 'gevoel' | null }>();
    let teller = 1;

    for (const p of deelnemerProfielen) {
      const raw = p.username?.trim();
      const label =
        raw && raw.length > 0
          ? raw.includes('@')
            ? raw.split('@')[0]
            : raw
          : `Deelnemer ${teller++}`;
      map.set(p.id, { label, groupType: p.group_type ?? null });
    }

    for (const w of onderzoeksWorkouts) {
      if (w.user_id === user?.id) continue;
      if (map.has(w.user_id)) continue;
      const rawNaam = w.profiles?.username?.trim();
      const label =
        rawNaam && rawNaam.length > 0
          ? rawNaam.includes('@')
            ? rawNaam.split('@')[0]
            : rawNaam
          : `Deelnemer ${teller++}`;
      map.set(w.user_id, { label, groupType: w.profiles?.group_type ?? null });
    }

    return [
      { id: ALLE_DEELNEMERS_ID, label: 'Gemiddelde (Alle)', groupType: null as 'app' | 'gevoel' | null },
      ...Array.from(map.entries()).map(([id, info]) => ({
        id,
        label: info.label,
        groupType: info.groupType,
      })),
    ];
  }, [deelnemerProfielen, onderzoeksWorkouts, user?.id]);

  // Lookup map van userId -> naam + groupType
  const deelnemerLookup = useMemo(() => {
    const map = new Map<string, { naam: string; groupType: 'app' | 'gevoel' | null }>();
    for (const d of deelnemers) {
      if (d.id === ALLE_DEELNEMERS_ID) continue;
      map.set(d.id, { naam: d.label, groupType: d.groupType });
    }
    return map;
  }, [deelnemers]);

  // Overzicht per deelnemer voor de deelnemerskaarten
  const deelnemerStatistieken = useMemo(() => {
    const perUserWorkouts = new Map<string, OnderzoeksWorkout[]>();
    for (const w of onderzoeksWorkouts) {
      const lijst = perUserWorkouts.get(w.user_id) ?? [];
      lijst.push(w);
      perUserWorkouts.set(w.user_id, lijst);
    }

    return deelnemers
      .filter((d) => d.id !== ALLE_DEELNEMERS_ID)
      .map((d) => {
        const lijst = perUserWorkouts.get(d.id) ?? [];
        let laatsteDatum: string | null = null;
        let totaalSets = 0;
        let totaalVol = 0;
        let totaalArb = 0;
        for (const w of lijst) {
          if (!laatsteDatum || w.date > laatsteDatum) laatsteDatum = w.date;
          if (w.set_type !== 'warmup') {
            totaalSets += Number(w.sets) || 1;
            totaalVol += parseFloat(String(w.volume)) || 0;
            totaalArb += parseFloat(String(w.work_joules)) || 0;
          }
        }
        return {
          id: d.id,
          naam: d.label,
          groupType: d.groupType,
          sessies: telUniekeWorkoutSessies(lijst),
          totaalSets,
          totaalVolume: totaalVol,
          totaalArbeid: totaalArb,
          laatsteDatum,
        };
      });
  }, [deelnemers, onderzoeksWorkouts]);

  const aantalGevoel = useMemo(
    () => deelnemerStatistieken.filter((d) => d.groupType === 'gevoel').length,
    [deelnemerStatistieken]
  );
  const aantalApp = useMemo(
    () => deelnemerStatistieken.filter((d) => d.groupType === 'app').length,
    [deelnemerStatistieken]
  );

  const gefilterdeDeelnemers = useMemo(() => {
    if (groepFilter === 'alle') return deelnemerStatistieken;
    return deelnemerStatistieken.filter((d) => d.groupType === groepFilter);
  }, [deelnemerStatistieken, groepFilter]);

  // Groepeer deelnemers in paren voor 2-koloms desktop grid
  const deelnemerRijen = useMemo(() => {
    if (!isDesktopLayout) {
      return gefilterdeDeelnemers.map((d) => [d]);
    }
    const rijen: (typeof gefilterdeDeelnemers)[] = [];
    for (let i = 0; i < gefilterdeDeelnemers.length; i += 2) {
      rijen.push(gefilterdeDeelnemers.slice(i, i + 2));
    }
    return rijen;
  }, [gefilterdeDeelnemers, isDesktopLayout]);

  // Recente gegroepeerde trainingssessies (voor gestructureerde onderzoekslog)
  const recenteSessies = useMemo(() => {
    const gegroepeerd = groepeerNaarSessies(onderzoeksWorkouts)
      .filter((s) => s.userId !== user?.id)
      .filter((s) => {
        if (groepFilter === 'alle') return true;
        const info = deelnemerLookup.get(s.userId);
        return info?.groupType === groepFilter;
      });
    return [...gegroepeerd].reverse().slice(0, 8);
  }, [onderzoeksWorkouts, user?.id, groepFilter, deelnemerLookup]);

  // Bereken mechanische arbeid op basis van de (eventueel met Coach 7 aangepaste) slaglengte s
  const berekenSessieArbeid = useCallback(
    (ses: GegroepeerdeSessie) =>
      simSlaglengte > 0
        ? Math.round(ses.totaalVolume * ZWAARTEKRACHT * simSlaglengte * 100) / 100
        : ses.totaalArbeid,
    [simSlaglengte]
  );

  // Echte data per deelnemer (of gemiddelde) voor de gekozen oefening,
  // gegroepeerd op echte trainingssessies (Top Set + som van volume/arbeid)
  const echteAnalyse = useMemo(() => {
    const relevant = onderzoeksWorkouts.filter((w) => matchesOefening(w.exercise, simOefening));
    const sessies = groepeerNaarSessies(relevant).filter((s) => !s.isMeting);

    if (gekozenDeelnemerId === ALLE_DEELNEMERS_ID) {
      const perUser = new Map<string, GegroepeerdeSessie[]>();
      for (const ses of sessies) {
        const arr = perUser.get(ses.userId) ?? [];
        arr.push(ses);
        perUser.set(ses.userId, arr);
      }
      if (perUser.size === 0) {
        return { startGewicht: null as number | null, reeks: [] as EchtePunt[], samenvatting: null };
      }

      const startGewichten: number[] = [];
      const eindGewichten: number[] = [];
      const groeiPcts: number[] = [];
      const volTotaalLijst: number[] = [];
      const arbTotaalLijst: number[] = [];
      let maxSessies = 0;

      for (const [, lijst] of perUser) {
        const beperkt = lijst.slice(0, 12);
        maxSessies = Math.max(maxSessies, beperkt.length);
        const eerste = beperkt[0];
        const laatste = beperkt[beperkt.length - 1];
        startGewichten.push(eerste.topGewicht);
        eindGewichten.push(laatste.topGewicht);
        if (eerste.beste1RM > 0) {
          groeiPcts.push(((laatste.beste1RM - eerste.beste1RM) / eerste.beste1RM) * 100);
        }
        volTotaalLijst.push(beperkt.reduce((s, x) => s + x.totaalVolume, 0));
        arbTotaalLijst.push(beperkt.reduce((s, x) => s + berekenSessieArbeid(x), 0));
      }

      const reeks: EchtePunt[] = [];
      for (let idx = 0; idx < maxSessies; idx++) {
        const items = Array.from(perUser.values())
          .map((l) => l[idx])
          .filter((x): x is GegroepeerdeSessie => Boolean(x));
        if (items.length === 0) continue;
        const avgGew = items.reduce((s, x) => s + x.topGewicht, 0) / items.length;
        const avg1RM = items.reduce((s, x) => s + x.beste1RM, 0) / items.length;
        const avgVol = items.reduce((s, x) => s + x.totaalVolume, 0) / items.length;
        const avgArb = items.reduce((s, x) => s + berekenSessieArbeid(x), 0) / items.length;
        reeks.push({
          sessie: idx + 1,
          gewicht: Math.round(avgGew * 10) / 10,
          eenRM: Math.round(avg1RM * 10) / 10,
          volume: Math.round(avgVol),
          arbeid: Math.round(avgArb),
        });
      }

      const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length);
      const startGem = Math.round(avg(startGewichten) * 2) / 2;
      const eindGem = Math.round(avg(eindGewichten) * 10) / 10;

      return {
        startGewicht: startGem,
        reeks,
        samenvatting: {
          startGewicht: startGem,
          eindGewicht: eindGem,
          groeiPct: groeiPcts.length > 0 ? avg(groeiPcts) : 0,
          totVolume: avg(volTotaalLijst),
          totArbeid: avg(arbTotaalLijst),
        },
      };
    }

    const userSessies = sessies.filter((s) => s.userId === gekozenDeelnemerId).slice(0, 12);
    if (userSessies.length === 0) {
      return { startGewicht: null as number | null, reeks: [] as EchtePunt[], samenvatting: null };
    }

    const eerste = userSessies[0];
    const laatste = userSessies[userSessies.length - 1];
    const startGewicht = eerste.topGewicht;
    const eindGewicht = laatste.topGewicht;
    const groeiPct =
      eerste.beste1RM > 0 ? ((laatste.beste1RM - eerste.beste1RM) / eerste.beste1RM) * 100 : 0;
    const totVolume = userSessies.reduce((s, x) => s + x.totaalVolume, 0);
    const totArbeid = userSessies.reduce((s, x) => s + berekenSessieArbeid(x), 0);

    const reeks: EchtePunt[] = userSessies.map((ses, idx) => ({
      sessie: idx + 1,
      gewicht: ses.topGewicht,
      eenRM: ses.beste1RM,
      volume: ses.totaalVolume,
      arbeid: berekenSessieArbeid(ses),
    }));

    return {
      startGewicht,
      reeks,
      samenvatting: {
        startGewicht,
        eindGewicht,
        groeiPct,
        totVolume,
        totArbeid,
      },
    };
  }, [onderzoeksWorkouts, gekozenDeelnemerId, simOefening, matchesOefening, berekenSessieArbeid]);

  // Neem automatisch echt startgewicht over bij wisselen deelnemer of oefening
  useEffect(() => {
    if (echteAnalyse.startGewicht !== null) {
      setSimStartGewicht(echteAnalyse.startGewicht);
    } else {
      const info = findExercise(simOefening.id);
      setSimStartGewicht(info?.startWaarde ?? 30);
    }
  }, [echteAnalyse.startGewicht, simOefening]);

  // Laad standaard vaste ROM (slaglengte s) bij wisselen van oefening
  useEffect(() => {
    const standaardRom = getStandaardSlaglengte(simOefening.id);
    setSimSlaglengte(standaardRom);
    setSimSlaglengteTekst(standaardRom.toFixed(2));
  }, [simOefening]);

  // Bereken simulaties met huidige startgewicht en (Coach 7) slaglengte s
  const simulaties = useMemo(() => {
    const scenarios: SimulatieScenario[] = ['optimaal', 'realistisch', 'vermoeidheid'];
    return scenarios.map((s) => ({
      scenario: s,
      data: simuleerAlgoritmeTraject(simStartGewicht, simOefening.id, 12, s, simSlaglengte),
    }));
  }, [simStartGewicht, simOefening, simSlaglengte]);

  // Samenvatting voor het geselecteerde focus-scenario
  const focusSimSamenvatting = useMemo(() => {
    const gevonden = simulaties.find((s) => s.scenario === focusScenario) ?? simulaties[0];
    const data = gevonden.data;
    const eerste = data[0];
    const laatste = data[data.length - 1];
    const groei1RM =
      eerste && eerste.geschatte1RM > 0
        ? ((laatste.geschatte1RM - eerste.geschatte1RM) / eerste.geschatte1RM) * 100
        : 0;
    const totVol = data.reduce((s, d) => s + d.volume, 0);
    const totArb = data.reduce((s, d) => s + d.arbeid, 0);

    return {
      scenario: gevonden.scenario,
      startGewicht: eerste?.gewicht ?? simStartGewicht,
      eindGewicht: laatste?.gewicht ?? simStartGewicht,
      groei1RM,
      totVol,
      totArb,
    };
  }, [simulaties, focusScenario, simStartGewicht]);

  const echteDataSamenvatting = echteAnalyse.samenvatting;

  const aantalDeelnemers = deelnemerStatistieken.length;
  const aantalSessies = telUniekeWorkoutSessies(onderzoeksWorkouts);
  const werkWorkouts = useMemo(
    () => onderzoeksWorkouts.filter((w) => w.set_type !== 'warmup'),
    [onderzoeksWorkouts]
  );
  const totaalVolume = werkWorkouts.reduce((s, w) => s + (parseFloat(String(w.volume)) || 0), 0);
  const totaalArbeid = werkWorkouts.reduce(
    (s, w) => s + (parseFloat(String(w.work_joules)) || 0),
    0
  );
  const oefeningen = Array.from(new Set(onderzoeksWorkouts.map((w) => w.exercise)));

  const standaardRomHuidig = getStandaardSlaglengte(simOefening.id);
  const isRomAangepast = Math.abs(simSlaglengte - standaardRomHuidig) > 0.001;
  const gekozenDeelnemerLabel =
    deelnemers.find((d) => d.id === gekozenDeelnemerId)?.label ?? 'Gemiddelde (Alle)';

  const handleExportVolleOnderzoeksCSV = async () => {
    setExportVolledigBezig(true);
    try {
      const alleWorkouts = await haalVolledigeOnderzoeksdata();

      if (!alleWorkouts || alleWorkouts.length === 0) {
        toonMelding('Geen data', 'Er zijn nog geen workouts in de database.');
        return;
      }

      const headers = [
        'id',
        'session_id',
        'user_id',
        'group_type',
        'username',
        'date',
        'exercise',
        'set_number',
        'set_type',
        'sets',
        'reps',
        'weight_kg',
        'volume_kg',
        'work_joules',
        'rpe',
        'prescribed_sets',
        'prescribed_reps',
        'prescribed_weight_kg',
        'is_meting',
        'test_moment',
        'notitie',
      ];
      const rows = alleWorkouts.map((w) => [
        w.id,
        `"${w.session_id ?? ''}"`,
        w.user_id,
        `"${w.profiles?.group_type ?? ''}"`,
        `"${(w.profiles?.username ?? '').replace(/"/g, '""')}"`,
        w.date,
        `"${w.exercise}"`,
        w.set_number ?? '',
        `"${w.set_type ?? 'normaal'}"`,
        w.sets,
        w.reps,
        w.weight,
        w.volume,
        w.work_joules || 0,
        w.rpe ?? '',
        w.prescribed_sets ?? '',
        w.prescribed_reps ?? '',
        w.prescribed_weight ?? '',
        w.is_meting ? 'true' : 'false',
        `"${w.test_moment ?? ''}"`,
        `"${(w.notitie ?? '').replace(/"/g, '""')}"`,
      ]);
      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const bestandsnaam = `wayt_volledig_onderzoek_${new Date().toISOString().split('T')[0]}.csv`;
      await exporteerCSVBestand(csvContent, bestandsnaam);
    } catch (err) {
      toonMelding(
        'Export mislukt',
        vertaalFout(err, 'Kon de volledige onderzoeksdata niet exporteren.')
      );
    } finally {
      setExportVolledigBezig(false);
    }
  };

  const handleExportMetSimulatie = async () => {
    setExportSimBezig(true);
    try {
      const alleWorkouts = await haalVolledigeOnderzoeksdata();

      if (!alleWorkouts || alleWorkouts.length === 0) {
        toonMelding('Geen data', 'Er zijn nog geen workouts in de database.');
        return;
      }

      const headers = [
        'id',
        'session_id',
        'user_id',
        'group_type',
        'username',
        'date',
        'exercise',
        'set_number',
        'set_type',
        'sets',
        'reps',
        'weight_kg',
        'volume_kg',
        'work_joules',
        'rpe',
        'prescribed_sets',
        'prescribed_reps',
        'prescribed_weight_kg',
        'is_meting',
        'test_moment',
        'notitie',
        'bron',
      ];

      // Echte data rijen (elke losse set)
      const echteRijen = alleWorkouts.map((w) => [
        w.id,
        `"${w.session_id ?? ''}"`,
        w.user_id,
        `"${w.profiles?.group_type ?? ''}"`,
        `"${(w.profiles?.username ?? '').replace(/"/g, '""')}"`,
        w.date,
        `"${w.exercise}"`,
        w.set_number ?? '',
        `"${w.set_type ?? 'normaal'}"`,
        w.sets,
        w.reps,
        w.weight,
        w.volume,
        w.work_joules || 0,
        w.rpe ?? '',
        w.prescribed_sets ?? '',
        w.prescribed_reps ?? '',
        w.prescribed_weight ?? '',
        w.is_meting ? 'true' : 'false',
        `"${w.test_moment ?? ''}"`,
        `"${(w.notitie ?? '').replace(/"/g, '""')}"`,
        'echt',
      ]);

      // Simulatie rijen: per gebruiker per oefening (bepaal startgewicht op basis van Top Set van eerste sessie)
      const simRijen: (string | number)[][] = [];
      const userOefeningMap = new Map<string, Map<string, number>>();
      const sessiesGesorteerd = groepeerNaarSessies(alleWorkouts).filter((s) => !s.isMeting);

      for (const ses of sessiesGesorteerd) {
        const uid = ses.userId;
        if (!userOefeningMap.has(uid)) userOefeningMap.set(uid, new Map());
        const oefeningMap = userOefeningMap.get(uid)!;
        const exId = ses.exercise;
        const isOnderzoek = ONDERZOEKS_OEFENINGEN.some(
          (o) => o.id === exId || o.naam.toLowerCase().replace(/ /g, '_') === exId
        );
        if (!isOnderzoek) continue;
        if (!oefeningMap.has(exId)) {
          oefeningMap.set(exId, ses.topGewicht);
        }
      }

      const scenarios: SimulatieScenario[] = ['optimaal', 'realistisch', 'vermoeidheid'];
      for (const [userId, oefeningMap] of userOefeningMap) {
        const userProfile = alleWorkouts.find((w) => w.user_id === userId);
        const groupType = userProfile?.profiles?.group_type ?? '';
        const username = (userProfile?.profiles?.username ?? '').replace(/"/g, '""');

        for (const [exId, startWeight] of oefeningMap) {
          for (const scenario of scenarios) {
            const traject = simuleerAlgoritmeTraject(startWeight, exId, 12, scenario);
            for (const sessie of traject) {
              simRijen.push([
                `"sim_${userId}_${exId}_${scenario}_s${sessie.sessie}"`,
                '',
                userId,
                `"${groupType}"`,
                `"${username}"`,
                `"sessie_${sessie.sessie}"`,
                `"${exId}"`,
                '',
                '"normaal"',
                sessie.sets,
                sessie.reps,
                sessie.gewicht,
                sessie.volume,
                sessie.arbeid,
                '', // rpe
                '',
                '',
                '', // prescribed
                'false',
                '',
                '',
                `"simulatie_${scenario}"`,
              ]);
            }
          }
        }
      }

      const alleRijen = [...echteRijen, ...simRijen];
      const csvContent = [headers.join(','), ...alleRijen.map((r) => r.join(','))].join('\n');
      const bestandsnaam = `wayt_data_simulatie_${new Date().toISOString().split('T')[0]}.csv`;
      await exporteerCSVBestand(csvContent, bestandsnaam);
    } catch (err) {
      toonMelding(
        'Export mislukt',
        vertaalFout(err, 'Kon de data met simulatie niet exporteren.')
      );
    } finally {
      setExportSimBezig(false);
    }
  };

  if (!isAdmin) return null;

  const delta1RM =
    echteDataSamenvatting !== null
      ? focusSimSamenvatting.groei1RM - echteDataSamenvatting.groeiPct
      : null;

  const deltaArbeid =
    echteDataSamenvatting !== null
      ? focusSimSamenvatting.totArb - echteDataSamenvatting.totArbeid
      : null;

  const themaOpties: {
    id: 'donker' | 'licht' | 'systeem';
    label: string;
    icoon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { id: 'donker', label: 'Donker', icoon: 'moon-outline' },
    { id: 'licht', label: 'Licht', icoon: 'sunny-outline' },
    { id: 'systeem', label: 'Systeem', icoon: 'contrast-outline' },
  ];

  const kpiItems: KpiKaartProps[] = [
    {
      icoon: 'people-outline',
      icoonKleur: kleuren.accentLicht,
      icoonAchtergrond: kleuren.accentGedimpt,
      label: 'Deelnemers',
      waarde: formatGetal(aantalDeelnemers),
      sublabel: `${aantalGevoel} gevoel · ${aantalApp} app`,
    },
    {
      icoon: 'calendar-outline',
      icoonKleur: kleuren.succes,
      icoonAchtergrond: kleuren.isDark ? 'rgba(16, 185, 129, 0.14)' : 'rgba(22, 163, 74, 0.10)',
      label: 'Sessies',
      waarde: formatGetal(aantalSessies),
      sublabel: `${formatGetal(werkWorkouts.length)} werksets gelogd`,
    },
    {
      icoon: 'barbell-outline',
      icoonKleur: INDIGO_KLEUR,
      icoonAchtergrond: kleuren.isDark ? 'rgba(99, 102, 241, 0.16)' : 'rgba(99, 102, 241, 0.10)',
      label: 'Totaal Volume',
      waarde: formatGetal(totaalVolume),
      eenheid: 'kg',
      sublabel: `${oefeningen.length} ${oefeningen.length === 1 ? 'oefening' : 'oefeningen'} actief`,
    },
    {
      icoon: 'flash-outline',
      icoonKleur: kleuren.waarschuwing,
      icoonAchtergrond: kleuren.isDark ? 'rgba(245, 158, 11, 0.14)' : 'rgba(217, 119, 6, 0.10)',
      label: 'Mechanische Arbeid',
      waarde: formatGetal(totaalArbeid),
      eenheid: 'J',
      sublabel: `${formatGetal(totaalArbeid / 1000, 1)} kJ totaal`,
    },
  ];

  return (
    <SafeAreaView style={[stijlen.veilig, { backgroundColor: kleuren.achtergrond }]}>
      <ScrollView
        style={stijlen.scroll}
        contentContainerStyle={[
          stijlen.scrollInhoud,
          { paddingTop: isMobile ? SPACING.sm : SPACING.lg },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={onderzoekLaden}
            onRefresh={laadOnderzoeksWorkouts}
            tintColor={kleuren.accent}
          />
        }
      >
        <ResponsiveContainer variant="wide" padded>
          {/* ─── Top Header Bar ────────────────────────────────────────── */}
          <ScreenHeader
            badge="WAYT RESEARCH · ONDERZOEKSMODUS"
            title="Wayt Research"
            subtitle={user?.email ?? 'Onderzoekersportaal · PWS Krachttraining'}
            rightAction={
              <View style={stijlen.headerActies}>
                {isDesktopLayout && (
                  <View
                    style={[
                      stijlen.headerThemaTrack,
                      {
                        backgroundColor: kleuren.kaart,
                        borderColor: kleuren.kaartRand,
                      },
                    ]}
                  >
                    {themaOpties.map((t) => {
                      const actief = voorkeur === t.id;
                      return (
                        <Pressable
                          key={t.id}
                          onPress={() => setVoorkeur(t.id)}
                          accessibilityLabel={`Thema ${t.label}`}
                          style={[
                            stijlen.headerThemaKnop,
                            actief && {
                              backgroundColor: kleuren.accentGedimpt,
                            },
                            WEB_POINTER,
                          ]}
                        >
                          <Ionicons
                            name={t.icoon}
                            size={15}
                            color={actief ? kleuren.accentLicht : kleuren.tekstGedimpt}
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                )}

                <Pressable
                  onPress={laadOnderzoeksWorkouts}
                  disabled={onderzoekLaden}
                  accessibilityLabel="Onderzoeksdata verversen"
                  style={({ pressed }) => [
                    stijlen.headerKnop,
                    !isMobile && stijlen.headerKnopMetTekst,
                    {
                      backgroundColor: kleuren.kaart,
                      borderColor: kleuren.kaartRand,
                      opacity: pressed || onderzoekLaden ? 0.72 : 1,
                    },
                    SHADOWS.forTheme(kleuren.isDark, 'sm'),
                    WEB_POINTER,
                  ]}
                >
                  {onderzoekLaden ? (
                    <ActivityIndicator size="small" color={kleuren.accentLicht} />
                  ) : (
                    <Ionicons name="refresh-outline" size={17} color={kleuren.tekst} />
                  )}
                  {!isMobile && (
                    <Text style={[stijlen.headerKnopTekst, { color: kleuren.tekst }]}>
                      Verversen
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  onPress={uitloggen}
                  accessibilityLabel="Uitloggen"
                  style={({ pressed }) => [
                    stijlen.headerKnop,
                    !isMobile && stijlen.headerKnopMetTekst,
                    {
                      backgroundColor: kleuren.isDark
                        ? 'rgba(239, 68, 68, 0.12)'
                        : 'rgba(220, 38, 38, 0.08)',
                      borderColor: kleuren.fout + '40',
                      opacity: pressed ? 0.72 : 1,
                    },
                    WEB_POINTER,
                  ]}
                >
                  <Ionicons name="log-out-outline" size={17} color={kleuren.fout} />
                  {!isMobile && (
                    <Text style={[stijlen.headerKnopTekst, { color: kleuren.fout }]}>
                      Uitloggen
                    </Text>
                  )}
                </Pressable>
              </View>
            }
          />

          {onderzoekFout && (
            <View style={{ marginBottom: SPACING.base }}>
              <ErrorBanner bericht={onderzoekFout} onProbeerOpnieuw={laadOnderzoeksWorkouts} />
            </View>
          )}

          {/* ─── KPI Overview Grid (4 cols desktop / 2x2 mobile) ──────── */}
          <View style={stijlen.sectieHeaderRij}>
            <Text style={[stijlen.sectieLabel, { color: kleuren.tekstGedimpt }]}>
              ONDERZOEKSOVERZICHT
            </Text>
            <Text style={[stijlen.sectieMeta, { color: kleuren.tekstGedimpt }]}>
              Live Supabase dataset
            </Text>
          </View>

          {isDesktopLayout ? (
            <View style={[stijlen.kpiGridRij, { marginBottom: SPACING.xl }]}>
              {kpiItems.map((item) => (
                <View key={item.label} style={{ flex: 1 }}>
                  <KpiKaart {...item} />
                </View>
              ))}
            </View>
          ) : (
            <View style={{ gap: SPACING.md, marginBottom: SPACING.xl }}>
              <View style={stijlen.kpiGridRij}>
                <View style={{ flex: 1 }}>
                  <KpiKaart {...kpiItems[0]} />
                </View>
                <View style={{ flex: 1 }}>
                  <KpiKaart {...kpiItems[1]} />
                </View>
              </View>
              <View style={stijlen.kpiGridRij}>
                <View style={{ flex: 1 }}>
                  <KpiKaart {...kpiItems[2]} />
                </View>
                <View style={{ flex: 1 }}>
                  <KpiKaart {...kpiItems[3]} />
                </View>
              </View>
            </View>
          )}

          {/* ─── Algoritme vs. Gevoel Simulator ───────────────────────── */}
          <View style={stijlen.sectieHeaderRij}>
            <View style={stijlen.sectieTitelMetBadge}>
              <Text style={[stijlen.sectieLabel, { color: kleuren.tekstGedimpt }]}>
                ALGORITME VS. GEVOEL SIMULATOR
              </Text>
              <View
                style={[
                  stijlen.metaPil,
                  { backgroundColor: kleuren.accentGedimpt, borderColor: kleuren.accent + '33' },
                ]}
              >
                <Text style={[stijlen.metaPilTekst, { color: kleuren.accentLicht }]}>
                  4 WEKEN · 12 SESSIES
                </Text>
              </View>
            </View>
            {!isMobile && (
              <Text style={[stijlen.sectieMeta, TABULAR_NUMS, { color: kleuren.tekstGedimpt }]}>
                W = m · g · s (g = 9,81 m/s²)
              </Text>
            )}
          </View>

          <View
            style={[
              stijlen.simLayout,
              isDesktopLayout ? stijlen.simLayoutDesktop : stijlen.simLayoutMobile,
            ]}
          >
            {/* ── Linkerpaneel: Controls ── */}
            <Card
              padding={20}
              style={isDesktopLayout ? stijlen.simControlsDesktop : stijlen.simControlsMobile}
            >
              <View style={stijlen.paneelHeader}>
                <View style={[stijlen.paneelIcoon, { backgroundColor: kleuren.accentGedimpt }]}>
                  <Ionicons name="options-outline" size={17} color={kleuren.accentLicht} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[stijlen.paneelTitel, { color: kleuren.tekst }]}>
                    Simulatie-instellingen
                  </Text>
                  <Text style={[stijlen.paneelSubtitel, { color: kleuren.tekstGedimpt }]}>
                    Pas parameters en Coach 7 slaglengte aan
                  </Text>
                </View>
              </View>

              {/* Oefening selector */}
              <View style={stijlen.controlBlok}>
                <Text style={[stijlen.controlLabel, { color: kleuren.tekstSecundair }]}>
                  Oefening
                </Text>
                <View style={stijlen.pilWrap}>
                  {ONDERZOEKS_OEFENINGEN.map((o) => {
                    const actief = simOefening.id === o.id;
                    return (
                      <Pressable
                        key={o.id}
                        onPress={() => setSimOefening(o)}
                        style={({ pressed }) => [
                          stijlen.keuzePil,
                          {
                            backgroundColor: actief
                              ? kleuren.accent
                              : kleuren.achtergrondSecundair,
                            borderColor: actief ? kleuren.accent : kleuren.kaartRand,
                            opacity: pressed ? 0.85 : 1,
                          },
                          WEB_POINTER,
                        ]}
                      >
                        <Text
                          style={[
                            stijlen.keuzePilTekst,
                            { color: actief ? '#FFFFFF' : kleuren.tekst },
                          ]}
                        >
                          {o.naam}
                        </Text>
                        <Text
                          style={[
                            stijlen.keuzePilSub,
                            TABULAR_NUMS,
                            { color: actief ? 'rgba(255,255,255,0.82)' : kleuren.tekstGedimpt },
                          ]}
                        >
                          {o.standaardRom.toFixed(2).replace('.', ',')} m
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Proefpersoon selector */}
              <View style={stijlen.controlBlok}>
                <Text style={[stijlen.controlLabel, { color: kleuren.tekstSecundair }]}>
                  Proefpersoon
                </Text>
                {isDesktopLayout ? (
                  <View style={stijlen.pilWrap}>
                    {deelnemers.map((d) => {
                      const actief = gekozenDeelnemerId === d.id;
                      const dotKleur =
                        d.groupType === 'app'
                          ? kleuren.accentLicht
                          : d.groupType === 'gevoel'
                            ? kleuren.waarschuwing
                            : kleuren.tekstGedimpt;
                      return (
                        <Pressable
                          key={d.id}
                          onPress={() => setGekozenDeelnemerId(d.id)}
                          style={({ pressed }) => [
                            stijlen.deelnemerPil,
                            {
                              backgroundColor: actief
                                ? kleuren.accent
                                : kleuren.achtergrondSecundair,
                              borderColor: actief ? kleuren.accent : kleuren.kaartRand,
                              opacity: pressed ? 0.85 : 1,
                            },
                            WEB_POINTER,
                          ]}
                        >
                          {d.id !== ALLE_DEELNEMERS_ID && (
                            <View
                              style={[
                                stijlen.groepPunt,
                                { backgroundColor: actief ? '#FFFFFF' : dotKleur },
                              ]}
                            />
                          )}
                          <Text
                            style={[
                              stijlen.deelnemerPilTekst,
                              { color: actief ? '#FFFFFF' : kleuren.tekst },
                            ]}
                          >
                            {d.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={stijlen.pilHorizontaal}>
                      {deelnemers.map((d) => {
                        const actief = gekozenDeelnemerId === d.id;
                        return (
                          <Pressable
                            key={d.id}
                            onPress={() => setGekozenDeelnemerId(d.id)}
                            style={[
                              stijlen.deelnemerPil,
                              {
                                backgroundColor: actief
                                  ? kleuren.accent
                                  : kleuren.achtergrondSecundair,
                                borderColor: actief ? kleuren.accent : kleuren.kaartRand,
                              },
                              WEB_POINTER,
                            ]}
                          >
                            <Text
                              style={[
                                stijlen.deelnemerPilTekst,
                                { color: actief ? '#FFFFFF' : kleuren.tekst },
                              ]}
                            >
                              {d.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </ScrollView>
                )}
              </View>

              {/* Startgewicht & Coach 7 Slaglengte s (m) */}
              <View style={stijlen.controlBlok}>
                <View style={stijlen.simInputsRij}>
                  <View
                    style={[
                      stijlen.simInputBlok,
                      {
                        backgroundColor: kleuren.achtergrondSecundair,
                        borderColor: kleuren.kaartRand,
                      },
                    ]}
                  >
                    <Text style={[stijlen.simInputLabel, { color: kleuren.tekstSecundair }]}>
                      Startgewicht
                    </Text>
                    <View
                      style={[
                        stijlen.inputMetEenheid,
                        {
                          backgroundColor: kleuren.kaart,
                          borderColor: kleuren.kaartRand,
                        },
                      ]}
                    >
                      <TextInput
                        style={[stijlen.simGewichtInput, TABULAR_NUMS, { color: kleuren.tekst }]}
                        keyboardType="decimal-pad"
                        value={String(simStartGewicht)}
                        accessibilityLabel="Startgewicht in kilogram"
                        onChangeText={(t) => {
                          const n = parseFloat(t.replace(',', '.'));
                          if (!isNaN(n) && n > 0) setSimStartGewicht(n);
                          else if (t === '') setSimStartGewicht(0);
                        }}
                      />
                      <Text style={[stijlen.inputEenheid, { color: kleuren.tekstGedimpt }]}>kg</Text>
                    </View>
                  </View>

                  <View
                    style={[
                      stijlen.simInputBlok,
                      {
                        backgroundColor: kleuren.achtergrondSecundair,
                        borderColor: isRomAangepast ? kleuren.accent + '77' : kleuren.kaartRand,
                      },
                    ]}
                  >
                    <View style={stijlen.simLabelMetReset}>
                      <Text style={[stijlen.simInputLabel, { color: kleuren.tekstSecundair }]}>
                        Slaglengte s
                      </Text>
                      <View
                        style={[
                          stijlen.coach7Badge,
                          { backgroundColor: kleuren.accentGedimpt },
                        ]}
                      >
                        <Text style={[stijlen.coach7BadgeTekst, { color: kleuren.accentLicht }]}>
                          Coach 7
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        stijlen.inputMetEenheid,
                        {
                          backgroundColor: kleuren.kaart,
                          borderColor: isRomAangepast ? kleuren.accent : kleuren.kaartRand,
                        },
                      ]}
                    >
                      <TextInput
                        style={[stijlen.simGewichtInput, TABULAR_NUMS, { color: kleuren.tekst }]}
                        keyboardType="decimal-pad"
                        value={simSlaglengteTekst}
                        placeholder={standaardRomHuidig.toFixed(2)}
                        placeholderTextColor={kleuren.tekstGedimpt}
                        accessibilityLabel="Coach 7 slaglengte s in meters"
                        onChangeText={(t) => {
                          const schoon = t.replace(/[^0-9.,]/g, '');
                          setSimSlaglengteTekst(schoon);
                          const n = parseFloat(schoon.replace(',', '.'));
                          if (!isNaN(n) && n > 0) {
                            setSimSlaglengte(n);
                          }
                        }}
                        onBlur={() => {
                          if (simSlaglengte > 0) {
                            setSimSlaglengteTekst(simSlaglengte.toFixed(2));
                          }
                        }}
                      />
                      <Text style={[stijlen.inputEenheid, { color: kleuren.tekstGedimpt }]}>m</Text>
                    </View>
                  </View>
                </View>

                {/* Reset naar ROM pil wanneer aangepast */}
                {isRomAangepast && (
                  <Pressable
                    onPress={() => {
                      const standaardRom = getStandaardSlaglengte(simOefening.id);
                      setSimSlaglengte(standaardRom);
                      setSimSlaglengteTekst(standaardRom.toFixed(2));
                    }}
                    style={({ pressed }) => [
                      stijlen.resetRomPil,
                      {
                        backgroundColor: kleuren.accentGedimpt,
                        borderColor: kleuren.accent + '44',
                        opacity: pressed ? 0.78 : 1,
                      },
                      WEB_POINTER,
                    ]}
                  >
                    <Ionicons name="refresh-outline" size={13} color={kleuren.accentLicht} />
                    <Text style={[stijlen.resetRomTekst, { color: kleuren.accentLicht }]}>
                      Reset naar standaard ROM ({standaardRomHuidig.toFixed(2).replace('.', ',')} m)
                    </Text>
                  </Pressable>
                )}
              </View>

              {/* Focus-scenario selector */}
              <View style={{ marginBottom: 0 }}>
                <Text style={[stijlen.controlLabel, { color: kleuren.tekstSecundair }]}>
                  Focus-scenario vergelijking
                </Text>
                <View style={stijlen.scenarioKnoppenRij}>
                  {(['optimaal', 'realistisch', 'vermoeidheid'] as SimulatieScenario[]).map(
                    (scenario) => {
                      const actief = focusScenario === scenario;
                      const kleur = SCENARIO_KLEUREN[scenario];
                      return (
                        <Pressable
                          key={scenario}
                          onPress={() => setFocusScenario(scenario)}
                          style={({ pressed }) => [
                            stijlen.scenarioPil,
                            {
                              backgroundColor: actief
                                ? kleuren.isDark
                                  ? kleur + '24'
                                  : kleur + '18'
                                : kleuren.achtergrondSecundair,
                              borderColor: actief ? kleur : kleuren.kaartRand,
                              opacity: pressed ? 0.85 : 1,
                            },
                            WEB_POINTER,
                          ]}
                        >
                          <View style={[stijlen.groepPunt, { backgroundColor: kleur }]} />
                          <Text
                            style={[
                              stijlen.scenarioPilTekst,
                              { color: actief ? kleuren.tekst : kleuren.tekstSecundair },
                            ]}
                            numberOfLines={1}
                          >
                            {SCENARIO_LABELS[scenario]}
                          </Text>
                        </Pressable>
                      );
                    }
                  )}
                </View>
              </View>
            </Card>

            {/* ── Rechterpaneel: Highlights + Grafiek + Vergelijkingstabel ── */}
            <View style={stijlen.simResultatenKolom}>
              {/* Highlight Delta Cards */}
              <View
                style={[
                  stijlen.highlightGrid,
                  isBreedOfTablet ? stijlen.highlightGridRow : stijlen.highlightGridStack,
                ]}
              >
                {/* 1RM Delta */}
                <Card padding={14} style={stijlen.highlightKaart}>
                  <View style={stijlen.highlightTop}>
                    <Text style={[stijlen.highlightLabel, { color: kleuren.tekstGedimpt }]}>
                      1RM GROEI ({SCENARIO_LABELS[focusScenario].toUpperCase()})
                    </Text>
                    {delta1RM !== null && (
                      <View
                        style={[
                          stijlen.deltaBadge,
                          {
                            backgroundColor:
                              delta1RM >= 0
                                ? kleuren.isDark
                                  ? 'rgba(16, 185, 129, 0.16)'
                                  : 'rgba(22, 163, 74, 0.10)'
                                : kleuren.isDark
                                  ? 'rgba(239, 68, 68, 0.16)'
                                  : 'rgba(220, 38, 38, 0.10)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            stijlen.deltaTekst,
                            TABULAR_NUMS,
                            { color: delta1RM >= 0 ? kleuren.succes : kleuren.fout },
                          ]}
                        >
                          {delta1RM >= 0 ? '+' : ''}
                          {delta1RM.toFixed(1).replace('.', ',')}% vs echt
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      stijlen.highlightWaarde,
                      TABULAR_NUMS,
                      { color: SCENARIO_KLEUREN[focusScenario] },
                    ]}
                  >
                    +{focusSimSamenvatting.groei1RM.toFixed(1).replace('.', ',')}%
                  </Text>
                  <Text style={[stijlen.highlightSub, TABULAR_NUMS, { color: kleuren.tekstSecundair }]}>
                    Echte data:{' '}
                    {echteDataSamenvatting
                      ? `${echteDataSamenvatting.groeiPct >= 0 ? '+' : ''}${echteDataSamenvatting.groeiPct.toFixed(1).replace('.', ',')}%`
                      : 'geen data'}
                  </Text>
                </Card>

                {/* Arbeid (J) Delta */}
                <Card padding={14} style={stijlen.highlightKaart}>
                  <View style={stijlen.highlightTop}>
                    <Text style={[stijlen.highlightLabel, { color: kleuren.tekstGedimpt }]}>
                      ARBEID (S = {simSlaglengte.toFixed(2).replace('.', ',')} M)
                    </Text>
                    {deltaArbeid !== null && (
                      <View
                        style={[
                          stijlen.deltaBadge,
                          { backgroundColor: kleuren.accentGedimpt },
                        ]}
                      >
                        <Text
                          style={[
                            stijlen.deltaTekst,
                            TABULAR_NUMS,
                            { color: kleuren.accentLicht },
                          ]}
                        >
                          {deltaArbeid >= 0 ? '+' : ''}
                          {formatGetal(deltaArbeid)} J
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[stijlen.highlightWaarde, TABULAR_NUMS, { color: kleuren.tekst }]}>
                    {formatGetal(focusSimSamenvatting.totArb)} J
                  </Text>
                  <Text style={[stijlen.highlightSub, TABULAR_NUMS, { color: kleuren.tekstSecundair }]}>
                    Echte data:{' '}
                    {echteDataSamenvatting
                      ? `${formatGetal(echteDataSamenvatting.totArbeid)} J`
                      : 'geen data'}
                  </Text>
                </Card>

                {/* Eindgewicht */}
                <Card padding={14} style={stijlen.highlightKaart}>
                  <View style={stijlen.highlightTop}>
                    <Text style={[stijlen.highlightLabel, { color: kleuren.tekstGedimpt }]}>
                      GEWICHTSVERLOOP
                    </Text>
                  </View>
                  <Text style={[stijlen.highlightWaarde, TABULAR_NUMS, { color: kleuren.tekst }]}>
                    {focusSimSamenvatting.startGewicht} → {focusSimSamenvatting.eindGewicht} kg
                  </Text>
                  <Text style={[stijlen.highlightSub, TABULAR_NUMS, { color: kleuren.tekstSecundair }]}>
                    Echte data:{' '}
                    {echteDataSamenvatting
                      ? `${echteDataSamenvatting.startGewicht} → ${echteDataSamenvatting.eindGewicht} kg`
                      : 'geen data'}
                  </Text>
                </Card>
              </View>

              {/* Multi-lijn Vergelijkingsgrafiek Card */}
              <Card padding={18}>
                <View
                  style={[
                    stijlen.grafiekHeader,
                    isMobile && { flexDirection: 'column', alignItems: 'flex-start', gap: 10 },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[stijlen.paneelTitel, { color: kleuren.tekst }]}>
                      Trajectvergelijking · {simOefening.naam}
                    </Text>
                    <Text style={[stijlen.paneelSubtitel, { color: kleuren.tekstGedimpt }]}>
                      {gekozenDeelnemerLabel} · start {simStartGewicht} kg
                    </Text>
                  </View>

                  {/* Y-as Metriek Switcher */}
                  <View
                    style={[
                      stijlen.metriekTrack,
                      {
                        backgroundColor: kleuren.achtergrondSecundair,
                        borderColor: kleuren.kaartRand,
                      },
                      isMobile && { width: '100%' },
                    ]}
                  >
                    {(
                      [
                        { id: 'eenRM', label: '1RM (kg)' },
                        { id: 'volume', label: 'Volume' },
                        { id: 'arbeid', label: 'Arbeid (J)' },
                      ] as { id: GrafiekMetriek; label: string }[]
                    ).map((m) => {
                      const actief = grafiekMetriek === m.id;
                      return (
                        <Pressable
                          key={m.id}
                          onPress={() => setGrafiekMetriek(m.id)}
                          style={[
                            stijlen.metriekKnop,
                            isMobile && { flex: 1 },
                            actief && {
                              backgroundColor: kleuren.accent,
                            },
                            WEB_POINTER,
                          ]}
                        >
                          <Text
                            style={[
                              stijlen.metriekTekst,
                              { color: actief ? '#FFFFFF' : kleuren.tekstSecundair },
                            ]}
                          >
                            {m.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <SimulatorVergelijkingsGrafiek
                  metriek={grafiekMetriek}
                  simulaties={simulaties}
                  echteReeks={echteAnalyse.reeks}
                  focusScenario={focusScenario}
                  kleuren={kleuren}
                />
              </Card>

              {/* Vergelijkingstabel Card */}
              <Card padding={0} style={{ overflow: 'hidden' }}>
                <View
                  style={[
                    stijlen.tabelHeaderBalk,
                    { borderBottomColor: kleuren.kaartRand },
                  ]}
                >
                  <Text style={[stijlen.paneelTitel, { color: kleuren.tekst }]}>
                    Scenario-overzicht (12 sessies)
                  </Text>
                  <Text style={[stijlen.tabelBadgeTekst, TABULAR_NUMS, { color: kleuren.tekstGedimpt }]}>
                    s = {simSlaglengte.toFixed(2).replace('.', ',')} m
                  </Text>
                </View>

                {/* Kolomkoppen */}
                <View
                  style={[
                    stijlen.simTabelRij,
                    {
                      backgroundColor: kleuren.achtergrondSecundair,
                      borderBottomColor: kleuren.kaartRand,
                    },
                  ]}
                >
                  <Text
                    style={[
                      stijlen.simTabelKop,
                      stijlen.simTabelCelBreed,
                      { color: kleuren.tekstGedimpt },
                    ]}
                  >
                    Scenario
                  </Text>
                  <Text style={[stijlen.simTabelKop, { color: kleuren.tekstGedimpt }]}>
                    Start → Eind
                  </Text>
                  <Text style={[stijlen.simTabelKop, { color: kleuren.tekstGedimpt }]}>1RM %</Text>
                  <Text style={[stijlen.simTabelKop, { color: kleuren.tekstGedimpt }]}>
                    Vol (kg)
                  </Text>
                  <Text style={[stijlen.simTabelKop, { color: kleuren.tekstGedimpt }]}>
                    Arbeid (J)
                  </Text>
                </View>

                {/* Scenario rijen */}
                {simulaties.map(({ scenario, data }) => {
                  const eerste = data[0];
                  const laatste = data[data.length - 1];
                  const groei1RM =
                    eerste.geschatte1RM > 0
                      ? (
                          ((laatste.geschatte1RM - eerste.geschatte1RM) / eerste.geschatte1RM) *
                          100
                        ).toFixed(1)
                      : '0.0';
                  const totVol = data.reduce((s, d) => s + d.volume, 0);
                  const totArb = data.reduce((s, d) => s + d.arbeid, 0);
                  const isFocus = focusScenario === scenario;
                  const kleur = SCENARIO_KLEUREN[scenario];

                  return (
                    <Pressable
                      key={scenario}
                      onPress={() => setFocusScenario(scenario)}
                      style={[
                        stijlen.simTabelRij,
                        {
                          borderBottomColor: kleuren.kaartRand,
                          backgroundColor: isFocus
                            ? kleuren.isDark
                              ? 'rgba(255,255,255,0.03)'
                              : 'rgba(9,9,11,0.025)'
                            : 'transparent',
                        },
                        WEB_POINTER,
                      ]}
                    >
                      <View style={[stijlen.simTabelCelBreed, stijlen.scenarioCelMetPunt]}>
                        <View style={[stijlen.groepPunt, { backgroundColor: kleur }]} />
                        <Text
                          style={[
                            stijlen.simTabelCelLinks,
                            {
                              color: kleuren.tekst,
                              fontFamily: isFocus ? 'Inter_700Bold' : 'Inter_600SemiBold',
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {SCENARIO_LABELS[scenario]}
                        </Text>
                      </View>
                      <Text style={[stijlen.simTabelCel, TABULAR_NUMS, { color: kleuren.tekst }]}>
                        {eerste.gewicht} → {laatste.gewicht}
                      </Text>
                      <Text
                        style={[
                          stijlen.simTabelCel,
                          TABULAR_NUMS,
                          { color: kleur, fontFamily: 'Inter_600SemiBold' },
                        ]}
                      >
                        +{groei1RM}%
                      </Text>
                      <Text style={[stijlen.simTabelCel, TABULAR_NUMS, { color: kleuren.tekst }]}>
                        {formatGetal(totVol)}
                      </Text>
                      <Text
                        style={[
                          stijlen.simTabelCel,
                          TABULAR_NUMS,
                          { color: kleuren.tekst, fontFamily: 'Inter_600SemiBold' },
                        ]}
                      >
                        {formatGetal(totArb)}
                      </Text>
                    </Pressable>
                  );
                })}

                {/* Echte data rij */}
                {echteDataSamenvatting && (
                  <View
                    style={[
                      stijlen.simTabelRij,
                      {
                        borderBottomColor: kleuren.kaartRand,
                        backgroundColor: kleuren.accentGedimpt,
                      },
                    ]}
                  >
                    <View style={[stijlen.simTabelCelBreed, stijlen.scenarioCelMetPunt]}>
                      <View style={[stijlen.groepPunt, { backgroundColor: ECHTE_DATA_KLEUR }]} />
                      <Text
                        style={[
                          stijlen.simTabelCelLinks,
                          { color: kleuren.accentLicht, fontFamily: 'Inter_700Bold' },
                        ]}
                        numberOfLines={1}
                      >
                        Echte Data
                      </Text>
                    </View>
                    <Text
                      style={[
                        stijlen.simTabelCel,
                        TABULAR_NUMS,
                        { color: kleuren.tekst, fontFamily: 'Inter_600SemiBold' },
                      ]}
                    >
                      {echteDataSamenvatting.startGewicht} → {echteDataSamenvatting.eindGewicht}
                    </Text>
                    <Text
                      style={[
                        stijlen.simTabelCel,
                        TABULAR_NUMS,
                        { color: kleuren.accentLicht, fontFamily: 'Inter_700Bold' },
                      ]}
                    >
                      {echteDataSamenvatting.groeiPct >= 0 ? '+' : ''}
                      {echteDataSamenvatting.groeiPct.toFixed(1)}%
                    </Text>
                    <Text
                      style={[
                        stijlen.simTabelCel,
                        TABULAR_NUMS,
                        { color: kleuren.tekst, fontFamily: 'Inter_600SemiBold' },
                      ]}
                    >
                      {formatGetal(echteDataSamenvatting.totVolume)}
                    </Text>
                    <Text
                      style={[
                        stijlen.simTabelCel,
                        TABULAR_NUMS,
                        { color: kleuren.tekst, fontFamily: 'Inter_700Bold' },
                      ]}
                    >
                      {formatGetal(echteDataSamenvatting.totArbeid)}
                    </Text>
                  </View>
                )}

                <View style={stijlen.simNotaBalk}>
                  <Text style={[stijlen.simNota, { color: kleuren.tekstGedimpt }]}>
                    Gebaseerd op berekenVoorschrift() (3×10 start, +2,5 kg) · W = m·g·s met s ={' '}
                    {simSlaglengte.toFixed(2)} m (Coach 7 aanpasbaar).
                  </Text>
                </View>
              </Card>
            </View>
          </View>

          {/* ─── Deelnemers & Trainingen Sectie ───────────────────────── */}
          <View style={[stijlen.sectieHeaderRij, { marginTop: SPACING.xxl }]}>
            <Text style={[stijlen.sectieLabel, { color: kleuren.tekstGedimpt }]}>
              DEELNEMERS & TRAININGEN ({gefilterdeDeelnemers.length})
            </Text>

            {/* Groep filter pills */}
            <View style={stijlen.filterPills}>
              {(
                [
                  { id: 'alle', label: `Alle (${aantalDeelnemers})` },
                  { id: 'gevoel', label: `Gevoel (${aantalGevoel})` },
                  { id: 'app', label: `App (${aantalApp})` },
                ] as { id: GroepFilter; label: string }[]
              ).map((f) => {
                const actief = groepFilter === f.id;
                return (
                  <Pressable
                    key={f.id}
                    onPress={() => setGroepFilter(f.id)}
                    style={[
                      stijlen.filterPil,
                      {
                        backgroundColor: actief ? kleuren.accent : kleuren.kaart,
                        borderColor: actief ? kleuren.accent : kleuren.kaartRand,
                      },
                      WEB_POINTER,
                    ]}
                  >
                    <Text
                      style={[
                        stijlen.filterPilTekst,
                        { color: actief ? '#FFFFFF' : kleuren.tekstSecundair },
                      ]}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Participant Summary Cards (2-col grid on desktop, 1-col on mobile) */}
          {gefilterdeDeelnemers.length === 0 ? (
            <EmptyState
              icoon="people-outline"
              titel="Geen deelnemers gevonden"
              subtekst={
                aantalDeelnemers === 0
                  ? 'Er zijn nog geen proefpersonen geregistreerd in het onderzoek.'
                  : 'Geen deelnemers in deze onderzoeks-groep. Kies "Alle" om iedereen te zien.'
              }
              compact
              style={{ marginBottom: SPACING.lg }}
            />
          ) : (
            <View style={{ gap: SPACING.md, marginBottom: SPACING.lg }}>
              {deelnemerRijen.map((rij, rijIdx) => (
                <View key={rijIdx} style={stijlen.deelnemerGridRij}>
                  {rij.map((d) => {
                    const geselecteerd = gekozenDeelnemerId === d.id;
                    const avatarBg =
                      d.groupType === 'app'
                        ? kleuren.accentGedimpt
                        : d.groupType === 'gevoel'
                          ? kleuren.isDark
                            ? 'rgba(245, 158, 11, 0.16)'
                            : 'rgba(217, 119, 6, 0.12)'
                          : kleuren.achtergrondSecundair;
                    const avatarTekst =
                      d.groupType === 'app'
                        ? kleuren.accentLicht
                        : d.groupType === 'gevoel'
                          ? kleuren.waarschuwing
                          : kleuren.tekstSecundair;

                    return (
                      <Pressable
                        key={d.id}
                        onPress={() => setGekozenDeelnemerId(d.id)}
                        style={({ pressed }) => [
                          stijlen.deelnemerKaartWrapper,
                          { opacity: pressed ? 0.92 : 1 },
                          WEB_POINTER,
                        ]}
                      >
                        <Card
                          padding={16}
                          style={[
                            stijlen.deelnemerKaart,
                            geselecteerd && {
                              borderColor: kleuren.accent,
                              borderWidth: 1.5,
                            },
                          ]}
                        >
                          <View style={stijlen.deelnemerKaartTop}>
                            <View style={[stijlen.avatarCirkel, { backgroundColor: avatarBg }]}>
                              <Text style={[stijlen.avatarTekst, { color: avatarTekst }]}>
                                {getInitialen(d.naam)}
                              </Text>
                            </View>

                            <View style={{ flex: 1, minWidth: 0 }}>
                              <View style={stijlen.deelnemerNaamRij}>
                                <Text
                                  style={[stijlen.deelnemerNaam, { color: kleuren.tekst }]}
                                  numberOfLines={1}
                                >
                                  {d.naam}
                                </Text>
                                {geselecteerd && (
                                  <View
                                    style={[
                                      stijlen.actiefLabel,
                                      { backgroundColor: kleuren.accentGedimpt },
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        stijlen.actiefLabelTekst,
                                        { color: kleuren.accentLicht },
                                      ]}
                                    >
                                      In simulator
                                    </Text>
                                  </View>
                                )}
                              </View>
                              <Text
                                style={[stijlen.deelnemerMeta, { color: kleuren.tekstGedimpt }]}
                                numberOfLines={1}
                              >
                                {d.laatsteDatum
                                  ? `Laatste training: ${d.laatsteDatum}`
                                  : 'Nog geen training gelogd'}
                              </Text>
                            </View>

                            <GroepBadge groupType={d.groupType} kleuren={kleuren} />
                          </View>

                          <View
                            style={[
                              stijlen.deelnemerMetricsStrip,
                              {
                                backgroundColor: kleuren.achtergrondSecundair,
                                borderColor: kleuren.kaartRand,
                              },
                            ]}
                          >
                            <View style={stijlen.deelnemerMetricCel}>
                              <Text
                                style={[
                                  stijlen.deelnemerMetricWaarde,
                                  TABULAR_NUMS,
                                  { color: kleuren.tekst },
                                ]}
                              >
                                {d.sessies}
                              </Text>
                              <Text
                                style={[
                                  stijlen.deelnemerMetricLabel,
                                  { color: kleuren.tekstGedimpt },
                                ]}
                              >
                                Sessies
                              </Text>
                            </View>
                            <View
                              style={[
                                stijlen.metricDivider,
                                { backgroundColor: kleuren.kaartRand },
                              ]}
                            />
                            <View style={stijlen.deelnemerMetricCel}>
                              <Text
                                style={[
                                  stijlen.deelnemerMetricWaarde,
                                  TABULAR_NUMS,
                                  { color: kleuren.tekst },
                                ]}
                              >
                                {d.totaalSets}
                              </Text>
                              <Text
                                style={[
                                  stijlen.deelnemerMetricLabel,
                                  { color: kleuren.tekstGedimpt },
                                ]}
                              >
                                Werksets
                              </Text>
                            </View>
                            <View
                              style={[
                                stijlen.metricDivider,
                                { backgroundColor: kleuren.kaartRand },
                              ]}
                            />
                            <View style={stijlen.deelnemerMetricCel}>
                              <Text
                                style={[
                                  stijlen.deelnemerMetricWaarde,
                                  TABULAR_NUMS,
                                  { color: kleuren.tekst },
                                ]}
                                numberOfLines={1}
                              >
                                {formatGetal(d.totaalVolume)} kg
                              </Text>
                              <Text
                                style={[
                                  stijlen.deelnemerMetricLabel,
                                  { color: kleuren.tekstGedimpt },
                                ]}
                              >
                                Volume
                              </Text>
                            </View>
                            <View
                              style={[
                                stijlen.metricDivider,
                                { backgroundColor: kleuren.kaartRand },
                              ]}
                            />
                            <View style={stijlen.deelnemerMetricCel}>
                              <Text
                                style={[
                                  stijlen.deelnemerMetricWaarde,
                                  TABULAR_NUMS,
                                  { color: kleuren.tekst },
                                ]}
                                numberOfLines={1}
                              >
                                {formatGetal(d.totaalArbeid)} J
                              </Text>
                              <Text
                                style={[
                                  stijlen.deelnemerMetricLabel,
                                  { color: kleuren.tekstGedimpt },
                                ]}
                              >
                                Arbeid
                              </Text>
                            </View>
                          </View>
                        </Card>
                      </Pressable>
                    );
                  })}
                  {isDesktopLayout && rij.length === 1 && <View style={{ flex: 1 }} />}
                </View>
              ))}
            </View>
          )}

          {/* Recente Trainingssessies Tabel */}
          {recenteSessies.length > 0 && (
            <Card padding={0} style={{ overflow: 'hidden', marginBottom: SPACING.lg }}>
              <View
                style={[
                  stijlen.tabelHeaderBalk,
                  { borderBottomColor: kleuren.kaartRand },
                ]}
              >
                <Text style={[stijlen.paneelTitel, { color: kleuren.tekst }]}>
                  Recente Onderzoekssessies
                </Text>
                <Text style={[stijlen.tabelBadgeTekst, { color: kleuren.tekstGedimpt }]}>
                  Laatste {recenteSessies.length}
                </Text>
              </View>

              {isBreedOfTablet && (
                <View
                  style={[
                    stijlen.sessieTabelRij,
                    {
                      backgroundColor: kleuren.achtergrondSecundair,
                      borderBottomColor: kleuren.kaartRand,
                    },
                  ]}
                >
                  <Text style={[stijlen.simTabelKop, { flex: 0.9, textAlign: 'left', color: kleuren.tekstGedimpt }]}>
                    Datum
                  </Text>
                  <Text style={[stijlen.simTabelKop, { flex: 1.3, textAlign: 'left', color: kleuren.tekstGedimpt }]}>
                    Deelnemer
                  </Text>
                  <Text style={[stijlen.simTabelKop, { flex: 0.85, textAlign: 'left', color: kleuren.tekstGedimpt }]}>
                    Groep
                  </Text>
                  <Text style={[stijlen.simTabelKop, { flex: 1.3, textAlign: 'left', color: kleuren.tekstGedimpt }]}>
                    Oefening
                  </Text>
                  <Text style={[stijlen.simTabelKop, { flex: 0.9, color: kleuren.tekstGedimpt }]}>
                    Top Set
                  </Text>
                  <Text style={[stijlen.simTabelKop, { flex: 0.85, color: kleuren.tekstGedimpt }]}>
                    Volume
                  </Text>
                  <Text style={[stijlen.simTabelKop, { flex: 0.85, color: kleuren.tekstGedimpt }]}>
                    Arbeid
                  </Text>
                </View>
              )}

              {recenteSessies.map((ses, idx) => {
                const deelnemer = deelnemerLookup.get(ses.userId);
                const oefNaam = findExercise(ses.exercise)?.naam ?? ses.exercise;
                const isLaatste = idx === recenteSessies.length - 1;

                if (isBreedOfTablet) {
                  return (
                    <View
                      key={ses.sleutel}
                      style={[
                        stijlen.sessieTabelRij,
                        !isLaatste && { borderBottomWidth: 1, borderBottomColor: kleuren.kaartRand },
                      ]}
                    >
                      <Text
                        style={[
                          stijlen.sessieCelLinks,
                          TABULAR_NUMS,
                          { flex: 0.9, color: kleuren.tekstSecundair },
                        ]}
                      >
                        {ses.datum}
                      </Text>
                      <Text
                        style={[
                          stijlen.sessieCelLinks,
                          { flex: 1.3, color: kleuren.tekst, fontFamily: 'Inter_600SemiBold' },
                        ]}
                        numberOfLines={1}
                      >
                        {deelnemer?.naam ?? 'Deelnemer'}
                      </Text>
                      <View style={{ flex: 0.85, alignItems: 'flex-start' }}>
                        <GroepBadge groupType={deelnemer?.groupType ?? null} kleuren={kleuren} />
                      </View>
                      <Text
                        style={[stijlen.sessieCelLinks, { flex: 1.3, color: kleuren.tekst }]}
                        numberOfLines={1}
                      >
                        {oefNaam}
                      </Text>
                      <Text
                        style={[
                          stijlen.simTabelCel,
                          TABULAR_NUMS,
                          { flex: 0.9, color: kleuren.tekst, fontFamily: 'Inter_600SemiBold' },
                        ]}
                      >
                        {ses.topGewicht} kg × {ses.topReps}
                      </Text>
                      <Text
                        style={[
                          stijlen.simTabelCel,
                          TABULAR_NUMS,
                          { flex: 0.85, color: kleuren.tekstSecundair },
                        ]}
                      >
                        {formatGetal(ses.totaalVolume)} kg
                      </Text>
                      <Text
                        style={[
                          stijlen.simTabelCel,
                          TABULAR_NUMS,
                          { flex: 0.85, color: kleuren.accentLicht, fontFamily: 'Inter_600SemiBold' },
                        ]}
                      >
                        {formatGetal(ses.totaalArbeid)} J
                      </Text>
                    </View>
                  );
                }

                return (
                  <View
                    key={ses.sleutel}
                    style={[
                      stijlen.sessieMobielRij,
                      !isLaatste && { borderBottomWidth: 1, borderBottomColor: kleuren.kaartRand },
                    ]}
                  >
                    <View style={stijlen.sessieMobielTop}>
                      <Text
                        style={[stijlen.deelnemerNaam, { color: kleuren.tekst, flex: 1 }]}
                        numberOfLines={1}
                      >
                        {deelnemer?.naam ?? 'Deelnemer'} · {oefNaam}
                      </Text>
                      <GroepBadge groupType={deelnemer?.groupType ?? null} kleuren={kleuren} />
                    </View>
                    <View style={stijlen.sessieMobielOnder}>
                      <Text
                        style={[
                          stijlen.deelnemerMeta,
                          TABULAR_NUMS,
                          { color: kleuren.tekstGedimpt },
                        ]}
                      >
                        {ses.datum} · Top {ses.topGewicht} kg × {ses.topReps}
                      </Text>
                      <Text
                        style={[
                          stijlen.deelnemerMeta,
                          TABULAR_NUMS,
                          { color: kleuren.accentLicht, fontFamily: 'Inter_600SemiBold' },
                        ]}
                      >
                        {formatGetal(ses.totaalVolume)} kg · {formatGetal(ses.totaalArbeid)} J
                      </Text>
                    </View>
                  </View>
                );
              })}
            </Card>
          )}

          {/* Gelogde Oefeningen */}
          {oefeningen.length > 0 && (
            <Card padding={16} style={{ marginBottom: SPACING.xl }}>
              <Text style={[stijlen.controlLabel, { color: kleuren.tekstSecundair, marginBottom: 10 }]}>
                Gelogde Oefeningen in Dataset ({oefeningen.length})
              </Text>
              <View style={stijlen.badgeRij}>
                {oefeningen.map((o) => {
                  const naam = findExercise(o)?.naam ?? o;
                  return (
                    <Badge
                      key={o}
                      label={naam}
                      kleur={kleuren.accentLicht}
                      achtergrond={kleuren.accentGedimpt}
                    />
                  );
                })}
              </View>
            </Card>
          )}

          {/* ─── CSV Export Suite ─────────────────────────────────────── */}
          <View style={stijlen.sectieHeaderRij}>
            <Text style={[stijlen.sectieLabel, { color: kleuren.tekstGedimpt }]}>
              ONDERZOEKSDATA EXPORTEREN (CSV)
            </Text>
            <Text style={[stijlen.sectieMeta, { color: kleuren.tekstGedimpt }]}>
              {Platform.OS === 'web' ? 'Directe browser-download' : 'Delen als CSV-bestand'}
            </Text>
          </View>

          <View
            style={[
              stijlen.exportGrid,
              isBreedOfTablet ? stijlen.exportGridRow : stijlen.exportGridStack,
            ]}
          >
            {/* Export 1: Volledige Onderzoeksdata */}
            <Card padding={20} style={stijlen.exportKaart}>
              <View style={stijlen.exportKaartTop}>
                <View style={[stijlen.exportIcoonBadge, { backgroundColor: kleuren.accentGedimpt }]}>
                  <Ionicons name="cloud-download-outline" size={22} color={kleuren.accentLicht} />
                </View>
                <View
                  style={[
                    stijlen.metaPil,
                    {
                      backgroundColor: kleuren.achtergrondSecundair,
                      borderColor: kleuren.kaartRand,
                    },
                  ]}
                >
                  <Text style={[stijlen.metaPilTekst, TABULAR_NUMS, { color: kleuren.tekstSecundair }]}>
                    {formatGetal(onderzoeksWorkouts.length)} RIJEN
                  </Text>
                </View>
              </View>

              <Text style={[stijlen.exportKaartTitel, { color: kleuren.tekst }]}>
                Volledige Onderzoeksdata
              </Text>
              <Text style={[stijlen.exportKaartTekst, { color: kleuren.tekstSecundair }]}>
                Alle individuele trainingssets inclusief deelnemersgroep, RPE, voorschriften,
                volume (kg), mechanische arbeid (J) en testmomenten.
              </Text>

              <View style={stijlen.exportKaartActie}>
                <PrimaryButton
                  titel="Exporteer Volledige CSV"
                  icoon="download-outline"
                  onPress={handleExportVolleOnderzoeksCSV}
                  bezig={exportVolledigBezig}
                  size="md"
                />
              </View>
            </Card>

            {/* Export 2: Data + Algoritme Simulatie */}
            <Card padding={20} style={stijlen.exportKaart}>
              <View style={stijlen.exportKaartTop}>
                <View
                  style={[
                    stijlen.exportIcoonBadge,
                    {
                      backgroundColor: kleuren.isDark
                        ? 'rgba(99, 102, 241, 0.16)'
                        : 'rgba(99, 102, 241, 0.10)',
                    },
                  ]}
                >
                  <Ionicons name="analytics-outline" size={22} color={INDIGO_KLEUR} />
                </View>
                <View
                  style={[
                    stijlen.metaPil,
                    {
                      backgroundColor: kleuren.achtergrondSecundair,
                      borderColor: kleuren.kaartRand,
                    },
                  ]}
                >
                  <Text style={[stijlen.metaPilTekst, { color: kleuren.tekstSecundair }]}>
                    3 SCENARIO&apos;S
                  </Text>
                </View>
              </View>

              <Text style={[stijlen.exportKaartTitel, { color: kleuren.tekst }]}>
                Data + Algoritme Simulatie
              </Text>
              <Text style={[stijlen.exportKaartTekst, { color: kleuren.tekstSecundair }]}>
                Combineert echte proefpersoondata met 12-sessie simulatietrajecten (optimaal,
                realistisch, vermoeidheid) per deelnemer en oefening.
              </Text>

              <View style={stijlen.exportKaartActie}>
                <Pressable
                  onPress={handleExportMetSimulatie}
                  disabled={exportSimBezig}
                  accessibilityRole="button"
                  accessibilityLabel="Data met simulatie exporteren als CSV"
                  style={({ pressed }) => [
                    stijlen.indigoExportKnop,
                    {
                      backgroundColor: INDIGO_KLEUR,
                      opacity: pressed || exportSimBezig ? 0.82 : 1,
                    },
                    WEB_POINTER,
                  ]}
                >
                  {exportSimBezig ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name="analytics-outline"
                        size={17}
                        color="#FFFFFF"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={stijlen.indigoExportTekst}>Exporteer Data + Simulatie</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </Card>
          </View>

          {/* ─── Weergave & Account ───────────────────────────────────── */}
          <View style={[stijlen.sectieHeaderRij, { marginTop: SPACING.xl }]}>
            <Text style={[stijlen.sectieLabel, { color: kleuren.tekstGedimpt }]}>
              WEERGAVE & ACCOUNT
            </Text>
          </View>

          <Card padding={18} style={{ marginBottom: SPACING.xl }}>
            <View
              style={[
                stijlen.footerRij,
                isBreedOfTablet ? stijlen.footerRijDesktop : stijlen.footerRijMobiel,
              ]}
            >
              <View style={stijlen.footerThemaBlok}>
                <Text style={[stijlen.controlLabel, { color: kleuren.tekstSecundair, marginBottom: 8 }]}>
                  Thema-voorkeur
                </Text>
                <View style={stijlen.pilWrap}>
                  {themaOpties.map((t) => {
                    const actief = voorkeur === t.id;
                    return (
                      <Pressable
                        key={t.id}
                        onPress={() => setVoorkeur(t.id)}
                        style={({ pressed }) => [
                          stijlen.themaPil,
                          {
                            backgroundColor: actief
                              ? kleuren.accent
                              : kleuren.achtergrondSecundair,
                            borderColor: actief ? kleuren.accent : kleuren.kaartRand,
                            opacity: pressed ? 0.85 : 1,
                          },
                          WEB_POINTER,
                        ]}
                      >
                        <Ionicons
                          name={t.icoon}
                          size={15}
                          color={actief ? '#FFFFFF' : kleuren.tekst}
                        />
                        <Text
                          style={[
                            stijlen.deelnemerPilTekst,
                            { color: actief ? '#FFFFFF' : kleuren.tekst },
                          ]}
                        >
                          {t.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={isBreedOfTablet ? stijlen.footerUitlogDesktop : stijlen.footerUitlogMobiel}>
                <PrimaryButton
                  titel="Uitloggen"
                  icoon="log-out-outline"
                  variant="danger"
                  size="md"
                  volledigeBreedte={!isBreedOfTablet}
                  onPress={uitloggen}
                />
              </View>
            </View>
          </Card>

          <View style={{ height: isTablet || isDesktopLayout ? 32 : 24 }} />
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const stijlen = StyleSheet.create({
  veilig: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollInhoud: {
    paddingBottom: SPACING.xxl,
  },

  // Header actions
  headerActies: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerThemaTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 3,
    gap: 2,
  },
  headerThemaKnop: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm - 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerKnop: {
    height: 40,
    minWidth: 40,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  headerKnopMetTekst: {
    paddingHorizontal: 14,
  },
  headerKnopTekst: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },

  // Section labels
  sectieHeaderRij: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectieTitelMetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  sectieLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  sectieMeta: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  metaPil: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  metaPilTekst: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },

  // KPI Grid
  kpiGridRij: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  kpiKaart: {
    flex: 1,
  },
  kpiTopRij: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  kpiLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
  },
  kpiIcoonBadge: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiWaardeRij: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    marginBottom: 4,
  },
  kpiWaarde: {
    fontSize: 26,
    fontFamily: 'Inter_900Black',
    letterSpacing: -0.6,
  },
  kpiEenheid: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  kpiSublabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },

  // Simulator layout
  simLayout: {
    gap: SPACING.lg,
  },
  simLayoutDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  simLayoutMobile: {
    flexDirection: 'column',
  },
  simControlsDesktop: {
    width: 360,
    flexShrink: 0,
  },
  simControlsMobile: {
    width: '100%',
  },
  simResultatenKolom: {
    flex: 1,
    minWidth: 0,
    gap: SPACING.md,
  },

  // Panel headers & controls
  paneelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  paneelIcoon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paneelTitel: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.2,
  },
  paneelSubtitel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  controlBlok: {
    marginBottom: SPACING.base,
  },
  controlLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  pilWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pilHorizontaal: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  keuzePil: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  keuzePilTekst: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  keuzePilSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  deelnemerPil: {
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deelnemerPilTekst: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  themaPil: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  // Physics inputs
  simInputsRij: {
    flexDirection: 'row',
    gap: 10,
  },
  simInputBlok: {
    flex: 1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 10,
    gap: 8,
  },
  simLabelMetReset: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  simInputLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  coach7Badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  coach7BadgeTekst: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.3,
  },
  inputMetEenheid: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.sm - 2,
    paddingHorizontal: 10,
    height: 40,
  },
  simGewichtInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    paddingVertical: 0,
    minWidth: 0,
  },
  inputEenheid: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 6,
  },
  resetRomPil: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  resetRomTekst: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },

  // Scenario pills
  scenarioKnoppenRij: {
    flexDirection: 'row',
    gap: 6,
  },
  scenarioPil: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  scenarioPilTekst: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },

  // Highlight delta strip
  highlightGrid: {
    gap: SPACING.md,
  },
  highlightGridRow: {
    flexDirection: 'row',
  },
  highlightGridStack: {
    flexDirection: 'column',
  },
  highlightKaart: {
    flex: 1,
  },
  highlightTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  highlightLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.7,
  },
  deltaBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  deltaTekst: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  highlightWaarde: {
    fontSize: 20,
    fontFamily: 'Inter_900Black',
    letterSpacing: -0.4,
    marginBottom: 3,
  },
  highlightSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },

  // Chart card
  grafiekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  metriekTrack: {
    flexDirection: 'row',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    padding: 3,
    gap: 3,
  },
  metriekKnop: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.xs + 1,
    alignItems: 'center',
  },
  metriekTekst: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  grafiekContainer: {
    width: '100%',
  },
  grafiekLegenda: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  legendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendaLijn: {
    width: 16,
    height: 2,
    borderRadius: 1,
  },
  legendaTekst: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },

  // Comparison table
  tabelHeaderBalk: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  tabelBadgeTekst: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  simTabelRij: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  simTabelKop: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    textAlign: 'right',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  simTabelCel: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'right',
  },
  simTabelCelBreed: {
    flex: 1.5,
    textAlign: 'left',
  },
  simTabelCelLinks: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  scenarioCelMetPunt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  simNotaBalk: {
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  simNota: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    lineHeight: 17,
  },

  // Participants & Group filter
  filterPills: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  filterPil: {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  filterPilTekst: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  deelnemerGridRij: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  deelnemerKaartWrapper: {
    flex: 1,
  },
  deelnemerKaart: {
    flex: 1,
  },
  deelnemerKaartTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  avatarCirkel: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarTekst: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  deelnemerNaamRij: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deelnemerNaam: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  actiefLabel: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  actiefLabelTekst: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  deelnemerMeta: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  groepPil: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    flexShrink: 0,
  },
  groepPunt: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  groepPilTekst: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  deelnemerMetricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  deelnemerMetricCel: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  deelnemerMetricWaarde: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    marginBottom: 2,
  },
  deelnemerMetricLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metricDivider: {
    width: 1,
    height: 24,
  },

  // Recent sessions table
  sessieTabelRij: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 18,
    gap: 8,
  },
  sessieCelLinks: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'left',
  },
  sessieMobielRij: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  sessieMobielTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessieMobielOnder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  // Exercise badges
  badgeRij: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  // CSV Export suite
  exportGrid: {
    gap: SPACING.md,
  },
  exportGridRow: {
    flexDirection: 'row',
  },
  exportGridStack: {
    flexDirection: 'column',
  },
  exportKaart: {
    flex: 1,
    justifyContent: 'space-between',
  },
  exportKaartTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  exportIcoonBadge: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportKaartTitel: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  exportKaartTekst: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
    marginBottom: 18,
  },
  exportKaartActie: {
    marginTop: 'auto',
  },
  indigoExportKnop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    shadowColor: INDIGO_KLEUR,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 4,
  },
  indigoExportTekst: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.1,
  },

  // Footer
  footerRij: {
    gap: SPACING.base,
  },
  footerRijDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  footerRijMobiel: {
    flexDirection: 'column',
  },
  footerThemaBlok: {
    flex: 1,
  },
  footerUitlogDesktop: {
    flexShrink: 0,
  },
  footerUitlogMobiel: {
    width: '100%',
  },
});
