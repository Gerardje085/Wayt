import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { SkeletonBlok } from './SkeletonLoader';
import { useThema } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useVoortgang } from '../hooks/useWorkouts';
import type { Workout } from '../types';
import { groepeerSessies } from '../utils/sessies';
import { formatDatumKort } from '../utils/datum';

const { width: SCHERM_BREEDTE } = Dimensions.get('window');
const GRAFIEK_BREEDTE = SCHERM_BREEDTE - 40;

export type GrafiekModus = 'volume' | 'arbeid' | 'eenRM';

interface ProgressChartProps {
  workouts?:   Workout[];
  laden?:      boolean;
  oefeningId?: string;
  kleuren?:    any;
  modus?:      GrafiekModus;
}

const MODUS_CONFIG: Record<GrafiekModus, { label: string; suffix: string; noot: string }> = {
  volume: { label: 'Totaal volume per training', suffix: ' kg', noot: 'Volume = reps × gewicht, opgeteld over alle sets' },
  arbeid: { label: 'Totale arbeid per training', suffix: ' J', noot: 'Arbeid = gewicht × 9,81 × slaglengte × reps, opgeteld' },
  eenRM:  { label: 'Beste geschatte 1RM per training', suffix: ' kg', noot: 'Epley-formule: gewicht × (1 + reps / 30), warm-ups niet meegeteld' },
};

export default function ProgressChart({ workouts: workoutsProp, laden: ladenProp, oefeningId, kleuren: kleurenProp, modus = 'volume' }: ProgressChartProps) {
  const { kleuren: themaKleuren } = useThema();
  const kleuren = kleurenProp ?? themaKleuren;
  const { user }  = useAuth();
  const { haalVoortgangOp, workouts: geladen, laden: ladenGeladen } = useVoortgang(user?.id);

  useEffect(() => {
    if (oefeningId) haalVoortgangOp(oefeningId);
  }, [oefeningId]);

  const workouts = workoutsProp ?? geladen;
  const laden    = ladenProp ?? (oefeningId ? ladenGeladen : false);
  const sessies  = React.useMemo(() => groepeerSessies(workouts ?? []), [workouts]);

  const opaciteit = useSharedValue(0);

  useEffect(() => {
    if (!laden && sessies.length >= 2) {
      opaciteit.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) });
    } else {
      opaciteit.value = 0;
    }
  }, [laden, sessies.length, opaciteit]);

  const animStijl = useAnimatedStyle(() => ({ opacity: opaciteit.value }));

  if (laden) {
    return (
      <View style={[stijlen.skeletonContainer, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
        <SkeletonBlok hoogte={14} breedte="60%" radius={4} stijl={{ marginBottom: 12 }} />
        <SkeletonBlok hoogte={200} breedte="100%" radius={12} />
      </View>
    );
  }

  if (sessies.length < 2) {
    return (
      <View style={[stijlen.geenData, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
        <Ionicons name="bar-chart-outline" size={40} color={kleuren.tekstGedimpt} style={{ marginBottom: 12 }} />
        <Text style={[stijlen.geenDataTitel, { color: kleuren.tekstGedimpt }]}>Grafiek nog niet beschikbaar</Text>
        <Text style={[stijlen.geenDataTekst, { color: kleuren.tekstGedimpt }]}>
          Log minimaal 2 sessies om je voortgang te zien.
        </Text>
      </View>
    );
  }

  const labels = sessies.map(sessie => formatDatumKort(sessie.datum));

  const dataPunten = sessies.map(sessie => {
    if (modus === 'volume') return Math.round(sessie.volume);
    if (modus === 'arbeid') return Math.round(sessie.joules);
    return sessie.beste1RM;
  });

  const modusInfo = MODUS_CONFIG[modus];

  const grafiekData = {
    labels,
    datasets: [{ data: dataPunten, color: (op = 1) => `rgba(167, 139, 250, ${op})`, strokeWidth: 2.5 }],
  };

  const grafiekConfig = {
    backgroundColor:       kleuren.achtergrond,
    backgroundGradientFrom: kleuren.achtergrondSecundair,
    backgroundGradientTo:  kleuren.achtergrond,
    decimalPlaces:         0,
    color:  (op = 1) => `rgba(124, 58, 237, ${op})`,
    labelColor: (op = 1) => `rgba(${kleuren.isDark ? '192, 192, 224' : '90, 33, 182'}, ${op})`,
    style:  { borderRadius: 16 },
    propsForDots: { r: '5', strokeWidth: '2', stroke: '#EC4899' },
    propsForBackgroundLines: { stroke: kleuren.kaartRand, strokeDasharray: '4' },
  };

  return (
    <Animated.View style={animStijl}>
      <Text style={[stijlen.grafiekTitel, { color: kleuren.tekstSecundair }]}>
        {modusInfo.label}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <LineChart
          data={grafiekData}
          width={Math.max(GRAFIEK_BREEDTE, sessies.length * 64)}
          height={220}
          chartConfig={grafiekConfig}
          bezier
          style={stijlen.grafiek}
          yAxisSuffix={modusInfo.suffix}
          fromZero={false}
          withInnerLines
          withOuterLines={false}
        />
      </ScrollView>
      <Text style={[stijlen.nota, { color: kleuren.tekstGedimpt }]}>
        {modusInfo.noot}
      </Text>
    </Animated.View>
  );
}

const stijlen = StyleSheet.create({
  skeletonContainer: { borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1 },
  geenData: {
    alignItems: 'center', padding: 32, borderRadius: 16,
    borderWidth: 1, borderStyle: 'dashed', marginBottom: 16,
  },
  geenDataTitel:  { fontSize: 16, fontWeight: '600', fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  geenDataTekst:  { fontSize: 13, textAlign: 'center', fontFamily: 'Inter_400Regular', lineHeight: 18 },
  grafiekTitel:   { fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold', marginBottom: 12 },
  grafiek:        { borderRadius: 16, paddingRight: 0 },
  nota:           { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 8, fontStyle: 'italic' },
});
