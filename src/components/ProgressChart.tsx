// ─────────────────────────────────────────────────────────────────────────────
// Wayt – ProgressChart (TypeScript + Skeleton + Fade-in animatie)
// Updated to accept either workouts array or oefeningId + useVoortgang
// ─────────────────────────────────────────────────────────────────────────────
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

const { width: SCHERM_BREEDTE } = Dimensions.get('window');
const GRAFIEK_BREEDTE = SCHERM_BREEDTE - 40;

interface ProgressChartProps {
  workouts?:   Workout[];
  laden?:      boolean;
  oefeningId?: string;  // Alternatief: laad zelf de data op
  kleuren?:    any;
}

export default function ProgressChart({ workouts: workoutsProp, laden: ladenProp, oefeningId, kleuren: kleurenProp }: ProgressChartProps) {
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

  const labels   = workouts.map((w) =>
    new Date(w.date).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' })
  );
  const data     = workouts.map((w) => parseFloat(String(w.volume)) || 0);

  const grafiekData = {
    labels,
    datasets: [{ data, color: (op = 1) => `rgba(167, 139, 250, ${op})`, strokeWidth: 2.5 }],
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
        Volume (kg) per Sessie
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <LineChart
          data={grafiekData}
          width={Math.max(GRAFIEK_BREEDTE, workouts.length * 80)}
          height={220}
          chartConfig={grafiekConfig}
          bezier
          style={stijlen.grafiek}
          yAxisSuffix=" kg"
          fromZero={false}
          withInnerLines
          withOuterLines={false}
        />
      </ScrollView>
      <Text style={[stijlen.nota, { color: kleuren.tekstGedimpt }]}>
        * Volume (kg) = sets × reps × gewicht
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
  geenDataIcoon:  { fontSize: 40, marginBottom: 12 },
  geenDataTitel:  { fontSize: 16, fontWeight: '600', fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  geenDataTekst:  { fontSize: 13, textAlign: 'center', fontFamily: 'Inter_400Regular', lineHeight: 18 },
  grafiekTitel:   { fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold', marginBottom: 12 },
  grafiek:        { borderRadius: 16, paddingRight: 0 },
  nota:           { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 8, fontStyle: 'italic' },
});
