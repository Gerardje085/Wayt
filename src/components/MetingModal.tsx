import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  TextInput, Pressable, Alert, ActivityIndicator,
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
import { useAuth } from '../context/AuthContext';
import { bereken1RM } from '../context/LiveWorkoutContext';
import { berekenVolume, berekenArbeid } from '../utils/physics';
import { supabase } from '../lib/supabase';

const KERN_OEFENINGEN = [
  { id: 'bench_press', naam: 'Bench Press', icoon: 'barbell-outline' },
  { id: 'lat_pulldown', naam: 'Lat Pulldown', icoon: 'arrow-down-circle-outline' },
  { id: 'leg_extension', naam: 'Leg Extension', icoon: 'arrow-forward-circle-outline' },
];

interface MetingModalProps {
  zichtbaar: boolean;
  onSluiten: () => void;
}

export default function MetingModal({ zichtbaar, onSluiten }: MetingModalProps) {
  const { kleuren } = useThema();
  const { user } = useAuth();
  const [isActief, setIsActief] = useState(false);
  const [week, setWeek] = useState<'week0' | 'week6'>('week0');
  const [gekozenOefening, setGekozenOefening] = useState(KERN_OEFENINGEN[0].id);
  const [gewichtStr, setGewichtStr] = useState('');
  const [repsStr, setRepsStr] = useState('');
  const [laden, setLaden] = useState(false);

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

  const gewicht = parseFloat(gewichtStr.replace(',', '.')) || 0;
  const reps = parseInt(repsStr) || 0;
  const berekend1RM = gewicht > 0 && reps > 0 ? bereken1RM(gewicht, reps) : null;

  const handleOpslaan = async () => {
    if (!user?.id) return;
    if (gewicht <= 0 || reps <= 0) {
      Alert.alert('Vul gewicht en herhalingen in');
      return;
    }
    setLaden(true);
    try {
      const volume = berekenVolume(1, reps, gewicht);
      const arbeid = berekenArbeid(gekozenOefening, reps, gewicht);
      const { error } = await supabase.from('workouts').insert({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        exercise: gekozenOefening,
        sets: 1,
        reps,
        weight: gewicht,
        volume: parseFloat(volume.toFixed(2)),
        work_joules: parseFloat(arbeid.toFixed(2)),
        is_meting: true,
      });
      if (error) throw error;
      Alert.alert(
        'Meting opgeslagen!',
        `Geschatte 1RM: ${berekend1RM} kg\n(${gewicht} kg x ${reps} herhalingen)`,
        [{ text: 'OK', onPress: () => { resetForm(); sluitModal(); } }]
      );
    } catch (err) {
      Alert.alert('Opslaan mislukt', (err as Error).message);
    } finally {
      setLaden(false);
    }
  };

  const resetForm = () => {
    setGewichtStr('');
    setRepsStr('');
    setGekozenOefening(KERN_OEFENINGEN[0].id);
    setWeek('week0');
  };

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
            <Ionicons name="trophy-outline" size={22} color={kleuren.waarschuwing} />
            <Text style={[s.titel, { color: kleuren.tekst }]}>Officiele 1RM Meting</Text>
            <TouchableOpacity onPress={sluitModal}>
              <Ionicons name="close" size={22} color={kleuren.tekstGedimpt} />
            </TouchableOpacity>
          </View>

          <Text style={[s.sectionLabel, { color: kleuren.tekstGedimpt }]}>MEETMOMENT</Text>
          <View style={[s.tabRij, { backgroundColor: kleuren.achtergrond }]}>
            {([['week0', 'Week 0 - Nulmeting'], ['week6', 'Week 6 - Eindmeting']] as const).map(([val, label]) => (
              <TouchableOpacity
                key={val}
                style={[s.tab, week === val && { backgroundColor: kleuren.accent }]}
                onPress={() => setWeek(val)}
              >
                <Text style={[s.tabTekst, { color: week === val ? '#FFF' : kleuren.tekstGedimpt }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[s.sectionLabel, { color: kleuren.tekstGedimpt }]}>OEFENING</Text>
          <View style={s.oefeningRij}>
            {KERN_OEFENINGEN.map(oef => (
              <TouchableOpacity
                key={oef.id}
                style={[
                  s.oefeningKnop,
                  { borderColor: kleuren.kaartRand, backgroundColor: kleuren.achtergrond },
                  gekozenOefening === oef.id && { borderColor: kleuren.accent, backgroundColor: kleuren.accentGedimpt },
                ]}
                onPress={() => setGekozenOefening(oef.id)}
              >
                <Ionicons name={oef.icoon as any} size={18} color={gekozenOefening === oef.id ? kleuren.accent : kleuren.tekstGedimpt} />
                <Text style={[s.oefeningTekst, { color: gekozenOefening === oef.id ? kleuren.accent : kleuren.tekstSecundair }]}>
                  {oef.naam}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[s.sectionLabel, { color: kleuren.tekstGedimpt }]}>PRESTATIE</Text>
          <View style={s.invoerRij}>
            <View style={s.invoerBlok}>
              <Text style={[s.invoerLabel, { color: kleuren.tekstGedimpt }]}>Gewicht (kg)</Text>
              <TextInput
                style={[s.invoer, { color: kleuren.tekst, backgroundColor: kleuren.achtergrond, borderColor: kleuren.kaartRand }]}
                value={gewichtStr}
                onChangeText={setGewichtStr}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={kleuren.tekstGedimpt}
              />
            </View>
            <View style={s.invoerBlok}>
              <Text style={[s.invoerLabel, { color: kleuren.tekstGedimpt }]}>Herhalingen</Text>
              <TextInput
                style={[s.invoer, { color: kleuren.tekst, backgroundColor: kleuren.achtergrond, borderColor: kleuren.kaartRand }]}
                value={repsStr}
                onChangeText={setRepsStr}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={kleuren.tekstGedimpt}
              />
            </View>
          </View>

          {berekend1RM !== null && (
            <View style={[s.resultaat, { backgroundColor: kleuren.waarschuwing + '18', borderColor: kleuren.waarschuwing + '44' }]}>
              <Text style={[s.resultaatLabel, { color: kleuren.tekstGedimpt }]}>Geschat 1RM (Epley)</Text>
              <Text style={[s.resultaatWaarde, { color: kleuren.waarschuwing }]}>{berekend1RM} kg</Text>
            </View>
          )}

          <TouchableOpacity
            style={[s.opslaanKnop, { backgroundColor: laden ? kleuren.tekstGedimpt : kleuren.accent }]}
            onPress={handleOpslaan}
            disabled={laden}
          >
            {laden
              ? <ActivityIndicator color="#FFF" size="small" />
              : <Text style={s.opslaanTekst}>Meting opslaan</Text>
            }
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
    gap: 10,
    marginBottom: 24,
  },
  titel: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  tabRij: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabTekst: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  oefeningRij: {
    gap: 8,
    marginBottom: 20,
  },
  oefeningKnop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  oefeningTekst: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  invoerRij: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  invoerBlok: { flex: 1 },
  invoerLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  invoer: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  resultaat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  resultaatLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  resultaatWaarde: {
    fontSize: 24,
    fontFamily: 'Inter_900Black',
    letterSpacing: -0.5,
  },
  opslaanKnop: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  opslaanTekst: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
});
