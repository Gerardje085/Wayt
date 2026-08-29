import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, Modal, Pressable, SafeAreaView, Image,
} from 'react-native';
import Animated, {
  FadeIn, FadeOut, SlideInDown, useSharedValue, useAnimatedStyle, withTiming, runOnJS, Easing
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useThema } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import {
  useLiveWorkout, formatTijd, bereken1RM,
  type LiveSet, type LiveOefening, type SetType,
} from '../src/context/LiveWorkoutContext';
import { useOpslaanWorkout } from '../src/hooks/useWorkouts';
import { OEFENINGEN_DB, findExercise, getMediaUrl } from '../src/data/exercises';
import ExerciseSelector from '../src/components/ExerciseSelector';
import { berekenVolume, berekenArbeid } from '../src/utils/physics';
import WarmupModal from '../src/components/WarmupModal';
import PrCelebratie from '../src/components/PrCelebratie';
import WorkoutSamenvatting, { type WorkoutSamenvattingData } from '../src/components/WorkoutSamenvatting';
import ExerciseGuideModal from '../src/components/ExerciseGuideModal';
import { supabase } from '../src/lib/supabase';

function setTypeConfig(kleuren: any): Record<SetType, { label: string; kleur: string }> {
  return {
    normaal: { label: '', kleur: kleuren.tekstGedimpt },
    warmup: { label: 'W', kleur: kleuren.warmup },
    dropset: { label: 'D', kleur: kleuren.dropset },
    failure: { label: 'F', kleur: kleuren.failure },
  };
}

