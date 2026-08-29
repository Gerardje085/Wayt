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
import { bereken1RM } from '../context/LiveWorkoutContext';
import type { Workout } from '../types';

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
  volume: { label: 'Volume (kg) per Sessie', suffix: ' kg', noot: '* Volume = sets x reps x gewicht' },
  arbeid: { label: 'Arbeid (Joules) per Sessie', suffix: ' J', noot: '* Arbeid = gewicht x 9,81 x slaglengte x reps' },
  eenRM:  { label: 'Geschat 1RM per Sessie', suffix: ' kg', noot: '* Epley-formule: gewicht x (1 + reps / 30)' },
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

  const opaciteit = useSharedValue(0);

  useEffect(() => {
    if (!laden && workouts.length >= 2) {
      opaciteit.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) });
    } else {
      opaciteit.value = 0;
    }
  }, [laden, workouts.length, opaciteit]);

  const animStijl = useAnimatedStyle(() => ({ opacity: opaciteit.value }));

  if (laden) {
    return (
      <View style={[stijlen.skeletonContainer, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
        <SkeletonBlok hoogte={14} breedte="60%" radius={4} stijl={{ marginBottom: 12 }} />
        <SkeletonBlok hoogte={200} breedte="100%" radius={12} />
      </View>
    );
  }

  if (!workouts || workouts.length < 2) {
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

  const labels = workouts.map(w =>
    new Date(w.date).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' })
  );

  const dataPunten = workouts.map(w => {
    if (modus === 'volume') return parseFloat(String(w.volume)) || 0;
    if (modus === 'arbeid') return parseFloat(String(w.work_joules)) || 0;
    return bereken1RM(Number(w.weight), Number(w.reps));
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
          width={Math.max(GRAFIEK_BREEDTE, workouts.length * 80)}
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
