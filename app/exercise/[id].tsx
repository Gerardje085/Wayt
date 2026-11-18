import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThema } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useVoortgang } from '../../src/hooks/useWorkouts';
import { groepeerNaarSessies } from '../../src/utils/sessieGroepering';
import {
  findExercise,
  formatEquipmentDutch,
  formatTargetDutch,
} from '../../src/data/exercises';
import ProgressChart from '../../src/components/ProgressChart';
import { GROEP_KLEUR } from '../../src/theme/groepKleuren';
import ExerciseGuideView from '../../src/components/ExerciseGuideView';
import { RADIUS, SPACING, useResponsive } from '../../src/theme/designTokens';
import ResponsiveContainer from '../../src/components/ui/ResponsiveContainer';
import ScreenHeader from '../../src/components/ui/ScreenHeader';
import Card from '../../src/components/ui/Card';

type TabOptie = 'uitleg' | 'voortgang';

export default function OefeningDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { kleuren } = useThema();
  const { user } = useAuth();
  const { width, contentPadding } = useResponsive();
  const isTweeKolommen = width >= 960;

  const [actieveTab, setActieveTab] = useState<TabOptie>('uitleg');

  const webPointer: ViewStyle | undefined =
    Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : undefined;

  const info = useMemo(() => findExercise(id), [id]);
  const accentKleur = info ? GROEP_KLEUR[info.groep] || kleuren.accent : kleuren.accent;

  const { haalVoortgangOp, workouts, laden } = useVoortgang(user?.id);
  useEffect(() => {
    if (id) haalVoortgangOp(id);
  }, [id]);

  const sessies = useMemo(() => groepeerNaarSessies(workouts), [workouts]);

  const pr = useMemo(
    () => sessies.reduce((best, ses) => (ses.beste1RM > best ? ses.beste1RM : best), 0),
    [sessies]
  );

  const recent = useMemo(() => [...sessies].reverse().slice(0, 10), [sessies]);

  const terugKnop = (
    <TouchableOpacity
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/exercises'))}
      style={[
        s.terugKnop,
        {
          backgroundColor: kleuren.kaart,
          borderColor: kleuren.kaartRand,
        },
        webPointer,
      ]}
      accessibilityLabel="Terug naar oefeningen"
    >
      <Ionicons name="arrow-back" size={20} color={kleuren.tekst} />
    </TouchableOpacity>
  );

  const voortgangInhoud = (
    <View style={s.voortgangKolom}>
      {/* PR & Stats Kaarten */}
      <View style={s.statGrid}>
        <Card padding={16} style={s.statKaart}>
          <View style={s.statHeaderRij}>
            <View style={[s.statIcoonBadge, { backgroundColor: accentKleur + '1E' }]}>
              <Ionicons name="trophy-outline" size={16} color={accentKleur} />
            </View>
            <Text style={[s.statLabel, { color: kleuren.tekstGedimpt }]}>GESCHATTE 1RM</Text>
          </View>
          <Text style={[s.statWaarde, { color: accentKleur }]}>
            {pr > 0 ? `${pr} kg` : '—'}
          </Text>
        </Card>

        <Card padding={16} style={s.statKaart}>
          <View style={s.statHeaderRij}>
            <View style={[s.statIcoonBadge, { backgroundColor: kleuren.accentGedimpt }]}>
              <Ionicons name="calendar-outline" size={16} color={kleuren.accentLicht} />
            </View>
            <Text style={[s.statLabel, { color: kleuren.tekstGedimpt }]}>GELOGDE SESSIES</Text>
          </View>
          <Text style={[s.statWaarde, { color: kleuren.tekst }]}>{sessies.length}</Text>
        </Card>
      </View>

      {/* Progressie Grafiek */}
      <ProgressChart workouts={workouts} oefeningId={id || ''} laden={laden} />

      {/* Recente Sessies */}
      <Card padding={18}>
        <View style={s.sectieHeaderRij}>
          <Text style={[s.sectieTitel, { color: kleuren.tekstSecundair }]}>RECENTE SESSIES</Text>
          {recent.length > 0 ? (
            <Text style={[s.sectieAantal, { color: kleuren.tekstGedimpt }]}>
              Laatste {recent.length}
            </Text>
          ) : null}
        </View>

        {recent.length === 0 ? (
          <View style={s.leegBox}>
            <Ionicons name="barbell-outline" size={24} color={kleuren.tekstGedimpt} />
            <Text style={[s.leegTekst, { color: kleuren.tekstGedimpt }]}>
              Nog geen workouts gelogd voor deze oefening.
            </Text>
          </View>
        ) : (
          recent.map((ses, index) => {
            const setsOverzicht =
              ses.sets.length > 1
                ? ses.sets
                    .map((st) => `${st.set_type === 'warmup' ? 'W ' : ''}${st.weight}×${st.reps}`)
                    .join(' · ')
                : `${ses.aantalWerkSets} ${ses.aantalWerkSets === 1 ? 'set' : 'sets'} × ${ses.topReps} reps`;
            const isLaatste = index === recent.length - 1;
            return (
              <View
                key={ses.sleutel || index}
                style={[
                  s.geschiedenisRij,
                  !isLaatste && { borderBottomWidth: 1, borderBottomColor: kleuren.kaartRand },
                ]}
              >
                <View style={s.geschiedenisLinks}>
                  <Text style={[s.datumTekst, { color: kleuren.tekst }]}>
                    {new Date(ses.datum).toLocaleDateString('nl-NL', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                  <Text style={[s.subDatum, { color: kleuren.tekstGedimpt }]} numberOfLines={2}>
                    {setsOverzicht}
                  </Text>
                </View>

                <View style={s.geschiedenisRechts}>
                  <Text style={[s.gewichtTekst, { color: accentKleur }]}>
                    {ses.topGewicht} kg × {ses.topReps}
                  </Text>
                  <Text style={[s.subDatum, { color: kleuren.tekstGedimpt }]}>
                    Volume: {ses.totaalVolume ? `${ses.totaalVolume} kg` : '—'}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </Card>
    </View>
  );

  return (
    <SafeAreaView style={[s.veilig, { backgroundColor: kleuren.achtergrond }]} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          s.scrollInhoud,
          { paddingHorizontal: contentPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveContainer variant={isTweeKolommen ? 'wide' : 'default'}>
          <ScreenHeader
            title={info?.naam || info?.name || id || 'Oefening'}
            subtitle={
              info
                ? `${formatTargetDutch(info.target)} · ${formatEquipmentDutch(info.equipment)}`
                : 'Oefening Details'
            }
            badge={info?.groep}
            leftAction={terugKnop}
          />

          {/* Mobiel / Tablet: Strakke pill tab switcher */}
          {!isTweeKolommen ? (
            <>
              <View
                style={[
                  s.tabBalk,
                  {
                    backgroundColor: kleuren.kaart,
                    borderColor: kleuren.kaartRand,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    s.tabKnop,
                    actieveTab === 'uitleg' && { backgroundColor: kleuren.accent },
                    webPointer,
                  ]}
                  onPress={() => setActieveTab('uitleg')}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="play-circle-outline"
                    size={17}
                    color={actieveTab === 'uitleg' ? '#FFFFFF' : kleuren.tekstSecundair}
                  />
                  <Text
                    style={[
                      s.tabTekst,
                      { color: actieveTab === 'uitleg' ? '#FFFFFF' : kleuren.tekstSecundair },
                    ]}
                  >
                    Uitleg & Beweging
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    s.tabKnop,
                    actieveTab === 'voortgang' && { backgroundColor: kleuren.accent },
                    webPointer,
                  ]}
                  onPress={() => setActieveTab('voortgang')}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="trending-up-outline"
                    size={17}
                    color={actieveTab === 'voortgang' ? '#FFFFFF' : kleuren.tekstSecundair}
                  />
                  <Text
                    style={[
                      s.tabTekst,
                      { color: actieveTab === 'voortgang' ? '#FFFFFF' : kleuren.tekstSecundair },
                    ]}
                  >
                    Voortgang & PRs
                  </Text>
                </TouchableOpacity>
              </View>

              {actieveTab === 'uitleg' ? (
                <ExerciseGuideView
                  oefeningId={id || ''}
                  oefeningNaam={info?.name || info?.naam}
                />
              ) : (
                voortgangInhoud
              )}
            </>
          ) : (
            /* Desktop: 2-koloms layout — Links Uitleg & Beweging, Rechts Voortgang & PRs */
            <View style={s.desktopGrid}>
              <View style={s.desktopLinks}>
                <View style={s.kolomLabelRij}>
                  <Ionicons name="play-circle-outline" size={16} color={accentKleur} />
                  <Text style={[s.kolomLabel, { color: kleuren.tekstSecundair }]}>
                    UITLEG & BEWEGING
                  </Text>
                </View>
                <ExerciseGuideView
                  oefeningId={id || ''}
                  oefeningNaam={info?.name || info?.naam}
                />
              </View>

              <View style={s.desktopRechts}>
                <View style={s.kolomLabelRij}>
                  <Ionicons name="trending-up-outline" size={16} color={accentKleur} />
                  <Text style={[s.kolomLabel, { color: kleuren.tekstSecundair }]}>
                    VOORTGANG & PRS
                  </Text>
                </View>
                {voortgangInhoud}
              </View>
            </View>
          )}
        </ResponsiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  veilig: { flex: 1 },
  scrollInhoud: {
    paddingTop: SPACING.md,
    paddingBottom: 44,
  },
  terugKnop: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBalk: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 18,
    gap: 4,
  },
  tabKnop: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabTekst: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  desktopGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
    marginTop: 4,
  },
  desktopLinks: {
    flex: 1.05,
    minWidth: 0,
  },
  desktopRechts: {
    flex: 0.95,
    minWidth: 0,
  },
  kolomLabelRij: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 12,
  },
  kolomLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.1,
  },
  voortgangKolom: {
    gap: 14,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statKaart: {
    flex: 1,
  },
  statHeaderRij: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  statIcoonBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.9,
    flexShrink: 1,
  },
  statWaarde: {
    fontSize: 24,
    fontFamily: 'Inter_900Black',
    letterSpacing: -0.5,
  },
  sectieHeaderRij: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectieTitel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.1,
  },
  sectieAantal: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  leegBox: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  leegTekst: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  geschiedenisRij: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    gap: 12,
  },
  geschiedenisLinks: {
    flex: 1,
    minWidth: 0,
  },
  geschiedenisRechts: {
    alignItems: 'flex-end',
  },
  datumTekst: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  subDatum: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  gewichtTekst: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
});
