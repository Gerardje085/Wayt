import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useThema } from '../../src/context/ThemeContext';
import { useLiveWorkout, type LiveOefening } from '../../src/context/LiveWorkoutContext';
import { getRoutines, deleteRoutine, type Routine } from '../../src/lib/routineStore';
import { findExercise } from '../../src/data/exercises';
import { GROEP_KLEUR } from '../../src/theme/groepKleuren';
import {
  NAV_METRICS,
  RADIUS,
  SHADOWS,
  SPACING,
  useResponsive,
} from '../../src/theme/designTokens';
import ResponsiveContainer from '../../src/components/ui/ResponsiveContainer';
import ScreenHeader from '../../src/components/ui/ScreenHeader';
import Card from '../../src/components/ui/Card';
import BottomSheet from '../../src/components/ui/BottomSheet';
import PrimaryButton from '../../src/components/ui/PrimaryButton';
import EmptyState from '../../src/components/ui/EmptyState';
import RoutineBuilder from '../../src/components/RoutineBuilder';
import type { ThemaKleuren } from '../../src/types';

function triggerImpact(style: Haptics.ImpactFeedbackStyle) {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(style);
  }
}

function RoutineKaart({
  routine,
  onStart,
  onDetails,
  onBewerk,
  onVerwijder,
  kleuren,
}: {
  routine: Routine;
  onStart: (r: Routine) => void;
  onDetails: (r: Routine) => void;
  onBewerk: (r: Routine) => void;
  onVerwijder: (r: Routine) => void;
  kleuren: ThemaKleuren;
}) {
  const [optiesZichtbaar, setOptiesZichtbaar] = useState(false);

  const webPointer: ViewStyle | undefined =
    Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : undefined;

  const oefeningItems = useMemo(
    () =>
      routine.oefeningen.map((oef) => {
        const gevonden = findExercise(oef.id);
        return {
          id: oef.id,
          naam: gevonden?.naam ?? oef.id,
          kleur: gevonden ? GROEP_KLEUR[gevonden.groep] || kleuren.accent : kleuren.accent,
          setsAantal: oef.sets?.length ?? 0,
        };
      }),
    [routine.oefeningen, kleuren.accent]
  );

  const totaalSets = useMemo(
    () => oefeningItems.reduce((sum, item) => sum + item.setsAantal, 0),
    [oefeningItems]
  );

  const accentStripKleur = oefeningItems[0]?.kleur ?? kleuren.accent;
  const zichtbarePills = oefeningItems.slice(0, 3);
  const overigeAantal = Math.max(0, oefeningItems.length - 3);

  const openOpties = () => {
    triggerImpact(Haptics.ImpactFeedbackStyle.Light);
    setOptiesZichtbaar(true);
  };

  return (
    <Card padding={0} style={s.routineKaart}>
      <View style={s.routineKaartInner}>
        {/* Subtiele spiergroep accentstrip links */}
        <View style={[s.accentStrip, { backgroundColor: accentStripKleur }]} />

        <View style={s.routineBody}>
          {/* Header rij */}
          <View style={s.routineHeaderRij}>
            <TouchableOpacity
              style={[s.routineTitelBlok, webPointer]}
              onPress={() => onDetails(routine)}
              activeOpacity={0.75}
            >
              <Text style={[s.routineNaam, { color: kleuren.tekst }]} numberOfLines={1}>
                {routine.naam}
              </Text>
              <Text style={[s.routineMeta, { color: kleuren.tekstGedimpt }]}>
                {oefeningItems.length}{' '}
                {oefeningItems.length === 1 ? 'oefening' : 'oefeningen'} · {totaalSets}{' '}
                {totaalSets === 1 ? 'set' : 'sets'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                s.optiesKnop,
                {
                  backgroundColor: kleuren.achtergrondSecundair,
                  borderColor: kleuren.kaartRand,
                },
                webPointer,
              ]}
              onPress={openOpties}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Routine opties"
            >
              <Ionicons name="ellipsis-horizontal" size={18} color={kleuren.tekstSecundair} />
            </TouchableOpacity>
          </View>

          {/* Oefening preview pills */}
          <View style={s.pillsContainer}>
            {zichtbarePills.length === 0 ? (
              <Text style={[s.geenOefTekst, { color: kleuren.tekstGedimpt }]}>
                Nog geen oefeningen toegevoegd
              </Text>
            ) : (
              <>
                {zichtbarePills.map((item, idx) => (
                  <View
                    key={`${item.id}-${idx}`}
                    style={[
                      s.oefPill,
                      {
                        backgroundColor: kleuren.achtergrondSecundair,
                        borderColor: kleuren.kaartRand,
                      },
                    ]}
                  >
                    <View style={[s.oefPillDot, { backgroundColor: item.kleur }]} />
                    <Text
                      style={[s.oefPillTekst, { color: kleuren.tekstSecundair }]}
                      numberOfLines={1}
                    >
                      {item.naam}
                    </Text>
                  </View>
                ))}
                {overigeAantal > 0 && (
                  <View
                    style={[
                      s.meerPill,
                      {
                        backgroundColor: kleuren.accentGedimpt,
                        borderColor: kleuren.accent + '38',
                      },
                    ]}
                  >
                    <Text style={[s.meerPillTekst, { color: kleuren.accentLicht }]}>
                      +{overigeAantal} meer
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Actieknop */}
          <View style={s.routineFooter}>
            <PrimaryButton
              titel="Start Routine"
              icoon="play"
              size="sm"
              onPress={() => onStart(routine)}
            />
          </View>
        </View>
      </View>

      {/* BottomSheet opties */}
      <BottomSheet
        visible={optiesZichtbaar}
        onClose={() => setOptiesZichtbaar(false)}
        title={routine.naam}
        subtitle={`${oefeningItems.length} ${oefeningItems.length === 1 ? 'oefening' : 'oefeningen'} · ${totaalSets} sets`}
      >
        <View style={s.sheetOptiesLijst}>
          <TouchableOpacity
            style={[
              s.sheetOptie,
              {
                backgroundColor: kleuren.achtergrondSecundair,
                borderColor: kleuren.kaartRand,
              },
              webPointer,
            ]}
            onPress={() => {
              setOptiesZichtbaar(false);
              onDetails(routine);
            }}
            activeOpacity={0.75}
          >
            <View style={[s.sheetIcoonBadge, { backgroundColor: kleuren.accentGedimpt }]}>
              <Ionicons name="eye-outline" size={18} color={kleuren.accentLicht} />
            </View>
            <Text style={[s.sheetOptieTekst, { color: kleuren.tekst }]}>Details bekijken</Text>
            <Ionicons name="chevron-forward" size={16} color={kleuren.tekstGedimpt} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              s.sheetOptie,
              {
                backgroundColor: kleuren.achtergrondSecundair,
                borderColor: kleuren.kaartRand,
              },
              webPointer,
            ]}
            onPress={() => {
              setOptiesZichtbaar(false);
              onBewerk(routine);
            }}
            activeOpacity={0.75}
          >
            <View style={[s.sheetIcoonBadge, { backgroundColor: kleuren.accentGedimpt }]}>
              <Ionicons name="create-outline" size={18} color={kleuren.accentLicht} />
            </View>
            <Text style={[s.sheetOptieTekst, { color: kleuren.tekst }]}>Routine bewerken</Text>
            <Ionicons name="chevron-forward" size={16} color={kleuren.tekstGedimpt} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              s.sheetVerwijderKnop,
              {
                backgroundColor: kleuren.fout + '14',
                borderColor: kleuren.fout + '3D',
              },
              webPointer,
            ]}
            onPress={() => {
              setOptiesZichtbaar(false);
              onVerwijder(routine);
            }}
            activeOpacity={0.75}
          >
            <Ionicons name="trash-outline" size={18} color={kleuren.fout} />
            <Text style={[s.sheetVerwijderTekst, { color: kleuren.fout }]}>
              Routine verwijderen
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </Card>
  );
}

