import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, Pressable, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThema } from '../context/ThemeContext';
import { PrimaryButton } from './ui/PrimaryButton';
import { RADIUS, SHADOWS } from '../theme/designTokens';

interface PrCelebratieProps {
  zichtbaar: boolean;
  oefeningNaam: string;
  eenRM: number;
  onSluiten: () => void;
}

export default function PrCelebratie({ zichtbaar, oefeningNaam, eenRM, onSluiten }: PrCelebratieProps) {
  const { kleuren } = useThema();

  useEffect(() => {
    if (zichtbaar && Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [zichtbaar]);

  useEffect(() => {
    if (!zichtbaar || Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') onSluiten();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zichtbaar, onSluiten]);

  if (!zichtbaar) return null;

  return (
    <Modal
      visible={zichtbaar}
      transparent
      animationType="fade"
      onRequestClose={onSluiten}
      statusBarTranslucent
    >
      <View style={s.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onSluiten} />

        <View
          style={[
            s.kaart,
            {
              backgroundColor: kleuren.kaart,
              borderColor: kleuren.waarschuwing + '55',
            },
            SHADOWS.forTheme(kleuren.isDark, 'lg'),
          ]}
        >
          <View style={[s.icoonRing, { backgroundColor: kleuren.waarschuwing + '22', borderColor: kleuren.waarschuwing + '44' }]}>
            <Ionicons name="trophy" size={34} color={kleuren.waarschuwing} />
          </View>

          <View style={[s.badge, { backgroundColor: kleuren.waarschuwing + '1F' }]}>
            <Text style={[s.prTekst, { color: kleuren.waarschuwing }]}>PERSOONLIJK RECORD</Text>
          </View>

          <Text style={[s.oefeningTekst, { color: kleuren.tekst }]}>{oefeningNaam}</Text>

          <View style={[s.waardeRij, { backgroundColor: kleuren.achtergrondSecundair, borderColor: kleuren.kaartRand }]}>
            <Text style={[s.waardeLabel, { color: kleuren.tekstSecundair }]}>Nieuw geschat 1RM</Text>
            <Text style={[s.waardeGetal, { color: kleuren.waarschuwing }]}>{eenRM} kg</Text>
          </View>

          <PrimaryButton
            titel="Ga verder"
            onPress={onSluiten}
            volledigeBreedte
          />
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  kaart: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: 26,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  icoonRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: 10,
  },
  prTekst: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.3,
  },
  oefeningTekst: {
    fontSize: 19,
    fontFamily: 'Inter_900Black',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 16,
  },
  waardeRij: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  waardeLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
  },
  waardeGetal: {
    fontSize: 32,
    fontFamily: 'Inter_900Black',
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },
});
