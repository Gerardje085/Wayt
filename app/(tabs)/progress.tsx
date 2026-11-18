import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Platform, type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useThema } from '../../src/context/ThemeContext';
import { useLiveWorkout } from '../../src/context/LiveWorkoutContext';
import { useVoortgang } from '../../src/hooks/useWorkouts';
import { groepeerNaarSessies } from '../../src/utils/sessieGroepering';
import { findExercise } from '../../src/data/exercises';
import ProgressChart, { type GrafiekModus } from '../../src/components/ProgressChart';
import ErrorBanner from '../../src/components/ErrorBanner';
import { SkeletonStatKaart } from '../../src/components/SkeletonLoader';
import ExerciseSelector from '../../src/components/ExerciseSelector';
import StatCard from '../../src/components/ui/StatCard';
import { ResponsiveContainer } from '../../src/components/ui/ResponsiveContainer';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { Card } from '../../src/components/ui/Card';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { NAV_METRICS, RADIUS, SPACING, useResponsive } from '../../src/theme/designTokens';

const WEB_POINTER = Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : undefined;

const ROM_OEFENINGEN = [
  { naam: 'Bench Press', rom: 0.40, kleur: '#EF4444', icoon: 'barbell-outline' },
  { naam: 'Lat Pulldown', rom: 0.60, kleur: '#3B82F6', icoon: 'arrow-down-circle-outline' },
  { naam: 'Leg Extension', rom: 0.50, kleur: '#22C55E', icoon: 'arrow-forward-circle-outline' },
  { naam: 'Overig', rom: 0.45, kleur: '#A855F7', icoon: 'fitness-outline' },
];
const MAX_ROM = Math.max(...ROM_OEFENINGEN.map(o => o.rom));

const GRAFIEK_MODI: { id: GrafiekModus; label: string }[] = [
  { id: 'volume', label: 'Volume' },
  { id: 'arbeid', label: 'Arbeid (J)' },
  { id: 'eenRM', label: 'Gesch. 1RM' },
];

