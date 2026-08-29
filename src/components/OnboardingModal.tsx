import React, { useEffect, useState, useCallback } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useThema } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = '@wayt_onboarding_done';

export default function OnboardingModal() {
  const { kleuren } = useThema();
  const { profile } = useAuth();
  const [isActief, setIsActief] = useState(false);

  const overlayOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(500);

  useEffect(() => {
    if (!profile) return;
    AsyncStorage.getItem(STORAGE_KEY).then(waarde => {
      if (!waarde) {
        setIsActief(true);
        overlayOpacity.value = withTiming(1, { duration: 200 });
        sheetTranslateY.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) });
      }
    });
  }, [profile]);

  const sluiten = useCallback(() => {
    overlayOpacity.value = withTiming(0, { duration: 180 });
    sheetTranslateY.value = withTiming(500, { duration: 220, easing: Easing.in(Easing.cubic) }, async (finished) => {
      if (finished) {
        await AsyncStorage.setItem(STORAGE_KEY, 'true');
        runOnJS(setIsActief)(false);
      }
    });
  }, []);

  const overlayAnimStijl = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const sheetAnimStijl = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  if (!isActief || !profile) return null;

  const isGroepA = profile.group_type === 'app';

  const inhoud = isGroepA
    ? {
        icoon: 'analytics-outline' as const,
        kleur: kleuren.accent,
        titel: 'Welkom bij de Algoritme-groep!',
        tekst:
          'Jij traint met behulp van een progressief overbelastingsalgoritme. Vor elke set krijg je een concreet advies voor gewicht en herhalingen op basis van je vorige sessie.\n\nHet is belangrijk dat je dit advies zo nauwkeurig mogelijk opvolgt - zo leveren jouw trainingsdata de meest betrouwbare onderzoeksresultaten op.',
        badge: 'Groep A - Algoritme',
      }
    : {
        icoon: 'body-outline' as const,
        kleur: '#F9A8D4',
        titel: 'Welkom bij de Gevoel-groep!',
        tekst:
          'Jij traint op eigen gevoel. De app dient als digitaal logboek: je bepaalt zelf hoeveel gewicht je gebruikt en hoeveel herhalingen je doet.\n\nVertrouw op je gevoel en log elke set zo eerlijk mogelijk. Zo zijn jouw gegevens waardevol voor het onderzoek.',
        badge: 'Groep B - Gevoel',
      };

  return (
    <Modal visible={isActief} transparent animationType="none" onRequestClose={sluiten}>
      <Animated.View style={[s.overlay, overlayAnimStijl]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={sluiten} />
        <Animated.View
          style={[s.kaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }, sheetAnimStijl]}
        >
          <View style={[s.icoonRing, { backgroundColor: inhoud.kleur + '22', borderColor: inhoud.kleur + '55' }]}>
            <Ionicons name={inhoud.icoon} size={40} color={inhoud.kleur} />
          </View>

          <View style={[s.badge, { backgroundColor: inhoud.kleur + '22' }]}>
            <Text style={[s.badgeTekst, { color: inhoud.kleur }]}>{inhoud.badge}</Text>
          </View>

          <Text style={[s.titel, { color: kleuren.tekst }]}>{inhoud.titel}</Text>
          <Text style={[s.tekst, { color: kleuren.tekstSecundair }]}>{inhoud.tekst}</Text>

          <TouchableOpacity
            style={[s.knop, { backgroundColor: inhoud.kleur }]}
            onPress={sluiten}
            activeOpacity={0.85}
          >
            <Text style={s.knopTekst}>Begrepen - start met trainen!</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 32,
  },
  kaart: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
  },
  icoonRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 16,
  },
  badgeTekst: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  titel: {
    fontSize: 22,
    fontFamily: 'Inter_900Black',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 14,
  },
  tekst: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: 28,
  },
  knop: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  knopTekst: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
});
