// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Skeleton Loader Component
// Pulserend laad-placeholder met react-native-reanimated shimmer-animatie.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useThema } from '../context/ThemeContext';
import { RADIUS } from '../theme/designTokens';

interface SkeletonBlokkProps {
  breedte?: number | `${number}%`;
  hoogte: number;
  radius?: number;
  stijl?: ViewStyle;
}

/** Eén skeleton-blok met puls-animatie */
export function SkeletonBlok({
  breedte = '100%',
  hoogte,
  radius = 8,
  stijl,
}: SkeletonBlokkProps) {
  const { kleuren } = useThema();
  const opaciteit = useSharedValue(0.45);

  useEffect(() => {
    opaciteit.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 750, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.45, { duration: 750, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [opaciteit]);

  const animStijl = useAnimatedStyle(() => ({
    opacity: opaciteit.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: breedte as ViewStyle['width'],
          height: hoogte,
          borderRadius: radius,
          backgroundColor: kleuren.isDark ? '#27272A' : '#E4E4E7',
        },
        animStijl,
        stijl,
      ]}
    />
  );
}

/** Skeleton voor een statistiekenkaart */
export function SkeletonStatKaart({ stijl }: { stijl?: ViewStyle }) {
  const { kleuren } = useThema();
  return (
    <View
      style={[
        {
          backgroundColor: kleuren.kaart,
          borderRadius: RADIUS.lg,
          padding: 16,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: kleuren.kaartRand,
        },
        stijl,
      ]}
    >
      <SkeletonBlok hoogte={26} breedte={56} radius={6} stijl={{ marginBottom: 8 }} />
      <SkeletonBlok hoogte={12} breedte={48} radius={4} />
    </View>
  );
}

/** Skeleton voor de advieskaart */
export function SkeletonAdviesKaart() {
  const { kleuren } = useThema();
  return (
    <View style={[stijlen.adviesKaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
      <SkeletonBlok hoogte={11} breedte="40%" radius={4} stijl={{ marginBottom: 10 }} />
      <SkeletonBlok hoogte={22} breedte="80%" radius={6} stijl={{ marginBottom: 6 }} />
      <SkeletonBlok hoogte={14} breedte="60%" radius={4} stijl={{ marginBottom: 14 }} />
      <View style={[stijlen.scheidslijn, { backgroundColor: kleuren.kaartRand }]} />
      <SkeletonBlok hoogte={12} breedte="70%" radius={4} stijl={{ marginTop: 10 }} />
    </View>
  );
}

const stijlen = StyleSheet.create({
  adviesKaart: {
    borderRadius: RADIUS.lg,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  scheidslijn: {
    height: 1,
  },
});
