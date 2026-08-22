// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Oefening Detail Scherm
// Progressiegrafiek + 1RM record + trainingsgeschiedenis
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThema } from '../../src/context/ThemeContext';
import { useAuth }  from '../../src/context/AuthContext';
import { useVoortgang } from '../../src/hooks/useWorkouts';
import { OEFENINGEN_DB } from '../../src/data/exercises';
import { bereken1RM } from '../../src/context/LiveWorkoutContext';
import ProgressChart from '../../src/components/ProgressChart';

const GROEP_KLEUR: Record<string, string> = {
  Borst: '#EF4444', Rug: '#3B82F6', Benen: '#22C55E',
  Schouders: '#F59E0B', Armen: '#A855F7', Core: '#06B6D4', Cardio: '#EC4899',
};

export default function OefeningDetail() {
  const { id }      = useLocalSearchParams<{ id: string }>();
  const router      = useRouter();
  const { kleuren } = useThema();
  const { user }    = useAuth();

  const info = OEFENINGEN_DB.find(o => o.id === id);
  const accentKleur = info ? (GROEP_KLEUR[info.groep] || kleuren.accent) : kleuren.accent;

  const { haalVoortgangOp, workouts, laden } = useVoortgang(user?.id);
  useEffect(() => { if (id) haalVoortgangOp(id); }, [id]);

  // Bereken PR (hoogste 1RM)
  const pr = workouts.reduce((best, w) => {
    const eenRM = bereken1RM(parseFloat(String(w.weight)) || 0, parseInt(String(w.reps)) || 0);
    return eenRM > best ? eenRM : best;
  }, 0);

  const recent = [...workouts].reverse().slice(0, 10);

  return (
    <SafeAreaView style={[s.veilig, { backgroundColor: kleuren.achtergrond }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: kleuren.kaartRand }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.terugKnop}>
          <Ionicons name="arrow-back" size={22} color={kleuren.tekst} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[s.titel, { color: kleuren.tekst }]} numberOfLines={1}>
            {info?.naam || id}
          </Text>
          {info && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <View style={[s.groepPill, { backgroundColor: accentKleur + '22', borderColor: accentKleur + '55' }]}>
                <Text style={[s.groepPillTekst, { color: accentKleur }]}>{info.groep}</Text>
              </View>
              <Text style={[s.typeTekst, { color: kleuren.tekstGedimpt }]}>
                {info.type === 'gewicht' ? 'Gewicht' : info.type === 'lichaamsgewicht' ? 'Lichaamsgewicht' : 'Tijd'}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={s.inhoud} showsVerticalScrollIndicator={false}>
        {/* PR Kaart */}
        {pr > 0 && (
          <View style={[s.prKaart, { backgroundColor: accentKleur + '15', borderColor: accentKleur + '44' }]}>
          <Ionicons name="trophy-outline" size={32} color={accentKleur} style={{ marginRight: 4 }} />
            <View style={{ flex: 1 }}>
              <Text style={[s.prLabel, { color: accentKleur }]}>Persoonlijk Record (1RM schatting)</Text>
              <Text style={[s.prWaarde, { color: kleuren.tekst }]}>{pr} kg</Text>
            </View>
          </View>
        )}

        {/* Progressiegrafiek */}
        <Text style={[s.sectieLabel, { color: kleuren.tekstGedimpt }]}>VOORTGANG</Text>
        {id ? (
          <View style={[s.grafiekKaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
            <ProgressChart oefeningId={id} kleuren={kleuren} />
          </View>
        ) : null}

        {/* Recente sessies */}
        <Text style={[s.sectieLabel, { color: kleuren.tekstGedimpt }]}>RECENTE SESSIES</Text>
        {recent.length === 0 ? (
          <View style={[s.leegKaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
            <Text style={[s.leegTekst, { color: kleuren.tekstGedimpt }]}>
              Nog geen sessies gelogd voor deze oefening.
            </Text>
          </View>
        ) : (
          recent.map((w, i) => (
            <View key={i} style={[s.sessieRij, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
              <View style={{ flex: 1 }}>
                <Text style={[s.sessieDatum, { color: kleuren.tekstGedimpt }]}>{w.date}</Text>
                <Text style={[s.sessieDetail, { color: kleuren.tekst }]}>
                  {w.weight}kg × {w.reps} reps
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[s.sessieVolume, { color: kleuren.accent }]}>
                  {parseFloat(String(w.volume)).toFixed(0)} kg vol.
                </Text>
                <Text style={[s.sessieEenRM, { color: kleuren.tekstGedimpt }]}>
                  ~{bereken1RM(parseFloat(String(w.weight)), parseInt(String(w.reps)))} kg 1RM
                </Text>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  veilig: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderBottomWidth: 1,
  },
  terugKnop: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
  titel:  { fontSize: 20, fontFamily: 'Inter_700Bold' },
  groepPill: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  groepPillTekst: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  typeTekst: { fontSize: 12, fontFamily: 'Inter_400Regular' },

  inhoud: { padding: 16 },
  sectieLabel: {
    fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.2,
    marginBottom: 10, marginTop: 8, textTransform: 'uppercase',
  },

  prKaart: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, borderWidth: 1, padding: 18, marginBottom: 20,
  },
  prLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  prWaarde: { fontSize: 28, fontFamily: 'Inter_900Black', letterSpacing: -1 },

  grafiekKaart: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 20, minHeight: 200 },

  sessieRij: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderRadius: 12, padding: 14, marginBottom: 8,
  },
  sessieDatum:  { fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  sessieDetail: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  sessieVolume: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  sessieEenRM:  { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },

  leegKaart: { borderWidth: 1, borderRadius: 16, padding: 24, alignItems: 'center' },
  leegTekst: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});