export default function WorkoutTab() {
  const router = useRouter();
  const { kleuren } = useThema();
  const { startWorkout, isActief } = useLiveWorkout();
  const { isTablet, isDesktop, isDesktopNav, contentPadding } = useResponsive();
  const isTweeKolommen = isTablet || isDesktop;

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [laden, setLaden] = useState(false);
  const [builderZichtbaar, setBuilderZichtbaar] = useState(false);
  const [bewerkRoutine, setBewerkRoutine] = useState<Routine | undefined>(undefined);

  const webPointer: ViewStyle | undefined =
    Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : undefined;

  const laadRoutines = useCallback(async () => {
    setLaden(true);
    const r = await getRoutines();
    setRoutines(r);
    setLaden(false);
  }, []);

  useEffect(() => {
    laadRoutines();
  }, [laadRoutines]);

  const handleStart = useCallback(
    (routine: Routine) => {
      triggerImpact(Haptics.ImpactFeedbackStyle.Medium);

      const liveOef: LiveOefening[] = routine.oefeningen.map((o) => ({
        id: o.id,
        rustTijd: o.rustTijd && o.rustTijd > 0 ? o.rustTijd : undefined,
        sets: o.sets.map((st) => ({
          ...st,
          type: 'normaal' as const,
          completed: false,
        })),
      }));

      startWorkout(routine.naam, routine.id, liveOef);
      router.push('/workout-session');
    },
    [startWorkout, router]
  );

  const handleLegeWorkout = useCallback(() => {
    triggerImpact(Haptics.ImpactFeedbackStyle.Medium);
    startWorkout('Lege Workout', null, []);
    router.push('/workout-session');
  }, [startWorkout, router]);

  const handleVerwijder = useCallback(
    async (routine: Routine) => {
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
            text: 'Verwijderen',
            style: 'destructive',
            onPress: async () => {
              await deleteRoutine(routine.id);
              laadRoutines();
            },
          },
        ]
      );
    },
    [laadRoutines]
  );

  // Groepeer routines in rijen van 2 op tablet/desktop voor gelijke breedtes
  const routineRijen = useMemo(() => {
    if (!isTweeKolommen) return routines.map((r) => [r]);
    const rijen: Routine[][] = [];
    for (let i = 0; i < routines.length; i += 2) {
      rijen.push(routines.slice(i, i + 2));
    }
    return rijen;
  }, [routines, isTweeKolommen]);

  return (
    <SafeAreaView style={[s.veilig, { backgroundColor: kleuren.achtergrond }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          s.scrollInhoud,
          {
            paddingHorizontal: contentPadding,
            paddingBottom: isDesktopNav
              ? isActief
                ? 104
                : SPACING.xxxl
              : NAV_METRICS.mobileContentBottomPadding + (isActief ? 72 : 0),
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={laden}
            onRefresh={laadRoutines}
            tintColor={kleuren.accent}
            colors={[kleuren.accent]}
          />
        }
      >
        <ResponsiveContainer variant="default">
          <ScreenHeader
            title="Trainen"
            subtitle="Start een sessie of kies een routine"
            rightAction={
              isActief ? (
                <TouchableOpacity
                  style={[
                    s.doorgaanKnop,
                    {
                      backgroundColor: kleuren.succes + '1F',
                      borderColor: kleuren.succes + '55',
                    },
                    webPointer,
                  ]}
                  onPress={() => router.push('/workout-session')}
                  activeOpacity={0.8}
                >
                  <View style={[s.liveDot, { backgroundColor: kleuren.succes }]} />
                  <Text style={[s.doorgaanTekst, { color: kleuren.succes }]}>Doorgaan</Text>
                </TouchableOpacity>
              ) : undefined
            }
          />

          {/* Quick-start kaart */}
          {!isActief ? (
            <TouchableOpacity
              style={[
                s.legeWorkoutKaart,
                {
                  backgroundColor: kleuren.accentGedimpt,
                  borderColor: kleuren.accent + '55',
                },
                SHADOWS.forTheme(kleuren.isDark, 'sm'),
                webPointer,
              ]}
              onPress={handleLegeWorkout}
              activeOpacity={0.82}
            >
              <View style={[s.legeWorkoutIcoon, { backgroundColor: kleuren.accent }]}>
                <Ionicons name="flash" size={20} color="#FFFFFF" />
              </View>
              <View style={s.legeWorkoutTekstBlok}>
                <Text style={[s.legeWorkoutTitel, { color: kleuren.tekst }]}>
                  Start Lege Workout
                </Text>
                <Text style={[s.legeWorkoutSub, { color: kleuren.tekstSecundair }]}>
                  Begin direct en voeg onderweg oefeningen toe
                </Text>
              </View>
              <View
                style={[
                  s.legeWorkoutActiePill,
                  {
                    backgroundColor: kleuren.kaart,
                    borderColor: kleuren.kaartRand,
                  },
                ]}
              >
                <Ionicons name="add" size={18} color={kleuren.accentLicht} />
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                s.actiefBanner,
                {
                  backgroundColor: kleuren.succes + '14',
                  borderColor: kleuren.succes + '44',
                },
                webPointer,
              ]}
              onPress={() => router.push('/workout-session')}
              activeOpacity={0.82}
            >
              <View style={[s.legeWorkoutIcoon, { backgroundColor: kleuren.succes }]}>
                <Ionicons name="pulse" size={20} color="#FFFFFF" />
              </View>
              <View style={s.legeWorkoutTekstBlok}>
                <Text style={[s.legeWorkoutTitel, { color: kleuren.tekst }]}>
                  Workout is bezig
                </Text>
                <Text style={[s.legeWorkoutSub, { color: kleuren.tekstSecundair }]}>
                  Tik om verder te gaan met je actieve sessie
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={kleuren.succes} />
            </TouchableOpacity>
          )}

          {/* Routines sectie header */}
          <View style={s.routinesHeader}>
            <View style={s.routinesTitelRij}>
              <Text style={[s.routinesTitel, { color: kleuren.tekst }]}>Mijn Routines</Text>
              <View
                style={[
                  s.aantalBadge,
                  {
                    backgroundColor: kleuren.kaart,
                    borderColor: kleuren.kaartRand,
                  },
                ]}
              >
                <Text style={[s.aantalBadgeTekst, { color: kleuren.tekstSecundair }]}>
                  {routines.length}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                s.nieuweRoutineKnop,
                {
                  backgroundColor: kleuren.kaart,
                  borderColor: kleuren.kaartRand,
                },
                webPointer,
              ]}
              onPress={() => {
                setBewerkRoutine(undefined);
                setBuilderZichtbaar(true);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={17} color={kleuren.accentLicht} />
              <Text style={[s.nieuweRoutineTekst, { color: kleuren.tekst }]}>Nieuwe routine</Text>
            </TouchableOpacity>
          </View>

          {/* Routines lijst / 2-koloms desktop grid */}
          {routines.length === 0 ? (
            <EmptyState
              icoon="document-text-outline"
              titel="Geen routines"
              subtekst="Maak je eerste routine aan om gestructureerd te trainen en je voortgang te meten."
              actieTekst="Maak Routine"
              onActie={() => {
                setBewerkRoutine(undefined);
                setBuilderZichtbaar(true);
              }}
            />
          ) : (
            <View style={s.routinesLijst}>
              {routineRijen.map((rij, rijIndex) => (
                <View key={`rij-${rijIndex}`} style={isTweeKolommen ? s.gridRij : undefined}>
                  {rij.map((r) => (
                    <View key={r.id} style={isTweeKolommen ? s.gridKolom : s.enkelItem}>
                      <RoutineKaart
                        routine={r}
                        onStart={handleStart}
                        onDetails={(routine) => router.push(`/routine/${routine.id}`)}
                        onBewerk={(routine) => {
                          setBewerkRoutine(routine);
                          setBuilderZichtbaar(true);
                        }}
                        onVerwijder={handleVerwijder}
                        kleuren={kleuren}
                      />
                    </View>
                  ))}
                  {isTweeKolommen && rij.length === 1 ? <View style={s.gridKolom} /> : null}
                </View>
              ))}
            </View>
          )}
        </ResponsiveContainer>
      </ScrollView>

      <RoutineBuilder
        zichtbaar={builderZichtbaar}
        initialRoutine={bewerkRoutine}
        onOpslaan={() => {
          setBuilderZichtbaar(false);
          laadRoutines();
        }}
        onSluiten={() => setBuilderZichtbaar(false)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  veilig: { flex: 1 },
  scrollInhoud: {
    paddingTop: SPACING.md,
  },
  doorgaanKnop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  doorgaanTekst: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
  },
  legeWorkoutKaart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 26,
  },
  actiefBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 26,
  },
  legeWorkoutIcoon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legeWorkoutTekstBlok: {
    flex: 1,
    minWidth: 0,
  },
  legeWorkoutTitel: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.2,
  },
  legeWorkoutSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  legeWorkoutActiePill: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routinesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  routinesTitelRij: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routinesTitel: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.2,
  },
  aantalBadge: {
    minWidth: 24,
    height: 22,
    paddingHorizontal: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aantalBadgeTekst: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  nieuweRoutineKnop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  nieuweRoutineTekst: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  routinesLijst: {
    gap: 14,
  },
  gridRij: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'stretch',
  },
  gridKolom: {
    flex: 1,
    minWidth: 0,
  },
  enkelItem: {
    width: '100%',
  },
  routineKaart: {
    overflow: 'hidden',
    flex: 1,
  },
  routineKaartInner: {
    flexDirection: 'row',
    flex: 1,
  },
  accentStrip: {
    width: 4,
  },
  routineBody: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  routineHeaderRij: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  routineTitelBlok: {
    flex: 1,
    minWidth: 0,
  },
  routineNaam: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.2,
  },
  routineMeta: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 3,
  },
  optiesKnop: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  geenOefTekst: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  oefPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: '100%',
  },
  oefPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  oefPillTekst: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    flexShrink: 1,
  },
  meerPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  meerPillTekst: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  routineFooter: {
    marginTop: 'auto',
  },
  sheetOptiesLijst: {
    gap: 10,
  },
  sheetOptie: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  sheetIcoonBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetOptieTekst: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  sheetVerwijderKnop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: 4,
  },
  sheetVerwijderTekst: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
});