export default function ProgressScreen() {
  const { user } = useAuth();
  const { kleuren } = useThema();
  const { isActief } = useLiveWorkout();
  const { isDesktopNav } = useResponsive();
  const [oefening, setOef] = useState('0025');
  const [selectorZicht, setSelectorZicht] = useState(false);
  const [grafiekModus, setGrafiekModus] = useState<GrafiekModus>('volume');
  const actieveOefeningInfo = findExercise(oefening);
  const actieveOefeningNaam = actieveOefeningInfo?.naam ?? oefening;

  const { haalVoortgangOp, workouts, laden, fout } = useVoortgang(user?.id);

  const vernieuwen = useCallback(() => {
    haalVoortgangOp(oefening);
  }, [oefening, haalVoortgangOp]);

  useEffect(() => { vernieuwen(); }, [vernieuwen]);

  const sessies = React.useMemo(() => groepeerNaarSessies(workouts), [workouts]);
  const n = sessies.length;
  const eersteVol = n > 0 ? sessies[0].totaalVolume : 0;
  const huidigeVol = n > 0 ? sessies[n - 1].totaalVolume : 0;
  const huidigeArbeid = n > 0 ? sessies[n - 1].totaalArbeid : 0;
  const huidig1RM = n > 0 ? sessies[n - 1].beste1RM : 0;
  const groei = eersteVol > 0 ? (((huidigeVol - eersteVol) / eersteVol) * 100).toFixed(1) : '0.0';
  const groeiGetal = parseFloat(groei);

  const recent = [...sessies].reverse().slice(0, 5);

  return (
    <SafeAreaView style={[stijlen.veilig, { backgroundColor: kleuren.achtergrond }]}>
      <ScrollView
        style={stijlen.scroll}
        contentContainerStyle={[
          stijlen.inhoud,
          {
            paddingBottom: isDesktopNav
              ? (isActief ? 104 : 40)
              : NAV_METRICS.mobileContentBottomPadding + (isActief ? 72 : 0),
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={laden}
            onRefresh={vernieuwen}
            tintColor={kleuren.accent}
            colors={[kleuren.accent]}
          />
        }
      >
        <ResponsiveContainer variant="default" padded>
          <ScreenHeader
            title="Voortgang"
            subtitle="Bekijk je trainingsdata en voortgang per oefening"
          />

          {/* Oefening Selector */}
          <Text style={[stijlen.sectie, { color: kleuren.tekstGedimpt }]}>OEFENING</Text>
          <TouchableOpacity
            style={[
              stijlen.pickerWrapper,
              { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand },
              WEB_POINTER,
            ]}
            onPress={() => setSelectorZicht(true)}
            activeOpacity={0.75}
            accessibilityLabel="Oefening kiezen"
          >
            <View style={stijlen.pickerLinks}>
              <View style={[stijlen.pickerIcoonBadge, { backgroundColor: kleuren.accentGedimpt }]}>
                <Ionicons
                  name={(actieveOefeningInfo?.icoon as any) || 'barbell-outline'}
                  size={18}
                  color={kleuren.accentLicht}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[stijlen.pickerNaam, { color: kleuren.tekst }]} numberOfLines={1}>
                  {actieveOefeningNaam}
                </Text>
                {actieveOefeningInfo?.groep ? (
                  <Text style={[stijlen.pickerSub, { color: kleuren.tekstGedimpt }]}>
                    {actieveOefeningInfo.groep}
                  </Text>
                ) : null}
              </View>
            </View>
            <Ionicons name="chevron-down" size={20} color={kleuren.tekstSecundair} />
          </TouchableOpacity>

          {fout && <ErrorBanner bericht={fout} onProbeerOpnieuw={vernieuwen} />}

          {/* Samenvatting */}
          <Text style={[stijlen.sectie, { color: kleuren.tekstGedimpt }]}>SAMENVATTING</Text>
          <View style={stijlen.statRij}>
            {laden ? (
              <>
                <SkeletonStatKaart stijl={{ flex: 1 }} />
                <SkeletonStatKaart stijl={{ flex: 1 }} />
                <SkeletonStatKaart stijl={{ flex: 1 }} />
              </>
            ) : (
              <>
                <StatCard waarde={String(n)} label="Sessies" icoon="calendar-outline" />
                <StatCard waarde={`${huidig1RM} kg`} label="1RM" icoon="trophy-outline" kleur={kleuren.waarschuwing} />
                <StatCard
                  waarde={`${groeiGetal >= 0 ? '+' : ''}${groei}%`}
                  label="Volume groei"
                  icoon="trending-up-outline"
                  kleur={groeiGetal >= 0 ? kleuren.succes : kleuren.fout}
                />
              </>
            )}
          </View>

          {!laden && n > 0 && (
            <Card
              style={[
                stijlen.arbeidKaart,
                { backgroundColor: kleuren.accentGedimpt, borderColor: kleuren.accent + '44' },
              ]}
            >
              <View>
                <Text style={[stijlen.arbeidLabel, { color: kleuren.tekstSecundair }]}>
                  Mechanische arbeid (laatste sessie)
                </Text>
                <Text style={[stijlen.arbeidWaarde, { color: kleuren.tekst }]}>
                  {huidigeArbeid.toFixed(0)} J
                </Text>
              </View>
              <View style={[stijlen.arbeidIcoonBadge, { backgroundColor: kleuren.accent + '22' }]}>
                <Ionicons name="flash" size={24} color={kleuren.accentLicht} />
              </View>
            </Card>
          )}

          {/* Grafiek Card */}
          <Card style={stijlen.sectieKaart}>
            <View style={stijlen.grafiekKop}>
              <Text style={[stijlen.kaartTitel, { color: kleuren.tekstGedimpt }]}>GRAFIEK</Text>
              <View style={[stijlen.modusSwitcher, { backgroundColor: kleuren.achtergrondSecundair, borderColor: kleuren.kaartRand }]}>
                {GRAFIEK_MODI.map(m => {
                  const actief = grafiekModus === m.id;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={[
                        stijlen.modusKnop,
                        actief && { backgroundColor: kleuren.accent },
                        WEB_POINTER,
                      ]}
                      onPress={() => setGrafiekModus(m.id)}
                      activeOpacity={0.75}
                    >
                      <Text style={[stijlen.modusKnopTekst, { color: actief ? '#FFFFFF' : kleuren.tekstSecundair }]}>
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <ProgressChart workouts={workouts} laden={laden} modus={grafiekModus} />
          </Card>

          {/* Desktop 2-column split for ROM + Recent Sessions */}
          <View style={isDesktopNav ? stijlen.desktopSplit : undefined}>
            <View style={isDesktopNav ? { flex: 1 } : undefined}>
              <Card style={stijlen.sectieKaart}>
                <Text style={[stijlen.kaartTitel, { color: kleuren.tekstGedimpt, marginBottom: 10 }]}>
                  SLAGLENGTE & ARBEID
                </Text>
                <Text style={[stijlen.romTitel, { color: kleuren.tekst }]}>
                  Waarom kost dezelfde last meer of minder energie?
                </Text>
                <Text style={[stijlen.romTekst, { color: kleuren.tekstSecundair }]}>
                  De mechanische arbeid (Joules) hangt af van de slaglengte (ROM): hoe verder je de last beweegt, hoe meer energie je verbruikt.
                </Text>
                <View style={stijlen.romLijst}>
                  {ROM_OEFENINGEN.map(oef => (
                    <View key={oef.naam} style={stijlen.romRij}>
                      <Ionicons name={oef.icoon as any} size={16} color={oef.kleur} />
                      <Text style={[stijlen.romNaam, { color: kleuren.tekst }]}>{oef.naam}</Text>
                      <View style={[stijlen.romBalkContainer, { backgroundColor: kleuren.achtergrondSecundair }]}>
                        <View
                          style={[
                            stijlen.romBalk,
                            { width: `${(oef.rom / MAX_ROM) * 100}%`, backgroundColor: oef.kleur },
                          ]}
                        />
                      </View>
                      <Text style={[stijlen.romWaarde, { color: oef.kleur }]}>{oef.rom.toFixed(2)} m</Text>
                    </View>
                  ))}
                </View>
                <Text style={[stijlen.romFormule, { color: kleuren.tekstGedimpt, borderTopColor: kleuren.kaartRand }]}>
                  W = m × g × ROM × reps
                </Text>
              </Card>
            </View>

            <View style={isDesktopNav ? { flex: 1 } : undefined}>
              <Card style={stijlen.sectieKaart}>
                <Text style={[stijlen.kaartTitel, { color: kleuren.tekstGedimpt, marginBottom: 12 }]}>
                  RECENTE SESSIES
                </Text>
                {!laden && recent.length === 0 ? (
                  <EmptyState
                    icoon="analytics-outline"
                    titel="Nog geen sessies"
                    subtekst={`Log eerst een training voor ${actieveOefeningNaam}.`}
                    compact
                  />
                ) : (
                  <View style={[stijlen.tabel, { borderColor: kleuren.kaartRand }]}>
                    <View style={[stijlen.tabelRij, { backgroundColor: kleuren.achtergrondSecundair }]}>
                      {['Datum', 'S×R', 'Gewicht', '1RM'].map((h, i) => (
                        <Text
                          key={h}
                          style={[stijlen.tabelKop, { color: kleuren.tekstGedimpt, flex: i === 0 ? 1.4 : 1 }]}
                        >
                          {h}
                        </Text>
                      ))}
                    </View>
                    {recent.map((ses, i) => (
                      <View
                        key={ses.sleutel}
                        style={[
                          stijlen.tabelRij,
                          {
                            borderTopWidth: 1,
                            borderTopColor: kleuren.kaartRand,
                            backgroundColor: i % 2 === 1 ? kleuren.achtergrondSecundair + '88' : 'transparent',
                          },
                        ]}
                      >
                        <Text style={[stijlen.tabelCel, { color: kleuren.tekstSecundair, flex: 1.4 }]}>
                          {new Date(ses.datum).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' })}
                        </Text>
                        <Text style={[stijlen.tabelCel, { color: kleuren.tekst }]}>
                          {ses.aantalWerkSets}×{ses.topReps}
                        </Text>
                        <Text style={[stijlen.tabelCel, { color: kleuren.tekst }]}>
                          {ses.topGewicht} kg
                        </Text>
                        <Text style={[stijlen.tabelCel, { color: kleuren.waarschuwing, fontFamily: 'Inter_700Bold' }]}>
                          {ses.beste1RM} kg
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </Card>
            </View>
          </View>
        </ResponsiveContainer>
      </ScrollView>

      <ExerciseSelector
        zichtbaar={selectorZicht}
        huidigeSelectie={oefening}
        onSelecteer={setOef}
        onSluiten={() => setSelectorZicht(false)}
      />
    </SafeAreaView>
  );
}

const stijlen = StyleSheet.create({
  veilig: { flex: 1 },
  scroll: { flex: 1 },
  inhoud: { paddingTop: SPACING.sm },
  sectie: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  pickerWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
    padding: 14,
  },
  pickerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  pickerIcoonBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerNaam: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  pickerSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 1,
  },
  statRij: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.base,
  },
  arbeidKaart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  arbeidLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  arbeidWaarde: {
    fontSize: 26,
    fontFamily: 'Inter_900Black',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  arbeidIcoonBadge: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectieKaart: {
    marginBottom: SPACING.base,
  },
  grafiekKop: {
    gap: 12,
    marginBottom: 14,
  },
  kaartTitel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  modusSwitcher: {
    flexDirection: 'row',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  modusKnop: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  modusKnopTekst: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  desktopSplit: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  romTitel: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    marginBottom: 6,
  },
  romTekst: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    marginBottom: 16,
  },
  romLijst: { gap: 12 },
  romRij: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  romNaam: {
    width: 100,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  romBalkContainer: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  romBalk: {
    height: '100%',
    borderRadius: 4,
  },
  romWaarde: {
    width: 44,
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  romFormule: {
    marginTop: 16,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontStyle: 'italic',
    textAlign: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  tabel: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tabelRij: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  tabelKop: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    textAlign: 'center',
    flex: 1,
  },
  tabelCel: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});
