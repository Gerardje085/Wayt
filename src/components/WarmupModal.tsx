import React, { useEffect, useState, useCallback } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Pressable,
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

interface WarmupSet {
  percentage: number;
  reps: number;
  gewicht: number;
}

interface WarmupModalProps {
  zichtbaar: boolean;
  onSluiten: () => void;
  werkGewicht: number;
  oefeningNaam: string;
}

export default function WarmupModal({ zichtbaar, onSluiten, werkGewicht, oefeningNaam }: WarmupModalProps) {
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

  const warmupSets: WarmupSet[] = [
    { percentage: 50, reps: 10, gewicht: Math.round(werkGewicht * 0.5 * 2) / 2 },
    { percentage: 70, reps: 5, gewicht: Math.round(werkGewicht * 0.7 * 2) / 2 },
    { percentage: 85, reps: 2, gewicht: Math.round(werkGewicht * 0.85 * 2) / 2 },
  ];

  return (
    <Modal visible={isActief} transparent animationType="none" onRequestClose={sluitModal}>
      <Animated.View style={[s.overlay, overlayAnimStijl]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={sluitModal} />
        <Animated.View
          style={[s.kaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }, sheetAnimStijl]}
        >
          <View style={s.header}>
            <View style={[s.icoon, { backgroundColor: kleuren.warmup + '22' }]}>
              <Ionicons name="flame-outline" size={20} color={kleuren.warmup} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.titel, { color: kleuren.tekst }]}>Opwarmschema</Text>
              <Text style={[s.subtitel, { color: kleuren.tekstGedimpt }]}>{oefeningNaam}</Text>
            </View>
            <TouchableOpacity onPress={sluitModal}>
              <Ionicons name="close" size={22} color={kleuren.tekstGedimpt} />
            </TouchableOpacity>
          </View>

          <View style={[s.werkGewichtRij, { backgroundColor: kleuren.accentGedimpt, borderColor: kleuren.accent + '44' }]}>
            <Text style={[s.werkGewichtLabel, { color: kleuren.tekstGedimpt }]}>Werkgewicht</Text>
            <Text style={[s.werkGewichtWaarde, { color: kleuren.accentTekst }]}>{werkGewicht} kg</Text>
          </View>

          <Text style={[s.sectionLabel, { color: kleuren.tekstGedimpt }]}>OPWARMSETS</Text>

          {warmupSets.map((set, i) => (
            <View
              key={i}
              style={[s.setRij, { backgroundColor: kleuren.achtergrond, borderColor: kleuren.kaartRand }]}
            >
              <View style={[s.setNummer, { backgroundColor: kleuren.warmup + '22' }]}>
                <Text style={[s.setNummerTekst, { color: kleuren.warmup }]}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.setGewicht, { color: kleuren.tekst }]}>{set.gewicht} kg</Text>
                <Text style={[s.setReps, { color: kleuren.tekstGedimpt }]}>{set.reps} herhalingen</Text>
              </View>
              <View style={[s.percentageBadge, { backgroundColor: kleuren.warmup + '22' }]}>
                <Text style={[s.percentageTekst, { color: kleuren.warmup }]}>{set.percentage}%</Text>
              </View>
            </View>
          ))}

          <Text style={[s.nota, { color: kleuren.tekstGedimpt }]}>
            Gewichten afgerond op 0,5 kg nauwkeurigheid.
          </Text>

          <TouchableOpacity
            style={[s.sluitenKnop, { backgroundColor: kleuren.kaartRand }]}
            onPress={sluitModal}
          >
            <Text style={[s.sluitenTekst, { color: kleuren.tekstSecundair }]}>Begrepen</Text>
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
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  icoon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titel: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  subtitel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  werkGewichtRij: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  werkGewichtLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  werkGewichtWaarde: {
    fontSize: 22,
    fontFamily: 'Inter_900Black',
    letterSpacing: -0.5,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  setRij: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  setNummer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setNummerTekst: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  setGewicht: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  setReps: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  percentageBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  percentageTekst: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  nota: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  sluitenKnop: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sluitenTekst: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
