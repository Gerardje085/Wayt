import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, type LayoutChangeEvent } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { SkeletonBlok } from './SkeletonLoader';
import { EmptyState } from './ui/EmptyState';
import { useThema } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useVoortgang } from '../hooks/useWorkouts';
import { groepeerNaarSessies } from '../utils/sessieGroepering';
import { RADIUS } from '../theme/designTokens';
import type { Workout } from '../types';

export type GrafiekModus = 'volume' | 'arbeid' | 'eenRM';

interface ProgressChartProps {
  workouts?: Workout[];
  laden?: boolean;
  oefeningId?: string;
  kleuren?: any;
  modus?: GrafiekModus;
}

const MODUS_CONFIG: Record<GrafiekModus, { label: string; suffix: string; noot: string }> = {
  volume: { label: 'Volume (kg) per sessie', suffix: ' kg', noot: '* Volume = sets × reps × gewicht' },
  arbeid: { label: 'Arbeid (Joules) per sessie', suffix: ' J', noot: '* Arbeid = gewicht × 9,81 × slaglengte × reps' },
  eenRM: { label: 'Geschat 1RM per sessie', suffix: ' kg', noot: '* Epley-formule: gewicht × (1 + reps / 30)' },
};

export default function ProgressChart({
  workouts: workoutsProp,
  laden: ladenProp,
  oefeningId,
  kleuren: kleurenProp,
  modus = 'volume',
}: ProgressChartProps) {
  const { kleuren: themaKleuren } = useThema();
  const kleuren = kleurenProp ?? themaKleuren;
  const { user } = useAuth();
  const { haalVoortgangOp, workouts: geladen, laden: ladenGeladen } = useVoortgang(user?.id);
  const [containerBreedte, setContainerBreedte] = useState(320);

  useEffect(() => {
    if (oefeningId) haalVoortgangOp(oefeningId);
  }, [oefeningId]);

  const workouts = workoutsProp ?? geladen;
  const sessies = React.useMemo(() => groepeerNaarSessies(workouts), [workouts]);
  const laden = ladenProp ?? (oefeningId ? ladenGeladen : false);

  const opaciteit = useSharedValue(0);

  useEffect(() => {
    if (!laden && sessies.length >= 2) {
      opaciteit.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) });
    } else {
      opaciteit.value = 0;
    }
  }, [laden, sessies.length, opaciteit]);

  const animStijl = useAnimatedStyle(() => ({ opacity: opaciteit.value }));

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = Math.floor(e.nativeEvent.layout.width);
    if (w > 120) setContainerBreedte(w);
  };

  if (laden) {
    return (
      <View
        onLayout={handleLayout}
        style={[stijlen.skeletonContainer, { backgroundColor: kleuren.achtergrondSecundair, borderColor: kleuren.kaartRand }]}
      >
        <SkeletonBlok hoogte={14} breedte="55%" radius={4} stijl={{ marginBottom: 12 }} />
        <SkeletonBlok hoogte={200} breedte="100%" radius={12} />
      </View>
    );
  }

  if (!sessies || sessies.length < 2) {
    return (
      <View onLayout={handleLayout}>
        <EmptyState
          icoon="bar-chart-outline"
          titel="Grafiek nog niet beschikbaar"
          subtekst="Log minimaal 2 sessies voor deze oefening om je voortgangslijn te zien."
          compact
        />
      </View>
    );
  }

  const labels = sessies.map(s =>
    new Date(s.datum).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' })
  );

  const dataPunten = sessies.map(s => {
    if (modus === 'volume') return s.totaalVolume;
    if (modus === 'arbeid') return s.totaalArbeid;
    return s.beste1RM;
  });

  const modusInfo = MODUS_CONFIG[modus];

  const grafiekData = {
    labels,
    datasets: [{ data: dataPunten, color: (op = 1) => `rgba(59, 130, 246, ${op})`, strokeWidth: 2.5 }],
  };

  const grafiekConfig = {
    backgroundColor: kleuren.kaart,
    backgroundGradientFrom: kleuren.achtergrondSecundair,
    backgroundGradientTo: kleuren.kaart,
    decimalPlaces: 0,
    color: (op = 1) => `rgba(37, 99, 235, ${op})`,
    labelColor: (op = 1) => `rgba(${kleuren.isDark ? '161, 161, 170' : '82, 82, 91'}, ${op})`,
    style: { borderRadius: RADIUS.md },
    propsForDots: { r: '4.5', strokeWidth: '2', stroke: kleuren.accentLicht, fill: kleuren.kaart },
    propsForBackgroundLines: { stroke: kleuren.kaartRand, strokeDasharray: '4' },
  };

  const grafiekBreedte = Math.max(containerBreedte, sessies.length * 76);

  return (
    <Animated.View style={animStijl} onLayout={handleLayout}>
      <Text style={[stijlen.grafiekTitel, { color: kleuren.tekstSecundair }]}>
        {modusInfo.label}
      </Text>
      <View style={[stijlen.grafiekWrap, { borderColor: kleuren.kaartRand }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={grafiekData}
            width={grafiekBreedte}
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
      </View>
      <Text style={[stijlen.nota, { color: kleuren.tekstGedimpt }]}>
        {modusInfo.noot}
      </Text>
    </Animated.View>
  );
}

const stijlen = StyleSheet.create({
  skeletonContainer: {
    borderRadius: RADIUS.md,
    padding: 16,
    borderWidth: 1,
  },
  grafiekTitel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 10,
  },
  grafiekWrap: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  grafiek: {
    borderRadius: RADIUS.md,
    paddingRight: 0,
  },
  nota: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
