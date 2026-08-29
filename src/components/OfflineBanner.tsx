// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Offline Banner Component
// Toont een gele banner als de app geen internetverbinding heeft.
// Verdwijnt automatisch zodra de verbinding hersteld is.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface OfflineBannerProps {
  offlineAantal?: number;
}

export default function OfflineBanner({ offlineAantal = 0 }: OfflineBannerProps) {
  const { isOnline, isControlled } = useNetworkStatus();
  const hoogte                     = useSharedValue(0);
  const opaciteit                  = useSharedValue(0);

  useEffect(() => {
    if (!isControlled) return;
    const zichtbaar = !isOnline;
    hoogte.value    = withTiming(zichtbaar ? 44 : 0, { duration: 300 });
    opaciteit.value = withTiming(zichtbaar ? 1 : 0, { duration: 300 });
  }, [isOnline, isControlled, hoogte, opaciteit]);

  const animStijl = useAnimatedStyle(() => ({
    height:  hoogte.value,
    opacity: opaciteit.value,
    overflow: 'hidden',
  }));

  return (
    <Animated.View style={[stijlen.banner, animStijl]}>
      <Ionicons name="cloud-offline-outline" size={16} color="#FEF3C7" />
      <Text style={stijlen.tekst}>
        Geen verbinding – training wordt lokaal opgeslagen
        {offlineAantal > 0 ? ` (${offlineAantal} wachtend)` : ''}
      </Text>
    </Animated.View>
  );
}

const stijlen = StyleSheet.create({
  banner: {
    backgroundColor: '#92400E',
    flexDirection:   'row',
    alignItems:      'center',
    paddingHorizontal: 16,
    gap:             8,
  },
  icoon: { fontSize: 14 },
  tekst: {
    flex:       1,
    fontSize:   12,
    color:      '#FEF3C7',
    fontFamily: 'Inter_600SemiBold',
  },
});
