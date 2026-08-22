// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Workout Session (Fullscreen Live Logger)
// Header timer + Oefening kaarten + Set logging + Auto-Suggest + Rest Timer
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, Modal, Pressable, KeyboardAvoidingView,
  Platform, SafeAreaView,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
  FadeIn, FadeOut, SlideInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useThema } from '../src/context/ThemeContext';
import { useAuth }  from '../src/context/AuthContext';
import {
  useLiveWorkout, formatTijd, bereken1RM,
  type LiveSet, type LiveOefening, type SetType,
} from '../src/context/LiveWorkoutContext';
import { useOpslaanWorkout } from '../src/hooks/useWorkouts';
import { OEFENINGEN_DB } from '../src/data/exercises';
import ExerciseSelector from '../src/components/ExerciseSelector';
import { berekenVolume } from '../src/utils/physics';
import { supabase } from '../src/lib/supabase';

// ─── Set Type Configuratie ────────────────────────────────────────────────────
const SET_TYPE_CONFIG: Record<SetType, { label: string; kleur: string }> = {
  normaal:  { label: '',  kleur: 'inherit' },
  warmup:   { label: 'W', kleur: '#F59E0B' },
  dropset:  { label: 'D', kleur: '#3B82F6' },
  failure:  { label: 'F', kleur: '#EF4444' },
};

