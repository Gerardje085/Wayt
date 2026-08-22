// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Admin Screen (TypeScript + Thema)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, Alert, Share, RefreshControl, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth }         from '../../src/context/AuthContext';
import { useThema }        from '../../src/context/ThemeContext';
import { useAlleWorkouts } from '../../src/hooks/useWorkouts';
import ErrorBanner         from '../../src/components/ErrorBanner';

export default function AdminScreen() {
  const { user, profile }   = useAuth();
  const { kleuren }         = useThema();
  const { haalAllesOp, workouts, laden, fout } = useAlleWorkouts(user?.id);

  useEffect(() => { haalAllesOp(); }, [haalAllesOp]);

  const aantalSessies = workouts.length;
  const totaalVolume  = workouts.reduce((s, w) => s + parseFloat(String(w.volume || 0)), 0);
  const oefeningen    = [...new Set(workouts.map((w) => w.exercise))];

  const handleExport = useCallback(async () => {
    if (workouts.length === 0) { Alert.alert('Geen data', 'Nog geen trainingen opgeslagen.'); return; }
    const headers = 'datum,oefening,sets,herhalingen,gewicht_kg,volume_kg\n';
    const rijen   = workouts.map((w) =>
      [w.date, w.exercise, w.sets, w.reps, w.weight,
       parseFloat(String(w.volume)).toFixed(2)].join(',')
    ).join('\n');
    try {
      await Share.share({ title: 'Wayt Onderzoeksdata', message: headers + rijen }, { subject: 'wayt_onderzoeksdata.csv', dialogTitle: 'Exporteer Data' });
    } catch (err) {
      Alert.alert('Export mislukt', (err as Error).message);
    }
  }, [workouts]);

  const TABEL_HEADERS = ['Datum', 'Oefening', 'S×R', 'kg', 'Vol'];

  return (
    <SafeAreaView style={[stijlen.veilig, { backgroundColor: kleuren.achtergrond }]}>
      <ScrollView style={stijlen.scroll} contentContainerStyle={stijlen.inhoud}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={laden} onRefresh={haalAllesOp} tintColor={kleuren.accent} colors={[kleuren.accent]} />}>

        {/* Header */}
        <Text style={[stijlen.titel, { color: kleuren.tekstSecundair }]}>Onderzoeksdata</Text>
        <Text style={[stijlen.subtitel, { color: kleuren.tekstGedimpt }]}>Ruwe trainingsdata voor het PWS-onderzoek</Text>

        {/* Profiel */}
        {profile && (
          <View style={[stijlen.profielKaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
            {[
              { label: 'E-mail',     waarde: user?.email ?? '—', kleur: kleuren.tekst },
              { label: 'Testgroep',  waarde: profile.group_type === 'app' ? 'Algoritme-groep' : 'Gevoel-groep',
                kleur: profile.group_type === 'app' ? kleuren.accent : '#F9A8D4' },
            ].map((r) => (
              <View key={r.label} style={stijlen.profielRij}>
                <Text style={[stijlen.profielLabel, { color: kleuren.tekstGedimpt }]}>{r.label}</Text>
                <Text style={[stijlen.profielWaarde, { color: r.kleur }]}>{r.waarde}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={[stijlen.lijn, { backgroundColor: kleuren.kaartRand }]} />

        {/* Statistieken */}
        <Text style={[stijlen.sectie, { color: kleuren.accent }]}>Totalen</Text>
        <View style={stijlen.statRij}>
          {[
            { w: String(aantalSessies),               l: 'Sessies' },
            { w: totaalVolume.toFixed(0),              l: 'Vol. (kg)' },
          ].map((s) => (
            <View key={s.l} style={[stijlen.statKaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
              <Text style={[stijlen.statWaarde, { color: kleuren.accent }]}>{s.w}</Text>
              <Text style={[stijlen.statLabel, { color: kleuren.tekstGedimpt }]}>{s.l}</Text>
            </View>
          ))}
        </View>

        {/* Oefeningen badges */}
        {oefeningen.length > 0 && (
          <>
            <Text style={[stijlen.sectie, { color: kleuren.accent }]}>Oefeningen</Text>
            <View style={stijlen.badgeRij}>
              {oefeningen.map((o) => (
                <View key={o} style={[stijlen.badge, { backgroundColor: kleuren.accentGedimpt, borderColor: kleuren.accent + '44' }]}>
                  <Text style={[stijlen.badgeTekst, { color: kleuren.tekstSecundair }]}>{o}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={[stijlen.lijn, { backgroundColor: kleuren.kaartRand }]} />

        {/* Export */}
        <Text style={[stijlen.sectie, { color: kleuren.accent }]}>Exporteren</Text>
        <TouchableOpacity style={stijlen.exportContainer} onPress={handleExport} accessibilityLabel="Data exporteren als CSV">
          <LinearGradient colors={['#065F46', '#047857']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={stijlen.exportKnop}>
            <Text style={stijlen.exportTekst}>Exporteer als CSV</Text>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={[stijlen.exportNota, { color: kleuren.tekstGedimpt }]}>Bevat: datum, oefening, sets, reps, gewicht, volume</Text>

        <View style={[stijlen.lijn, { backgroundColor: kleuren.kaartRand }]} />

        {/* Tabel */}
        <Text style={[stijlen.sectie, { color: kleuren.accent }]}>Alle Sessies ({aantalSessies})</Text>

        {fout && <ErrorBanner bericht={fout} onProbeerOpnieuw={haalAllesOp} />}

        {laden && workouts.length === 0 ? (
          <View style={[stijlen.laad, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
            <ActivityIndicator color={kleuren.accent} size="small" />
            <Text style={[{ fontFamily: 'Inter_400Regular', color: kleuren.tekstGedimpt }]}>Data ophalen…</Text>
          </View>
        ) : workouts.length === 0 ? (
          <View style={[stijlen.geenData, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
            <Text style={[{ color: kleuren.tekstGedimpt, textAlign: 'center', fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22 }]}>
              Nog geen trainingen gelogd.{'\n'}Start op het Training-tabblad!
            </Text>
          </View>
        ) : (
          <View style={[stijlen.tabel, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
            <View style={[stijlen.tabelRij, { backgroundColor: kleuren.achtergrondSecundair }]}>
              {TABEL_HEADERS.map((h, i) => (
                <Text key={h} style={[stijlen.tabelKop, { color: kleuren.accent, flex: i === 1 ? 2 : i === 0 ? 1.4 : 1 }]}>{h}</Text>
              ))}
            </View>
            {workouts.map((w, i) => (
              <View key={w.id} style={[stijlen.tabelRij, { backgroundColor: i % 2 === 0 ? 'transparent' : kleuren.accentGedimpt + '44' }]}>
                <Text style={[stijlen.tabelCel, { color: kleuren.tekstSecundair, flex: 1.4, fontSize: 11 }]}>
                  {new Date(w.date).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' })}
                </Text>
                <Text style={[stijlen.tabelCel, { color: kleuren.tekst, flex: 2, fontSize: 11 }]} numberOfLines={1}>{w.exercise}</Text>
                <Text style={[stijlen.tabelCel, { color: kleuren.tekst }]}>{w.sets}×{w.reps}</Text>
                <Text style={[stijlen.tabelCel, { color: kleuren.tekst }]}>{w.weight}</Text>
                <Text style={[stijlen.tabelCel, { color: kleuren.accent }]}>{parseFloat(String(w.volume)).toFixed(0)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const stijlen = StyleSheet.create({
  veilig:  { flex: 1 }, scroll: { flex: 1 }, inhoud: { padding: 20 },
  titel:   { fontSize: 26, fontWeight: '900', fontFamily: 'Inter_900Black', letterSpacing: -0.5, marginBottom: 4 },
  subtitel:{ fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 16 },
  lijn:    { height: 1, marginBottom: 20, marginTop: 4 },
  sectie:  { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Inter_700Bold', marginBottom: 10 },
  profielKaart: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  profielRij:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  profielLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  profielWaarde:{ fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  statRij:  { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statKaart:{ flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, alignItems: 'center' },
  statWaarde: { fontSize: 20, fontWeight: '700', fontFamily: 'Inter_700Bold', marginBottom: 4 },
  statLabel:  { fontSize: 10, fontFamily: 'Inter_400Regular', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
  badgeRij: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  badge:    { borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12, borderWidth: 1 },
  badgeTekst:{ fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  exportContainer: { borderRadius: 14, overflow: 'hidden', marginBottom: 8 },
  exportKnop: { paddingVertical: 16, alignItems: 'center' },
  exportTekst:{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  exportNota: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 20, textAlign: 'center' },
  tabel:    { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
  tabelRij: { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 10, alignItems: 'center' },
  tabelKop: { fontFamily: 'Inter_700Bold', fontSize: 10, textTransform: 'uppercase', textAlign: 'center' },
  tabelCel: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  laad:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 20, borderRadius: 14, borderWidth: 1 },
  geenData: { padding: 24, borderRadius: 14, alignItems: 'center', borderWidth: 1 },
});
