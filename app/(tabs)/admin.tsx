import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, Alert, Share, RefreshControl, ActivityIndicator, TextInput, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useThema } from '../../src/context/ThemeContext';
import { useAlleWorkouts } from '../../src/hooks/useWorkouts';
import { supabase } from '../../src/lib/supabase';
import { bereken1RM } from '../../src/context/LiveWorkoutContext';
import ErrorBanner from '../../src/components/ErrorBanner';
import StatCard from '../../src/components/ui/StatCard';
import Badge from '../../src/components/ui/Badge';
import { getDefaultRestTime, setDefaultRestTime, STANDAARD_RUST_TIJD } from '../../src/lib/settingsStore';

interface AbVergelijking {
  groepA: number;
  groepB: number;
  aantalA: number;
  aantalB: number;
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
  const [abVergelijking, setAbVergelijking] = useState<AbVergelijking | null>(null);
  const [abLaden, setAbLaden] = useState(false);

  // Standaard rusttijd instelling
  const [standaardRust, setStandaardRust] = useState<number>(STANDAARD_RUST_TIJD);
  const [customRustModal, setCustomRustModal] = useState(false);
  const [customRustInput, setCustomRustInput] = useState('');

  useEffect(() => {
    haalAllesOp();
  }, [haalAllesOp]);

  useEffect(() => {
    laadAbVergelijking();
    getDefaultRestTime().then(setStandaardRust);
  }, []);

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
      const { data: profielen } = await supabase
        .from('profiles')
        .select('id, group_type');
      if (!profielen) return;

      const groepAIds = profielen.filter(p => p.group_type === 'app').map(p => p.id);
      const groepBIds = profielen.filter(p => p.group_type === 'gevoel').map(p => p.id);

      const berekenGemiddeld1RM = async (userIds: string[]): Promise<number> => {
        if (userIds.length === 0) return 0;
        const { data: wdata } = await supabase
          .from('workouts')
          .select('user_id, weight, reps, date')
          .in('user_id', userIds)
          .in('exercise', ['bench_press', 'lat_pulldown', 'leg_extension', '0025', '0150', '0585']);
        if (!wdata || wdata.length === 0) return 0;

        const vroegsteDatumPerUser = new Map<string, string>();
        const laastste1RMPerUser = new Map<string, number>();

        for (const row of wdata) {
          if (!vroegsteDatumPerUser.has(row.user_id) || row.date < vroegsteDatumPerUser.get(row.user_id)!) {
            vroegsteDatumPerUser.set(row.user_id, row.date);
          }
        }

        const baseline1RMPerUser = new Map<string, number>();
        for (const row of wdata) {
          if (row.date === vroegsteDatumPerUser.get(row.user_id)) {
            const eenRM = bereken1RM(Number(row.weight), Number(row.reps));
            baseline1RMPerUser.set(row.user_id, Math.max(baseline1RMPerUser.get(row.user_id) || 0, eenRM));
          }
          const eenRM = bereken1RM(Number(row.weight), Number(row.reps));
          laastste1RMPerUser.set(row.user_id, Math.max(laastste1RMPerUser.get(row.user_id) || 0, eenRM));
        }

        let somGroei = 0;
        let geteldeUsers = 0;
        for (const uid of userIds) {
          const base = baseline1RMPerUser.get(uid) || 0;
          const laatst = laastste1RMPerUser.get(uid) || 0;
          if (base > 0) {
            somGroei += ((laatst - base) / base) * 100;
            geteldeUsers++;
          }
        }
        return geteldeUsers > 0 ? somGroei / geteldeUsers : 0;
      };

      const [groepAGroei, groepBGroei] = await Promise.all([
        berekenGemiddeld1RM(groepAIds),
        berekenGemiddeld1RM(groepBIds),
      ]);

