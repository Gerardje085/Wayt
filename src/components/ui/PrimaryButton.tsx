import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ActivityIndicator, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useThema } from '../../context/ThemeContext';

interface PrimaryButtonProps {
  titel: string;
  onPress: () => void;
  icoon?: keyof typeof Ionicons.glyphMap;
  bezig?: boolean;
  uitgeschakeld?: boolean;
}

export default function PrimaryButton({ titel, onPress, icoon, bezig, uitgeschakeld }: PrimaryButtonProps) {
  const { kleuren } = useThema();
  const schaal = useSharedValue(1);
  const actief = !bezig && !uitgeschakeld;

  const animStijl = useAnimatedStyle(() => ({
    transform: [{ scale: schaal.value }],
  }));

  return (
    <Animated.View style={animStijl}>
      <TouchableOpacity
        activeOpacity={0.9}
        disabled={!actief}
        onPressIn={() => {
          schaal.value = withSpring(0.97, { damping: 14, stiffness: 300 });
        }}
        onPressOut={() => {
          schaal.value = withSpring(1, { damping: 14, stiffness: 300 });
        }}
        onPress={onPress}
      >
        <LinearGradient
          colors={actief ? [kleuren.accent, kleuren.accentLicht] : [kleuren.kaartRand, kleuren.kaartRand]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[stijlen.knop, { shadowColor: kleuren.accent, shadowOpacity: actief ? 0.35 : 0 }]}
        >
          {bezig ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={stijlen.inhoud}>
              {icoon && <Ionicons name={icoon} size={18} color="#FFFFFF" style={{ marginRight: 8 }} />}
              <Text style={stijlen.tekst}>{titel}</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const stijlen = StyleSheet.create({
  knop: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 6,
  },
  inhoud: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tekst: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
});
