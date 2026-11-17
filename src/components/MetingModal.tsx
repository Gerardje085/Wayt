// ─────────────────────────────────────────────────────────────────────────────
// Wayt – MetingModal (Upgrade: Wetenschappelijke 1RM Wizard)
// Onderzoek: Gestandaardiseerd meetprotocol voor nulmeting (baseline)
// en eindmeting (endline) met warmup-ramp, rusttimers en Epley 1RM opslag.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  TextInput, Pressable, Alert, ActivityIndicator, ScrollView,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useThema } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { bereken1RM } from "../context/LiveWorkoutContext";
import { berekenVolume, berekenArbeid } from "../utils/physics";
import { vertaalFout } from "../utils/errorVertaler";
import { insertWorkoutsVeilig } from "../hooks/useWorkouts";
import { genereerUuid } from "../utils/sessieGroepering";

// ─── Kern-oefeningen voor de meting ──────────────────────────────────────────

const KERN_OEFENINGEN = [
  { id: "barbell_bench_press", naam: "Bench Press",    icoon: "barbell-outline",              startGewicht: 60 },
  { id: "barbell_squat",       naam: "Squat",          icoon: "body-outline",                 startGewicht: 80 },
  { id: "barbell_deadlift",    naam: "Deadlift",       icoon: "fitness-outline",              startGewicht: 100 },
  { id: "lat_pulldown",        naam: "Lat Pulldown",   icoon: "arrow-down-circle-outline",    startGewicht: 60 },
  { id: "leg_extension",       naam: "Leg Extension",  icoon: "arrow-forward-circle-outline", startGewicht: 50 },
] as const;

// ─── Warmup-ramp berekening (% van doelgewicht) ───────────────────────────────

type WarmupStap = {
  label: string;
  percentage: number;
  sets: number;
  reps: number;
  gewicht: number;
};

function berekenWarmupRamp(doelGewicht: number): WarmupStap[] {
  return [
    { label: "Opwarmen 1", percentage: 50, sets: 1, reps: 8,  gewicht: Math.round(doelGewicht * 0.50 / 2.5) * 2.5 },
    { label: "Opwarmen 2", percentage: 70, sets: 1, reps: 5,  gewicht: Math.round(doelGewicht * 0.70 / 2.5) * 2.5 },
    { label: "Opwarmen 3", percentage: 85, sets: 1, reps: 2,  gewicht: Math.round(doelGewicht * 0.85 / 2.5) * 2.5 },
    { label: "Test poging", percentage: 100, sets: 1, reps: 1, gewicht: doelGewicht },
  ];
}

// ─── Wizard stappen ────────────────────────────────────────────────────────────
type WizardStap = "selecteer" | "warmup" | "testpoging" | "resultaat";

interface MetingModalProps {
  zichtbaar: boolean;
  onSluiten: () => void;
}

