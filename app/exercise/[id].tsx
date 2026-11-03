import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThema } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useVoortgang } from '../../src/hooks/useWorkouts';
import {
  findExercise,
  formatEquipmentDutch,
  formatTargetDutch,
  formatCategoryDutch,
} from '../../src/data/exercises';
import { groepeerSessies, vatSetsSamen, formatKg } from '../../src/utils/sessies';
import { formatDatumLang } from '../../src/utils/datum';
import ProgressChart from '../../src/components/ProgressChart';
import { GROEP_KLEUR } from '../../src/theme/groepKleuren';
import ExerciseGuideView from '../../src/components/ExerciseGuideView';

type TabOptie = 'uitleg' | 'voortgang';

export default function OefeningDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { kleuren } = useThema();
  const { user } = useAuth();
  const [actieveTab, setActieveTab] = useState<TabOptie>('uitleg');

  const info = useMemo(() => findExercise(id), [id]);
  const accentKleur = info ? (GROEP_KLEUR[info.groep] || kleuren.accent) : kleuren.accent;

  const { haalVoortgangOp, workouts, laden } = useVoortgang(user?.id);
  useEffect(() => {
    if (id) haalVoortgangOp(id);
  }, [id]);

  const sessies = useMemo(() => groepeerSessies(workouts), [workouts]);
  const pr = sessies.reduce((best, sessie) => Math.max(best, sessie.beste1RM), 0);
  const recent = [...sessies].reverse().slice(0, 10);

  return (
    <SafeAreaView style={[s.veilig, { backgroundColor: kleuren.achtergrond }]}>
      <View style={[s.header, { borderBottomColor: kleuren.kaartRand }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.terugKnop} accessibilityLabel="Terug">
          <Ionicons name="arrow-back" size={22} color={kleuren.tekst} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[s.titel, { color: kleuren.tekst }]} numberOfLines={1}>
            {info?.naam || info?.name || id}
          </Text>
          <Text style={[s.sub, { color: kleuren.tekstGedimpt }]}>
            {info ? `${info.groep} • ${formatTargetDutch(info.target)} • ${formatEquipmentDutch(info.equipment)}` : 'Oefening Details'}
          </Text>
        </View>
      </View>

      {/* Tabs Selector */}
      <View style={[s.tabBalk, { borderBottomColor: kleuren.kaartRand, backgroundColor: kleuren.kaart }]}>
        <TouchableOpacity
          style={[
            s.tabKnop,
            actieveTab === 'uitleg' && [s.tabKnopActief, { borderBottomColor: accentKleur }],
          ]}
          onPress={() => setActieveTab('uitleg')}
        >
          <Ionicons
            name="play-circle-outline"
            size={18}
            color={actieveTab === 'uitleg' ? accentKleur : kleuren.tekstGedimpt}
          />
          <Text
            style={[
              s.tabTekst,
              { color: actieveTab === 'uitleg' ? accentKleur : kleuren.tekstGedimpt },
            ]}
          >
            Uitleg & Beweging
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            s.tabKnop,
            actieveTab === 'voortgang' && [s.tabKnopActief, { borderBottomColor: accentKleur }],
          ]}
          onPress={() => setActieveTab('voortgang')}
        >
          <Ionicons
            name="trending-up-outline"
            size={18}
            color={actieveTab === 'voortgang' ? accentKleur : kleuren.tekstGedimpt}
          />
          <Text
            style={[
              s.tabTekst,
              { color: actieveTab === 'voortgang' ? accentKleur : kleuren.tekstGedimpt },
            ]}
          >
            Voortgang & PRs
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.inhoud} showsVerticalScrollIndicator={false}>
        {actieveTab === 'uitleg' ? (
          <View>
            <ExerciseGuideView oefeningId={id || ''} oefeningNaam={info?.name || info?.naam} />
          </View>
        ) : (
          <View>
            {/* PR & Stats Kaart */}
            <View style={[s.statGrid, { marginBottom: 16 }]}>
              <View style={[s.statKaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
                <Text style={[s.statLabel, { color: kleuren.tekstGedimpt }]}>GESCHATTE 1RM</Text>
                <Text style={[s.statWaarde, { color: accentKleur }]}>
                  {pr > 0 ? `${pr} kg` : '—'}
                </Text>
              </View>
              <View style={[s.statKaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
                <Text style={[s.statLabel, { color: kleuren.tekstGedimpt }]}>TRAININGEN</Text>
                <Text style={[s.statWaarde, { color: kleuren.tekst }]}>
                  {sessies.length}
                </Text>
              </View>
            </View>

            {/* Progressie Grafiek */}
            <View style={{ marginBottom: 16 }}>
              <ProgressChart workouts={workouts} laden={laden} modus="eenRM" />
            </View>

            {/* Recente Sessies */}
            <View style={[s.sectieKaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
              <Text style={[s.sectieTitel, { color: kleuren.tekstSecundair }]}>RECENTE TRAININGEN</Text>
              {recent.length === 0 ? (
                <Text style={[s.leegTekst, { color: kleuren.tekstGedimpt }]}>Nog geen workouts gelogd voor deze oefening.</Text>
              ) : (
                recent.map(sessie => (
                  <View key={sessie.datum} style={[s.geschiedenisRij, { borderBottomColor: kleuren.kaartRand }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.datumTekst, { color: kleuren.tekst }]}>
                        {formatDatumLang(sessie.datum)}
                      </Text>
                      <Text style={[s.subDatum, { color: kleuren.tekstGedimpt }]}>
                        {vatSetsSamen(sessie.sets)}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[s.gewichtTekst, { color: kleuren.tekst }]}>
                        {sessie.beste1RM > 0 ? `1RM ${formatKg(sessie.beste1RM)}` : '—'}
                      </Text>
                      <Text style={[s.subDatum, { color: kleuren.tekstGedimpt }]}>
                        {Math.round(sessie.volume)} kg · {Math.round(sessie.joules)} J
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  veilig: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  terugKnop: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  titel: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  sub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  tabBalk: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabKnop: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabKnopActief: {},
  tabTekst: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  inhoud: {
    padding: 16,
    paddingBottom: 40,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statKaart: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
    marginBottom: 6,
  },
  statWaarde: {
    fontSize: 22,
    fontFamily: 'Inter_900Black',
  },
  sectieKaart: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  sectieTitel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
    marginBottom: 12,
  },
  leegTekst: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    paddingVertical: 12,
  },
  geschiedenisRij: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  datumTekst: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  subDatum: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  gewichtTekst: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
});
