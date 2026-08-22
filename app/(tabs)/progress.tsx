// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Progress Screen (TypeScript + Skeleton Loaders + Thema)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, RefreshControl, TouchableOpacity,
} from 'react-native';
import { Ionicons }        from '@expo/vector-icons';
import { useAuth }         from '../../src/context/AuthContext';
import { useThema }        from '../../src/context/ThemeContext';
import { useVoortgang }    from '../../src/hooks/useWorkouts';
import { OEFENINGEN_DB }   from '../../src/data/exercises';
import ProgressChart       from '../../src/components/ProgressChart';
import ErrorBanner         from '../../src/components/ErrorBanner';
import { SkeletonStatKaart } from '../../src/components/SkeletonLoader';
import ExerciseSelector      from '../../src/components/ExerciseSelector';

export default function ProgressScreen() {
  const { user }              = useAuth();
  const { kleuren }           = useThema();
  const [oefening, setOef]    = useState(OEFENINGEN_DB[0].id);
  const [selectorZicht, setSelectorZicht] = useState(false);
  const actieveOefeningNaam = OEFENINGEN_DB.find(o => o.id === oefening)?.naam ?? oefening;

  const { haalVoortgangOp, workouts, laden, fout } = useVoortgang(user?.id);

  const vernieuwen = useCallback(() => {
    haalVoortgangOp(oefening);
  }, [oefening, haalVoortgangOp]);

  useEffect(() => { vernieuwen(); }, [vernieuwen]);

  const n            = workouts.length;
  const eersteVol    = n > 0 ? parseFloat(String(workouts[0].volume)) : 0;
  const huidigeVol   = n > 0 ? parseFloat(String(workouts[n - 1].volume)) : 0;
  const groei        = eersteVol > 0 ? (((huidigeVol - eersteVol) / eersteVol) * 100).toFixed(1) : '0.0';
  const groeiGetal   = parseFloat(groei);

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
        {/* Header */}
        <View style={stijlen.header}>
          <Text style={[stijlen.titel, { color: kleuren.tekstSecundair }]}>Voortgang</Text>
          <Text style={[stijlen.subtitel, { color: kleuren.tekstGedimpt }]}>Bekijk je trainingsvolume</Text>
        </View>

        <View style={[stijlen.lijn, { backgroundColor: kleuren.kaartRand }]} />

        {/* Oefening */}
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

        {/* Fout */}
        {fout && <ErrorBanner bericht={fout} onProbeerOpnieuw={vernieuwen} />}

        {/* Statistieken */}
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
              {[
                { waarde: String(n),                  label: 'Sessies' },
                { waarde: `${huidigeVol.toFixed(0)}`, label: 'Volume (kg)' },
                { waarde: `${groeiGetal >= 0 ? '+' : ''}${groei}%`, label: 'Groei',
                  kleur: groeiGetal >= 0 ? kleuren.succes : kleuren.fout },
              ].map((s) => (
                <View key={s.label} style={[stijlen.statKaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
                  <Text style={[stijlen.statWaarde, { color: s.kleur ?? kleuren.accent }]}>{s.waarde}</Text>
                  <Text style={[stijlen.statLabel, { color: kleuren.tekstGedimpt }]}>{s.label}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Volume kaart */}
        {!laden && n > 0 && (
          <View style={[stijlen.arbeidKaart, { backgroundColor: kleuren.accentGedimpt, borderColor: kleuren.accent + '55' }]}>
            <View>
              <Text style={[stijlen.arbeidLabel, { color: kleuren.tekstGedimpt }]}>Volume (laatste sessie)</Text>
              <Text style={[stijlen.arbeidWaarde, { color: kleuren.tekstSecundair }]}>{huidigeVol.toFixed(0)} kg</Text>
            </View>
            <Ionicons name="barbell" size={32} color={kleuren.accent} />
          </View>
        )}

        <View style={[stijlen.lijn, { backgroundColor: kleuren.kaartRand }]} />

        {/* Grafiek */}
        <Text style={[stijlen.sectie, { color: kleuren.accent }]}>Volume-grafiek (kg)</Text>
        <ProgressChart workouts={workouts} laden={laden} />

        <View style={[stijlen.lijn, { backgroundColor: kleuren.kaartRand }]} />

        {/* Recente sessies */}
        <Text style={[stijlen.sectie, { color: kleuren.accent }]}>Recente Sessies</Text>
        {!laden && recent.length === 0 ? (
          <View style={[stijlen.geenData, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
            <Text style={[stijlen.geenDataTekst, { color: kleuren.tekstGedimpt }]}>
              Nog geen sessies voor {oefening}.{'\n'}Log eerst een training!
            </Text>
          </View>
        ) : (
          <View style={[stijlen.tabel, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
            {/* Kop */}
            <View style={[stijlen.tabelRij, { backgroundColor: kleuren.achtergrondSecundair }]}>
              {['Datum', 'S×R', 'Gewicht', 'Volume'].map((h, i) => (
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
                <Text style={[stijlen.tabelCel, { color: kleuren.accent }]}>{parseFloat(String(w.volume)).toFixed(0)} kg</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Oefening Selector Modal */}
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
  veilig:  { flex: 1 }, scroll: { flex: 1 }, inhoud: { padding: 20 },
  header:  { marginBottom: 16 },
  titel:   { fontSize: 26, fontWeight: '900', fontFamily: 'Inter_900Black', letterSpacing: -0.5 },
  subtitel:{ fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  lijn:    { height: 1, marginBottom: 20, marginTop: 4 },
  sectie:  { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Inter_700Bold', marginBottom: 10 },
  pickerWrapper: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: 14, borderWidth: 1, marginBottom: 20, padding: 16
  },
  statRij: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statKaart: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, alignItems: 'center' },
  statWaarde: { fontSize: 20, fontWeight: '700', fontFamily: 'Inter_700Bold', marginBottom: 4 },
  statLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
  arbeidKaart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 20 },
  arbeidLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 4 },
  arbeidWaarde: { fontSize: 24, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  tabel:   { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
  tabelRij:{ flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 10, alignItems: 'center' },
  tabelKop:{ fontFamily: 'Inter_700Bold', fontSize: 10, textTransform: 'uppercase', textAlign: 'center', flex: 1 },
  tabelCel:{ flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  geenData:{ padding: 24, borderRadius: 14, alignItems: 'center', borderWidth: 1, marginBottom: 12 },
  geenDataTekst: { textAlign: 'center', fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22 },
});
