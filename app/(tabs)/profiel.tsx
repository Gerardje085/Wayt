import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useThema } from '../../src/context/ThemeContext';
import { useAlleWorkouts } from '../../src/hooks/useWorkouts';
import { findExercise } from '../../src/data/exercises';
import { canoniekeId } from '../../src/lib/trainingsHistorie';
import { groepeerSessies, vatSetsSamen } from '../../src/utils/sessies';
import { formatDatumLang, dagenGeleden } from '../../src/utils/datum';
import MetingModal, { haalMetingStatus, aantalMetingenKlaar } from '../../src/components/MetingModal';
import EmptyState from '../../src/components/ui/EmptyState';
import type { Workout } from '../../src/types';

interface OefeningInTraining {
  id: string;
  naam: string;
  samenvatting: string;
}

interface Training {
  datum: string;
  oefeningen: OefeningInTraining[];
  sets: number;
  volume: number;
  heeftMeting: boolean;
}

function bouwTrainingen(rijen: Workout[]): Training[] {
  const perDatum = new Map<string, Workout[]>();
  for (const rij of rijen) {
    perDatum.set(rij.date, [...(perDatum.get(rij.date) ?? []), rij]);
  }

  return Array.from(perDatum.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([datum, dagRijen]) => {
      const perOefening = new Map<string, Workout[]>();
      for (const rij of dagRijen) {
        const id = canoniekeId(rij.exercise);
        perOefening.set(id, [...(perOefening.get(id) ?? []), rij]);
      }
      const oefeningen: OefeningInTraining[] = [];
      let sets = 0;
      let volume = 0;
      for (const [id, oefRijen] of perOefening) {
        const sessie = groepeerSessies(oefRijen)[0];
        const naam = findExercise(id)?.naam ?? id;
        if (sessie) {
          oefeningen.push({ id, naam, samenvatting: vatSetsSamen(sessie.sets) });
          sets += sessie.werkSets;
          volume += sessie.volume;
        }
      }
      return {
        datum,
        oefeningen,
        sets,
        volume,
        heeftMeting: dagRijen.some(r => r.is_meting),
      };
    });
}