function SetTypeModal({
  zichtbaar, onSluiten, onKies, huidigType, kleuren
}: {
  zichtbaar: boolean; onSluiten: () => void;
  onKies: (t: SetType) => void; huidigType: SetType; kleuren: any;
}) {
  const [isActief, setIsActief] = useState(false);
  const overlayOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(400);

  useEffect(() => {
    if (zichtbaar) {
      setIsActief(true);
      overlayOpacity.value = withTiming(1, { duration: 200 });
      sheetTranslateY.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) });
    }
  }, [zichtbaar]);

  const sluitModal = useCallback((gekozenType?: SetType) => {
    overlayOpacity.value = withTiming(0, { duration: 180 });
    sheetTranslateY.value = withTiming(400, { duration: 220, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) {
        runOnJS(setIsActief)(false);
        if (gekozenType) {
          runOnJS(onKies)(gekozenType);
        }
        runOnJS(onSluiten)();
      }
    });
  }, [onKies, onSluiten]);

  const overlayAnimStijl = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const sheetAnimStijl = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  if (!isActief) return null;

  const types: SetType[] = ['normaal', 'warmup', 'dropset', 'failure'];
  const labels: Record<SetType, string> = {
    normaal: 'Normaal', warmup: 'Warm-up (W)', dropset: 'Drop-set (D)', failure: 'Failure (F)',
  };
  const cfg = setTypeConfig(kleuren);

  return (
    <Modal visible={isActief} transparent animationType="none" onRequestClose={() => sluitModal()}>
      <Animated.View style={[stm.overlay, overlayAnimStijl]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => sluitModal()} />
        <Animated.View style={[stm.sheet, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }, sheetAnimStijl]}>
          <Text style={[stm.titel, { color: kleuren.tekst }]}>Set Type</Text>
          {types.map(t => (
            <TouchableOpacity
              key={t}
              style={[stm.optie, { borderColor: kleuren.kaartRand }, huidigType === t && { backgroundColor: kleuren.accent + '22' }]}
              onPress={() => sluitModal(t)}
            >
              {cfg[t].label ? (
                <View style={[stm.typeBadge, { backgroundColor: cfg[t].kleur }]}>
                  <Text style={stm.typeBadgeTekst}>{cfg[t].label}</Text>
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
      </Animated.View>
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

const QUICK_ADD_STAPPEN = [1.25, 2.5, 5];

interface PrState {
  zichtbaar: boolean;
  oefeningNaam: string;
  eenRM: number;
}

function SetRij({
  set, index, oefeningId, toonGewicht, vorige, kleuren, bestaandePR, onNieuwPR,
}: {
  set: LiveSet; index: number; oefeningId: string;
  toonGewicht: boolean; vorige: { reps: number; gewicht: number } | null | undefined;
  kleuren: any; bestaandePR: number; onNieuwPR: (eenRM: number) => void;
}) {
  const { toggleSet, updateSet, setSetType, startRustTimer } = useLiveWorkout();
  const [typeModal, setTypeModal] = useState(false);
  const [gewichtStr, setGewichtStr] = useState(String(set.gewicht || ''));
  const [repsStr, setRepsStr] = useState(String(set.reps || ''));
  const [quickAddZicht, setQuickAddZicht] = useState(false);
  const isCompleted = set.completed;
  const cfg = setTypeConfig(kleuren);

  const handleCheck = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const gewicht = parseFloat(gewichtStr.replace(',', '.')) || 0;
    const reps = parseInt(repsStr) || 0;
    updateSet(oefeningId, set.id, 'gewicht', gewicht);
    updateSet(oefeningId, set.id, 'reps', reps);
    toggleSet(oefeningId, set.id);
    if (!isCompleted) {
      startRustTimer(90);
      if (gewicht > 0 && reps > 0) {
        const nieuwEenRM = bereken1RM(gewicht, reps);
        if (nieuwEenRM > bestaandePR) {
          onNieuwPR(nieuwEenRM);
        }
      }
    }
  };

  const pasGewichtAan = (delta: number) => {
    const huidig = parseFloat(gewichtStr.replace(',', '.')) || 0;
    const nieuw = Math.max(0, Math.round((huidig + delta) * 4) / 4);
    const tekst = Number.isInteger(nieuw) ? String(nieuw) : nieuw.toFixed(2).replace(/\.?0+$/, '');
    setGewichtStr(tekst);
    updateSet(oefeningId, set.id, 'gewicht', nieuw);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const bgKleur = isCompleted ? kleuren.succes + '18' : kleuren.kaart;
  const typeLabel = cfg[set.type].label || String(index + 1);
  const typeKleur = cfg[set.type].kleur;

  return (
    <View>
      <Animated.View entering={FadeIn.duration(200)} style={[sr.rij, { backgroundColor: bgKleur, borderColor: kleuren.kaartRand }]}>
        <TouchableOpacity onLongPress={() => setTypeModal(true)} style={sr.nummerKnop}>
          <View style={[sr.nummerBadge, {
            backgroundColor: isCompleted ? kleuren.succes + '33' : typeKleur + '22',
            borderColor: isCompleted ? kleuren.succes : typeKleur + '66',
          }]}>
            {isCompleted ? (
              <Ionicons name="checkmark" size={15} color={kleuren.succes} />
            ) : (
              <Text style={[sr.nummerTekst, { color: typeKleur }]}>
                {typeLabel}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <Text style={[sr.vorige, { color: kleuren.tekstGedimpt }]} numberOfLines={1}>
          {vorige ? `${vorige.gewicht}×${vorige.reps}` : '—'}
        </Text>

        {toonGewicht && (
          <TouchableOpacity
            style={{ flex: 1.2 }}
            onFocus={() => setQuickAddZicht(true)}
            onBlur={() => setQuickAddZicht(false)}
            onPress={() => !isCompleted && setQuickAddZicht(v => !v)}
            activeOpacity={1}
          >
            <TextInput
              style={[sr.input, { color: kleuren.tekst, backgroundColor: isCompleted ? 'transparent' : kleuren.achtergrond }]}
              value={gewichtStr}
              onChangeText={setGewichtStr}
              keyboardType="decimal-pad"
              placeholder={vorige ? String(vorige.gewicht) : '0'}
              placeholderTextColor={kleuren.tekstGedimpt}
              editable={!isCompleted}
              selectTextOnFocus
              onFocus={() => setQuickAddZicht(true)}
            />
          </TouchableOpacity>
        )}

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

      {toonGewicht && quickAddZicht && !isCompleted && (
        <Animated.View entering={FadeIn.duration(150)} style={[sr.quickAddRij, { backgroundColor: kleuren.achtergrondSecundair }]}>
          {QUICK_ADD_STAPPEN.map(stap => (
            <TouchableOpacity
              key={`min-${stap}`}
              style={[sr.quickKnop, { borderColor: kleuren.kaartRand }]}
              onPress={() => pasGewichtAan(-stap)}
            >
              <Text style={[sr.quickTekst, { color: kleuren.fout }]}>-{stap}</Text>
            </TouchableOpacity>
          ))}
          {[...QUICK_ADD_STAPPEN].reverse().map(stap => (
            <TouchableOpacity
              key={`plus-${stap}`}
              style={[sr.quickKnop, { borderColor: kleuren.kaartRand }]}
              onPress={() => pasGewichtAan(stap)}
            >
              <Text style={[sr.quickTekst, { color: kleuren.succes }]}>+{stap}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}
    </View>
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
  quickAddRij: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    marginBottom: 8,
    marginTop: -4,
  },
  quickKnop: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 6,
    alignItems: 'center',
  },
  quickTekst: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
});

function OefeningKaart({
  oefening, kleuren, bestaandePRs, onNieuwPR,
}: {
  oefening: LiveOefening; kleuren: any;
  bestaandePRs: Record<string, number>;
  onNieuwPR: (oefeningId: string, eenRM: number) => void;
}) {
  const { toggleOefening, addSet } = useLiveWorkout();
  const info = findExercise(oefening.id);
  const toonGewicht = info?.type === 'gewicht';
  const [warmupZicht, setWarmupZicht] = useState(false);
  const [guideZicht, setGuideZicht] = useState(false);

  const werkGewicht = oefening.sets.find(s => s.type === 'normaal')?.gewicht
    ?? oefening.sets[oefening.sets.length - 1]?.gewicht
  const mediaUri = info?.image_url || (info?.image ? getMediaUrl(info.image) : '');

  return (
    <View style={[ok.kaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
      <TouchableOpacity style={ok.header} onPress={() => toggleOefening(oefening.id)}>
        <View style={[ok.thumbContainer, { backgroundColor: '#FFFFFF', borderColor: kleuren.kaartRand }]}>
          {mediaUri ? (
            <Image source={{ uri: mediaUri }} style={ok.thumbImage} resizeMode="contain" />
          ) : (
            <Ionicons name={(info?.icoon as any) || 'barbell-outline'} size={18} color={kleuren.accent} />
          )}
        </View>
        <Text style={[ok.naam, { color: kleuren.tekst }]} numberOfLines={1}>{info?.naam || oefening.id}</Text>
        
        <TouchableOpacity
          style={ok.infoKnop}
          onPress={(e) => {
            e.stopPropagation();
            setGuideZicht(true);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Oefening uitleg bekijken"
        >
          <Ionicons name="information-circle-outline" size={20} color={kleuren.accent} />
        </TouchableOpacity>

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

      {oefening.expanded && (
        <View style={ok.setsContainer}>
          <View style={ok.kolomHeaders}>
            <Text style={[ok.kolomHeader, { color: kleuren.tekstGedimpt, width: 38, textAlign: 'center' }]}>SET</Text>
            <Text style={[ok.kolomHeader, { color: kleuren.tekstGedimpt, flex: 1, textAlign: 'center' }]}>VORIG</Text>
            {toonGewicht && <Text style={[ok.kolomHeader, { color: kleuren.tekstGedimpt, flex: 1.2, textAlign: 'center' }]}>KG</Text>}
            <Text style={[ok.kolomHeader, { color: kleuren.tekstGedimpt, flex: 1.2, textAlign: 'center' }]}>REPS</Text>
            <View style={{ width: 44 }} />
          </View>

          {oefening.sets.map((set, i) => (
            <SetRij
              key={set.id}
              set={set} index={i}
              oefeningId={oefening.id}
              toonGewicht={toonGewicht}
              vorige={set.vorige}
              kleuren={kleuren}
              bestaandePR={bestaandePRs[oefening.id] ?? 0}
              onNieuwPR={(eenRM) => onNieuwPR(oefening.id, eenRM)}
            />
          ))}

          <View style={ok.footer}>
            <TouchableOpacity style={ok.addSetKnop} onPress={() => addSet(oefening.id)}>
              <Ionicons name="add" size={16} color={kleuren.accent} />
              <Text style={{ color: kleuren.accent, fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>Set toevoegen</Text>
            </TouchableOpacity>

            {toonGewicht && werkGewicht > 0 && (
              <TouchableOpacity
                style={[ok.warmupKnop, { borderColor: kleuren.warmup + '66' }]}
                onPress={() => setWarmupZicht(true)}
              >
                <Ionicons name="flame-outline" size={14} color={kleuren.warmup} />
                <Text style={[ok.warmupTekst, { color: kleuren.warmup }]}>Opwarmen</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <WarmupModal
        zichtbaar={warmupZicht}
        onSluiten={() => setWarmupZicht(false)}
        werkGewicht={werkGewicht > 0 ? werkGewicht : 20}
        oefeningNaam={info?.naam ?? oefening.id}
      />

      <ExerciseGuideModal
        zichtbaar={guideZicht}
        onSluiten={() => setGuideZicht(false)}
        oefeningId={oefening.id}
        oefeningNaam={info?.naam}
      />
    </View>
  );
}

const ok = StyleSheet.create({
  kaart: { borderWidth: 1, borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  thumbContainer: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  thumbImage: { width: '100%', height: '100%' },
  icoonContainer: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  naam: { flex: 1, fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  voltooiInfo: { marginRight: 4 },
  voltooiTekst: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  infoKnop: { padding: 4, marginRight: 2 },
  setsContainer: { paddingHorizontal: 10, paddingBottom: 12 },
  kolomHeaders: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 2, marginBottom: 6, gap: 8 },
  kolomHeader: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.8 },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  addSetKnop: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 10 },
  warmupKnop: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 10, borderRadius: 10, borderWidth: 1 },
  warmupTekst: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});

export default function WorkoutSession() {
  const router = useRouter();
  const { kleuren } = useThema();
  const { user } = useAuth();
  const { slaOp, laden: ladenOpslaan } = useOpslaanWorkout();
  const {
    isActief, routineNaam, oefeningen, verlopenTijd,
    stopWorkout, rustTimerLoopt, rustTimerResterend,
    stopRustTimer, addOefening,
  } = useLiveWorkout();

  const [selectorZicht, setSelectorZicht] = useState(false);
  const [bestaandePRs, setBestaandePRs] = useState<Record<string, number>>({});
  const [prState, setPrState] = useState<PrState>({ zichtbaar: false, oefeningNaam: '', eenRM: 0 });
  const [samenvattingData, setSamenvattingData] = useState<WorkoutSamenvattingData | null>(null);

  useEffect(() => {
    if (!isActief) {
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)/workout');
    }
  }, [isActief]);

  useEffect(() => {
    if (!user?.id || oefeningen.length === 0) return;
    const oefeningIds = oefeningen.map(o => o.id);
    supabase
      .from('workouts')
      .select('exercise, weight, reps')
      .eq('user_id', user.id)
      .in('exercise', oefeningIds)
      .then(({ data }) => {
        if (!data) return;
        const prs: Record<string, number> = {};
        for (const row of data) {
          const eenRM = bereken1RM(Number(row.weight), Number(row.reps));
          if (!prs[row.exercise] || eenRM > prs[row.exercise]) {
            prs[row.exercise] = eenRM;
          }
        }
        setBestaandePRs(prs);
      });
  }, [user?.id, oefeningen.length]);

  const handleNieuwPR = useCallback((oefeningId: string, eenRM: number) => {
    const info = findExercise(oefeningId);
    setPrState({ zichtbaar: true, oefeningNaam: info?.naam ?? oefeningId, eenRM });
    setBestaandePRs(prev => ({ ...prev, [oefeningId]: eenRM }));
  }, []);

  const berekenSamenvatting = useCallback((): WorkoutSamenvattingData => {
    const voltooidesets = oefeningen.reduce((acc, o) => acc + o.sets.filter(s => s.completed).length, 0);
    let totaalVolume = 0;
    let totaalJoules = 0;
    const prLijst: { oefeningNaam: string; eenRM: number }[] = [];
    const afgemerkteOefeningIds = new Set<string>();

    for (const o of oefeningen) {
      const voltooid = o.sets.filter(s => s.completed);
      for (const s of voltooid) {
        totaalVolume += berekenVolume(1, s.reps, s.gewicht);
        totaalJoules += berekenArbeid(o.id, s.reps, s.gewicht);
        const eenRM = bereken1RM(s.gewicht, s.reps);
        const oud = bestaandePRs[o.id] ?? 0;
        if (eenRM > oud && !afgemerkteOefeningIds.has(o.id)) {
          const info = findExercise(o.id);
          prLijst.push({ oefeningNaam: info?.naam ?? o.id, eenRM });
          afgemerkteOefeningIds.add(o.id);
        }
      }
    }
    return { duurSeconden: verlopenTijd, voltooidesets, totaalVolume, totaalJoules, prs: prLijst };
  }, [oefeningen, verlopenTijd, bestaandePRs]);

  const handleAfronden = useCallback(() => {
    const samenvatting = berekenSamenvatting();
    setSamenvattingData(samenvatting);
  }, [berekenSamenvatting]);

  const handleOpslaanEnAfsluiten = useCallback(async () => {
    if (!user?.id) return;
    const workoutsData = oefeningen.flatMap(o =>
      o.sets
        .filter(s => s.completed)
        .map(s => {
          const volume = berekenVolume(1, s.reps, s.gewicht);
          const arbeid = berekenArbeid(o.id, s.reps, s.gewicht);
          return {
            user_id: user.id,
            date: new Date().toISOString().split('T')[0],
            exercise: o.id,
            sets: 1,
            reps: s.reps,
            weight: s.gewicht,
            volume: parseFloat(volume.toFixed(2)),
            work_joules: parseFloat(arbeid.toFixed(2)),
          };
        })
    );
    if (workoutsData.length > 0) {
      await slaOp(workoutsData);
    }
    setSamenvattingData(null);
    stopWorkout();
    router.back();
  }, [oefeningen, user?.id, slaOp, stopWorkout, router]);

  const handleOefeningToevoegen = (oefeningId: string) => {
    addOefening(oefeningId);
    setSelectorZicht(false);
  };

  if (!isActief) return null;

  return (
    <SafeAreaView style={[s.veilig, { backgroundColor: kleuren.achtergrond }]}>
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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollInhoud}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {oefeningen.map(o => (
          <OefeningKaart
            key={o.id}
            oefening={o}
            kleuren={kleuren}
            bestaandePRs={bestaandePRs}
            onNieuwPR={handleNieuwPR}
          />
        ))}

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

      <PrCelebratie
        zichtbaar={prState.zichtbaar}
        oefeningNaam={prState.oefeningNaam}
        eenRM={prState.eenRM}
        onSluiten={() => setPrState(p => ({ ...p, zichtbaar: false }))}
      />

      {samenvattingData && (
        <WorkoutSamenvatting
          zichtbaar={true}
          data={samenvattingData}
          onOpslaan={handleOpslaanEnAfsluiten}
          onAnnuleren={() => setSamenvattingData(null)}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  veilig: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderBottomWidth: 1, gap: 12,
  },
  headerKnop: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
  headerMidden: { flex: 1, alignItems: 'center' },
  routineNaam: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  timerTekst: { fontSize: 13, fontFamily: 'Inter_900Black', letterSpacing: 1, marginTop: 2 },
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
