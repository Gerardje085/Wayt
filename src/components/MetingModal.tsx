// ─────────────────────────────────────────────────────────────────────────────
// Wayt – MetingModal (Wetenschappelijke 1RM Wizard)
// Onderzoek: Gestandaardiseerd meetprotocol voor nulmeting (baseline)
// en eindmeting (endline) met warmup-ramp, rusttimers en Epley 1RM opslag.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, Platform, type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThema } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { bereken1RM } from '../context/LiveWorkoutContext';
import { berekenVolume, berekenArbeid } from '../utils/physics';
import { vertaalFout } from '../utils/errorVertaler';
import { insertWorkoutsVeilig } from '../hooks/useWorkouts';
import { genereerUuid } from '../utils/sessieGroepering';
import { BottomSheet } from './ui/BottomSheet';
import { RADIUS } from '../theme/designTokens';

const WEB_POINTER = Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : undefined;

const KERN_OEFENINGEN = [
  { id: 'barbell_bench_press', naam: 'Bench Press', icoon: 'barbell-outline', startGewicht: 60 },
  { id: 'barbell_squat', naam: 'Squat', icoon: 'body-outline', startGewicht: 80 },
  { id: 'barbell_deadlift', naam: 'Deadlift', icoon: 'fitness-outline', startGewicht: 100 },
  { id: 'lat_pulldown', naam: 'Lat Pulldown', icoon: 'arrow-down-circle-outline', startGewicht: 60 },
  { id: 'leg_extension', naam: 'Leg Extension', icoon: 'arrow-forward-circle-outline', startGewicht: 50 },
] as const;

type WarmupStap = {
  label: string;
  percentage: number;
  sets: number;
  reps: number;
  gewicht: number;
};

function berekenWarmupRamp(doelGewicht: number): WarmupStap[] {
  return [
    { label: 'Opwarmen 1', percentage: 50, sets: 1, reps: 8, gewicht: Math.round(doelGewicht * 0.50 / 2.5) * 2.5 },
    { label: 'Opwarmen 2', percentage: 70, sets: 1, reps: 5, gewicht: Math.round(doelGewicht * 0.70 / 2.5) * 2.5 },
    { label: 'Opwarmen 3', percentage: 85, sets: 1, reps: 2, gewicht: Math.round(doelGewicht * 0.85 / 2.5) * 2.5 },
    { label: 'Test poging', percentage: 100, sets: 1, reps: 1, gewicht: doelGewicht },
  ];
}

type WizardStap = 'selecteer' | 'warmup' | 'testpoging' | 'resultaat';

interface MetingModalProps {
  zichtbaar: boolean;
  onSluiten: () => void;
}

function toonWaarschuwing(titel: string, bericht?: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(bericht ? `${titel}\n\n${bericht}` : titel);
  } else {
    Alert.alert(titel, bericht);
  }
}

