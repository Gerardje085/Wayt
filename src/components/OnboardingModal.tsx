import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useThema } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { BottomSheet } from './ui/BottomSheet';
import { PrimaryButton } from './ui/PrimaryButton';
import { RADIUS } from '../theme/designTokens';

const STORAGE_KEY = '@wayt_onboarding_done';

export default function OnboardingModal() {
  const { kleuren } = useThema();
  const { profile } = useAuth();
  const [isActief, setIsActief] = useState(false);

  useEffect(() => {
    if (!profile || profile.role === 'admin') return;
    AsyncStorage.getItem(STORAGE_KEY).then(waarde => {
      if (!waarde) {
        setIsActief(true);
      }
    });
  }, [profile]);

  const sluiten = useCallback(async () => {
    setIsActief(false);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Negeer opslagfout
    }
  }, []);

  if (!isActief || !profile || profile.role === 'admin') return null;

  const isGroepA = profile.group_type === 'app';

  const inhoud = isGroepA
    ? {
        icoon: 'analytics-outline' as const,
        kleur: kleuren.accent,
        titel: 'Welkom bij de Algoritme-groep!',
        tekst:
          'Jij traint met behulp van een progressief overbelastingsalgoritme. Voor elke set krijg je een concreet advies voor gewicht en herhalingen op basis van je vorige sessie.\n\nHet is belangrijk dat je dit advies zo nauwkeurig mogelijk opvolgt — zo leveren jouw trainingsdata de meest betrouwbare onderzoeksresultaten op.',
        badge: 'Groep A · Algoritme',
      }
    : {
        icoon: 'body-outline' as const,
        kleur: '#EC4899',
        titel: 'Welkom bij de Gevoel-groep!',
        tekst:
          'Jij traint op eigen gevoel. De app dient als digitaal logboek: je bepaalt zelf hoeveel gewicht je gebruikt en hoeveel herhalingen je doet.\n\nVertrouw op je gevoel en log elke set zo eerlijk mogelijk. Zo zijn jouw gegevens waardevol voor het onderzoek.',
        badge: 'Groep B · Gevoel',
      };

  return (
    <BottomSheet
      visible={isActief}
      onClose={sluiten}
      maxWidth={480}
    >
      <View style={s.container}>
        <View style={[s.icoonRing, { backgroundColor: inhoud.kleur + '1F', borderColor: inhoud.kleur + '44' }]}>
          <Ionicons name={inhoud.icoon} size={38} color={inhoud.kleur} />
        </View>

        <View style={[s.badge, { backgroundColor: inhoud.kleur + '1F' }]}>
          <Text style={[s.badgeTekst, { color: inhoud.kleur }]}>{inhoud.badge}</Text>
        </View>

        <Text style={[s.titel, { color: kleuren.tekst }]}>{inhoud.titel}</Text>
        <Text style={[s.tekst, { color: kleuren.tekstSecundair }]}>{inhoud.tekst}</Text>

        <PrimaryButton
          titel="Begrepen — start met trainen!"
          onPress={sluiten}
          size="lg"
          volledigeBreedte
        />
      </View>
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 6,
  },
  icoonRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 14,
  },
  badgeTekst: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.4,
  },
  titel: {
    fontSize: 22,
    fontFamily: 'Inter_900Black',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 12,
  },
  tekst: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
});