export default function ProfielScherm() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { kleuren } = useThema();
  const { haalAllesOp, workouts, laden } = useAlleWorkouts(user?.id);
  const [metingZicht, setMetingZicht] = useState(false);
  const [metingenKlaar, setMetingenKlaar] = useState(0);
  const [toonAantal, setToonAantal] = useState(10);

  const vernieuwen = useCallback(() => {
    haalAllesOp();
    if (user?.id) haalMetingStatus(user.id).then(s => setMetingenKlaar(aantalMetingenKlaar(s)));
  }, [haalAllesOp, user?.id]);

  useEffect(() => { vernieuwen(); }, [vernieuwen]);

  const trainingen = useMemo(() => bouwTrainingen(workouts).filter(t => t.oefeningen.length > 0), [workouts]);
  const weekGrens = dagenGeleden(6);
  const dezeWeek = trainingen.filter(t => t.datum >= weekGrens).length;

  const isAlgoritme = profile?.group_type === 'app';
  const groepLabel = isAlgoritme ? 'Algoritme-groep' : 'Gevoel-groep';

  const menu = [
    { icoon: 'trophy-outline', label: '1RM-meting', sub: `${metingenKlaar} van 6 gemeten`, onPress: () => setMetingZicht(true) },
    { icoon: 'library-outline', label: 'Oefeningenbibliotheek', sub: 'Uitleg en voortgang per oefening', onPress: () => router.push('/oefeningen') },
    { icoon: 'settings-outline', label: 'Instellingen', sub: profile?.is_onderzoeker ? 'Rusttijd, account en onderzoek' : 'Rusttijd en account', onPress: () => router.push('/instellingen') },
  ];

  return (
    <SafeAreaView style={[s.veilig, { backgroundColor: kleuren.achtergrond }]}>
      <ScrollView
        contentContainerStyle={s.inhoud}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={laden} onRefresh={vernieuwen} tintColor={kleuren.accent} colors={[kleuren.accent]} />}
      >
        <Text style={[s.titel, { color: kleuren.tekst }]}>Profiel</Text>
        <Text style={[s.email, { color: kleuren.tekstGedimpt }]} numberOfLines={1}>{user?.email}</Text>

        {profile && (
          <View style={s.badgeRij}>
            <View style={[s.badge, { backgroundColor: kleuren.accentGedimpt }]}>
              <Ionicons name={isAlgoritme ? 'analytics-outline' : 'body-outline'} size={14} color={kleuren.accentTekst} />
              <Text style={[s.badgeTekst, { color: kleuren.accentTekst }]}>{groepLabel}</Text>
            </View>
            {profile.is_onderzoeker && (
              <View style={[s.badge, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand, borderWidth: 1 }]}>
                <Text style={[s.badgeTekst, { color: kleuren.tekstSecundair }]}>Onderzoeker</Text>
              </View>
            )}
          </View>
        )}

        <View style={s.statRij}>
          {[
            { waarde: trainingen.length, label: 'Trainingen' },
            { waarde: dezeWeek, label: 'Deze week' },
            { waarde: `${metingenKlaar}/6`, label: 'Metingen' },
          ].map(stat => (
            <View key={stat.label} style={[s.statKaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
              <Text style={[s.statWaarde, { color: kleuren.tekst }]}>{stat.waarde}</Text>
              <Text style={[s.statLabel, { color: kleuren.tekstGedimpt }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={[s.menu, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
          {menu.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[s.menuRij, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: kleuren.kaartRand }]}
              onPress={item.onPress}
              accessibilityRole="button"
            >
              <Ionicons name={item.icoon as any} size={20} color={kleuren.accentTekst} />
              <View style={{ flex: 1 }}>
                <Text style={[s.menuLabel, { color: kleuren.tekst }]}>{item.label}</Text>
                <Text style={[s.menuSub, { color: kleuren.tekstGedimpt }]}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={kleuren.tekstGedimpt} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[s.sectie, { color: kleuren.tekstGedimpt }]}>GESCHIEDENIS</Text>
        {trainingen.length === 0 && !laden ? (
          <EmptyState
            icoon="time-outline"
            titel="Nog geen trainingen"
            subtekst="Je afgeronde workouts verschijnen hier."
          />
        ) : (
          trainingen.slice(0, toonAantal).map(training => (
            <View key={training.datum} style={[s.training, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
              <View style={s.trainingKop}>
                <Text style={[s.trainingDatum, { color: kleuren.tekst }]}>{formatDatumLang(training.datum)}</Text>
                {training.heeftMeting && (
                  <Ionicons name="trophy" size={16} color={kleuren.waarschuwing} accessibilityLabel="Bevat 1RM-meting" />
                )}
              </View>
              <Text style={[s.trainingMeta, { color: kleuren.tekstGedimpt }]}>
                {training.oefeningen.length} {training.oefeningen.length === 1 ? 'oefening' : 'oefeningen'} · {training.sets} sets · {Math.round(training.volume)} kg
              </Text>
              {training.oefeningen.map(oef => (
                <TouchableOpacity
                  key={oef.id}
                  style={s.oefRij}
                  onPress={() => router.push(`/exercise/${oef.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`${oef.naam}, ${oef.samenvatting}`}
                >
                  <Text style={[s.oefNaam, { color: kleuren.tekstSecundair }]} numberOfLines={1}>{oef.naam}</Text>
                  <Text style={[s.oefSamenvatting, { color: kleuren.tekstGedimpt }]} numberOfLines={1}>{oef.samenvatting}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}

        {trainingen.length > toonAantal && (
          <TouchableOpacity style={s.meerKnop} onPress={() => setToonAantal(n => n + 10)} accessibilityRole="button">
            <Text style={[s.meerTekst, { color: kleuren.accentTekst }]}>Meer laden</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      <MetingModal
        zichtbaar={metingZicht}
        onSluiten={() => { setMetingZicht(false); vernieuwen(); }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  veilig: { flex: 1 },
  inhoud: { padding: 20 },
  titel: { fontSize: 30, fontFamily: 'Inter_900Black', letterSpacing: -1 },
  email: { fontSize: 15, fontFamily: 'Inter_400Regular', marginTop: 2 },
  badgeRij: { flexDirection: 'row', gap: 8, marginTop: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeTekst: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  statRij: { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 16 },
  statKaart: { flex: 1, borderWidth: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  statWaarde: { fontSize: 22, fontFamily: 'Inter_900Black', letterSpacing: -0.5 },
  statLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginTop: 2 },
  menu: { borderWidth: 1, borderRadius: 16, marginBottom: 24, overflow: 'hidden' },
  menuRij: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, minHeight: 60, paddingVertical: 10 },
  menuLabel: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  menuSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  sectie: { fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 1.2, marginBottom: 10 },
  training: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 10 },
  trainingKop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  trainingDatum: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  trainingMeta: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2, marginBottom: 8 },
  oefRij: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 36 },
  oefNaam: { flex: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  oefSamenvatting: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  meerKnop: { alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  meerTekst: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
