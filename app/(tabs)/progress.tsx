import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, RefreshControl, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useThema } from '../../src/context/ThemeContext';
import { useVoortgang } from '../../src/hooks/useWorkouts';
import { OEFENINGEN_DB, findExercise } from '../../src/data/exercises';
import ProgressChart, { type GrafiekModus } from '../../src/components/ProgressChart';
import ErrorBanner from '../../src/components/ErrorBanner';
import { SkeletonStatKaart } from '../../src/components/SkeletonLoader';
import ExerciseSelector from '../../src/components/ExerciseSelector';
import StatCard from '../../src/components/ui/StatCard';
import { bereken1RM } from '../../src/context/LiveWorkoutContext';

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
  const [oefening, setOef] = useState('0025');
  const [selectorZicht, setSelectorZicht] = useState(false);
  const [grafiekModus, setGrafiekModus] = useState<GrafiekModus>('volume');
  const actieveOefeningNaam = findExercise(oefening)?.naam ?? oefening;

  const { haalVoortgangOp, workouts, laden, fout } = useVoortgang(user?.id);

  const vernieuwen = useCallback(() => {
    haalVoortgangOp(oefening);
  }, [oefening, haalVoortgangOp]);

  useEffect(() => { vernieuwen(); }, [vernieuwen]);

  const n = workouts.length;
  const eersteVol = n > 0 ? parseFloat(String(workouts[0].volume)) : 0;
  const huidigeVol = n > 0 ? parseFloat(String(workouts[n - 1].volume)) : 0;
  const huidigeArbeid = n > 0 ? parseFloat(String(workouts[n - 1].work_joules || 0)) : 0;
  const huidig1RM = n > 0 ? bereken1RM(Number(workouts[n - 1].weight), Number(workouts[n - 1].reps)) : 0;
  const groei = eersteVol > 0 ? (((huidigeVol - eersteVol) / eersteVol) * 100).toFixed(1) : '0.0';
  const groeiGetal = parseFloat(groei);

  const recent = [...workouts].reverse().slice(0, 5);

  return (
    <SafeAreaView style={[stijlen.veilig, { backgroundColor: kleuren.achtergrond }]}>
      <ScrollView
        style={stijlen.scroll}
        contentContainerStyle={stijlen.inhoud}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={laden} onRefresh={vernieuwen} tintColor={kleuren.accent} colors={[kleuren.accent]} />
        }
      >
        <View style={stijlen.header}>
          <Text style={[stijlen.titel, { color: kleuren.tekstSecundair }]}>Voortgang</Text>
          <Text style={[stijlen.subtitel, { color: kleuren.tekstGedimpt }]}>Bekijk je trainingsdata</Text>
        </View>

        <View style={[stijlen.lijn, { backgroundColor: kleuren.kaartRand }]} />

        <Text style={[stijlen.sectie, { color: kleuren.accent }]}>Oefening</Text>
        <TouchableOpacity
          style={[stijlen.pickerWrapper, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}
          onPress={() => setSelectorZicht(true)}
          accessibilityLabel="Oefening kiezen"
        >
          <Text style={{ color: kleuren.tekst, fontFamily: 'Inter_600SemiBold', fontSize: 16 }}>
            {actieveOefeningNaam}
          </Text>
          <Ionicons name="chevron-down" size={20} color={kleuren.accent} />
        </TouchableOpacity>

        {fout && <ErrorBanner bericht={fout} onProbeerOpnieuw={vernieuwen} />}

        <Text style={[stijlen.sectie, { color: kleuren.accent }]}>Samenvatting</Text>
        <View style={stijlen.statRij}>
          {laden ? (
            <>
              <SkeletonStatKaart stijl={{ flex: 1 }} />
              <SkeletonStatKaart stijl={{ flex: 1 }} />
              <SkeletonStatKaart stijl={{ flex: 1 }} />
            </>
          ) : (
            <>
              <StatCard waarde={String(n)} label="Sessies" />
              <StatCard waarde={`${huidig1RM}`} label="1RM (kg)" kleur={kleuren.waarschuwing} />
              <StatCard
                waarde={`${groeiGetal >= 0 ? '+' : ''}${groei}%`}
                label="Volume groei"
                kleur={groeiGetal >= 0 ? kleuren.succes : kleuren.fout}
              />
            </>
          )}
        </View>

        {!laden && n > 0 && (
          <View style={[stijlen.arbeidKaart, { backgroundColor: kleuren.accentGedimpt, borderColor: kleuren.accent + '55' }]}>
            <View>
              <Text style={[stijlen.arbeidLabel, { color: kleuren.tekstGedimpt }]}>Arbeid (laatste sessie)</Text>
              <Text style={[stijlen.arbeidWaarde, { color: kleuren.tekstSecundair }]}>{huidigeArbeid.toFixed(0)} J</Text>
            </View>
            <Ionicons name="flash" size={32} color={kleuren.accent} />
          </View>
        )}

        <View style={[stijlen.lijn, { backgroundColor: kleuren.kaartRand }]} />

        <Text style={[stijlen.sectie, { color: kleuren.accent }]}>Grafiek</Text>

        <View style={[stijlen.modusSwitcher, { backgroundColor: kleuren.achtergrond }]}>
          {GRAFIEK_MODI.map(m => (
            <TouchableOpacity
              key={m.id}
              style={[stijlen.modusKnop, grafiekModus === m.id && { backgroundColor: kleuren.accent }]}
              onPress={() => setGrafiekModus(m.id)}
            >
              <Text style={[stijlen.modusKnopTekst, { color: grafiekModus === m.id ? '#FFF' : kleuren.tekstGedimpt }]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ProgressChart workouts={workouts} laden={laden} modus={grafiekModus} />

        <View style={[stijlen.lijn, { backgroundColor: kleuren.kaartRand }]} />

        <Text style={[stijlen.sectie, { color: kleuren.accent }]}>Slaglengte & Arbeid</Text>
        <View style={[stijlen.romKaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
          <Text style={[stijlen.romTitel, { color: kleuren.tekst }]}>Waarom kost dezelfde last meer of minder energie?</Text>
          <Text style={[stijlen.romTekst, { color: kleuren.tekstGedimpt }]}>
            De mechanische arbeid (Joules) hangt af van de slaglengte (ROM): hoe verder je de last beweegt, hoe meer energie je verbruikt.
          </Text>
          <View style={stijlen.romLijst}>
            {ROM_OEFENINGEN.map(oef => (
              <View key={oef.naam} style={stijlen.romRij}>
                <Ionicons name={oef.icoon as any} size={16} color={oef.kleur} />
                <Text style={[stijlen.romNaam, { color: kleuren.tekst }]}>{oef.naam}</Text>
                <View style={stijlen.romBalkContainer}>
                  <View style={[stijlen.romBalk, { width: `${(oef.rom / MAX_ROM) * 100}%`, backgroundColor: oef.kleur }]} />
                </View>
                <Text style={[stijlen.romWaarde, { color: oef.kleur }]}>{oef.rom} m</Text>
              </View>
            ))}
          </View>
          <Text style={[stijlen.romFormule, { color: kleuren.tekstGedimpt, borderColor: kleuren.kaartRand }]}>
            W = m × g × ROM × reps
          </Text>
        </View>

        <View style={[stijlen.lijn, { backgroundColor: kleuren.kaartRand }]} />

        <Text style={[stijlen.sectie, { color: kleuren.accent }]}>Recente Sessies</Text>
        {!laden && recent.length === 0 ? (
          <View style={[stijlen.geenData, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
            <Text style={[stijlen.geenDataTekst, { color: kleuren.tekstGedimpt }]}>
              Nog geen sessies voor {actieveOefeningNaam}.{'\n'}Log eerst een training!
            </Text>
          </View>
        ) : (
          <View style={[stijlen.tabel, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
            <View style={[stijlen.tabelRij, { backgroundColor: kleuren.achtergrondSecundair }]}>
              {['Datum', 'S×R', 'Gewicht', '1RM'].map((h, i) => (
                <Text key={h} style={[stijlen.tabelKop, { color: kleuren.accent, flex: i === 0 ? 1.5 : 1 }]}>{h}</Text>
              ))}
            </View>
            {recent.map((w, i) => (
              <View key={w.id} style={[stijlen.tabelRij, { backgroundColor: i % 2 === 0 ? 'transparent' : kleuren.accentGedimpt + '44' }]}>
                <Text style={[stijlen.tabelCel, { color: kleuren.tekstSecundair, flex: 1.5 }]}>
                  {new Date(w.date).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' })}
                </Text>
                <Text style={[stijlen.tabelCel, { color: kleuren.tekst }]}>{w.sets}×{w.reps}</Text>
                <Text style={[stijlen.tabelCel, { color: kleuren.tekst }]}>{w.weight}kg</Text>
                <Text style={[stijlen.tabelCel, { color: kleuren.waarschuwing }]}>
                  {bereken1RM(Number(w.weight), Number(w.reps))} kg
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />
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
  veilig: { flex: 1 }, scroll: { flex: 1 }, inhoud: { padding: 20 },
  header: { marginBottom: 16 },
  titel: { fontSize: 26, fontWeight: '900', fontFamily: 'Inter_900Black', letterSpacing: -0.5 },
  subtitel: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  lijn: { height: 1, marginBottom: 20, marginTop: 4 },
  sectie: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Inter_700Bold', marginBottom: 10 },
  pickerWrapper: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: 14, borderWidth: 1, marginBottom: 20, padding: 16
  },
  statRij: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  arbeidKaart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 20 },
  arbeidLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 4 },
  arbeidWaarde: { fontSize: 24, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  modusSwitcher: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  modusKnop: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  modusKnopTekst: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  romKaart: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  romTitel: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
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
    backgroundColor: 'rgba(128,128,128,0.15)',
    overflow: 'hidden',
  },
  romBalk: {
    height: '100%',
    borderRadius: 4,
  },
  romWaarde: {
    width: 36,
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    textAlign: 'right',
  },
  romFormule: {
    marginTop: 16,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    textAlign: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  tabel: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
  tabelRij: { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 10, alignItems: 'center' },
  tabelKop: { fontFamily: 'Inter_700Bold', fontSize: 10, textTransform: 'uppercase', textAlign: 'center', flex: 1 },
  tabelCel: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  geenData: { padding: 24, borderRadius: 14, alignItems: 'center', borderWidth: 1, marginBottom: 12 },
  geenDataTekst: { textAlign: 'center', fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22 },
});