export default function MetingModal({ zichtbaar, onSluiten }: MetingModalProps) {
  const { kleuren } = useThema();
  const { user } = useAuth();

  const [wizardStap, setWizardStap] = useState<WizardStap>('selecteer');
  const [testMoment, setTestMoment] = useState<'baseline' | 'endline'>('baseline');
  const [gekozenOefIndex, setGekozenOefIndex] = useState(0);
  const [doelGewichtStr, setDoelGewichtStr] = useState('');
  const [warmupStapIndex, setWarmupStapIndex] = useState(0);
  const [gewichtStr, setGewichtStr] = useState('');
  const [repsStr, setRepsStr] = useState('');
  const [laden, setLaden] = useState(false);

  const [rustSeconden, setRustSeconden] = useState(0);
  const [rustLoopt, setRustLoopt] = useState(false);
  const rustRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const gekozenOef = KERN_OEFENINGEN[gekozenOefIndex];
  const doelGewicht = parseFloat(doelGewichtStr.replace(',', '.')) || gekozenOef.startGewicht;
  const warmupRamp = berekenWarmupRamp(doelGewicht);
  const huidigeWarmupStap = warmupRamp[warmupStapIndex];

  const gewicht = parseFloat(gewichtStr.replace(',', '.')) || 0;
  const reps = parseInt(repsStr, 10) || 0;
  const berekend1RM = gewicht > 0 && reps > 0 ? bereken1RM(gewicht, reps) : null;

  const stopRust = useCallback(() => {
    if (rustRef.current) {
      clearInterval(rustRef.current);
      rustRef.current = null;
    }
    setRustLoopt(false);
    setRustSeconden(0);
  }, []);

  useEffect(() => {
    return () => {
      if (rustRef.current) clearInterval(rustRef.current);
    };
  }, []);

  const startRust = useCallback((seconden: number) => {
    if (rustRef.current) clearInterval(rustRef.current);
    setRustSeconden(seconden);
    setRustLoopt(true);
    rustRef.current = setInterval(() => {
      setRustSeconden(prev => {
        if (prev <= 1) {
          if (rustRef.current) {
            clearInterval(rustRef.current);
            rustRef.current = null;
          }
          setRustLoopt(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const resetWizard = useCallback(() => {
    setWizardStap('selecteer');
    setTestMoment('baseline');
    setGekozenOefIndex(0);
    setDoelGewichtStr('');
    setWarmupStapIndex(0);
    setGewichtStr('');
    setRepsStr('');
    stopRust();
  }, [stopRust]);

  const sluitModal = useCallback(() => {
    stopRust();
    resetWizard();
    onSluiten();
  }, [stopRust, resetWizard, onSluiten]);

  const naarWarmup = () => {
    setWarmupStapIndex(0);
    setWizardStap('warmup');
  };

  const warmupVolgende = () => {
    stopRust();
    const volgend = warmupStapIndex + 1;
    if (volgend >= warmupRamp.length - 1) {
      setWizardStap('testpoging');
      setGewichtStr(String(doelGewicht));
      setRepsStr('');
      startRust(120);
    } else {
      setWarmupStapIndex(volgend);
      const rustDuur = volgend >= 2 ? 120 : 90;
      startRust(rustDuur);
    }
  };

  const handleOpslaan = async () => {
    if (!user?.id) return;
    if (gewicht <= 0 || reps <= 0) {
      toonWaarschuwing('Vul gewicht en herhalingen in');
      return;
    }
    setLaden(true);
    try {
      const volume = berekenVolume(1, reps, gewicht);
      const arbeid = berekenArbeid(gekozenOef.id, reps, gewicht);
      const { error } = await insertWorkoutsVeilig({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        exercise: gekozenOef.id,
        sets: 1,
        reps,
        weight: gewicht,
        volume: parseFloat(volume.toFixed(2)),
        work_joules: parseFloat(arbeid.toFixed(2)),
        is_meting: true,
        test_moment: testMoment,
        session_id: genereerUuid(),
        set_number: 1,
        set_type: 'normaal',
      });
      if (error) throw error;
      setWizardStap('resultaat');
    } catch (err) {
      toonWaarschuwing('Opslaan mislukt', vertaalFout(err, 'Kon de 1RM-meting niet opslaan. Probeer het opnieuw.'));
    } finally {
      setLaden(false);
    }
  };

  const formatTijd = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

  return (
    <BottomSheet
      visible={zichtbaar}
      onClose={sluitModal}
      title="Officiële 1RM Meting"
      subtitle="Gestandaardiseerd meetprotocol met opwarmschema"
      maxWidth={540}
      scrollable
    >
      {/* STAP 1: Selecteer */}
      {wizardStap === 'selecteer' && (
        <>
          <Text style={[s.sectionLabel, { color: kleuren.tekstGedimpt }]}>MEETMOMENT</Text>
          <View style={[s.tabRij, { backgroundColor: kleuren.achtergrondSecundair, borderColor: kleuren.kaartRand }]}>
            {(['baseline', 'endline'] as const).map((val) => {
              const actief = testMoment === val;
              return (
                <TouchableOpacity
                  key={val}
                  style={[s.tab, actief && { backgroundColor: kleuren.accent }, WEB_POINTER]}
                  onPress={() => setTestMoment(val)}
                  activeOpacity={0.75}
                >
                  <Text style={[s.tabTekst, { color: actief ? '#FFFFFF' : kleuren.tekstSecundair }]}>
                    {val === 'baseline' ? 'Week 0 – Nulmeting' : 'Week 6 – Eindmeting'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[s.sectionLabel, { color: kleuren.tekstGedimpt }]}>OEFENING</Text>
          <View style={s.oefeningRij}>
            {KERN_OEFENINGEN.map((oef, idx) => {
              const actief = gekozenOefIndex === idx;
              return (
                <TouchableOpacity
                  key={oef.id}
                  style={[
                    s.oefeningKnop,
                    {
                      borderColor: actief ? kleuren.accent : kleuren.kaartRand,
                      backgroundColor: actief ? kleuren.accentGedimpt : kleuren.achtergrondSecundair,
                    },
                    WEB_POINTER,
                  ]}
                  onPress={() => setGekozenOefIndex(idx)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={oef.icoon as any}
                    size={18}
                    color={actief ? kleuren.accentLicht : kleuren.tekstGedimpt}
                  />
                  <Text style={[s.oefeningTekst, { color: actief ? kleuren.tekst : kleuren.tekstSecundair }]}>
                    {oef.naam}
                  </Text>
                  {actief && <Ionicons name="checkmark-circle" size={18} color={kleuren.accentLicht} style={{ marginLeft: 'auto' }} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[s.sectionLabel, { color: kleuren.tekstGedimpt }]}>GESCHAT MAXIMAAL GEWICHT (KG)</Text>
          <TextInput
            style={[
              s.invoer,
              { color: kleuren.tekst, backgroundColor: kleuren.achtergrondSecundair, borderColor: kleuren.kaartRand },
            ]}
            value={doelGewichtStr}
            onChangeText={setDoelGewichtStr}
            keyboardType="decimal-pad"
            placeholder={String(gekozenOef.startGewicht)}
            placeholderTextColor={kleuren.tekstGedimpt}
          />
          <Text style={[s.uitlegTekst, { color: kleuren.tekstSecundair }]}>
            Voer het gewicht in dat je denkt te kunnen tillen voor 1 herhaling. Het warmup-schema wordt hier automatisch op gebaseerd.
          </Text>

          <TouchableOpacity
            style={[s.primaryKnop, { backgroundColor: kleuren.accent }, WEB_POINTER]}
            onPress={naarWarmup}
            activeOpacity={0.85}
          >
            <Ionicons name="flame-outline" size={18} color="#FFFFFF" />
            <Text style={s.primaryKnopTekst}>Start Warmup Schema</Text>
          </TouchableOpacity>
        </>
      )}

      {/* STAP 2: Warmup */}
      {wizardStap === 'warmup' && (
        <>
          <Text style={[s.sectionLabel, { color: kleuren.tekstGedimpt }]}>
            WARMUP SCHEMA · {gekozenOef.naam.toUpperCase()}
          </Text>

          <View style={s.progressRij}>
            {warmupRamp.slice(0, -1).map((_, idx) => (
              <View
                key={idx}
                style={[
                  s.progressPil,
                  {
                    backgroundColor: idx < warmupStapIndex
                      ? kleuren.succes
                      : idx === warmupStapIndex
                        ? kleuren.accent
                        : kleuren.kaartRand,
                  },
                ]}
              />
            ))}
          </View>

          <View style={[s.stapKaart, { backgroundColor: kleuren.accentGedimpt, borderColor: kleuren.accent + '44' }]}>
            <Text style={[s.stapNummer, { color: kleuren.accentLicht }]}>
              {huidigeWarmupStap.label} ({huidigeWarmupStap.percentage}%)
            </Text>
            <Text style={[s.stapGewicht, { color: kleuren.tekst }]}>
              {huidigeWarmupStap.sets}×{huidigeWarmupStap.reps} @ {huidigeWarmupStap.gewicht} kg
            </Text>
          </View>

          {rustLoopt && (
            <View style={[s.rustBalk, { backgroundColor: kleuren.waarschuwing + '16', borderColor: kleuren.waarschuwing + '44' }]}>
              <Ionicons name="timer-outline" size={17} color={kleuren.waarschuwing} />
              <Text style={[s.rustTekst, { color: kleuren.waarschuwing }]}>
                Rust: {formatTijd(rustSeconden)}
              </Text>
              <TouchableOpacity onPress={stopRust} style={WEB_POINTER}>
                <Text style={{ color: kleuren.tekstSecundair, fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>Overslaan</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[
              s.primaryKnop,
              { backgroundColor: rustLoopt ? kleuren.kaartRand : kleuren.accent },
              WEB_POINTER,
            ]}
            onPress={warmupVolgende}
            disabled={rustLoopt}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
            <Text style={s.primaryKnopTekst}>
              {warmupStapIndex < warmupRamp.length - 2 ? 'Volgende warmup stap' : 'Start testpoging'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[s.secondaryKnop, WEB_POINTER]} onPress={() => setWizardStap('selecteer')}>
            <Text style={{ color: kleuren.tekstSecundair, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>
              Terug naar selectie
            </Text>
          </TouchableOpacity>
        </>
      )}

      {/* STAP 3: Testpoging */}
      {wizardStap === 'testpoging' && (
        <>
          <Text style={[s.sectionLabel, { color: kleuren.tekstGedimpt }]}>
            TESTPOGING · {gekozenOef.naam.toUpperCase()}
          </Text>

          {rustLoopt && (
            <View style={[s.rustBalk, { backgroundColor: kleuren.succes + '16', borderColor: kleuren.succes + '44' }]}>
              <Ionicons name="timer-outline" size={17} color={kleuren.succes} />
              <Text style={[s.rustTekst, { color: kleuren.succes }]}>
                Rust voor testpoging: {formatTijd(rustSeconden)}
              </Text>
              <TouchableOpacity onPress={stopRust} style={WEB_POINTER}>
                <Text style={{ color: kleuren.tekstSecundair, fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>Overslaan</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={[s.uitlegTekst, { color: kleuren.tekstSecundair }]}>
            Voer het werkelijke gewicht en het aantal herhalingen in dat je hebt afgerond. De 1RM wordt automatisch berekend via de Epley-formule.
          </Text>

          <View style={s.invoerRij}>
            <View style={s.invoerBlok}>
              <Text style={[s.invoerLabel, { color: kleuren.tekstGedimpt }]}>Gewicht (kg)</Text>
              <TextInput
                style={[
                  s.invoerVeld,
                  { color: kleuren.tekst, backgroundColor: kleuren.achtergrondSecundair, borderColor: kleuren.kaartRand },
                ]}
                value={gewichtStr}
                onChangeText={setGewichtStr}
                keyboardType="decimal-pad"
                placeholder={String(doelGewicht)}
                placeholderTextColor={kleuren.tekstGedimpt}
              />
            </View>
            <View style={s.invoerBlok}>
              <Text style={[s.invoerLabel, { color: kleuren.tekstGedimpt }]}>Herhalingen</Text>
              <TextInput
                style={[
                  s.invoerVeld,
                  { color: kleuren.tekst, backgroundColor: kleuren.achtergrondSecundair, borderColor: kleuren.kaartRand },
                ]}
                value={repsStr}
                onChangeText={setRepsStr}
                keyboardType="number-pad"
                placeholder="1"
                placeholderTextColor={kleuren.tekstGedimpt}
              />
            </View>
          </View>

          {berekend1RM !== null && (
            <View style={[s.resultaatKaart, { backgroundColor: kleuren.waarschuwing + '18', borderColor: kleuren.waarschuwing + '44' }]}>
              <Text style={[s.resultaatLabel, { color: kleuren.tekstSecundair }]}>Geschat 1RM (Epley)</Text>
              <Text style={[s.resultaatWaarde, { color: kleuren.waarschuwing }]}>{berekend1RM} kg</Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              s.primaryKnop,
              { backgroundColor: laden ? kleuren.tekstGedimpt : kleuren.accent },
              WEB_POINTER,
            ]}
            onPress={handleOpslaan}
            disabled={laden}
            activeOpacity={0.85}
          >
            {laden ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="#FFFFFF" />
                <Text style={s.primaryKnopTekst}>Meting opslaan</Text>
              </>
            )}
          </TouchableOpacity>
        </>
      )}

      {/* STAP 4: Resultaat */}
      {wizardStap === 'resultaat' && (
        <>
          <View style={[s.resultaatSucces, { backgroundColor: kleuren.succes + '14', borderColor: kleuren.succes + '44' }]}>
            <Ionicons name="checkmark-circle" size={44} color={kleuren.succes} />
            <Text style={[s.resultaatSuccesTitel, { color: kleuren.tekst }]}>
              Meting opgeslagen!
            </Text>
            <Text style={[s.resultaatSuccesOef, { color: kleuren.tekstSecundair }]}>
              {gekozenOef.naam} — {testMoment === 'baseline' ? 'Nulmeting (Week 0)' : 'Eindmeting (Week 6)'}
            </Text>
            {berekend1RM !== null && (
              <Text style={[s.resultaatSucces1RM, { color: kleuren.waarschuwing }]}>
                1RM: {berekend1RM} kg
              </Text>
            )}
            <Text style={[s.resultaatSuccesSub, { color: kleuren.tekstGedimpt }]}>
              {gewicht} kg × {reps} herhalingen
            </Text>
          </View>

          <TouchableOpacity
            style={[s.primaryKnop, { backgroundColor: kleuren.accent }, WEB_POINTER]}
            onPress={resetWizard}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
            <Text style={s.primaryKnopTekst}>Nieuwe meting starten</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.secondaryKnop, WEB_POINTER]} onPress={sluitModal}>
            <Text style={{ color: kleuren.tekstSecundair, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Sluiten</Text>
          </TouchableOpacity>
        </>
      )}
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.3,
    marginBottom: 10,
  },
  tabRij: {
    flexDirection: 'row',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 4,
    marginBottom: 18,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabTekst: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  oefeningRij: {
    gap: 8,
    marginBottom: 18,
  },
  oefeningKnop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  oefeningTekst: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  invoer: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: 10,
    fontVariant: ['tabular-nums'],
  },
  uitlegTekst: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
    marginBottom: 18,
  },
  primaryKnop: {
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  primaryKnopTekst: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  secondaryKnop: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  progressRij: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  progressPil: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  stapKaart: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 18,
    marginBottom: 16,
    alignItems: 'center',
  },
  stapNummer: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  stapGewicht: {
    fontSize: 28,
    fontFamily: 'Inter_900Black',
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
  },
  rustBalk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 14,
  },
  rustTekst: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    fontVariant: ['tabular-nums'],
  },
  invoerRij: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  invoerBlok: { flex: 1 },
  invoerLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  invoerVeld: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  resultaatKaart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  resultaatLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  resultaatWaarde: {
    fontSize: 26,
    fontFamily: 'Inter_900Black',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  resultaatSucces: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  resultaatSuccesTitel: {
    fontSize: 20,
    fontFamily: 'Inter_900Black',
  },
  resultaatSuccesOef: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  resultaatSucces1RM: {
    fontSize: 34,
    fontFamily: 'Inter_900Black',
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
  },
  resultaatSuccesSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
});
