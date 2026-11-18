import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThema } from '../../src/context/ThemeContext';
import { getRoutines, Routine } from '../../src/lib/routineStore';
import { findExercise, getMediaUrl } from '../../src/data/exercises';
import { useLiveWorkout, type LiveOefening } from '../../src/context/LiveWorkoutContext';
import { GROEP_KLEUR } from '../../src/theme/groepKleuren';
import { BREAKPOINTS, RADIUS, SPACING, useResponsive } from '../../src/theme/designTokens';
import ResponsiveContainer from '../../src/components/ui/ResponsiveContainer';
import ScreenHeader from '../../src/components/ui/ScreenHeader';
import Card from '../../src/components/ui/Card';
import PrimaryButton from '../../src/components/ui/PrimaryButton';
import RoutineBuilder from '../../src/components/RoutineBuilder';

export default function RoutineDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { kleuren } = useThema();
  const { startWorkout } = useLiveWorkout();
  const { width, contentPadding } = useResponsive();
  const isTweeKolommen = width >= BREAKPOINTS.sidebar;

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [builderZichtbaar, setBuilderZichtbaar] = useState(false);

  const webPointer: ViewStyle | undefined =
    Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : undefined;

  const laadRoutine = useCallback(async () => {
    const routines = await getRoutines();
    const gevonden = routines.find((r) => r.id === id);
    if (gevonden) setRoutine(gevonden);
  }, [id]);

  useEffect(() => {
    if (id) laadRoutine();
  }, [id, laadRoutine]);

  const statistieken = useMemo(() => {
    if (!routine) return { totaalSets: 0, spiergroepen: [] as string[] };
    let totaalSets = 0;
    const groepSet = new Set<string>();
    routine.oefeningen.forEach((oef) => {
      totaalSets += oef.sets?.length || 0;
      const gevonden = findExercise(oef.id);
      if (gevonden?.groep) groepSet.add(gevonden.groep);
    });
    return { totaalSets, spiergroepen: Array.from(groepSet) };
  }, [routine]);

  if (!routine) {
    return (
      <SafeAreaView
        style={[
          stijlen.container,
          { backgroundColor: kleuren.achtergrond, justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator color={kleuren.accent} size="small" />
        <Text
          style={{
            color: kleuren.tekstGedimpt,
            fontFamily: 'Inter_400Regular',
            marginTop: 10,
            fontSize: 13,
          }}
        >
          Routine laden...
        </Text>
      </SafeAreaView>
    );
  }

  const startRoutine = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const liveOef: LiveOefening[] = routine.oefeningen.map((o) => ({
      id: o.id,
      rustTijd: o.rustTijd && o.rustTijd > 0 ? o.rustTijd : undefined,
      sets: o.sets.map((s) => ({
        ...s,
        type: 'normaal' as const,
        completed: false,
      })),
    }));

    startWorkout(routine.naam, routine.id, liveOef);
    router.push('/workout-session');
  };

  const terugKnop = (
    <TouchableOpacity
      style={[
        stijlen.icoonKnop,
        { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand },
        webPointer,
      ]}
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/workout'))}
      accessibilityLabel="Terug naar trainen"
    >
      <Ionicons name="arrow-back" size={20} color={kleuren.tekst} />
    </TouchableOpacity>
  );

  const bewerkKnop = (
    <TouchableOpacity
      style={[
        stijlen.bewerkKnop,
        { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand },
        webPointer,
      ]}
      onPress={() => setBuilderZichtbaar(true)}
      accessibilityLabel="Routine bewerken"
    >
      <Ionicons name="create-outline" size={17} color={kleuren.accentLicht} />
      <Text style={[stijlen.bewerkTekst, { color: kleuren.tekst }]}>Bewerken</Text>
    </TouchableOpacity>
  );

  const oefeningenLijst = (
    <View style={stijlen.oefeningenKolom}>
      <Text style={[stijlen.sectieLabel, { color: kleuren.tekstSecundair }]}>
        OEFENINGEN ({routine.oefeningen.length})
      </Text>

      {routine.oefeningen.map((item, index) => {
        const oefInfo = findExercise(item.id);
        const isTijd = oefInfo?.type === 'tijd';
        const mediaUri = oefInfo?.image_url || getMediaUrl(oefInfo?.image);
        const groepKleur = oefInfo ? GROEP_KLEUR[oefInfo.groep] || kleuren.accent : kleuren.accent;

        return (
          <Card key={`${item.id}-${index}`} padding={16} style={stijlen.oefeningKaart}>
            <TouchableOpacity
              style={[stijlen.oefeningHeader, webPointer]}
              onPress={() => router.push(`/exercise/${item.id}`)}
              activeOpacity={0.78}
            >
              <View
                style={[
                  stijlen.thumbContainer,
                  { backgroundColor: '#FFFFFF', borderColor: kleuren.kaartRand },
                ]}
              >
                {mediaUri ? (
                  <Image
                    source={{ uri: mediaUri }}
                    style={stijlen.thumbImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Ionicons
                    name={(oefInfo?.icoon as any) ?? 'barbell-outline'}
                    size={20}
                    color={groepKleur}
                  />
                )}
              </View>

              <View style={stijlen.oefTekstBlok}>
                <Text style={[stijlen.oefeningNaam, { color: kleuren.tekst }]} numberOfLines={1}>
                  {oefInfo ? oefInfo.naam : item.id}
                </Text>
                <View style={stijlen.groepPillRij}>
                  <View
                    style={[
                      stijlen.groepPill,
                      {
                        backgroundColor: groepKleur + '1A',
                        borderColor: groepKleur + '3D',
                      },
                    ]}
                  >
                    <View style={[stijlen.groepDot, { backgroundColor: groepKleur }]} />
                    <Text style={[stijlen.groepPillTekst, { color: groepKleur }]}>
                      {oefInfo?.groep ?? 'Spiergroep'}
                    </Text>
                  </View>
                  {item.rustTijd && item.rustTijd > 0 ? (
                    <View
                      style={[
                        stijlen.rustPill,
                        {
                          backgroundColor: kleuren.achtergrondSecundair,
                          borderColor: kleuren.kaartRand,
                        },
                      ]}
                    >
                      <Ionicons name="timer-outline" size={11} color={kleuren.tekstGedimpt} />
                      <Text style={[stijlen.rustPillTekst, { color: kleuren.tekstSecundair }]}>
                        {item.rustTijd}s rust
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <Ionicons name="chevron-forward" size={16} color={kleuren.tekstGedimpt} />
            </TouchableOpacity>

            <View
              style={[
                stijlen.detailsRij,
                {
                  backgroundColor: kleuren.achtergrondSecundair,
                  borderColor: kleuren.kaartRand,
                },
              ]}
            >
              <View style={stijlen.detailKolom}>
                <Text style={[stijlen.detailLabel, { color: kleuren.tekstGedimpt }]}>Sets</Text>
                <Text style={[stijlen.detailWaarde, { color: kleuren.tekst }]}>
                  {item.sets?.length || 0}
                </Text>
              </View>

              <View style={[stijlen.detailScheiding, { backgroundColor: kleuren.kaartRand }]} />

              <View style={stijlen.detailKolom}>
                <Text style={[stijlen.detailLabel, { color: kleuren.tekstGedimpt }]}>
                  {isTijd ? 'Seconden' : 'Reps'}
                </Text>
                <Text style={[stijlen.detailWaarde, { color: kleuren.tekst }]}>
                  {item.sets?.[0]?.reps || 0}
                </Text>
              </View>

              {oefInfo?.type === 'gewicht' ? (
                <>
                  <View style={[stijlen.detailScheiding, { backgroundColor: kleuren.kaartRand }]} />
                  <View style={stijlen.detailKolom}>
                    <Text style={[stijlen.detailLabel, { color: kleuren.tekstGedimpt }]}>
                      Gewicht
                    </Text>
                    <Text style={[stijlen.detailWaarde, { color: kleuren.tekst }]}>
                      {item.sets?.[0]?.gewicht || 0} kg
                    </Text>
                  </View>
                </>
              ) : null}
            </View>
          </Card>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={[stijlen.container, { backgroundColor: kleuren.achtergrond }]} edges={['top']}>
      <ScrollView
        style={stijlen.scroll}
        contentContainerStyle={[
          stijlen.inhoud,
          { paddingHorizontal: contentPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveContainer variant={isTweeKolommen ? 'wide' : 'default'}>
          <ScreenHeader
            title={routine.naam}
            subtitle={`${routine.oefeningen.length} ${
              routine.oefeningen.length === 1 ? 'oefening' : 'oefeningen'
            } · ${statistieken.totaalSets} ${statistieken.totaalSets === 1 ? 'set' : 'sets'}`}
            leftAction={terugKnop}
            rightAction={!isTweeKolommen ? bewerkKnop : undefined}
          />

          {isTweeKolommen ? (
            <View style={stijlen.desktopGrid}>
              <View style={stijlen.desktopLinks}>{oefeningenLijst}</View>

              <View style={stijlen.desktopRechts}>
                <Card padding={20} style={stijlen.overzichtKaart}>
                  <Text style={[stijlen.sectieLabel, { color: kleuren.tekstSecundair }]}>
                    ROUTINE OVERZICHT
                  </Text>

                  <View style={stijlen.overzichtStats}>
                    <View
                      style={[
                        stijlen.overzichtStatBox,
                        {
                          backgroundColor: kleuren.achtergrondSecundair,
                          borderColor: kleuren.kaartRand,
                        },
                      ]}
                    >
                      <Text style={[stijlen.overzichtWaarde, { color: kleuren.tekst }]}>
                        {routine.oefeningen.length}
                      </Text>
                      <Text style={[stijlen.overzichtLabel, { color: kleuren.tekstGedimpt }]}>
                        Oefeningen
                      </Text>
                    </View>
                    <View
                      style={[
                        stijlen.overzichtStatBox,
                        {
                          backgroundColor: kleuren.achtergrondSecundair,
                          borderColor: kleuren.kaartRand,
                        },
                      ]}
                    >
                      <Text style={[stijlen.overzichtWaarde, { color: kleuren.accentLicht }]}>
                        {statistieken.totaalSets}
                      </Text>
                      <Text style={[stijlen.overzichtLabel, { color: kleuren.tekstGedimpt }]}>
                        Totaal sets
                      </Text>
                    </View>
                  </View>

                  {statistieken.spiergroepen.length > 0 ? (
                    <View style={stijlen.spiergroepenBlok}>
                      <Text style={[stijlen.spiergroepenTitel, { color: kleuren.tekstGedimpt }]}>
                        Spiergroepen
                      </Text>
                      <View style={stijlen.spiergroepenPills}>
                        {statistieken.spiergroepen.map((g) => {
                          const k = GROEP_KLEUR[g as keyof typeof GROEP_KLEUR] || kleuren.accent;
                          return (
                            <View
                              key={g}
                              style={[
                                stijlen.groepPill,
                                {
                                  backgroundColor: k + '1A',
                                  borderColor: k + '3D',
                                },
                              ]}
                            >
                              <View style={[stijlen.groepDot, { backgroundColor: k }]} />
                              <Text style={[stijlen.groepPillTekst, { color: k }]}>{g}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  ) : null}

                  <View style={stijlen.sidebarActies}>
                    <PrimaryButton
                      titel="Routine Starten"
                      icoon="play"
                      size="lg"
                      onPress={startRoutine}
                    />
                    <PrimaryButton
                      titel="Routine bewerken"
                      icoon="create-outline"
                      variant="secondary"
                      size="md"
                      onPress={() => setBuilderZichtbaar(true)}
                    />
                  </View>
                </Card>
              </View>
            </View>
          ) : (
            oefeningenLijst
          )}

          <View style={{ height: isTweeKolommen ? 40 : 24 }} />
        </ResponsiveContainer>
      </ScrollView>

      {!isTweeKolommen ? (
        <View
          style={[
            stijlen.footer,
            {
              borderTopColor: kleuren.kaartRand,
              backgroundColor: kleuren.achtergrond,
              paddingHorizontal: contentPadding,
            },
          ]}
        >
          <ResponsiveContainer variant="default">
            <PrimaryButton
              titel="Routine Starten"
              icoon="play"
              size="lg"
              onPress={startRoutine}
            />
          </ResponsiveContainer>
        </View>
      ) : null}

      <RoutineBuilder
        zichtbaar={builderZichtbaar}
        initialRoutine={routine}
        onOpslaan={() => {
          setBuilderZichtbaar(false);
          laadRoutine();
        }}
        onSluiten={() => setBuilderZichtbaar(false)}
      />
    </SafeAreaView>
  );
}

const stijlen = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  inhoud: { paddingTop: SPACING.md },
  icoonKnop: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bewerkKnop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bewerkTekst: {
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
    flex: 1.4,
    minWidth: 0,
  },
  desktopRechts: {
    flex: 0.85,
    maxWidth: 340,
    minWidth: 260,
  },
  oefeningenKolom: {
    gap: 12,
  },
  sectieLabel: {
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  oefeningKaart: {
    width: '100%',
  },
  oefeningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  thumbContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  oefTekstBlok: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  oefeningNaam: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.1,
  },
  groepPillRij: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  groepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
  },
  groepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  groepPillTekst: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  rustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
  },
  rustPillTekst: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  detailsRij: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingVertical: 11,
  },
  detailKolom: {
    flex: 1,
    alignItems: 'center',
  },
  detailScheiding: {
    width: 1,
    height: 26,
  },
  detailLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 3,
  },
  detailWaarde: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  overzichtKaart: {
    gap: 16,
  },
  overzichtStats: {
    flexDirection: 'row',
    gap: 10,
  },
  overzichtStatBox: {
    flex: 1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  overzichtWaarde: {
    fontSize: 22,
    fontFamily: 'Inter_900Black',
    letterSpacing: -0.4,
  },
  overzichtLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  spiergroepenBlok: {
    gap: 8,
  },
  spiergroepenTitel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  spiergroepenPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  sidebarActies: {
    gap: 10,
    marginTop: 4,
  },
  footer: {
    paddingVertical: 14,
    borderTopWidth: 1,
  },
});
