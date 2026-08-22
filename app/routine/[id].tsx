// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Routine Details Screen
// Toont de details van een specifieke routine voordat je deze start.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThema } from '../../src/context/ThemeContext';
import { getRoutines, Routine } from '../../src/lib/routineStore';
import { OEFENINGEN_DB } from '../../src/data/exercises';
import RoutineBuilder from '../../src/components/RoutineBuilder';

export default function RoutineDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { kleuren } = useThema();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [builderZichtbaar, setBuilderZichtbaar] = useState(false);

  const laadRoutine = async () => {
    const routines = await getRoutines();
    const gevonden = routines.find((r) => r.id === id);
    if (gevonden) setRoutine(gevonden);
  };

  useEffect(() => {
    if (id) laadRoutine();
  }, [id]);

  if (!routine) {
    return (
      <SafeAreaView style={[stijlen.container, { backgroundColor: kleuren.achtergrond, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: kleuren.tekstGedimpt, fontFamily: 'Inter_400Regular' }}>Laden...</Text>
      </SafeAreaView>
    );
  }

  const startRoutine = () => {
    // Navigeer naar dashboard en geef de routineId mee zodat hij daar gestart wordt
    router.push({
      pathname: '/(tabs)/dashboard',
      params: { routineId: routine.id }
    });
  };

  return (
    <SafeAreaView style={[stijlen.container, { backgroundColor: kleuren.achtergrond }]}>
      {/* Header */}
      <View style={[stijlen.header, { borderBottomColor: kleuren.kaartRand }]}>
        <TouchableOpacity style={stijlen.terugKnop} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={kleuren.tekstSecundair} />
        </TouchableOpacity>
        <Text style={[stijlen.titel, { color: kleuren.tekstSecundair }]}>{routine.naam}</Text>
        <TouchableOpacity style={stijlen.terugKnop} onPress={() => setBuilderZichtbaar(true)}>
          <Ionicons name="pencil" size={20} color={kleuren.accent} />
        </TouchableOpacity>
      </View>

      {/* Inhoud */}
      <ScrollView style={stijlen.scroll} contentContainerStyle={stijlen.inhoud}>
        <Text style={[stijlen.sectieLabel, { color: kleuren.accent }]}>Oefeningen</Text>
        
        {routine.oefeningen.map((item, index) => {
          const oefInfo = OEFENINGEN_DB.find((o) => o.id === item.id);
          const isTijd = oefInfo?.type === 'tijd';
          
          return (
            <View key={index} style={[stijlen.oefeningKaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
              <View style={stijlen.oefeningHeader}>
                <View style={[stijlen.nummerBadge, { backgroundColor: kleuren.accent + '22' }]}>
                  <Text style={[stijlen.nummerTekst, { color: kleuren.accent }]}>{index + 1}</Text>
                </View>
                <Text style={[stijlen.oefeningNaam, { color: kleuren.tekst }]}>
                  {oefInfo ? oefInfo.naam : item.id}
                </Text>
                {oefInfo?.icoon ? (
                  <Ionicons name={oefInfo.icoon as any} size={20} color={kleuren.tekstGedimpt} />
                ) : null}
              </View>

              <View style={stijlen.detailsRij}>
                <View style={stijlen.detailKolom}>
                  <Text style={[stijlen.detailLabel, { color: kleuren.tekstGedimpt }]}>Sets</Text>
                  <Text style={[stijlen.detailWaarde, { color: kleuren.tekst }]}>{item.sets?.length || 0}</Text>
                </View>
                <View style={stijlen.detailKolom}>
                  <Text style={[stijlen.detailLabel, { color: kleuren.tekstGedimpt }]}>{isTijd ? 'Seconden' : 'Reps'}</Text>
                  <Text style={[stijlen.detailWaarde, { color: kleuren.tekst }]}>{item.sets?.[0]?.reps || 0}</Text>
                </View>
                {oefInfo?.type === 'gewicht' ? (
                  <View style={stijlen.detailKolom}>
                    <Text style={[stijlen.detailLabel, { color: kleuren.tekstGedimpt }]}>Gewicht</Text>
                    <Text style={[stijlen.detailWaarde, { color: kleuren.tekst }]}>{item.sets?.[0]?.gewicht || 0} kg</Text>
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Start Knop */}
      <View style={[stijlen.footer, { borderTopColor: kleuren.kaartRand, backgroundColor: kleuren.achtergrond }]}>
        <TouchableOpacity style={stijlen.startContainer} onPress={startRoutine} activeOpacity={0.8}>
          <LinearGradient colors={['#7C3AED', '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={stijlen.startKnop}>
            <Ionicons name="play" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={stijlen.startTekst}>Routine Starten</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <RoutineBuilder
        zichtbaar={builderZichtbaar}
        initialRoutine={routine}
        onOpslaan={laadRoutine}
        onSluiten={() => setBuilderZichtbaar(false)}
      />
    </SafeAreaView>
  );
}

const stijlen = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  terugKnop: { padding: 4 },
  titel: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  scroll: { flex: 1 },
  inhoud: { padding: 16 },
  sectieLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily: 'Inter_700Bold',
    marginBottom: 12,
  },
  oefeningKaart: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  oefeningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nummerBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  nummerTekst: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  oefeningNaam: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  detailsRij: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.1)', // Subtiele donkerte op light en dark thema's
    borderRadius: 8,
    paddingVertical: 12,
  },
  detailKolom: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  detailWaarde: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  startContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  startKnop: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startTekst: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
});
