import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, Alert, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useThema } from '../../src/context/ThemeContext';
import { useLiveWorkout } from '../../src/context/LiveWorkoutContext';
import { getRoutines, deleteRoutine, type Routine } from '../../src/lib/routineStore';
import { findExercise, type Spiergroep } from '../../src/data/exercises';
import RoutineBuilder from '../../src/components/RoutineBuilder';
import EmptyState from '../../src/components/ui/EmptyState';
import type { LiveOefening } from '../../src/context/LiveWorkoutContext';

const GROEP_KLEUR: Record<string, string> = {
  Borst: '#EF4444', Rug: '#3B82F6',
  Benen: '#22C55E', Schouders: '#F59E0B',
  Armen: '#A855F7', Core: '#06B6D4',
  Cardio: '#EC4899', Kuiten: '#10B981', Nek: '#64748B',
};

function schatDuur(routine: Routine): string {
  const aantalSets = routine.oefeningen.reduce((acc, o) => acc + o.sets.length, 0);
  const minuten = Math.round(aantalSets * 2.5);
  return minuten < 60 ? `${minuten} min` : `${Math.floor(minuten / 60)}u ${minuten % 60}m`;
}

function uniekeSpiergroepen(routine: Routine): Spiergroep[] {
  const groepen = new Set<Spiergroep>();
  for (const oef of routine.oefeningen) {
    const info = findExercise(oef.id);
    if (info) groepen.add(info.groep);
  }
  return Array.from(groepen).slice(0, 4);
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
  const spiergroepen = uniekeSpiergroepen(routine);
  const duur = schatDuur(routine);
  const aantalOef = routine.oefeningen.length;

  return (
    <TouchableOpacity
      style={[s.routineKaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}
      onPress={() => onStart(routine)}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(routine.naam, 'Wat wil je doen?', [
          { text: 'Bewerken', onPress: () => onBewerk(routine) },
          { text: 'Verwijderen', style: 'destructive', onPress: () => onVerwijder(routine) },
          { text: 'Annuleren', style: 'cancel' },
        ]);
      }}
    >
      <View style={[s.routineKleurblok, { backgroundColor: spiergroepen[0] ? GROEP_KLEUR[spiergroepen[0]] : kleuren.accent }]} />

      <View style={s.routineInhoud}>
        <Text style={[s.routineNaam, { color: kleuren.tekst }]} numberOfLines={1}>{routine.naam}</Text>

        <View style={s.routineMeta}>
          <View style={s.routineMetaItem}>
            <Ionicons name="barbell-outline" size={12} color={kleuren.tekstGedimpt} />
            <Text style={[s.routineMetaTekst, { color: kleuren.tekstGedimpt }]}>{aantalOef} oef.</Text>
          </View>
          <View style={s.routineMetaItem}>
            <Ionicons name="time-outline" size={12} color={kleuren.tekstGedimpt} />
            <Text style={[s.routineMetaTekst, { color: kleuren.tekstGedimpt }]}>{duur}</Text>
          </View>
        </View>

        <View style={s.pillRij}>
          {spiergroepen.map(g => (
            <View key={g} style={[s.pill, { backgroundColor: GROEP_KLEUR[g] + '22', borderColor: GROEP_KLEUR[g] + '55' }]}>
              <Text style={[s.pillTekst, { color: GROEP_KLEUR[g] }]}>{g}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[s.startKnop, { backgroundColor: kleuren.accent + '22' }]}
        onPress={() => onStart(routine)}
      >
        <Ionicons name="play" size={20} color={kleuren.accent} />
      </TouchableOpacity>
    </TouchableOpacity>
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

    const liveOef: LiveOefening[] = routine.oefeningen.map((o, oi) => ({
      id: o.id,
      expanded: oi === 0,
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
          <Text style={[s.headerTitel, { color: kleuren.tekst }]}>Trainen</Text>
          {isActief && (
            <TouchableOpacity
              style={[s.doorgaanKnop, { backgroundColor: kleuren.succes + '22', borderColor: kleuren.succes + '55' }]}
              onPress={() => router.push('/workout-session')}
            >
              <Ionicons name="pulse" size={14} color={kleuren.succes} style={{ marginRight: 4 }} />
              <Text style={{ color: kleuren.succes, fontFamily: 'Inter_700Bold', fontSize: 13 }}>Doorgaan</Text>
            </TouchableOpacity>
          )}
        </View>

        {!isActief && (
          <TouchableOpacity style={s.legeWorkoutKnop} onPress={handleLegeWorkout}>
            <LinearGradient
              colors={[kleuren.accent, kleuren.accentLicht]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.legeWorkoutGradient}
            >
              <Ionicons name="add-circle-outline" size={28} color="#FFFFFF" style={{ marginBottom: 8 }} />
              <Text style={s.legeWorkoutTekst}>Start Lege Workout</Text>
              <Text style={s.legeWorkoutSub}>Kies je eigen oefeningen</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={s.routinesHeader}>
          <Text style={[s.routinesTitel, { color: kleuren.tekst }]}>
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
    alignItems: 'center', marginBottom: 24,
  },
  headerTitel: { fontSize: 30, fontFamily: 'Inter_900Black', letterSpacing: -1 },
  doorgaanKnop: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8,
  },

  legeWorkoutKnop: { borderRadius: 18, overflow: 'hidden', marginBottom: 28 },
  legeWorkoutGradient: { padding: 28, alignItems: 'center' },
  legeWorkoutTekst: { color: '#FFF', fontSize: 20, fontFamily: 'Inter_900Black', letterSpacing: -0.5 },
  legeWorkoutSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 4 },

  routinesHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  routinesTitel: { fontSize: 20, fontFamily: 'Inter_900Black', letterSpacing: -0.5 },
  nieuweRoutineKnop: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7,
  },

  routineKaart: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 16,
    borderWidth: 1, marginBottom: 10, overflow: 'hidden',
  },
  routineKleurblok: { width: 5, alignSelf: 'stretch' },
  routineInhoud: { flex: 1, padding: 14 },
  routineNaam: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  routineMeta: { flexDirection: 'row', gap: 14, marginBottom: 8 },
  routineMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  routineMetaTekst: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  pillRij: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    borderRadius: 8, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  pillTekst: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  startKnop: {
    width: 52, alignSelf: 'stretch', justifyContent: 'center', alignItems: 'center',
  },
});
