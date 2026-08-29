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
import { formatTijd } from '../context/LiveWorkoutContext';

export interface WorkoutSamenvattingData {
  duurSeconden: number;
  voltooidesets: number;
  totaalVolume: number;
  totaalJoules: number;
  prs: { oefeningNaam: string; eenRM: number }[];
}

interface WorkoutSamenvattingProps {
  zichtbaar: boolean;
  data: WorkoutSamenvattingData;
  onOpslaan: () => void;
  onAnnuleren: () => void;
}

export default function WorkoutSamenvatting({ zichtbaar, data, onOpslaan, onAnnuleren }: WorkoutSamenvattingProps) {
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

  const sluitModal = useCallback((actie: 'opslaan' | 'annuleren') => {
    overlayOpacity.value = withTiming(0, { duration: 180 });
    sheetTranslateY.value = withTiming(500, { duration: 220, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) {
        runOnJS(setIsActief)(false);
        if (actie === 'opslaan') {
          runOnJS(onOpslaan)();
        } else {
          runOnJS(onAnnuleren)();
        }
      }
    });
  }, [onOpslaan, onAnnuleren]);

  const overlayAnimStijl = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const sheetAnimStijl = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  if (!isActief) return null;

  const stats = [
    { icoon: 'timer-outline', label: 'Duur', waarde: formatTijd(data.duurSeconden), kleur: kleuren.accent },
    { icoon: 'checkmark-circle-outline', label: 'Sets voltooid', waarde: String(data.voltooidesets), kleur: kleuren.succes },
    { icoon: 'trending-up-outline', label: 'Volume', waarde: `${data.totaalVolume.toFixed(0)} kg`, kleur: kleuren.tekstSecundair },
    { icoon: 'flash-outline', label: 'Arbeid', waarde: `${data.totaalJoules.toFixed(0)} J`, kleur: kleuren.waarschuwing },
  ];

  return (
    <Modal visible={isActief} transparent animationType="none" onRequestClose={() => sluitModal('annuleren')}>
      <Animated.View style={[s.overlay, overlayAnimStijl]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => sluitModal('annuleren')} />
        <Animated.View
          style={[s.kaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }, sheetAnimStijl]}
        >
          <View style={s.header}>
            <View style={[s.icoonRing, { backgroundColor: kleuren.succes + '22' }]}>
              <Ionicons name="barbell-outline" size={28} color={kleuren.succes} />
            </View>
            <Text style={[s.titel, { color: kleuren.tekst }]}>Workout afgerond!</Text>
            <Text style={[s.subtitel, { color: kleuren.tekstGedimpt }]}>Goed gedaan. Hier is je samenvatting.</Text>
          </View>

          <View style={s.statGrid}>
            {stats.map(stat => (
              <View
                key={stat.label}
                style={[s.statKaart, { backgroundColor: kleuren.achtergrond, borderColor: kleuren.kaartRand }]}
              >
                <Ionicons name={stat.icoon as any} size={20} color={stat.kleur} style={{ marginBottom: 6 }} />
                <Text style={[s.statWaarde, { color: stat.kleur }]}>{stat.waarde}</Text>
                <Text style={[s.statLabel, { color: kleuren.tekstGedimpt }]}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {data.prs.length > 0 && (
            <>
              <Text style={[s.sectionLabel, { color: kleuren.tekstGedimpt }]}>PERSOONLIJKE RECORDS</Text>
              {data.prs.map((pr, i) => (
                <View
                  key={i}
                  style={[s.prRij, { backgroundColor: kleuren.waarschuwing + '15', borderColor: kleuren.waarschuwing + '44' }]}
                >
                  <Ionicons name="trophy" size={16} color={kleuren.waarschuwing} />
                  <Text style={[s.prNaam, { color: kleuren.tekst }]}>{pr.oefeningNaam}</Text>
                  <Text style={[s.prWaarde, { color: kleuren.waarschuwing }]}>{pr.eenRM} kg</Text>
                </View>
              ))}
            </>
          )}

          <View style={s.knoppen}>
            <TouchableOpacity
              style={[s.annulerenKnop, { borderColor: kleuren.kaartRand }]}
              onPress={() => sluitModal('annuleren')}
            >
              <Text style={[s.annulerenTekst, { color: kleuren.tekstGedimpt }]}>Doorgaan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.opslaanKnop, { backgroundColor: kleuren.succes }]}
              onPress={() => sluitModal('opslaan')}
            >
              <Ionicons name="checkmark" size={18} color="#FFF" />
              <Text style={s.opslaanTekst}>Opslaan & Afsluiten</Text>
            </TouchableOpacity>
          </View>
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
    alignItems: 'center',
    marginBottom: 24,
  },
  icoonRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  titel: {
    fontSize: 22,
    fontFamily: 'Inter_900Black',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statKaart: {
    flex: 1,
    minWidth: '44%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  statWaarde: {
    fontSize: 20,
    fontFamily: 'Inter_900Black',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  prRij: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  prNaam: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  prWaarde: {
    fontSize: 16,
    fontFamily: 'Inter_900Black',
  },
  knoppen: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  annulerenKnop: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  annulerenTekst: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  opslaanKnop: {
    flex: 2,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  opslaanTekst: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
});
