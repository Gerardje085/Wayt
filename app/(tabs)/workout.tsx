import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert, RefreshControl, Modal, Pressable, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useThema } from '../../src/context/ThemeContext';
import { useLiveWorkout } from '../../src/context/LiveWorkoutContext';
import { getRoutines, deleteRoutine, type Routine } from '../../src/lib/routineStore';
import { findExercise } from '../../src/data/exercises';
import RoutineBuilder from '../../src/components/RoutineBuilder';
import EmptyState from '../../src/components/ui/EmptyState';
import type { LiveOefening } from '../../src/context/LiveWorkoutContext';

function RoutineOptiesModal({
  zichtbaar,
  routineNaam,
  onSluiten,
  onBewerk,
  onVerwijder,
  kleuren,
}: {
  zichtbaar: boolean;
  routineNaam: string;
  onSluiten: () => void;
  onBewerk: () => void;
  onVerwijder: () => void;
  kleuren: any;
}) {
  if (!zichtbaar) return null;

  return (
    <Modal visible={zichtbaar} transparent animationType="fade" onRequestClose={onSluiten}>
      <View style={s.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onSluiten} />
        <View style={[s.modalSheet, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
          <Text style={[s.modalTitel, { color: kleuren.tekst }]} numberOfLines={1}>
            {routineNaam}
          </Text>

          <TouchableOpacity
            style={[s.modalOptie, { borderColor: kleuren.kaartRand, backgroundColor: kleuren.achtergrondSecundair }]}
            onPress={() => {
              onSluiten();
              onBewerk();
            }}
            activeOpacity={0.75}
          >
            <View style={[s.modalIcoonBadge, { backgroundColor: kleuren.accent + '22' }]}>
              <Ionicons name="create-outline" size={17} color={kleuren.accent} />
            </View>
            <Text style={[s.modalOptieTekst, { color: kleuren.tekst }]}>Routine bewerken</Text>
            <Ionicons name="chevron-forward" size={16} color={kleuren.tekstGedimpt} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.modalVerwijderKnop, { backgroundColor: kleuren.fout + '15', borderColor: kleuren.fout + '44' }]}
            onPress={() => {
              onSluiten();
              onVerwijder();
            }}
            activeOpacity={0.75}
          >
            <Ionicons name="trash-outline" size={18} color={kleuren.fout} />
            <Text style={[s.modalVerwijderTekst, { color: kleuren.fout }]}>Routine verwijderen</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.modalAnnuleerKnop, { borderColor: kleuren.kaartRand, backgroundColor: kleuren.achtergrond }]}
            onPress={onSluiten}
            activeOpacity={0.75}
          >
            <Text style={[s.modalAnnuleerTekst, { color: kleuren.tekstGedimpt }]}>Annuleren</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function RoutineKaart({
  routine, onStart, onBewerk, onVerwijder, kleuren,
}: {
  routine: Routine;
  onStart: (r: Routine) => void;
  onBewerk: (r: Routine) => void;
  onVerwijder: (r: Routine) => void;
  kleuren: any;
}) {
  const [optiesZichtbaar, setOptiesZichtbaar] = useState(false);

  const oefeningNamen = routine.oefeningen
    .map(oef => findExercise(oef.id)?.naam ?? oef.id)
    .join(', ');

  const openOpties = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setOptiesZichtbaar(true);
  };

  return (
    <View style={[s.routineKaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
      <View style={s.routineHeaderRij}>
        <Text style={[s.routineNaam, { color: kleuren.tekst }]} numberOfLines={1}>
          {routine.naam}
        </Text>
        <TouchableOpacity
          style={s.optiesKnop}
          onPress={openOpties}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Routine opties"
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={kleuren.tekstGedimpt} />
        </TouchableOpacity>
      </View>

      <Text style={[s.routineOefeningenTekst, { color: kleuren.tekstGedimpt }]} numberOfLines={2}>
        {oefeningNamen || 'Geen oefeningen'}
      </Text>

      <TouchableOpacity
        style={[s.startRoutineKnop, { backgroundColor: kleuren.accent }]}
        onPress={() => onStart(routine)}
        activeOpacity={0.85}
      >
        <Text style={s.startRoutineTekst}>Start Routine</Text>
      </TouchableOpacity>

      <RoutineOptiesModal
        zichtbaar={optiesZichtbaar}
        routineNaam={routine.naam}
        onSluiten={() => setOptiesZichtbaar(false)}
        onBewerk={() => onBewerk(routine)}
        onVerwijder={() => onVerwijder(routine)}
        kleuren={kleuren}
      />
    </View>
  );
}

export default function WorkoutTab() {
  const router = useRouter();
  const { user } = useAuth();
  const { kleuren } = useThema();
  const { startWorkout, isActief } = useLiveWorkout();

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [laden, setLaden] = useState(false);
  const [builderZichtbaar, setBuilderZichtbaar] = useState(false);
  const [bewerkRoutine, setBewerkRoutine] = useState<Routine | undefined>(undefined);

  const laadRoutines = useCallback(async () => {
    setLaden(true);
    const r = await getRoutines();
    setRoutines(r);
    setLaden(false);
  }, []);

  useEffect(() => { laadRoutines(); }, [laadRoutines]);

  const handleStart = useCallback((routine: Routine) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const liveOef: LiveOefening[] = routine.oefeningen.map((o) => ({
      id: o.id,
      rustTijd: o.rustTijd && o.rustTijd > 0 ? o.rustTijd : undefined,
      sets: o.sets.map(s => ({
        ...s,
        type: 'normaal' as const,
        completed: false,
      }))
    }));

    startWorkout(routine.naam, routine.id, liveOef);
    router.push('/workout-session');
  }, [startWorkout, router]);

  const handleLegeWorkout = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startWorkout('Lege Workout', null, []);
    router.push('/workout-session');
  }, [startWorkout, router]);

  const handleVerwijder = useCallback(async (routine: Routine) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const bevestigd = window.confirm(
        `"${routine.naam}" verwijderen?\n\nDit kan niet ongedaan worden gemaakt.`
      );
      if (bevestigd) {
        await deleteRoutine(routine.id);
        laadRoutines();
      }
      return;
    }

    Alert.alert(
      `"${routine.naam}" verwijderen?`,
      'Dit kan niet ongedaan worden gemaakt.',
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Verwijderen', style: 'destructive',
          onPress: async () => {
            await deleteRoutine(routine.id);
            laadRoutines();
          }
        }
      ]
    );
  }, [laadRoutines]);

  return (
    <SafeAreaView style={[s.veilig, { backgroundColor: kleuren.achtergrond }]}>
      <ScrollView
        contentContainerStyle={s.inhoud}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={laden} onRefresh={laadRoutines}
            tintColor={kleuren.accent} colors={[kleuren.accent]} />
        }
      >
        <View style={s.header}>
          <View style={s.headerZij} />
          <Text style={[s.headerTitel, { color: kleuren.tekst }]}>Trainen</Text>
          <View style={[s.headerZij, { alignItems: 'flex-end' }]}>
            {isActief && (
              <TouchableOpacity
                style={[s.doorgaanKnop, { backgroundColor: kleuren.succes + '22', borderColor: kleuren.succes + '55' }]}
                onPress={() => router.push('/workout-session')}
              >
                <Ionicons name="pulse" size={14} color={kleuren.succes} style={{ marginRight: 4 }} />
                <Text style={{ color: kleuren.succes, fontFamily: 'Inter_700Bold', fontSize: 12 }}>Doorgaan</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {!isActief && (
          <TouchableOpacity
            style={[s.legeWorkoutKnop, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}
            onPress={handleLegeWorkout}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color={kleuren.accent} />
            <Text style={[s.legeWorkoutTekst, { color: kleuren.tekst }]}>Start Lege Workout</Text>
          </TouchableOpacity>
        )}

        <View style={s.routinesHeader}>
          <Text style={[s.routinesTitel, { color: kleuren.tekstGedimpt }]}>
            Mijn Routines
          </Text>
          <TouchableOpacity
            style={[s.nieuweRoutineKnop, { borderColor: kleuren.kaartRand }]}
            onPress={() => { setBewerkRoutine(undefined); setBuilderZichtbaar(true); }}
          >
            <Ionicons name="add" size={18} color={kleuren.accent} />
            <Text style={{ color: kleuren.accent, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>Nieuw</Text>
          </TouchableOpacity>
        </View>

        {routines.length === 0 ? (
          <EmptyState
            icoon="document-text-outline"
            titel="Geen routines"
            subtekst="Maak je eerste routine aan om gestructureerd te trainen."
            actieTekst="Maak Routine"
            onActie={() => setBuilderZichtbaar(true)}
          />
        ) : (
          routines.map(r => (
            <RoutineKaart
              key={r.id}
              routine={r}
              onStart={handleStart}
              onBewerk={(routine) => { setBewerkRoutine(routine); setBuilderZichtbaar(true); }}
              onVerwijder={handleVerwijder}
              kleuren={kleuren}
            />
          ))
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      <RoutineBuilder
        zichtbaar={builderZichtbaar}
        initialRoutine={bewerkRoutine}
        onOpslaan={() => { setBuilderZichtbaar(false); laadRoutines(); }}
        onSluiten={() => setBuilderZichtbaar(false)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  veilig: { flex: 1 },
  inhoud: { padding: 20 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  headerZij: { width: 92, alignItems: 'flex-start' },
  headerTitel: { fontSize: 17, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  doorgaanKnop: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6,
  },

  legeWorkoutKnop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 24,
  },
  legeWorkoutTekst: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },

  routinesHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  routinesTitel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  nieuweRoutineKnop: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7,
  },

  routineKaart: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  routineHeaderRij: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  routineNaam: { flex: 1, fontSize: 17, fontFamily: 'Inter_700Bold' },
  optiesKnop: { padding: 4 },
  routineOefeningenTekst: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
    marginBottom: 14,
  },
  startRoutineKnop: {
    width: '100%',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startRoutineTekst: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 36,
  },
  modalTitel: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOptie: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  modalIcoonBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOptieTekst: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  modalVerwijderKnop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  modalVerwijderTekst: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  modalAnnuleerKnop: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  modalAnnuleerTekst: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
