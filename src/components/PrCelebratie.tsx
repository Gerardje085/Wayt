import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThema } from '../context/ThemeContext';

interface PrCelebratieProps {
  zichtbaar: boolean;
  oefeningNaam: string;
  eenRM: number;
  onSluiten: () => void;
}

export default function PrCelebratie({ zichtbaar, oefeningNaam, eenRM, onSluiten }: PrCelebratieProps) {
  const { kleuren } = useThema();
  const [isActief, setIsActief] = useState(false);

  const overlayOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(400);

  useEffect(() => {
    if (zichtbaar) {
      setIsActief(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      overlayOpacity.value = withTiming(1, { duration: 200 });
      cardTranslateY.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) });
    }
  }, [zichtbaar]);

  const sluitModal = useCallback(() => {
    overlayOpacity.value = withTiming(0, { duration: 180 });
    cardTranslateY.value = withTiming(400, { duration: 220, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) {
        runOnJS(setIsActief)(false);
        runOnJS(onSluiten)();
      }
    });
  }, [onSluiten]);

  const overlayAnimStijl = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const cardAnimStijl = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslateY.value }],
  }));

  if (!isActief) return null;

  return (
    <Modal visible={isActief} transparent animationType="none" onRequestClose={sluitModal}>
      <Animated.View style={[s.overlay, overlayAnimStijl]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={sluitModal} />

        <Animated.View
          style={[s.kaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }, cardAnimStijl]}
        >
          <View style={[s.icoonRing, { backgroundColor: kleuren.waarschuwing + '22' }]}>
            <Ionicons name="trophy" size={36} color={kleuren.waarschuwing} />
          </View>

          <Text style={[s.prTekst, { color: kleuren.waarschuwing }]}>PERSOONLIJK RECORD</Text>
          <Text style={[s.oefeningTekst, { color: kleuren.tekst }]}>{oefeningNaam}</Text>

          <View style={[s.waardeRij, { backgroundColor: kleuren.achtergrond, borderColor: kleuren.kaartRand }]}>
            <Text style={[s.waardeLabel, { color: kleuren.tekstGedimpt }]}>Nieuw geschat 1RM</Text>
            <Text style={[s.waardeGetal, { color: kleuren.waarschuwing }]}>{eenRM} kg</Text>
          </View>

          <Pressable style={[s.sluitenKnop, { backgroundColor: kleuren.accent }]} onPress={sluitModal}>
            <Text style={s.sluitenTekst}>Ga verder</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
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
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  icoonRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  prTekst: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  oefeningTekst: {
    fontSize: 18,
    fontFamily: 'Inter_900Black',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 16,
  },
  waardeRij: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  waardeLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginBottom: 2,
  },
  waardeGetal: {
    fontSize: 28,
    fontFamily: 'Inter_900Black',
    letterSpacing: -0.5,
  },
  sluitenKnop: {
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 32,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  sluitenTekst: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
});