// ─── Set Type Modal ────────────────────────────────────────────────────────────
function SetTypeModal({
  zichtbaar, onSluiten, onKies, huidigType, kleuren
}: {
  zichtbaar: boolean; onSluiten: () => void;
  onKies: (t: SetType) => void; huidigType: SetType; kleuren: any;
}) {
  const types: SetType[] = ['normaal', 'warmup', 'dropset', 'failure'];
  const labels: Record<SetType, string> = {
    normaal: 'Normaal', warmup: 'Warm-up (W)', dropset: 'Drop-set (D)', failure: 'Failure (F)',
  };
  return (
    <Modal visible={zichtbaar} transparent animationType="fade" onRequestClose={onSluiten}>
      <Pressable style={stm.overlay} onPress={onSluiten}>
        <Animated.View entering={SlideInDown.duration(200)} style={[stm.sheet, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
          <Text style={[stm.titel, { color: kleuren.tekst }]}>Set Type</Text>
          {types.map(t => (
            <TouchableOpacity
              key={t}
              style={[stm.optie, { borderColor: kleuren.kaartRand }, huidigType === t && { backgroundColor: kleuren.accent + '22' }]}
              onPress={() => { onKies(t); onSluiten(); }}
            >
              {SET_TYPE_CONFIG[t].label ? (
                <View style={[stm.typeBadge, { backgroundColor: SET_TYPE_CONFIG[t].kleur }]}>
                  <Text style={stm.typeBadgeTekst}>{SET_TYPE_CONFIG[t].label}</Text>
                </View>
              ) : (
                <View style={[stm.typeBadge, { backgroundColor: kleuren.tekstGedimpt + '44' }]}>
                  <Text style={[stm.typeBadgeTekst, { color: kleuren.tekst }]}>#</Text>
                </View>
              )}
              <Text style={[stm.optieNaam, { color: kleuren.tekst }]}>{labels[t]}</Text>
              {huidigType === t && <Ionicons name="checkmark" size={18} color={kleuren.accent} />}
            </TouchableOpacity>
          ))}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
const stm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, padding: 20, paddingBottom: 40 },
  titel: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 16, textAlign: 'center' },
  optie: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  optieNaam: { flex: 1, fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  typeBadge: { width: 28, height: 28, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
  typeBadgeTekst: { color: '#FFF', fontSize: 13, fontFamily: 'Inter_700Bold' },
});

// ─── Set Rij ─────────────────────────────────────────────────────────────────
function SetRij({
  set, index, oefeningId, toonGewicht, vorige, kleuren,
}: {
  set: LiveSet; index: number; oefeningId: string;
  toonGewicht: boolean; vorige: { reps: number; gewicht: number } | null | undefined;
  kleuren: any;
}) {
  const { toggleSet, updateSet, setSetType, startRustTimer } = useLiveWorkout();
  const [typeModal, setTypeModal]     = useState(false);
  const [gewichtStr, setGewichtStr]   = useState(String(set.gewicht || ''));
  const [repsStr,    setRepsStr]      = useState(String(set.reps    || ''));
  const isCompleted = set.completed;
  const cfg         = SET_TYPE_CONFIG[set.type];

  const handleCheck = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const gewicht = parseFloat(gewichtStr.replace(',', '.')) || 0;
    const reps    = parseInt(repsStr) || 0;
    updateSet(oefeningId, set.id, 'gewicht', gewicht);
    updateSet(oefeningId, set.id, 'reps', reps);
    toggleSet(oefeningId, set.id);
    if (!isCompleted) startRustTimer(90);
  };

  const bgKleur = isCompleted
    ? kleuren.succes + '18'
    : kleuren.kaart;

  const typeLabel = SET_TYPE_CONFIG[set.type].label || String(index + 1);
  const typeKleur = SET_TYPE_CONFIG[set.type].kleur !== 'inherit'
    ? SET_TYPE_CONFIG[set.type].kleur
    : kleuren.tekstGedimpt;

  return (
    <Animated.View entering={FadeIn.duration(200)} style={[sr.rij, { backgroundColor: bgKleur, borderColor: kleuren.kaartRand }]}>
      {/* Set nummer / type badge */}
      <TouchableOpacity onLongPress={() => setTypeModal(true)} style={sr.nummerKnop}>
        <View style={[sr.nummerBadge, {
          backgroundColor: isCompleted ? kleuren.succes + '33' : typeKleur + '22',
          borderColor: isCompleted ? kleuren.succes : typeKleur + '66',
        }]}>
          <Text style={[sr.nummerTekst, { color: isCompleted ? kleuren.succes : typeKleur }]}>
            {isCompleted ? '✓' : typeLabel}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Vorige prestatie */}
      <Text style={[sr.vorige, { color: kleuren.tekstGedimpt }]} numberOfLines={1}>
        {vorige ? `${vorige.gewicht}×${vorige.reps}` : '—'}
      </Text>

      {/* Gewicht input */}
      {toonGewicht && (
        <TextInput
          style={[sr.input, { color: kleuren.tekst, backgroundColor: isCompleted ? 'transparent' : kleuren.achtergrond }]}
          value={gewichtStr}
          onChangeText={setGewichtStr}
          keyboardType="decimal-pad"
          placeholder={vorige ? String(vorige.gewicht) : '0'}
          placeholderTextColor={kleuren.tekstGedimpt}
          editable={!isCompleted}
          selectTextOnFocus
        />
      )}

      {/* Reps input */}
      <TextInput
        style={[sr.input, { color: kleuren.tekst, backgroundColor: isCompleted ? 'transparent' : kleuren.achtergrond }]}
        value={repsStr}
        onChangeText={setRepsStr}
        keyboardType="number-pad"
        placeholder={vorige ? String(vorige.reps) : '0'}
        placeholderTextColor={kleuren.tekstGedimpt}
        editable={!isCompleted}
        selectTextOnFocus
      />

      {/* Check knop */}
      <TouchableOpacity onPress={handleCheck} style={[sr.checkKnop, { backgroundColor: isCompleted ? kleuren.succes : kleuren.achtergrond, borderColor: isCompleted ? kleuren.succes : kleuren.kaartRand }]}>
        <Ionicons name="checkmark" size={22} color={isCompleted ? '#FFF' : kleuren.tekstGedimpt} />
      </TouchableOpacity>

      <SetTypeModal
        zichtbaar={typeModal}
        onSluiten={() => setTypeModal(false)}
        onKies={(t) => setSetType(oefeningId, set.id, t)}
        huidigType={set.type}
        kleuren={kleuren}
      />
    </Animated.View>
  );
}

const sr = StyleSheet.create({
  rij: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, marginBottom: 6, paddingVertical: 8, paddingHorizontal: 10, gap: 8 },
  nummerKnop: { width: 38, alignItems: 'center' },
  nummerBadge: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  nummerTekst: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  vorige: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  input: { flex: 1.2, borderRadius: 10, textAlign: 'center', paddingVertical: 9, fontSize: 16, fontFamily: 'Inter_700Bold' },
  checkKnop: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
});

