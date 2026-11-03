import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, Alert, Share, RefreshControl, ActivityIndicator, TextInput, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useThema } from '../src/context/ThemeContext';
import { useAlleWorkouts } from '../src/hooks/useWorkouts';
import { supabase } from '../src/lib/supabase';
import { bereken1RM } from '../src/context/LiveWorkoutContext';
import ErrorBanner from '../src/components/ErrorBanner';
import StatCard from '../src/components/ui/StatCard';
import TerugKnop from '../src/components/ui/TerugKnop';
import Badge from '../src/components/ui/Badge';
import { getDefaultRestTime, setDefaultRestTime, STANDAARD_RUST_TIJD } from '../src/lib/settingsStore';
import { canoniekeId } from '../src/lib/trainingsHistorie';
import { findExercise } from '../src/data/exercises';
import { vandaag } from '../src/utils/datum';
import type { Workout } from '../src/types';

interface AbVergelijking {
  groepA: number;
  groepB: number;
  aantalA: number;
  aantalB: number;
  compleetA: number;
  compleetB: number;
  opvolging: number | null;
}

type ExportRij = Workout & { group_type?: string };

const KERN_OEFENINGEN = ['0025', '0150', '0585'];

function gemiddelde(waarden: number[]): number {
  return waarden.length > 0 ? waarden.reduce((a, b) => a + b, 0) / waarden.length : 0;
}

function groeiPerDeelnemer(metingen: Workout[]): Map<string, number> {
  const perDeelnemer = new Map<string, Map<string, Workout[]>>();
  for (const m of metingen) {
    const oefening = canoniekeId(m.exercise);
    if (!KERN_OEFENINGEN.includes(oefening)) continue;
    const perOefening = perDeelnemer.get(m.user_id) ?? new Map<string, Workout[]>();
    perOefening.set(oefening, [...(perOefening.get(oefening) ?? []), m]);
    perDeelnemer.set(m.user_id, perOefening);
  }

  const resultaat = new Map<string, number>();
  for (const [userId, perOefening] of perDeelnemer) {
    const groeien: number[] = [];
    for (const rijen of perOefening.values()) {
      const eenRM = (r: Workout) => bereken1RM(Number(r.weight), Number(r.reps));
      let begin = rijen.filter(r => r.meting_moment === 'week0');
      let eind = rijen.filter(r => r.meting_moment === 'week6');
      if (begin.length === 0 || eind.length === 0) {
        const datums = rijen.map(r => r.date).sort();
        const eerste = datums[0];
        const laatste = datums[datums.length - 1];
        if (eerste === laatste) continue;
        if (begin.length === 0) begin = rijen.filter(r => r.date === eerste);
        if (eind.length === 0) eind = rijen.filter(r => r.date === laatste);
      }
      const beginMax = Math.max(...begin.map(eenRM));
      const eindMax = Math.max(...eind.map(eenRM));
      if (beginMax > 0) groeien.push(((eindMax - beginMax) / beginMax) * 100);
    }
    if (groeien.length > 0) resultaat.set(userId, gemiddelde(groeien));
  }
  return resultaat;
}

