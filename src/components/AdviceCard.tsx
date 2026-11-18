// ─────────────────────────────────────────────────────────────────────────────
// Wayt – AdviceCard (TypeScript + Skeleton Loader + Animatie)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { getStatusLabel } from '../utils/algorithm';
import { SkeletonAdviesKaart } from './SkeletonLoader';
import { useAuth } from '../context/AuthContext';
import { RADIUS } from '../theme/designTokens';
import type { Voorschrift, Workout } from '../types';

interface AdviceCardProps {
  voorschrift: Voorschrift | null;
  vorigeSessie: Workout | null;
  laden: boolean;
}

export default function AdviceCard({ voorschrift, vorigeSessie, laden }: AdviceCardProps) {
  const { profile } = useAuth();

  const vertaalY = useSharedValue(16);
  const opaciteit = useSharedValue(0);

  useEffect(() => {
    if (!laden && voorschrift && profile?.group_type === 'app') {
      vertaalY.value = withSpring(0, { damping: 18, stiffness: 200 });
      opaciteit.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) });
    } else {
      vertaalY.value = 16;
      opaciteit.value = 0;
    }
  }, [laden, voorschrift, profile?.group_type, vertaalY, opaciteit]);

  const animStijl = useAnimatedStyle(() => ({
    transform: [{ translateY: vertaalY.value }],
    opacity: opaciteit.value,
  }));

  if (profile?.group_type !== 'app') return null;
  if (laden) return <SkeletonAdviesKaart />;
  if (!voorschrift) return null;

  const statusKleuren: Record<string, [string, string]> = {
    progressie: ['#065F46', '#047857'],
    houden: ['#1E3A8A', '#1D4ED8'],
    deload: ['#9A3412', '#7C2D12'],
    nieuw: ['#1E40AF', '#2563EB'],
  };
  const gradientKleuren = statusKleuren[voorschrift.status] ?? statusKleuren.nieuw;

  return (
    <Animated.View style={animStijl}>
      <LinearGradient
        colors={gradientKleuren}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={stijlen.kaart}
      >
        <Text style={stijlen.kopLabel}>JOUW DOEL VOOR VANDAAG</Text>

        <Text style={stijlen.doelTekst}>
          {voorschrift.sets} sets van{' '}
          <Text style={stijlen.accentTekst}>{voorschrift.reps} herhalingen</Text>{' '}
          met{' '}
          <Text style={stijlen.accentTekst}>{voorschrift.weight} kg</Text>
        </Text>

        <Text style={stijlen.statusTekst}>{getStatusLabel(voorschrift.status)}</Text>

        {vorigeSessie && (
          <View style={stijlen.vorigeRij}>
            <Text style={stijlen.vorigeTekst}>
              Vorige sessie:{' '}
              <Text style={stijlen.vorigeWaarde}>
                {vorigeSessie.sets}×{vorigeSessie.reps} @ {vorigeSessie.weight} kg
              </Text>
              {'  '}
              ({new Date(vorigeSessie.date).toLocaleDateString('nl-NL')})
            </Text>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

const stijlen = StyleSheet.create({
  kaart: {
    borderRadius: RADIUS.lg,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  kopLabel: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.72)',
    fontFamily: 'Inter_700Bold',
    marginBottom: 10,
  },
  doelTekst: {
    fontSize: 20,
    color: '#FFFFFF',
    lineHeight: 28,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  accentTekst: {
    color: '#BFDBFE',
    fontFamily: 'Inter_900Black',
  },
  statusTekst: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
    fontFamily: 'Inter_400Regular',
    marginBottom: 12,
  },
  vorigeRij: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.16)',
    paddingTop: 10,
    marginTop: 4,
  },
  vorigeTekst: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.68)',
    fontFamily: 'Inter_400Regular',
  },
  vorigeWaarde: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
});
