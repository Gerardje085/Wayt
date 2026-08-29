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
import { useThema } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import type { Voorschrift, Workout } from '../types';

interface AdviceCardProps {
  voorschrift:  Voorschrift | null;
  vorigeSessie: Workout | null;
  laden:        boolean;
}

export default function AdviceCard({ voorschrift, vorigeSessie, laden }: AdviceCardProps) {
  const { kleuren } = useThema();
  const { profile } = useAuth();

  // Intrede-animatie: slide-up + fade-in
  const vertaalY  = useSharedValue(20);
  const opaciteit = useSharedValue(0);

  useEffect(() => {
    if (!laden && voorschrift && profile?.group_type === 'app') {
      vertaalY.value  = withSpring(0,   { damping: 18, stiffness: 200 });
      opaciteit.value = withTiming(1,   { duration: 400, easing: Easing.out(Easing.quad) });
    } else {
      vertaalY.value  = 20;
      opaciteit.value = 0;
    }
  }, [laden, voorschrift, profile?.group_type, vertaalY, opaciteit]);

  const animStijl = useAnimatedStyle(() => ({
    transform:  [{ translateY: vertaalY.value }],
    opacity:    opaciteit.value,
  }));

  if (profile?.group_type !== 'app') return null;
  if (laden) return <SkeletonAdviesKaart />;
  if (!voorschrift) return null;

  const statusKleuren: Record<string, [string, string]> = {
    progressie: ['#065F46', '#064E3B'],
    houden:     ['#1E3A5F', '#1E3A8A'],
    deload:     ['#7C2D12', '#78350F'],
    nieuw:      ['#2D1B69', '#1E1B4B'],
  };
  const kleuren2 = statusKleuren[voorschrift.status] ?? statusKleuren.nieuw;

  return (
    <Animated.View style={animStijl}>
      <LinearGradient colors={kleuren2} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={stijlen.kaart}>
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
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  kopLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Inter_700Bold',
    marginBottom: 10,
  },
  doelTekst: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 28,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  accentTekst: {
    color: '#C4B5FD',
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  statusTekst: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Inter_400Regular',
    marginBottom: 12,
  },
  vorigeRij: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 10,
    marginTop: 4,
  },
  vorigeTekst: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'Inter_400Regular',
  },
  vorigeWaarde: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Inter_600SemiBold',
  },
});