// ─── Oefening Kaart ───────────────────────────────────────────────────────────
function OefeningKaart({ oefening, kleuren }: { oefening: LiveOefening; kleuren: any }) {
  const { toggleOefening, addSet, removeSet } = useLiveWorkout();
  const info = OEFENINGEN_DB.find(o => o.id === oefening.id);
  const toonGewicht = info?.type === 'gewicht';

  return (
    <View style={[ok.kaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
      {/* Oefening header */}
      <TouchableOpacity style={ok.header} onPress={() => toggleOefening(oefening.id)}>
        <View style={[ok.icoonContainer, { backgroundColor: kleuren.accent + '22' }]}>
          <Ionicons name={(info?.icoon as any) || 'barbell-outline'} size={18} color={kleuren.accent} />
        </View>
        <Text style={[ok.naam, { color: kleuren.tekst }]} numberOfLines={1}>{info?.naam || oefening.id}</Text>
        <View style={ok.voltooiInfo}>
          <Text style={[ok.voltooiTekst, { color: kleuren.tekstGedimpt }]}>
            {oefening.sets.filter(s => s.completed).length}/{oefening.sets.length}
          </Text>
        </View>
        <Ionicons
          name={oefening.expanded ? 'chevron-up' : 'chevron-down'}
          size={18} color={kleuren.tekstGedimpt}
        />
      </TouchableOpacity>

      {/* Sets tabel */}
      {oefening.expanded && (
        <View style={ok.setsContainer}>
          {/* Kolom headers */}
          <View style={ok.kolomHeaders}>
            <Text style={[ok.kolomHeader, { color: kleuren.tekstGedimpt, width: 38, textAlign: 'center' }]}>SET</Text>
            <Text style={[ok.kolomHeader, { color: kleuren.tekstGedimpt, flex: 1, textAlign: 'center' }]}>VORIG</Text>
            {toonGewicht && <Text style={[ok.kolomHeader, { color: kleuren.tekstGedimpt, flex: 1.2, textAlign: 'center' }]}>KG</Text>}
            <Text style={[ok.kolomHeader, { color: kleuren.tekstGedimpt, flex: 1.2, textAlign: 'center' }]}>REPS</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Set rijen */}
          {oefening.sets.map((set, i) => (
            <SetRij
              key={set.id}
              set={set} index={i}
              oefeningId={oefening.id}
              toonGewicht={toonGewicht}
              vorige={set.vorige}
              kleuren={kleuren}
            />
          ))}

          {/* Add Set */}
          <TouchableOpacity style={ok.addSetKnop} onPress={() => addSet(oefening.id)}>
            <Ionicons name="add" size={16} color={kleuren.accent} />
            <Text style={{ color: kleuren.accent, fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>Add Set</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const ok = StyleSheet.create({
  kaart: { borderWidth: 1, borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  icoonContainer: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  naam: { flex: 1, fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  voltooiInfo: { marginRight: 4 },
  voltooiTekst: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  setsContainer: { paddingHorizontal: 10, paddingBottom: 12 },
  kolomHeaders: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 2, marginBottom: 6, gap: 8 },
  kolomHeader: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.8 },
  addSetKnop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 10, marginTop: 4 },
});

// ─── Hoofd Scherm ─────────────────────────────────────────────────────────────
export default function WorkoutSession() {
  const router         = useRouter();
  const { kleuren }    = useThema();
  const { user }       = useAuth();
  const { slaOp, laden: ladenOpslaan } = useOpslaanWorkout();
  const {
    isActief, routineNaam, oefeningen, verlopenTijd,
    stopWorkout, rustTimerLoopt, rustTimerResterend,
    stopRustTimer, startRustTimer,
  } = useLiveWorkout();

  const [selectorZicht, setSelectorZicht] = useState(false);

  // Redirect als geen actieve workout – gebruik replace zodat GO_BACK error niet optreedt
  useEffect(() => {
    if (!isActief) {
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)/workout');
    }
  }, [isActief]);

  const handleAfronden = useCallback(() => {
    const totaalSets = oefeningen.reduce((acc, o) => acc + o.sets.filter(s => s.completed).length, 0);
    Alert.alert(
      'Workout afronden?',
      `Je hebt ${totaalSets} sets voltooid in ${formatTijd(verlopenTijd)}.`,
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Afronden & Opslaan', style: 'default',
          onPress: async () => {
            if (!user?.id) return;
            // Sla alle voltooide sets op
            const workoutsData = oefeningen.flatMap(o =>
              o.sets
                .filter(s => s.completed)
                .map(s => {
                  const volume = berekenVolume(1, s.reps, s.gewicht);
                  return {
                    user_id:     user.id,
                    date:        new Date().toISOString().split('T')[0],
                    exercise:    o.id,
                    sets:        1,
                    reps:        s.reps,
                    weight:      s.gewicht,
                    volume:      parseFloat(volume.toFixed(2)),
                    work_joules: 0,
                  };
                })
            );
            if (workoutsData.length > 0) {
              await slaOp(workoutsData);
            }
            stopWorkout();
            router.back();
          }
        }
      ]
    );
  }, [oefeningen, verlopenTijd, user?.id, slaOp, stopWorkout, router]);

  const handleMinimaliseer = () => router.back();

  const handleOefeningToevoegen = (oefeningId: string) => {
    // TODO: add via context
    setSelectorZicht(false);
  };

  if (!isActief) return null;

  return (
    <SafeAreaView style={[s.veilig, { backgroundColor: kleuren.achtergrond }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: kleuren.kaartRand }]}>
        <TouchableOpacity style={s.headerKnop} onPress={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/(tabs)/workout');
        }}>
          <Ionicons name="chevron-down" size={22} color={kleuren.tekstGedimpt} />
        </TouchableOpacity>

        <View style={s.headerMidden}>
          <Text style={[s.routineNaam, { color: kleuren.tekst }]} numberOfLines={1}>{routineNaam}</Text>
          <Text style={[s.timerTekst, { color: kleuren.accent }]}>{formatTijd(verlopenTijd)}</Text>
        </View>

        <TouchableOpacity
          style={[s.afrondenKnop, { backgroundColor: kleuren.succes }]}
          onPress={handleAfronden}
          disabled={ladenOpslaan}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name="checkmark" size={16} color="#FFF" />
            <Text style={s.afrondenTekst}>Klaar</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Rest Timer Banner */}
      {rustTimerLoopt && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          style={[s.rustBanner, {
            backgroundColor: rustTimerResterend <= 10 ? kleuren.fout + '22' : kleuren.accent + '15',
            borderColor: rustTimerResterend <= 10 ? kleuren.fout + '55' : kleuren.accent + '44',
          }]}
        >
          <Ionicons name="timer-outline" size={16} color={rustTimerResterend <= 10 ? kleuren.fout : kleuren.accent} />
          <Text style={[s.rustTekst, { color: rustTimerResterend <= 10 ? kleuren.fout : kleuren.accent }]}>
            Rust: {formatTijd(rustTimerResterend)}
          </Text>
          <TouchableOpacity onPress={stopRustTimer}>
            <Text style={{ color: kleuren.tekstGedimpt, fontSize: 13 }}>Overslaan</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Oefeningen */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollInhoud}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {oefeningen.map(o => (
          <OefeningKaart key={o.id} oefening={o} kleuren={kleuren} />
        ))}

        {/* Oefening toevoegen */}
        <TouchableOpacity
          style={[s.addOefKnop, { borderColor: kleuren.kaartRand }]}
          onPress={() => setSelectorZicht(true)}
        >
          <Ionicons name="add-circle-outline" size={20} color={kleuren.accent} style={{ marginRight: 8 }} />
          <Text style={{ color: kleuren.accent, fontFamily: 'Inter_600SemiBold', fontSize: 15 }}>Oefening Toevoegen</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <ExerciseSelector
        zichtbaar={selectorZicht}
        huidigeSelectie=""
        onSelecteer={handleOefeningToevoegen}
        onSluiten={() => setSelectorZicht(false)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  veilig:  { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderBottomWidth: 1, gap: 12,
  },
  headerKnop:   { width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
  headerMidden: { flex: 1, alignItems: 'center' },
  routineNaam:  { fontSize: 15, fontFamily: 'Inter_700Bold' },
  timerTekst:   { fontSize: 13, fontFamily: 'Inter_900Black', letterSpacing: 1, marginTop: 2 },
  afrondenKnop: { borderRadius: 10, paddingVertical: 9, paddingHorizontal: 16 },
  afrondenTekst: { color: '#FFF', fontFamily: 'Inter_700Bold', fontSize: 14 },

  rustBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1,
  },
  rustTekst: { flex: 1, fontSize: 14, fontFamily: 'Inter_700Bold' },

  scrollInhoud: { padding: 16, paddingTop: 12 },

  addOefKnop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 16, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', marginTop: 4,
  },
});
