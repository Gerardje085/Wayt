// ─────────────────────────────────────────────────────────────────────────────
// Wayt – ExerciseGuideModal Component
// Modal sheet wrapping ExerciseGuideView with smooth bidirectional animations.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState, useCallback } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Pressable, ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useThema } from '../context/ThemeContext';
import ExerciseGuideView from './ExerciseGuideView';
import type { ExerciseDbItem } from '../services/exerciseDb';

interface ExerciseGuideModalProps {
  zichtbaar: boolean;
  onSluiten: () => void;
  oefeningId: string;
  oefeningNaam?: string;
  data?: ExerciseDbItem | null;
}

export default function ExerciseGuideModal({
  zichtbaar, onSluiten, oefeningId, oefeningNaam, data,
}: ExerciseGuideModalProps) {
  const { kleuren } = useThema();
  const [isActief, setIsActief] = useState(false);

  const overlayOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(500);

  useEffect(() => {
    if (zichtbaar) {
      setIsActief(true);
      overlayOpacity.value = withTiming(1, { duration: 200 });
      sheetTranslateY.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) });
    }
  }, [zichtbaar]);

  const sluitModal = useCallback(() => {
    overlayOpacity.value = withTiming(0, { duration: 180 });
    sheetTranslateY.value = withTiming(500, { duration: 220, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) {
        runOnJS(setIsActief)(false);
        runOnJS(onSluiten)();
      }
    });
  }, [onSluiten]);

  const overlayAnimStijl = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const sheetAnimStijl = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  if (!isActief) return null;

  return (
    <Modal visible={isActief} transparent animationType="none" onRequestClose={sluitModal}>
      <Animated.View style={[s.overlay, overlayAnimStijl]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={sluitModal} />
        <Animated.View
          style={[s.kaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }, sheetAnimStijl]}
        >
          <View style={s.header}>
            <View style={[s.icoonBox, { backgroundColor: kleuren.accent + '22' }]}>
              <Ionicons name="information-circle" size={20} color={kleuren.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.titel, { color: kleuren.tekst }]} numberOfLines={1}>
                {oefeningNaam || oefeningId}
              </Text>
              <Text style={[s.subtitel, { color: kleuren.tekstGedimpt }]}>Oefeninstructies & Beweging</Text>
            </View>
            <TouchableOpacity onPress={sluitModal} style={s.sluitKnop}>
              <Ionicons name="close" size={22} color={kleuren.tekstGedimpt} />
            </TouchableOpacity>
          </View>

          <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
            <ExerciseGuideView oefeningId={oefeningId} oefeningNaam={oefeningNaam} data={data} />

            <TouchableOpacity
              style={[s.begrepenKnop, { backgroundColor: kleuren.kaartRand }]}
              onPress={sluitModal}
            >
              <Text style={[s.begrepenTekst, { color: kleuren.tekstSecundair }]}>Sluiten</Text>
            </TouchableOpacity>
          </ScrollView>
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
    paddingBottom: 28,
  },
  kaart: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    maxHeight: '88%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  icoonBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titel: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  subtitel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  sluitKnop: {
    padding: 4,
  },
  scroll: {
    maxHeight: 520,
  },
  begrepenKnop: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  begrepenTekst: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
