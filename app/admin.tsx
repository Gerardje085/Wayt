import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert, Share, RefreshControl, TextInput, Dimensions, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Line, Polyline, Circle, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useThema } from '../src/context/ThemeContext';
import {
  haalVolledigeOnderzoeksdata,
  haalAlleDeelnemerProfielen,
  type OnderzoeksWorkout,
  type DeelnemerProfiel,
} from '../src/hooks/useWorkouts';
import StatCard from '../src/components/ui/StatCard';
import Badge from '../src/components/ui/Badge';
import ErrorBanner from '../src/components/ErrorBanner';
import { simuleerAlgoritmeTraject, SimulatieScenario, SimulatieSessie } from '../src/utils/algorithm';
import { getStandaardSlaglengte, ZWAARTEKRACHT } from '../src/utils/physics';
import { findExercise } from '../src/data/exercises';
import { vertaalFout } from '../src/utils/errorVertaler';
import {
  groepeerNaarSessies,
  telUniekeWorkoutSessies,
  type GegroepeerdeSessie,
} from '../src/utils/sessieGroepering';

const ALLE_DEELNEMERS_ID = '__ALLE__';
type GrafiekMetriek = 'eenRM' | 'volume' | 'arbeid';

interface EchtePunt {
  sessie: number;
  gewicht: number;
  eenRM: number;
  volume: number;
  arbeid: number;
}

function SimulatorVergelijkingsGrafiek({
  metriek,
  simulaties,
  echteReeks,
  kleuren,
}: {
  metriek: GrafiekMetriek;
  simulaties: { scenario: SimulatieScenario; data: SimulatieSessie[] }[];
  echteReeks: EchtePunt[];
  kleuren: any;
}) {
  const CHART_W = Math.max(260, Dimensions.get('window').width - 72);
  const CHART_H = 196;
  const PAD_L = 44;
  const PAD_R = 12;
  const PAD_T = 14;
  const PAD_B = 24;
  const PLOT_W = CHART_W - PAD_L - PAD_R;
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
    punten.map(p => `${xPos(p.sessie).toFixed(1)},${yPos(p.val).toFixed(1)}`).join(' ');

  const optimaalData = simulaties.find(s => s.scenario === 'optimaal')?.data ?? [];
  const realistischData = simulaties.find(s => s.scenario === 'realistisch')?.data ?? [];
  const vermoeidheidData = simulaties.find(s => s.scenario === 'vermoeidheid')?.data ?? [];

  const echtePunten = echteReeks
    .filter(p => p.sessie >= 1 && p.sessie <= 12)
    .map(p => ({ sessie: p.sessie, val: getEchtWaarde(p) }));

  const yTicks = [0, 0.333, 0.666, 1].map(f => ({
    y: PAD_T + PLOT_H * (1 - f),
    label: Math.round(minY + ySpan * f),
  }));

  return (
    <View style={{ marginTop: 8 }}>
      <Svg width={CHART_W} height={CHART_H}>
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
              strokeDasharray={idx === 0 ? undefined : '3,3'}
            />
            <SvgText
              x={PAD_L - 6}
              y={t.y + 3}
              fontSize={9}
              fill={kleuren.tekstGedimpt}
              textAnchor="end"
            >
              {t.label}
            </SvgText>
          </React.Fragment>
        ))}

        {/* X-as sessielabels (1 t/m 12) */}
        {Array.from({ length: 12 }, (_, idx) => idx + 1).map(sessie => (
          <SvgText
            key={sessie}
            x={xPos(sessie)}
            y={CHART_H - 6}
            fontSize={9}
            fill={kleuren.tekstGedimpt}
            textAnchor="middle"
          >
            {sessie}
          </SvgText>
        ))}

        {/* 4. Vermoeidheid (Rood) */}
        {vermoeidheidData.length > 1 && (
          <Polyline
            points={maakPunten(vermoeidheidData.map(d => ({ sessie: d.sessie, val: getSimWaarde(d) })))}
            fill="none"
            stroke="#EF4444"
            strokeWidth={2}
          />
        )}

        {/* 3. Realistisch (Geel/Amber) */}
        {realistischData.length > 1 && (
          <Polyline
            points={maakPunten(realistischData.map(d => ({ sessie: d.sessie, val: getSimWaarde(d) })))}
            fill="none"
            stroke="#F59E0B"
            strokeWidth={2}
          />
        )}

        {/* 2. Optimaal (Groen gestippeld) */}
        {optimaalData.length > 1 && (
          <Polyline
            points={maakPunten(optimaalData.map(d => ({ sessie: d.sessie, val: getSimWaarde(d) })))}
            fill="none"
            stroke="#10B981"
            strokeWidth={2}
            strokeDasharray="5,4"
          />
        )}

        {/* 1. Echte Data (Dikke blauwe lijn + puntjes) */}
        {echtePunten.length > 1 && (
          <Polyline
            points={maakPunten(echtePunten)}
            fill="none"
            stroke="#3B82F6"
            strokeWidth={3}
          />
        )}
        {echtePunten.map((p) => (
          <Circle
            key={`echt-${p.sessie}`}
            cx={xPos(p.sessie)}
            cy={yPos(p.val)}
            r={3.8}
            fill="#3B82F6"
            stroke={kleuren.kaart}
            strokeWidth={1.5}
          />
        ))}
      </Svg>

      {/* Legenda */}
      <View style={stijlen.grafiekLegenda}>
        <View style={stijlen.legendaItem}>
          <View style={[stijlen.legendaLijn, { backgroundColor: '#3B82F6', height: 3 }]} />
          <Text style={[stijlen.legendaTekst, { color: kleuren.tekst }]}>Echte Data (Gevoel)</Text>
        </View>
        <View style={stijlen.legendaItem}>
          <Svg width={18} height={4}>
            <Line x1={0} y1={2} x2={18} y2={2} stroke="#10B981" strokeWidth={2} strokeDasharray="4,3" />
          </Svg>
          <Text style={[stijlen.legendaTekst, { color: kleuren.tekst }]}>Algoritme – Optimaal</Text>
        </View>
        <View style={stijlen.legendaItem}>
          <View style={[stijlen.legendaLijn, { backgroundColor: '#F59E0B' }]} />
          <Text style={[stijlen.legendaTekst, { color: kleuren.tekst }]}>Algoritme – Realistisch</Text>
        </View>
        <View style={stijlen.legendaItem}>
          <View style={[stijlen.legendaLijn, { backgroundColor: '#EF4444' }]} />
          <Text style={[stijlen.legendaTekst, { color: kleuren.tekst }]}>Algoritme – Vermoeidheid (deload)</Text>
        </View>
      </View>
    </View>
  );
}