export default function MetingModal({ zichtbaar, onSluiten }: MetingModalProps) {
  const { kleuren } = useThema();
  const { user } = useAuth();
  const [isActief, setIsActief] = useState(false);

  // Wizard state
  const [wizardStap, setWizardStap] = useState<WizardStap>("selecteer");
  const [testMoment, setTestMoment] = useState<"baseline" | "endline">("baseline");
  const [gekozenOefIndex, setGekozenOefIndex] = useState(0);
  const [doelGewichtStr, setDoelGewichtStr] = useState("");
  const [warmupStapIndex, setWarmupStapIndex] = useState(0);
  const [gewichtStr, setGewichtStr] = useState("");
  const [repsStr, setRepsStr] = useState("");
  const [laden, setLaden] = useState(false);

  // Rusttimer voor tussen warmup-stappen
  const [rustSeconden, setRustSeconden] = useState(0);
  const [rustLoopt, setRustLoopt] = useState(false);
  const rustRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const overlayOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(600);

  const gekozenOef = KERN_OEFENINGEN[gekozenOefIndex];
  const doelGewicht = parseFloat(doelGewichtStr.replace(",", ".")) || gekozenOef.startGewicht;
  const warmupRamp = berekenWarmupRamp(doelGewicht);
  const huidigeWarmupStap = warmupRamp[warmupStapIndex];

  const gewicht = parseFloat(gewichtStr.replace(",", ".")) || 0;
  const reps = parseInt(repsStr) || 0;
  const berekend1RM = gewicht > 0 && reps > 0 ? bereken1RM(gewicht, reps) : null;

  // ─── Animaties ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (zichtbaar) {
      setIsActief(true);
      overlayOpacity.value = withTiming(1, { duration: 200 });
      sheetTranslateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
    }
  }, [zichtbaar]);

  const sluitModal = useCallback(() => {
    stopRust();
    overlayOpacity.value = withTiming(0, { duration: 180 });
    sheetTranslateY.value = withTiming(600, { duration: 250, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) {
        runOnJS(setIsActief)(false);
        runOnJS(onSluiten)();
        runOnJS(resetWizard)();
      }
    });
  }, [onSluiten]);

  const overlayAnimStijl = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const sheetAnimStijl = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  // ─── Rusttimer ────────────────────────────────────────────────────────────────

  const startRust = useCallback((seconden: number) => {
    if (rustRef.current) clearInterval(rustRef.current);
    setRustSeconden(seconden);
    setRustLoopt(true);
    rustRef.current = setInterval(() => {
      setRustSeconden(prev => {
        if (prev <= 1) {
          if (rustRef.current) clearInterval(rustRef.current);
          setRustLoopt(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stopRust = useCallback(() => {
    if (rustRef.current) clearInterval(rustRef.current);
    setRustLoopt(false);
    setRustSeconden(0);
  }, []);

  // ─── Wizard navigatie ─────────────────────────────────────────────────────────

  const resetWizard = () => {
    setWizardStap("selecteer");
    setTestMoment("baseline");
    setGekozenOefIndex(0);
    setDoelGewichtStr("");
    setWarmupStapIndex(0);
    setGewichtStr("");
    setRepsStr("");
    stopRust();
  };

  const naarWarmup = () => {
    setWarmupStapIndex(0);
    setWizardStap("warmup");
  };

  const warmupVolgende = () => {
    stopRust();
    const volgend = warmupStapIndex + 1;
    if (volgend >= warmupRamp.length - 1) {
      // Laatste warmup stap, ga naar testpoging
      setWizardStap("testpoging");
      setGewichtStr(String(doelGewicht));
      setRepsStr("");
      startRust(120); // 2 minuten rust voor testpoging
    } else {
      setWarmupStapIndex(volgend);
      // Rust tussen warmup-stappen: 90s voor lichte sets, 120s voor zwaardere
      const rustDuur = volgend >= 2 ? 120 : 90;
      startRust(rustDuur);
    }
  };

  // ─── Opslaan ─────────────────────────────────────────────────────────────────

  const handleOpslaan = async () => {
    if (!user?.id) return;
    if (gewicht <= 0 || reps <= 0) {
      Alert.alert("Vul gewicht en herhalingen in");
      return;
    }
    setLaden(true);
    try {
      const volume = berekenVolume(1, reps, gewicht);
      const arbeid = berekenArbeid(gekozenOef.id, reps, gewicht);
      const { error } = await insertWorkoutsVeilig({
        user_id: user.id,
        date: new Date().toISOString().split("T")[0],
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
      setWizardStap("resultaat");
    } catch (err) {
      Alert.alert('Opslaan mislukt', vertaalFout(err, 'Kon de 1RM-meting niet opslaan. Probeer het opnieuw.'));
    } finally {
      setLaden(false);
    }
  };

  const formatTijd = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (!isActief) return null;

  return (
    <Modal visible={isActief} transparent animationType="none" onRequestClose={sluitModal}>
      <Animated.View style={[s.overlay, overlayAnimStijl]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={sluitModal} />
        <Animated.View style={[s.kaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }, sheetAnimStijl]}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* ── Header ── */}
            <View style={s.header}>
              <Ionicons name="trophy-outline" size={22} color={kleuren.waarschuwing} />
              <Text style={[s.titel, { color: kleuren.tekst }]}>Officiële 1RM Meting</Text>
              <TouchableOpacity onPress={sluitModal}>
                <Ionicons name="close" size={22} color={kleuren.tekstGedimpt} />
              </TouchableOpacity>
            </View>

            {/* ── STAP 1: Selecteer ── */}
            {wizardStap === "selecteer" && (
              <>
                {/* Testmoment */}
                <Text style={[s.sectionLabel, { color: kleuren.tekstGedimpt }]}>MEETMOMENT</Text>
                <View style={[s.tabRij, { backgroundColor: kleuren.achtergrond }]}>
                  {(["baseline", "endline"] as const).map((val) => (
                    <TouchableOpacity
                      key={val}
                      style={[s.tab, testMoment === val && { backgroundColor: kleuren.accent }]}
                      onPress={() => setTestMoment(val)}
                    >
                      <Text style={[s.tabTekst, { color: testMoment === val ? "#FFF" : kleuren.tekstGedimpt }]}>
                        {val === "baseline" ? "Week 0 – Nulmeting" : "Week 6 – Eindmeting"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Oefening */}
                <Text style={[s.sectionLabel, { color: kleuren.tekstGedimpt }]}>OEFENING</Text>
                <View style={s.oefeningRij}>
                  {KERN_OEFENINGEN.map((oef, idx) => (
                    <TouchableOpacity
                      key={oef.id}
                      style={[
                        s.oefeningKnop,
                        { borderColor: kleuren.kaartRand, backgroundColor: kleuren.achtergrond },
                        gekozenOefIndex === idx && { borderColor: kleuren.accent, backgroundColor: kleuren.accentGedimpt },
                      ]}
                      onPress={() => setGekozenOefIndex(idx)}
                    >
                      <Ionicons
                        name={oef.icoon as any}
                        size={18}
                        color={gekozenOefIndex === idx ? kleuren.accent : kleuren.tekstGedimpt}
                      />
                      <Text style={[s.oefeningTekst, { color: gekozenOefIndex === idx ? kleuren.accent : kleuren.tekstSecundair }]}>
                        {oef.naam}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Schatting doelgewicht */}
                <Text style={[s.sectionLabel, { color: kleuren.tekstGedimpt }]}>GESCHAT MAXIMAAL GEWICHT (kg)</Text>
                <TextInput
                  style={[s.invoer, { color: kleuren.tekst, backgroundColor: kleuren.achtergrond, borderColor: kleuren.kaartRand }]}
                  value={doelGewichtStr}
                  onChangeText={setDoelGewichtStr}
                  keyboardType="decimal-pad"
                  placeholder={String(gekozenOef.startGewicht)}
                  placeholderTextColor={kleuren.tekstGedimpt}
                />
                <Text style={[s.uitlegTekst, { color: kleuren.tekstGedimpt }]}>
                  Voer het gewicht in dat je denkt te kunnen tillen voor 1 herhaling. Het warmup-schema wordt hier automatisch op gebaseerd.
                </Text>

                <TouchableOpacity
                  style={[s.primaryKnop, { backgroundColor: kleuren.accent }]}
                  onPress={naarWarmup}
                >
                  <Ionicons name="flame-outline" size={18} color="#FFF" />
                  <Text style={s.primaryKnopTekst}>Start Warmup Schema</Text>
                </TouchableOpacity>
              </>
            )}

            {/* ── STAP 2: Warmup ── */}
            {wizardStap === "warmup" && (
              <>
                <Text style={[s.sectionLabel, { color: kleuren.tekstGedimpt }]}>WARMUP SCHEMA – {gekozenOef.naam.toUpperCase()}</Text>

                {/* Voortgangsbalk */}
                <View style={s.progressRij}>
                  {warmupRamp.slice(0, -1).map((stap, idx) => (
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

                {/* Huidige stap kaart */}
                <View style={[s.stapKaart, { backgroundColor: kleuren.accent + "12", borderColor: kleuren.accent + "44" }]}>
                  <Text style={[s.stapNummer, { color: kleuren.accent }]}>
                    {huidigeWarmupStap.label} ({huidigeWarmupStap.percentage}%)
                  </Text>
                  <Text style={[s.stapGewicht, { color: kleuren.tekst }]}>
                    {huidigeWarmupStap.sets}×{huidigeWarmupStap.reps} @ {huidigeWarmupStap.gewicht} kg
                  </Text>
                </View>

                {/* Rusttimer */}
                {rustLoopt && (
                  <View style={[s.rustBalk, { backgroundColor: kleuren.waarschuwing + "15", borderColor: kleuren.waarschuwing + "44" }]}>
                    <Ionicons name="timer-outline" size={16} color={kleuren.waarschuwing} />
                    <Text style={[s.rustTekst, { color: kleuren.waarschuwing }]}>
                      Rust: {formatTijd(rustSeconden)}
                    </Text>
                    <TouchableOpacity onPress={stopRust}>
                      <Text style={{ color: kleuren.tekstGedimpt, fontSize: 12 }}>Overslaan</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={[s.primaryKnop, { backgroundColor: rustLoopt ? kleuren.kaartRand : kleuren.accent }]}
                  onPress={warmupVolgende}
                  disabled={rustLoopt}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
                  <Text style={s.primaryKnopTekst}>
                    {warmupStapIndex < warmupRamp.length - 2 ? "Volgende warmup stap" : "Start testpoging"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={s.secondaryKnop} onPress={() => setWizardStap("selecteer")}>
                  <Text style={{ color: kleuren.tekstGedimpt, fontFamily: "Inter_400Regular", fontSize: 14 }}>
                    Terug naar selectie
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* ── STAP 3: Testpoging ── */}
            {wizardStap === "testpoging" && (
              <>
                <Text style={[s.sectionLabel, { color: kleuren.tekstGedimpt }]}>TESTPOGING – {gekozenOef.naam.toUpperCase()}</Text>

                {rustLoopt && (
                  <View style={[s.rustBalk, { backgroundColor: kleuren.succes + "15", borderColor: kleuren.succes + "44" }]}>
                    <Ionicons name="timer-outline" size={16} color={kleuren.succes} />
                    <Text style={[s.rustTekst, { color: kleuren.succes }]}>
                      Rust voor testpoging: {formatTijd(rustSeconden)}
                    </Text>
                    <TouchableOpacity onPress={stopRust}>
                      <Text style={{ color: kleuren.tekstGedimpt, fontSize: 12 }}>Overslaan</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <Text style={[s.uitlegTekst, { color: kleuren.tekstGedimpt }]}>
                  Voer het werkelijke gewicht en het aantal herhalingen in dat je hebt afgerond. De 1RM wordt automatisch berekend via de Epley-formule.
                </Text>

                <View style={s.invoerRij}>
                  <View style={s.invoerBlok}>
                    <Text style={[s.invoerLabel, { color: kleuren.tekstGedimpt }]}>Gewicht (kg)</Text>
                    <TextInput
                      style={[s.invoerVeld, { color: kleuren.tekst, backgroundColor: kleuren.achtergrond, borderColor: kleuren.kaartRand }]}
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
                      style={[s.invoerVeld, { color: kleuren.tekst, backgroundColor: kleuren.achtergrond, borderColor: kleuren.kaartRand }]}
                      value={repsStr}
                      onChangeText={setRepsStr}
                      keyboardType="number-pad"
                      placeholder="1"
                      placeholderTextColor={kleuren.tekstGedimpt}
                    />
                  </View>
                </View>

                {berekend1RM !== null && (
                  <View style={[s.resultaatKaart, { backgroundColor: kleuren.waarschuwing + "18", borderColor: kleuren.waarschuwing + "44" }]}>
                    <Text style={[s.resultaatLabel, { color: kleuren.tekstGedimpt }]}>Geschat 1RM (Epley)</Text>
                    <Text style={[s.resultaatWaarde, { color: kleuren.waarschuwing }]}>{berekend1RM} kg</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[s.primaryKnop, { backgroundColor: laden ? kleuren.tekstGedimpt : kleuren.accent }]}
                  onPress={handleOpslaan}
                  disabled={laden}
                >
                  {laden
                    ? <ActivityIndicator color="#FFF" size="small" />
                    : <>
                        <Ionicons name="save-outline" size={18} color="#FFF" />
                        <Text style={s.primaryKnopTekst}>Meting opslaan</Text>
                      </>
                  }
                </TouchableOpacity>
              </>
            )}

            {/* ── STAP 4: Resultaat ── */}
            {wizardStap === "resultaat" && (
              <>
                <View style={[s.resultaatSucces, { backgroundColor: kleuren.succes + "12", borderColor: kleuren.succes + "44" }]}>
                  <Ionicons name="checkmark-circle" size={40} color={kleuren.succes} />
                  <Text style={[s.resultaatSuccesTitel, { color: kleuren.tekst }]}>
                    Meting opgeslagen!
                  </Text>
                  <Text style={[s.resultaatSuccesOef, { color: kleuren.tekstSecundair }]}>
                    {gekozenOef.naam} — {testMoment === "baseline" ? "Nulmeting (Week 0)" : "Eindmeting (Week 6)"}
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
                  style={[s.primaryKnop, { backgroundColor: kleuren.accent }]}
                  onPress={() => resetWizard()}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#FFF" />
                  <Text style={s.primaryKnopTekst}>Nieuwe meting starten</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.secondaryKnop} onPress={sluitModal}>
                  <Text style={{ color: kleuren.tekstGedimpt, fontFamily: "Inter_400Regular", fontSize: 14 }}>Sluiten</Text>
                </TouchableOpacity>
              </>
            )}

          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  kaart: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
  },
  titel: {
    flex: 1,
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  tabRij: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
  },
  tabTekst: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  oefeningRij: {
    gap: 8,
    marginBottom: 20,
  },
  oefeningKnop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  oefeningTekst: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  invoer: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 10,
  },
  uitlegTekst: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
    marginBottom: 16,
  },
  primaryKnop: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 10,
  },
  primaryKnopTekst: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  secondaryKnop: {
    alignItems: "center",
    paddingVertical: 12,
  },
  progressRij: {
    flexDirection: "row",
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
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  stapNummer: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  stapGewicht: {
    fontSize: 28,
    fontFamily: "Inter_900Black",
    letterSpacing: -1,
  },
  rustBalk: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  rustTekst: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  invoerRij: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  invoerBlok: { flex: 1 },
  invoerLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  invoerVeld: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  resultaatKaart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  resultaatLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  resultaatWaarde: {
    fontSize: 28,
    fontFamily: "Inter_900Black",
    letterSpacing: -0.5,
  },
  resultaatSucces: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  resultaatSuccesTitel: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  resultaatSuccesOef: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  resultaatSucces1RM: {
    fontSize: 36,
    fontFamily: "Inter_900Black",
    letterSpacing: -1,
  },
  resultaatSuccesSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