      setAbVergelijking({
        groepA: groepAGroei,
        groepB: groepBGroei,
        aantalA: groepAIds.length,
        aantalB: groepBIds.length,
      });
    } catch (e) {
      console.warn('Fout bij A/B vergelijking ophalen:', e);
    } finally {
      setAbLaden(false);
    }
  };

  const aantalSessies = workouts.length;
  const totaalVolume = workouts.reduce((s, w) => s + (parseFloat(String(w.volume)) || 0), 0);
  const totaalArbeid = workouts.reduce((s, w) => s + (parseFloat(String(w.work_joules)) || 0), 0);
  const oefeningen = Array.from(new Set(workouts.map((w) => w.exercise)));

  const adherenceGemiddeld = (): number => {
    if (workouts.length === 0) return 0;
    const scores = workouts.map(w => {
      const v = Number((w as any).prescribed_weight);
      const g = Number(w.weight);
      if (!v || v <= 0) return 100;
      return Math.max(0, 100 - (Math.abs(g - v) / v) * 100);
    });
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const handleExportCSV = async () => {
    if (workouts.length === 0) {
      Alert.alert('Geen data', 'Er zijn nog geen workouts om te exporteren.');
      return;
    }
    const headers = ['id', 'user_id', 'date', 'exercise', 'sets', 'reps', 'weight_kg', 'volume_kg', 'work_joules', 'prescribed_sets', 'prescribed_reps', 'prescribed_weight_kg', 'is_meting'];
    const rows = workouts.map((w: any) => [
      w.id, w.user_id, w.date, `"${w.exercise}"`, w.sets, w.reps, w.weight, w.volume, w.work_joules || 0,
      w.prescribed_sets ?? '', w.prescribed_reps ?? '', w.prescribed_weight ?? '', w.is_meting ? 'true' : 'false',
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    try {
      await Share.share({ message: csvContent, title: `wayt_export_${new Date().toISOString().split('T')[0]}.csv` });
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
        refreshControl={<RefreshControl refreshing={laden || abLaden} onRefresh={() => { haalAllesOp(); laadAbVergelijking(); }} tintColor={kleuren.accent} />}
      >
        <Text style={[stijlen.titel, { color: kleuren.tekst }]}>Instellingen & Data</Text>
        <Text style={[stijlen.subtitel, { color: kleuren.tekstGedimpt }]}>Voorkeuren, standaard rusttijd en PWS-onderzoeksresultaten</Text>

        {/* ─── Instellingen Sectie ────────────────────────────────────── */}
        <Text style={[stijlen.sectie, { color: kleuren.accent }]}>STANDAARD RUSTTIJD TUSSEN SETS</Text>
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
        <Text style={[stijlen.sectie, { color: kleuren.accent, marginTop: 16 }]}>WEERGAVE & THEMA</Text>
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
        <Text style={[stijlen.sectie, { color: kleuren.accent }]}>PROFIEL & ONDERZOEKSGROEP</Text>
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

        {/* ─── Therapietrouw (Groep A) ─────────────────────────────────── */}
        {profile?.group_type === 'app' && (
          <>
            <Text style={[stijlen.sectie, { color: kleuren.accent }]}>Therapietrouw (Groep A)</Text>
            <View style={[stijlen.adherenceKaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
              <View style={stijlen.adherenceRij}>
                <Text style={[stijlen.adherenceLabel, { color: kleuren.tekstGedimpt }]}>Gemiddelde opvolggraad</Text>
                <Text style={[stijlen.adherenceWaarde, { color: kleuren.succes }]}>{adherenceGemiddeld()}%</Text>
              </View>
              <View style={[stijlen.adherenceBalk, { backgroundColor: kleuren.kaartRand }]}>
                <View style={[stijlen.adherenceVulling, { width: `${adherenceGemiddeld()}%`, backgroundColor: kleuren.succes }]} />
              </View>
              <Text style={[stijlen.adherenceNota, { color: kleuren.tekstGedimpt }]}>
                Gebaseerd op jouw {aantalSessies} gelogde sessies.
              </Text>
            </View>
          </>
        )}

        {/* ─── A/B Vergelijking ────────────────────────────────────── */}
        <Text style={[stijlen.sectie, { color: kleuren.accent }]}>A/B Vergelijking — Gemiddelde 1RM Groei</Text>
        {abLaden ? (
          <ActivityIndicator color={kleuren.accent} style={{ marginBottom: 20 }} />
        ) : abVergelijking ? (
          <View style={[stijlen.abKaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
            {([
              { label: 'Groep A (Algoritme)', waarde: abVergelijking.groepA, aantalPersonen: abVergelijking.aantalA, kleur: kleuren.accent },
              { label: 'Groep B (Gevoel)', waarde: abVergelijking.groepB, aantalPersonen: abVergelijking.aantalB, kleur: '#F9A8D4' },
            ]).map(groep => (
              <View key={groep.label} style={stijlen.abGroepRij}>
                <View style={stijlen.abGroepInfo}>
                  <Text style={[stijlen.abGroepLabel, { color: kleuren.tekst }]}>{groep.label}</Text>
                  <Text style={[stijlen.abGroepAantal, { color: kleuren.tekstGedimpt }]}>{groep.aantalPersonen} deeln.</Text>
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
              Procentuele 1RM-toename t.o.v. nulmeting (Epley-formule)
            </Text>
          </View>
        ) : (
          <View style={[stijlen.geenData, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
            <Text style={{ color: kleuren.tekstGedimpt, fontFamily: 'Inter_400Regular', fontSize: 13 }}>
              Nog onvoldoende data voor A/B vergelijking.
            </Text>
          </View>
        )}

        <View style={[stijlen.lijn, { backgroundColor: kleuren.kaartRand }]} />

        {/* ─── Totalen ──────────────────────────────────────────────── */}
        <Text style={[stijlen.sectie, { color: kleuren.accent }]}>Totalen</Text>
        <View style={stijlen.statRij}>
          <StatCard waarde={String(aantalSessies)} label="Sessies" />
          <StatCard waarde={totaalVolume.toFixed(0)} label="Vol. (kg)" />
          <StatCard waarde={totaalArbeid.toFixed(0)} label="Arbeid (J)" />
        </View>

        {oefeningen.length > 0 && (
          <>
            <Text style={[stijlen.sectie, { color: kleuren.accent, marginTop: 12 }]}>Oefeningen</Text>
            <View style={stijlen.badgeRij}>
              {oefeningen.map((o) => (
                <Badge key={o} label={o} kleur={kleuren.accent} achtergrond={kleuren.accentGedimpt} />
              ))}
            </View>
          </>
        )}

        <View style={[stijlen.lijn, { backgroundColor: kleuren.kaartRand }]} />

        {/* ─── Exporteren & Uitloggen ───────────────────────────────── */}
        <Text style={[stijlen.sectie, { color: kleuren.accent }]}>Exporteren & Account</Text>
        <TouchableOpacity
          style={[stijlen.exportKnop, { backgroundColor: kleuren.succes }]}
          onPress={handleExportCSV}
          accessibilityLabel="Data exporteren als CSV"
        >
          <Ionicons name="download-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={stijlen.exportTekst}>Exporteer als CSV</Text>
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