function csvVeld(waarde: unknown): string {
  if (waarde === null || waarde === undefined) return '';
  const tekst = String(waarde);
  return /[",\n]/.test(tekst) ? `"${tekst.replace(/"/g, '""')}"` : tekst;
}

const RUST_PRESETS = [
  { label: '60s', seconden: 60 },
  { label: '90s', seconden: 90 },
  { label: '2 min', seconden: 120 },
  { label: '3 min', seconden: 180 },
];

export default function AdminScreen() {
  const { user, profile, uitloggen } = useAuth();
  const { kleuren, voorkeur, setVoorkeur } = useThema();
  const { haalAllesOp, workouts, laden, fout } = useAlleWorkouts(user?.id);
  const isOnderzoeker = profile?.is_onderzoeker === true;
  const [abVergelijking, setAbVergelijking] = useState<AbVergelijking | null>(null);
  const [abLaden, setAbLaden] = useState(false);
  const [onderzoeksRijen, setOnderzoeksRijen] = useState<ExportRij[]>([]);

  // Standaard rusttijd instelling
  const [standaardRust, setStandaardRust] = useState<number>(STANDAARD_RUST_TIJD);
  const [customRustModal, setCustomRustModal] = useState(false);
  const [customRustInput, setCustomRustInput] = useState('');

  useEffect(() => {
    haalAllesOp();
  }, [haalAllesOp]);

  useEffect(() => {
    getDefaultRestTime().then(setStandaardRust);
  }, []);

  useEffect(() => {
    if (isOnderzoeker) laadAbVergelijking();
  }, [isOnderzoeker]);

  const handleKiesRust = async (sec: number) => {
    setStandaardRust(sec);
    await setDefaultRestTime(sec);
  };

  const handleCustomRustOpslaan = async () => {
    const num = parseInt(customRustInput, 10);
    if (isNaN(num) || num < 5 || num > 600) {
      Alert.alert('Ongeldige tijd', 'Voer een tijd in tussen 5 en 600 seconden.');
      return;
    }
    setStandaardRust(num);
    await setDefaultRestTime(num);
    setCustomRustModal(false);
    setCustomRustInput('');
  };

  const laadAbVergelijking = async () => {
    setAbLaden(true);
    try {
      const { data: profielen, error: profielFout } = await supabase
        .from('profiles')
        .select('id, group_type, is_onderzoeker');
      if (profielFout || !profielen) throw profielFout ?? new Error('Geen profielen');

      const { data: rijen, error: rijFout } = await supabase
        .from('workouts')
        .select('*')
        .order('date', { ascending: true })
        .limit(50000);
      if (rijFout || !rijen) throw rijFout ?? new Error('Geen workouts');

      const deelnemers = profielen.filter(p => !p.is_onderzoeker);
      const groepPerId = new Map(profielen.map(p => [p.id, p.group_type as string]));
      const groepAIds = deelnemers.filter(p => p.group_type === 'app').map(p => p.id);
      const groepBIds = deelnemers.filter(p => p.group_type === 'gevoel').map(p => p.id);

      const alleRijen = rijen as Workout[];
      setOnderzoeksRijen(alleRijen.map(r => ({ ...r, group_type: groepPerId.get(r.user_id) })));

      const groei = groeiPerDeelnemer(alleRijen.filter(r => r.is_meting));
      const groeiA = groepAIds.filter(id => groei.has(id)).map(id => groei.get(id)!);
      const groeiB = groepBIds.filter(id => groei.has(id)).map(id => groei.get(id)!);

      const voorgeschreven = alleRijen.filter(r =>
        groepAIds.includes(r.user_id) && !r.is_meting && r.set_type !== 'warmup' && Number(r.prescribed_weight) > 0,
      );
      const opgevolgd = voorgeschreven.filter(r =>
        Math.abs(Number(r.weight) - Number(r.prescribed_weight)) < 0.01 &&
        Number(r.reps) >= Number(r.prescribed_reps),
      );

      setAbVergelijking({
        groepA: gemiddelde(groeiA),
        groepB: gemiddelde(groeiB),
        aantalA: groepAIds.length,
        aantalB: groepBIds.length,
        compleetA: groeiA.length,
        compleetB: groeiB.length,
        opvolging: voorgeschreven.length > 0 ? Math.round((opgevolgd.length / voorgeschreven.length) * 100) : null,
      });
    } catch (e) {
      console.warn('Fout bij A/B vergelijking ophalen:', e);
      setAbVergelijking(null);
    } finally {
      setAbLaden(false);
    }
  };

  const totaalVolume = workouts.reduce((s, w) => s + (parseFloat(String(w.volume)) || 0), 0);
  const totaalArbeid = workouts.reduce((s, w) => s + (parseFloat(String(w.work_joules)) || 0), 0);
  const oefeningen = Array.from(new Set(workouts.map((w) => findExercise(w.exercise)?.naam ?? w.exercise)));

  const handleExportCSV = async () => {
    const bron: ExportRij[] = isOnderzoeker ? onderzoeksRijen : workouts;
    if (bron.length === 0) {
      Alert.alert('Geen data', 'Er zijn nog geen workouts om te exporteren.');
      return;
    }
    const headers = ['id', 'user_id', 'group_type', 'date', 'exercise', 'set_type', 'sets', 'reps', 'weight_kg', 'volume_kg', 'work_joules', 'prescribed_sets', 'prescribed_reps', 'prescribed_weight_kg', 'is_meting', 'meting_moment'];
    const rows = bron.map(w => [
      w.id, w.user_id, w.group_type ?? profile?.group_type ?? '', w.date, canoniekeId(w.exercise), w.set_type ?? 'normaal',
      w.sets, w.reps, w.weight, w.volume, w.work_joules || 0,
      w.prescribed_sets, w.prescribed_reps, w.prescribed_weight,
      w.is_meting ? 'true' : 'false', w.meting_moment,
    ].map(csvVeld));
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    try {
      await Share.share({ message: csvContent, title: `wayt_export_${vandaag()}.csv` });
    } catch {
      Alert.alert('Export mislukt', 'Kon het bestand niet delen.');
    }
  };

  const maxAb = Math.max(Math.abs(abVergelijking?.groepA || 0), Math.abs(abVergelijking?.groepB || 0), 1);
  const TABEL_HEADERS = ['Datum', 'Oefening', 'Sets×Reps', 'Gewicht', 'Vol (kg)'];
  const isCustomActief = !RUST_PRESETS.some(p => p.seconden === standaardRust);

  return (
    <SafeAreaView style={[stijlen.veilig, { backgroundColor: kleuren.achtergrond }]}>
      <ScrollView
        style={stijlen.scroll}
        contentContainerStyle={stijlen.inhoud}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={laden || abLaden} onRefresh={() => { haalAllesOp(); if (isOnderzoeker) laadAbVergelijking(); }} tintColor={kleuren.accent} />}
      >
        <TerugKnop label="Profiel" />
        <Text style={[stijlen.titel, { color: kleuren.tekst }]}>{isOnderzoeker ? 'Instellingen & Onderzoek' : 'Instellingen'}</Text>
        <Text style={[stijlen.subtitel, { color: kleuren.tekstGedimpt }]}>
          {isOnderzoeker ? 'Voorkeuren en PWS-onderzoeksresultaten' : 'Voorkeuren, rusttijd en je account'}
        </Text>

        {/* ─── Instellingen Sectie ────────────────────────────────────── */}
        <Text style={[stijlen.sectie, { color: kleuren.accentTekst }]}>STANDAARD RUSTTIJD TUSSEN SETS</Text>
        <View style={[stijlen.kaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
          <Text style={[stijlen.kaartUitleg, { color: kleuren.tekstGedimpt }]}>
            Deze rusttijd wordt automatisch ingevuld bij nieuwe oefeningen in routines en live workouts:
          </Text>
          <View style={stijlen.rustKnoppenRij}>
            {RUST_PRESETS.map(p => {
              const actief = standaardRust === p.seconden;
              return (
                <TouchableOpacity
                  key={p.seconden}
                  style={[
                    stijlen.rustPresetKnop,
                    {
                      backgroundColor: actief ? kleuren.accent : kleuren.achtergrond,
                      borderColor: actief ? kleuren.accent : kleuren.kaartRand,
                    },
                  ]}
                  onPress={() => handleKiesRust(p.seconden)}
                >
                  <Text style={[stijlen.rustPresetTekst, { color: actief ? '#FFF' : kleuren.tekst }]}>{p.label}</Text>
                </TouchableOpacity>
              );
            })}

            {/* Custom Aangepast Knop */}
            <TouchableOpacity
              style={[
                stijlen.rustPresetKnop,
                {
                  backgroundColor: isCustomActief ? kleuren.accent : kleuren.achtergrond,
                  borderColor: isCustomActief ? kleuren.accent : kleuren.kaartRand,
                },
              ]}
              onPress={() => {
                setCustomRustInput(String(standaardRust));
                setCustomRustModal(true);
              }}
            >
              <Text style={[stijlen.rustPresetTekst, { color: isCustomActief ? '#FFF' : kleuren.tekst }]}>
                {isCustomActief ? `${standaardRust}s (Aangepast)` : '+ Custom'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Thema Instelling ────────────────────────────────────── */}
        <Text style={[stijlen.sectie, { color: kleuren.accentTekst, marginTop: 16 }]}>WEERGAVE & THEMA</Text>
        <View style={[stijlen.kaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
          <View style={stijlen.rustKnoppenRij}>
            {[
              { id: 'donker', label: 'Donker', icoon: 'moon-outline' },
              { id: 'licht', label: 'Licht', icoon: 'sunny-outline' },
              { id: 'systeem', label: 'Systeem', icoon: 'settings-outline' },
            ].map(t => {
              const actief = voorkeur === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    stijlen.rustPresetKnop,
                    {
                      backgroundColor: actief ? kleuren.accent : kleuren.achtergrond,
                      borderColor: actief ? kleuren.accent : kleuren.kaartRand,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    },
                  ]}
                  onPress={() => setVoorkeur(t.id as any)}
                >
                  <Ionicons name={t.icoon as any} size={15} color={actief ? '#FFF' : kleuren.tekst} />
                  <Text style={[stijlen.rustPresetTekst, { color: actief ? '#FFF' : kleuren.tekst }]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[stijlen.lijn, { backgroundColor: kleuren.kaartRand, marginTop: 24 }]} />

        {/* ─── Profiel & Groepsinfo ─────────────────────────────────── */}
        <Text style={[stijlen.sectie, { color: kleuren.accentTekst }]}>PROFIEL & ONDERZOEKSGROEP</Text>
        {profile && (
          <View style={[stijlen.profielKaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
            {[
              { label: 'E-mail', waarde: user?.email ?? '—', kleur: kleuren.tekst },
              {
                label: 'Testgroep',
                waarde: profile.group_type === 'app' ? 'Algoritme-groep (Groep A)' : 'Gevoel-groep (Groep B)',
                kleur: profile.group_type === 'app' ? kleuren.accent : '#F9A8D4',
              },
            ].map((r) => (
              <View key={r.label} style={stijlen.profielRij}>
                <Text style={[stijlen.profielLabel, { color: kleuren.tekstGedimpt }]}>{r.label}</Text>
                <Text style={[stijlen.profielWaarde, { color: r.kleur }]}>{r.waarde}</Text>
              </View>
            ))}
          </View>
        )}

        {isOnderzoeker && (
          <>
            {/* ─── A/B Vergelijking ────────────────────────────────────── */}
            <Text style={[stijlen.sectie, { color: kleuren.accentTekst }]}>A/B Vergelijking — Gemiddelde 1RM Groei</Text>
            {abLaden ? (
              <ActivityIndicator color={kleuren.accent} style={{ marginBottom: 20 }} />
            ) : abVergelijking ? (
              <View style={[stijlen.abKaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
                {([
                  { label: 'Groep A (Algoritme)', waarde: abVergelijking.groepA, aantalPersonen: abVergelijking.aantalA, compleet: abVergelijking.compleetA, kleur: kleuren.accent },
                  { label: 'Groep B (Gevoel)', waarde: abVergelijking.groepB, aantalPersonen: abVergelijking.aantalB, compleet: abVergelijking.compleetB, kleur: '#F9A8D4' },
                ]).map(groep => (
                  <View key={groep.label} style={stijlen.abGroepRij}>
                    <View style={stijlen.abGroepInfo}>
                      <Text style={[stijlen.abGroepLabel, { color: kleuren.tekst }]}>{groep.label}</Text>
                      <Text style={[stijlen.abGroepAantal, { color: kleuren.tekstGedimpt }]}>
                        {groep.compleet}/{groep.aantalPersonen} met begin- en eindmeting
                      </Text>
                    </View>
                    <View style={[stijlen.abBalkContainer, { backgroundColor: kleuren.achtergrond }]}>
                      <View style={[stijlen.abBalk, {
                        width: `${(Math.abs(groep.waarde) / maxAb) * 100}%`,
                        backgroundColor: groep.kleur,
                      }]} />
                    </View>
                    <Text style={[stijlen.abWaarde, { color: groep.kleur }]}>
                      {groep.waarde >= 0 ? '+' : ''}{groep.waarde.toFixed(1)}%
                    </Text>
                  </View>
                ))}
                <Text style={[stijlen.abNota, { color: kleuren.tekstGedimpt }]}>
                  Procentuele 1RM-toename week 0 → week 6, gemiddeld over Bench Press, Lat Pulldown en Leg Extension (Epley-formule)
                </Text>
                {abVergelijking.opvolging !== null && (
                  <Text style={[stijlen.abNota, { color: kleuren.tekstGedimpt }]}>
                    Opvolging advies Groep A: {abVergelijking.opvolging}% van de sets op voorgeschreven gewicht én reps gehaald
                  </Text>
                )}
              </View>
            ) : (
              <View style={[stijlen.geenData, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
                <Text style={{ color: kleuren.tekstGedimpt, fontFamily: 'Inter_400Regular', fontSize: 13 }}>
                  Nog onvoldoende data voor A/B vergelijking.
                </Text>
              </View>
            )}
          </>
        )}

        <View style={[stijlen.lijn, { backgroundColor: kleuren.kaartRand }]} />

        {/* ─── Totalen ──────────────────────────────────────────────── */}
        <Text style={[stijlen.sectie, { color: kleuren.accentTekst }]}>Totalen</Text>
        <View style={stijlen.statRij}>
          <StatCard waarde={String(new Set(workouts.map(w => w.date)).size)} label="Trainingsdagen" />
          <StatCard waarde={totaalVolume.toFixed(0)} label="Vol. (kg)" />
          <StatCard waarde={totaalArbeid.toFixed(0)} label="Arbeid (J)" />
        </View>

        {oefeningen.length > 0 && (
          <>
            <Text style={[stijlen.sectie, { color: kleuren.accentTekst, marginTop: 12 }]}>Oefeningen</Text>
            <View style={stijlen.badgeRij}>
              {oefeningen.map((o) => (
                <Badge key={o} label={o} kleur={kleuren.accent} achtergrond={kleuren.accentGedimpt} />
              ))}
            </View>
          </>
        )}

        <View style={[stijlen.lijn, { backgroundColor: kleuren.kaartRand }]} />

        {/* ─── Exporteren & Uitloggen ───────────────────────────────── */}
        <Text style={[stijlen.sectie, { color: kleuren.accentTekst }]}>Exporteren & Account</Text>
        {isOnderzoeker && (
          <Text style={[stijlen.kaartUitleg, { color: kleuren.tekstGedimpt }]}>
            Export bevat alle deelnemers ({onderzoeksRijen.length} rijen), inclusief testgroep.
          </Text>
        )}
        <TouchableOpacity
          style={[stijlen.exportKnop, { backgroundColor: kleuren.succes }]}
          onPress={handleExportCSV}
          accessibilityLabel="Data exporteren als CSV"
        >
          <Ionicons name="download-outline" size={18} color={kleuren.opSucces} style={{ marginRight: 8 }} />
          <Text style={[stijlen.exportTekst, { color: kleuren.opSucces }]}>{isOnderzoeker ? 'Exporteer onderzoeksdata (CSV)' : 'Exporteer mijn data (CSV)'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[stijlen.uitlogKnop, { borderColor: kleuren.fout + '55', backgroundColor: kleuren.fout + '15' }]}
          onPress={uitloggen}
        >
          <Ionicons name="log-out-outline" size={18} color={kleuren.fout} style={{ marginRight: 8 }} />
          <Text style={[stijlen.uitlogTekst, { color: kleuren.fout }]}>Uitloggen</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Custom Rusttijd Modal */}
      <Modal visible={customRustModal} transparent animationType="fade" onRequestClose={() => setCustomRustModal(false)}>
        <View style={stijlen.modalOverlay}>
          <View style={[stijlen.customModalBox, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
            <Text style={[stijlen.customModalTitel, { color: kleuren.tekst }]}>Aangepaste Rusttijd</Text>
            <Text style={[stijlen.customModalSub, { color: kleuren.tekstGedimpt }]}>
              Voer de standaard rustduur tussen sets in (in seconden):
            </Text>

            <TextInput
              style={[stijlen.customInput, { backgroundColor: kleuren.achtergrond, borderColor: kleuren.kaartRand, color: kleuren.tekst }]}
              keyboardType="numeric"
              placeholder="bijv. 75"
              placeholderTextColor={kleuren.tekstGedimpt}
              value={customRustInput}
              onChangeText={setCustomRustInput}
              autoFocus
            />

            <View style={stijlen.modalKnoppenRij}>
              <TouchableOpacity
                style={[stijlen.modalKnop, { backgroundColor: kleuren.achtergrond, borderColor: kleuren.kaartRand }]}
                onPress={() => setCustomRustModal(false)}
              >
                <Text style={{ color: kleuren.tekstGedimpt, fontFamily: 'Inter_600SemiBold' }}>Annuleren</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[stijlen.modalKnop, { backgroundColor: kleuren.accent, borderColor: kleuren.accent }]}
                onPress={handleCustomRustOpslaan}
              >
                <Text style={{ color: '#FFF', fontFamily: 'Inter_700Bold' }}>Opslaan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const stijlen = StyleSheet.create({
  veilig: { flex: 1 }, scroll: { flex: 1 }, inhoud: { padding: 20 },
  titel: { fontSize: 26, fontWeight: '900', fontFamily: 'Inter_900Black', letterSpacing: -0.5, marginBottom: 4 },
  subtitel: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 16 },
  lijn: { height: 1, marginBottom: 20, marginTop: 4 },
  sectie: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'Inter_700Bold', marginBottom: 10 },
  kaart: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 16 },
  kaartUitleg: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18, marginBottom: 12 },
  rustKnoppenRij: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rustPresetKnop: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 },
  rustPresetTekst: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  profielKaart: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  profielRij: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  profielLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  profielWaarde: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  adherenceKaart: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 20 },
  adherenceRij: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  adherenceLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  adherenceWaarde: { fontSize: 22, fontFamily: 'Inter_900Black', letterSpacing: -0.5 },
  adherenceBalk: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  adherenceVulling: { height: '100%', borderRadius: 4 },
  adherenceNota: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  abKaart: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 20, gap: 14 },
  abGroepRij: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  abGroepInfo: { width: 110 },
  abGroepLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  abGroepAantal: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  abBalkContainer: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden' },
  abBalk: { height: '100%', borderRadius: 5 },
  abWaarde: { width: 50, fontSize: 13, fontFamily: 'Inter_700Bold', textAlign: 'right' },
  abNota: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 4 },
  statRij: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  badgeRij: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  exportKnop: { flexDirection: 'row', borderRadius: 12, paddingVertical: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  exportTekst: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  uitlogKnop: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, paddingVertical: 14, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  uitlogTekst: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  geenData: { padding: 24, borderRadius: 14, alignItems: 'center', borderWidth: 1, marginBottom: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  customModalBox: { width: '100%', maxWidth: 340, borderRadius: 18, borderWidth: 1, padding: 20 },
  customModalTitel: { fontSize: 17, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  customModalSub: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18, marginBottom: 16 },
  customInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 18, fontFamily: 'Inter_700Bold', textAlign: 'center', marginBottom: 16 },
  modalKnoppenRij: { flexDirection: 'row', gap: 10 },
  modalKnop: { flex: 1, borderRadius: 10, borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
});