const ONDERZOEKS_OEFENINGEN = [
  { id: '0025', naam: 'Bench Press', standaardRom: 0.40 },
  { id: '0150', naam: 'Lat Pulldown', standaardRom: 0.60 },
  { id: '0585', naam: 'Leg Extension', standaardRom: 0.50 },
];

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

export default function AdminScreen() {
  const { user, isAdmin, uitloggen } = useAuth();
  const { kleuren, voorkeur, setVoorkeur } = useThema();

  // Simulator & onderzoeksdata state
  const [onderzoeksWorkouts, setOnderzoeksWorkouts] = useState<OnderzoeksWorkout[]>([]);
  const [deelnemerProfielen, setDeelnemerProfielen] = useState<DeelnemerProfiel[]>([]);
  const [onderzoekLaden, setOnderzoekLaden] = useState(false);
  const [onderzoekFout, setOnderzoekFout] = useState<string | null>(null);
  const [gekozenDeelnemerId, setGekozenDeelnemerId] = useState<string>(ALLE_DEELNEMERS_ID);
  const [simOefening, setSimOefening] = useState(ONDERZOEKS_OEFENINGEN[0]);
  const [simStartGewicht, setSimStartGewicht] = useState(30);
  const [simSlaglengte, setSimSlaglengte] = useState(ONDERZOEKS_OEFENINGEN[0].standaardRom);
  const [simSlaglengteTekst, setSimSlaglengteTekst] = useState(ONDERZOEKS_OEFENINGEN[0].standaardRom.toFixed(2));
  const [grafiekMetriek, setGrafiekMetriek] = useState<GrafiekMetriek>('eenRM');

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
      setOnderzoekFout(vertaalFout(err, 'Kon de onderzoeksdata niet ophalen. Probeer het opnieuw.'));
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
    const map = new Map<string, string>();
    let teller = 1;

    for (const p of deelnemerProfielen) {
      const raw = p.username?.trim();
      const label = raw && raw.length > 0
        ? (raw.includes('@') ? raw.split('@')[0] : raw)
        : `Deelnemer ${teller++}`;
      map.set(p.id, label);
    }

    for (const w of onderzoeksWorkouts) {
      if (w.user_id === user?.id) continue;
      if (map.has(w.user_id)) continue;
      const rawNaam = w.profiles?.username?.trim();
      const label = rawNaam && rawNaam.length > 0
        ? (rawNaam.includes('@') ? rawNaam.split('@')[0] : rawNaam)
        : `Deelnemer ${teller++}`;
      map.set(w.user_id, label);
    }

    return [
      { id: ALLE_DEELNEMERS_ID, label: 'Gemiddelde (Alle)' },
      ...Array.from(map.entries()).map(([id, label]) => ({ id, label })),
    ];
  }, [deelnemerProfielen, onderzoeksWorkouts, user?.id]);

  // Overzicht per deelnemer voor de deelnemerskaart
  const deelnemerStatistieken = useMemo(() => {
    const perUserWorkouts = new Map<string, OnderzoeksWorkout[]>();
    for (const w of onderzoeksWorkouts) {
      const lijst = perUserWorkouts.get(w.user_id) ?? [];
      lijst.push(w);
      perUserWorkouts.set(w.user_id, lijst);
    }

    return deelnemers
      .filter(d => d.id !== ALLE_DEELNEMERS_ID)
      .map(d => {
        const lijst = perUserWorkouts.get(d.id) ?? [];
        let laatsteDatum: string | null = null;
        let totaalSets = 0;
        for (const w of lijst) {
          if (!laatsteDatum || w.date > laatsteDatum) laatsteDatum = w.date;
          if (w.set_type !== 'warmup') {
            totaalSets += Number(w.sets) || 1;
          }
        }
        return {
          id: d.id,
          naam: d.label,
          sessies: telUniekeWorkoutSessies(lijst),
          totaalSets,
          laatsteDatum,
        };
      });
  }, [deelnemers, onderzoeksWorkouts]);

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
    const relevant = onderzoeksWorkouts.filter(w => matchesOefening(w.exercise, simOefening));
    const sessies = groepeerNaarSessies(relevant).filter(s => !s.isMeting);

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
          .map(l => l[idx])
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

    const userSessies = sessies.filter(s => s.userId === gekozenDeelnemerId).slice(0, 12);
    if (userSessies.length === 0) {
      return { startGewicht: null as number | null, reeks: [] as EchtePunt[], samenvatting: null };
    }

    const eerste = userSessies[0];
    const laatste = userSessies[userSessies.length - 1];
    const startGewicht = eerste.topGewicht;
    const eindGewicht = laatste.topGewicht;
    const groeiPct = eerste.beste1RM > 0
      ? ((laatste.beste1RM - eerste.beste1RM) / eerste.beste1RM) * 100
      : 0;
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
    return scenarios.map(s => ({
      scenario: s,
      data: simuleerAlgoritmeTraject(simStartGewicht, simOefening.id, 12, s, simSlaglengte),
    }));
  }, [simStartGewicht, simOefening, simSlaglengte]);

  const echteDataSamenvatting = echteAnalyse.samenvatting;

  const aantalDeelnemers = deelnemerStatistieken.length;
  const aantalSessies = telUniekeWorkoutSessies(onderzoeksWorkouts);
  const werkWorkouts = useMemo(
    () => onderzoeksWorkouts.filter(w => w.set_type !== 'warmup'),
    [onderzoeksWorkouts]
  );
  const totaalVolume = werkWorkouts.reduce((s, w) => s + (parseFloat(String(w.volume)) || 0), 0);
  const totaalArbeid = werkWorkouts.reduce((s, w) => s + (parseFloat(String(w.work_joules)) || 0), 0);
  const oefeningen = Array.from(new Set(onderzoeksWorkouts.map((w) => w.exercise)));

  const handleExportVolleOnderzoeksCSV = async () => {
    try {
      const alleWorkouts = await haalVolledigeOnderzoeksdata();

      if (!alleWorkouts || alleWorkouts.length === 0) {
        toonMelding('Geen data', 'Er zijn nog geen workouts in de database.');
        return;
      }

      const headers = [
        'id', 'session_id', 'user_id', 'group_type', 'username', 'date', 'exercise',
        'set_number', 'set_type', 'sets', 'reps', 'weight_kg', 'volume_kg', 'work_joules', 'rpe',
        'prescribed_sets', 'prescribed_reps', 'prescribed_weight_kg',
        'is_meting', 'test_moment', 'notitie',
      ];
      const rows = alleWorkouts.map((w) => [
        w.id,
        `"${w.session_id ?? ''}"`,
        w.user_id,
        `"${w.profiles?.group_type ?? ''}"`,
        `"${(w.profiles?.username ?? '').replace(/"/g, '""')}"`,
        w.date, `"${w.exercise}"`,
        w.set_number ?? '',
        `"${w.set_type ?? 'normaal'}"`,
        w.sets, w.reps, w.weight, w.volume, w.work_joules || 0,
        w.rpe ?? '',
        w.prescribed_sets ?? '', w.prescribed_reps ?? '', w.prescribed_weight ?? '',
        w.is_meting ? 'true' : 'false',
        `"${w.test_moment ?? ''}"`,
        `"${(w.notitie ?? '').replace(/"/g, '""')}"`,
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const bestandsnaam = `wayt_volledig_onderzoek_${new Date().toISOString().split('T')[0]}.csv`;
      await exporteerCSVBestand(csvContent, bestandsnaam);
    } catch (err) {
      toonMelding('Export mislukt', vertaalFout(err, 'Kon de volledige onderzoeksdata niet exporteren.'));
    }
  };

  const handleExportMetSimulatie = async () => {
    try {
      const alleWorkouts = await haalVolledigeOnderzoeksdata();

      if (!alleWorkouts || alleWorkouts.length === 0) {
        toonMelding('Geen data', 'Er zijn nog geen workouts in de database.');
        return;
      }

      const headers = [
        'id', 'session_id', 'user_id', 'group_type', 'username', 'date', 'exercise',
        'set_number', 'set_type', 'sets', 'reps', 'weight_kg', 'volume_kg', 'work_joules', 'rpe',
        'prescribed_sets', 'prescribed_reps', 'prescribed_weight_kg',
        'is_meting', 'test_moment', 'notitie', 'bron',
      ];

      // Echte data rijen (elke losse set)
      const echteRijen = alleWorkouts.map((w) => [
        w.id,
        `"${w.session_id ?? ''}"`,
        w.user_id,
        `"${w.profiles?.group_type ?? ''}"`,
        `"${(w.profiles?.username ?? '').replace(/"/g, '""')}"`,
        w.date, `"${w.exercise}"`,
        w.set_number ?? '',
        `"${w.set_type ?? 'normaal'}"`,
        w.sets, w.reps, w.weight, w.volume, w.work_joules || 0,
        w.rpe ?? '',
        w.prescribed_sets ?? '', w.prescribed_reps ?? '', w.prescribed_weight ?? '',
        w.is_meting ? 'true' : 'false',
        `"${w.test_moment ?? ''}"`,
        `"${(w.notitie ?? '').replace(/"/g, '""')}"`,
        'echt',
      ]);

      // Simulatie rijen: per gebruiker per oefening (bepaal startgewicht op basis van Top Set van eerste sessie)
      const simRijen: any[][] = [];
      const userOefeningMap = new Map<string, Map<string, number>>();
      const sessiesGesorteerd = groepeerNaarSessies(alleWorkouts).filter(s => !s.isMeting);

      for (const ses of sessiesGesorteerd) {
        const uid = ses.userId;
        if (!userOefeningMap.has(uid)) userOefeningMap.set(uid, new Map());
        const oefeningMap = userOefeningMap.get(uid)!;
        const exId = ses.exercise;
        const isOnderzoek = ONDERZOEKS_OEFENINGEN.some(
          o => o.id === exId || o.naam.toLowerCase().replace(/ /g, '_') === exId
        );
        if (!isOnderzoek) continue;
        if (!oefeningMap.has(exId)) {
          oefeningMap.set(exId, ses.topGewicht);
        }
      }

      const scenarios: SimulatieScenario[] = ['optimaal', 'realistisch', 'vermoeidheid'];
      for (const [userId, oefeningMap] of userOefeningMap) {
        const userProfile = alleWorkouts.find(w => w.user_id === userId);
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
                `"sessie_${sessie.sessie}"`, `"${exId}"`,
                '',
                '"normaal"',
                sessie.sets, sessie.reps, sessie.gewicht, sessie.volume, sessie.arbeid,
                '', // rpe
                '', '', '', // prescribed
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
      const csvContent = [headers.join(','), ...alleRijen.map(r => r.join(','))].join('\n');
      const bestandsnaam = `wayt_data_simulatie_${new Date().toISOString().split('T')[0]}.csv`;
      await exporteerCSVBestand(csvContent, bestandsnaam);
    } catch (err) {
      toonMelding('Export mislukt', vertaalFout(err, 'Kon de data met simulatie niet exporteren.'));
    }
  };

  const scenarioLabel = (s: string) => {
    switch (s) {
      case 'optimaal': return 'Optimaal';
      case 'realistisch': return 'Realistisch';
      case 'vermoeidheid': return 'Vermoeidheid';
      default: return s;
    }
  };

  if (!isAdmin) return null;

  return (
    <SafeAreaView style={[stijlen.veilig, { backgroundColor: kleuren.achtergrond }]}>
      <ScrollView
        style={stijlen.scroll}
        contentContainerStyle={stijlen.inhoud}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={onderzoekLaden}
            onRefresh={laadOnderzoeksWorkouts}
            tintColor={kleuren.accent}
          />
        }
      >
        <View style={stijlen.headerRij}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[stijlen.titel, { color: kleuren.tekst }]}>Wayt Admin</Text>
              <View style={[stijlen.adminBadge, { backgroundColor: kleuren.accentGedimpt }]}>
                <Text style={[stijlen.adminBadgeTekst, { color: kleuren.accent }]}>ONDERZOEKER</Text>
              </View>
            </View>
            <Text style={[stijlen.subtitel, { color: kleuren.tekstGedimpt, marginBottom: 0 }]}>
              {user?.email ?? 'Onderzoekersportaal'}
            </Text>
          </View>
          <TouchableOpacity
            style={[stijlen.terugKnop, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}
            onPress={laadOnderzoeksWorkouts}
            accessibilityLabel="Onderzoeksdata verversen"
          >
            <Ionicons name="refresh-outline" size={20} color={kleuren.tekst} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[stijlen.terugKnop, { backgroundColor: kleuren.fout + '15', borderColor: kleuren.fout + '44' }]}
            onPress={uitloggen}
            accessibilityLabel="Uitloggen"
          >
            <Ionicons name="log-out-outline" size={20} color={kleuren.fout} />
          </TouchableOpacity>
        </View>

        {onderzoekFout && (
          <ErrorBanner
            bericht={onderzoekFout}
            onProbeerOpnieuw={laadOnderzoeksWorkouts}
          />
        )}

        {/* ─── Onderzoek Totalen ────────────────────────────────────── */}
        <Text style={[stijlen.sectie, { color: kleuren.accent }]}>ONDERZOEKSOVERZICHT</Text>
        <View style={[stijlen.statRij, { marginBottom: 8 }]}>
          <StatCard waarde={String(aantalDeelnemers)} label="Deelnemers" />
          <StatCard waarde={String(aantalSessies)} label="Sessies" />
        </View>
        <View style={[stijlen.statRij, { marginBottom: 18 }]}>
          <StatCard waarde={totaalVolume.toFixed(0)} label="Vol. (kg)" />
          <StatCard waarde={totaalArbeid.toFixed(0)} label="Arbeid (J)" />
        </View>

        {/* ─── Deelnemerslijst ──────────────────────────────────────── */}
        <Text style={[stijlen.sectie, { color: kleuren.accent }]}>DEELNEMERS ({aantalDeelnemers})</Text>
        <View style={[stijlen.kaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
          {deelnemerStatistieken.length === 0 ? (
            <Text style={[stijlen.kaartUitleg, { color: kleuren.tekstGedimpt, marginBottom: 0 }]}>
              Er zijn nog geen deelnemers geregistreerd.
            </Text>
          ) : (
            deelnemerStatistieken.map((d, idx) => {
              const geselecteerd = gekozenDeelnemerId === d.id;
              return (
                <TouchableOpacity
                  key={d.id}
                  style={[
                    stijlen.deelnemerRij,
                    idx < deelnemerStatistieken.length - 1 && { borderBottomWidth: 1, borderBottomColor: kleuren.kaartRand },
                    geselecteerd && { backgroundColor: kleuren.accentGedimpt, borderRadius: 8, paddingHorizontal: 8 },
                  ]}
                  onPress={() => setGekozenDeelnemerId(d.id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[stijlen.deelnemerNaam, { color: kleuren.tekst }]}>{d.naam}</Text>
                    <Text style={[stijlen.deelnemerMeta, { color: kleuren.tekstGedimpt }]}>
                      {d.laatsteDatum ? `Laatste training: ${d.laatsteDatum}` : 'Nog geen training gelogd'}
                    </Text>
                  </View>
                  <Badge
                    label={`${d.sessies} ${d.sessies === 1 ? 'sessie' : 'sessies'} · ${d.totaalSets} sets`}
                    kleur={geselecteerd ? kleuren.accent : kleuren.tekstSecundair}
                    achtergrond={geselecteerd ? kleuren.accent + '22' : kleuren.achtergrond}
                  />
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ─── Algoritme vs. Gevoel Simulator ────────────────────────────────────── */}
        <Text style={[stijlen.sectie, { color: kleuren.accent }]}>ALGORITME VS. GEVOEL SIMULATOR (4 WEKEN / 12 SESSIES)</Text>
        <View style={[stijlen.kaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
          {/* Proefpersoon selector */}
          <Text style={[stijlen.kaartUitleg, { color: kleuren.tekstGedimpt, marginBottom: 8 }]}>Selecteer proefpersoon:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {deelnemers.map(d => {
                const actief = gekozenDeelnemerId === d.id;
                return (
                  <TouchableOpacity
                    key={d.id}
                    style={[
                      stijlen.rustPresetKnop,
                      {
                        backgroundColor: actief ? kleuren.accent : kleuren.achtergrond,
                        borderColor: actief ? kleuren.accent : kleuren.kaartRand,
                      },
                    ]}
                    onPress={() => setGekozenDeelnemerId(d.id)}
                  >
                    <Text style={[stijlen.rustPresetTekst, { color: actief ? '#FFF' : kleuren.tekst }]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Oefening selector */}
          <Text style={[stijlen.kaartUitleg, { color: kleuren.tekstGedimpt, marginBottom: 8 }]}>Selecteer oefening:</Text>
          <View style={[stijlen.rustKnoppenRij, { marginBottom: 12 }]}>
            {ONDERZOEKS_OEFENINGEN.map(o => {
              const actief = simOefening.id === o.id;
              return (
                <TouchableOpacity
                  key={o.id}
                  style={[
                    stijlen.rustPresetKnop,
                    {
                      backgroundColor: actief ? kleuren.accent : kleuren.achtergrond,
                      borderColor: actief ? kleuren.accent : kleuren.kaartRand,
                    },
                  ]}
                  onPress={() => setSimOefening(o)}
                >
                  <Text style={[stijlen.rustPresetTekst, { color: actief ? '#FFF' : kleuren.tekst }]}>{o.naam}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Startgewicht & Coach 7 Slaglengte s (m) */}
          <View style={stijlen.simInputsRij}>
            <View style={[stijlen.simInputBlok, { backgroundColor: kleuren.achtergrond, borderColor: kleuren.kaartRand }]}>
              <Text style={[stijlen.simInputLabel, { color: kleuren.tekstGedimpt }]}>Startgewicht (kg)</Text>
              <TextInput
                style={[stijlen.simGewichtInput, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand, color: kleuren.tekst }]}
                keyboardType="decimal-pad"
                value={String(simStartGewicht)}
                onChangeText={(t) => {
                  const n = parseFloat(t.replace(',', '.'));
                  if (!isNaN(n) && n > 0) setSimStartGewicht(n);
                  else if (t === '') setSimStartGewicht(0);
                }}
              />
            </View>

            <View style={[stijlen.simInputBlok, { backgroundColor: kleuren.achtergrond, borderColor: kleuren.kaartRand }]}>
              <View style={stijlen.simLabelMetReset}>
                <Text style={[stijlen.simInputLabel, { color: kleuren.tekstGedimpt }]}>Slaglengte s (m)</Text>
                {Math.abs(simSlaglengte - getStandaardSlaglengte(simOefening.id)) > 0.001 && (
                  <TouchableOpacity
                    onPress={() => {
                      const standaardRom = getStandaardSlaglengte(simOefening.id);
                      setSimSlaglengte(standaardRom);
                      setSimSlaglengteTekst(standaardRom.toFixed(2));
                    }}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text style={{ fontSize: 10, fontFamily: 'Inter_600SemiBold', color: kleuren.accent }}>Reset</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={[stijlen.simGewichtInput, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand, color: kleuren.tekst }]}
                keyboardType="decimal-pad"
                value={simSlaglengteTekst}
                placeholder={getStandaardSlaglengte(simOefening.id).toFixed(2)}
                placeholderTextColor={kleuren.tekstGedimpt}
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
            </View>
          </View>

          {/* Overzichtstabel */}
          <View style={stijlen.simTabelContainer}>
            {/* Header */}
            <View style={[stijlen.simTabelRij, stijlen.simTabelHeader, { borderBottomColor: kleuren.kaartRand }]}>
              <Text style={[stijlen.simTabelCel, stijlen.simTabelCelBreed, { color: kleuren.tekstGedimpt, fontFamily: 'Inter_700Bold' }]}>Scenario</Text>
              <Text style={[stijlen.simTabelCel, { color: kleuren.tekstGedimpt, fontFamily: 'Inter_700Bold' }]}>Start → Eind</Text>
              <Text style={[stijlen.simTabelCel, { color: kleuren.tekstGedimpt, fontFamily: 'Inter_700Bold' }]}>1RM %</Text>
              <Text style={[stijlen.simTabelCel, { color: kleuren.tekstGedimpt, fontFamily: 'Inter_700Bold' }]}>Vol (kg)</Text>
              <Text style={[stijlen.simTabelCel, { color: kleuren.tekstGedimpt, fontFamily: 'Inter_700Bold' }]}>Arbeid (J)</Text>
            </View>

            {/* Scenario rijen */}
            {simulaties.map(({ scenario, data }) => {
              const eerste = data[0];
              const laatste = data[data.length - 1];
              const groei1RM = eerste.geschatte1RM > 0
                ? ((laatste.geschatte1RM - eerste.geschatte1RM) / eerste.geschatte1RM * 100).toFixed(1)
                : '0.0';
              const totVol = data.reduce((s, d) => s + d.volume, 0);
              const totArb = data.reduce((s, d) => s + d.arbeid, 0);

              return (
                <View key={scenario} style={[stijlen.simTabelRij, { borderBottomColor: kleuren.kaartRand }]}>
                  <Text style={[stijlen.simTabelCel, stijlen.simTabelCelBreed, { color: kleuren.tekst }]}>{scenarioLabel(scenario)}</Text>
                  <Text style={[stijlen.simTabelCel, { color: kleuren.tekst }]}>{eerste.gewicht} → {laatste.gewicht}</Text>
                  <Text style={[stijlen.simTabelCel, { color: kleuren.accent }]}>+{groei1RM}%</Text>
                  <Text style={[stijlen.simTabelCel, { color: kleuren.tekst }]}>{totVol.toFixed(0)}</Text>
                  <Text style={[stijlen.simTabelCel, { color: kleuren.tekst }]}>{totArb.toFixed(0)}</Text>
                </View>
              );
            })}

            {/* Echte data rij */}
            {echteDataSamenvatting && (
              <View style={[stijlen.simTabelRij, { borderBottomColor: kleuren.kaartRand, backgroundColor: kleuren.accentGedimpt }]}>
                <Text style={[stijlen.simTabelCel, stijlen.simTabelCelBreed, { color: kleuren.accent, fontFamily: 'Inter_700Bold' }]}>Echte Data</Text>
                <Text style={[stijlen.simTabelCel, { color: kleuren.tekst }]}>{echteDataSamenvatting.startGewicht} → {echteDataSamenvatting.eindGewicht}</Text>
                <Text style={[stijlen.simTabelCel, { color: kleuren.accent }]}>{echteDataSamenvatting.groeiPct >= 0 ? '+' : ''}{echteDataSamenvatting.groeiPct.toFixed(1)}%</Text>
                <Text style={[stijlen.simTabelCel, { color: kleuren.tekst }]}>{echteDataSamenvatting.totVolume.toFixed(0)}</Text>
                <Text style={[stijlen.simTabelCel, { color: kleuren.tekst }]}>{echteDataSamenvatting.totArbeid.toFixed(0)}</Text>
              </View>
            )}
          </View>

          {/* Y-as Metriek Switcher + Multi-lijn Vergelijkingsgrafiek */}
          <View style={stijlen.metriekRij}>
            {([
              { id: 'eenRM', label: '1RM (kg)' },
              { id: 'volume', label: 'Volume (kg)' },
              { id: 'arbeid', label: 'Arbeid (J)' },
            ] as { id: GrafiekMetriek; label: string }[]).map(m => {
              const actief = grafiekMetriek === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    stijlen.metriekKnop,
                    {
                      backgroundColor: actief ? kleuren.accent : kleuren.achtergrond,
                      borderColor: actief ? kleuren.accent : kleuren.kaartRand,
                    },
                  ]}
                  onPress={() => setGrafiekMetriek(m.id)}
                >
                  <Text style={[stijlen.metriekTekst, { color: actief ? '#FFF' : kleuren.tekstGedimpt }]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <SimulatorVergelijkingsGrafiek
            metriek={grafiekMetriek}
            simulaties={simulaties}
            echteReeks={echteAnalyse.reeks}
            kleuren={kleuren}
          />

          <Text style={[stijlen.simNota, { color: kleuren.tekstGedimpt }]}>
            Gebaseerd op berekenVoorschrift() (3×10 start, +2,5 kg) · W = m·g·s met s = {simSlaglengte.toFixed(2)} m (Coach 7 aanpasbaar).
          </Text>
        </View>

        <View style={[stijlen.lijn, { backgroundColor: kleuren.kaartRand }]} />

        {oefeningen.length > 0 && (
          <>
            <Text style={[stijlen.sectie, { color: kleuren.accent, marginTop: 12 }]}>Gelogde Oefeningen</Text>
            <View style={stijlen.badgeRij}>
              {oefeningen.map((o) => {
                const naam = findExercise(o)?.naam ?? o;
                return <Badge key={o} label={naam} kleur={kleuren.accent} achtergrond={kleuren.accentGedimpt} />;
              })}
            </View>
          </>
        )}

        <View style={[stijlen.lijn, { backgroundColor: kleuren.kaartRand }]} />

        {/* ─── Exporteren ──────────────────────────────────────────── */}
        <Text style={[stijlen.sectie, { color: kleuren.accent }]}>Onderzoeksdata Exporteren</Text>
        <TouchableOpacity
          style={[stijlen.exportKnop, { backgroundColor: kleuren.accent }]}
          onPress={handleExportVolleOnderzoeksCSV}
          accessibilityLabel="Volledige onderzoeksdata exporteren als CSV"
        >
          <Ionicons name="cloud-download-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={stijlen.exportTekst}>Exporteer Volledige Onderzoeksdata (CSV)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[stijlen.exportKnop, { backgroundColor: '#6366F1' }]}
          onPress={handleExportMetSimulatie}
          accessibilityLabel="Data met simulatie exporteren als CSV"
        >
          <Ionicons name="analytics-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={stijlen.exportTekst}>Exporteer Data + Simulatie (CSV)</Text>
        </TouchableOpacity>

        <View style={[stijlen.lijn, { backgroundColor: kleuren.kaartRand, marginTop: 10 }]} />

        {/* ─── Weergave & Account ──────────────────────────────────── */}
        <Text style={[stijlen.sectie, { color: kleuren.accent }]}>Weergave & Account</Text>
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
                  <Text style={[stijlen.rustPresetTekst, { color: actief ? '#FFF' : kleuren.tekst }]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={[stijlen.uitlogKnop, { borderColor: kleuren.fout + '55', backgroundColor: kleuren.fout + '15' }]}
          onPress={uitloggen}
        >
          <Ionicons name="log-out-outline" size={18} color={kleuren.fout} style={{ marginRight: 8 }} />
          <Text style={[stijlen.uitlogTekst, { color: kleuren.fout }]}>Uitloggen</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const stijlen = StyleSheet.create({
  veilig: { flex: 1 }, scroll: { flex: 1 }, inhoud: { padding: 20 },
  headerRij: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  terugKnop: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  adminBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  adminBadgeTekst: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.8 },
  titel: { fontSize: 24, fontWeight: '900', fontFamily: 'Inter_900Black', letterSpacing: -0.5, marginBottom: 2 },
  subtitel: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 16 },
  lijn: { height: 1, marginBottom: 20, marginTop: 4 },
  sectie: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'Inter_700Bold', marginBottom: 10 },
  kaart: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 16 },
  kaartUitleg: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18, marginBottom: 12 },
  deelnemerRij: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  deelnemerNaam: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  deelnemerMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  rustKnoppenRij: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rustPresetKnop: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 },
  rustPresetTekst: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  profielKaart: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  profielRij: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  profielLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  profielWaarde: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  statRij: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  badgeRij: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  exportKnop: { flexDirection: 'row', borderRadius: 12, paddingVertical: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  exportTekst: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  uitlogKnop: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, paddingVertical: 14, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  uitlogTekst: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  geenData: { padding: 24, borderRadius: 14, alignItems: 'center', borderWidth: 1, marginBottom: 16 },
  // Simulator styles
  simInputsRij: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  simInputBlok: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 10, gap: 6 },
  simLabelMetReset: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  simInputLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  simGewichtInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 15, fontFamily: 'Inter_700Bold', textAlign: 'center', width: '100%' },
  simTabelContainer: { borderRadius: 8, overflow: 'hidden', marginTop: 4 },
  simTabelRij: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 4, borderBottomWidth: 1 },
  simTabelHeader: { paddingBottom: 8 },
  simTabelCel: { flex: 1, fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  simTabelCelBreed: { flex: 1.4, textAlign: 'left' },
  simNota: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 10, textAlign: 'center' },
  metriekRij: { flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 4 },
  metriekKnop: { flex: 1, paddingVertical: 7, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  metriekTekst: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  grafiekLegenda: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  legendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendaLijn: { width: 16, height: 2, borderRadius: 1 },
  legendaTekst: { fontSize: 11, fontFamily: 'Inter_400Regular' },
});
