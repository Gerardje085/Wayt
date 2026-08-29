import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  RefreshControl, TouchableOpacity, Dimensions
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useThema } from '../../src/context/ThemeContext';
import { useStatistieken } from '../../src/hooks/useStatistieken';
import type { DagData, SpiergroepVerdeling } from '../../src/hooks/useStatistieken';
import MetingModal from '../../src/components/MetingModal';
import HerstelHeatmap from '../../src/components/HerstelHeatmap';

const { width: SCREEN_W } = Dimensions.get('window');

function ConsistencyCalendar({ heatmap, kleuren }: { heatmap: DagData[]; kleuren: any }) {
  const CEL = 13;
  const GAP = 3;
  const dagMap = useMemo(() => {
    const m = new Map<string, number>();
    heatmap.forEach(d => m.set(d.datum, d.count));
    return m;
  }, [heatmap]);

  const cellen = useMemo(() => {
    const cells: { datum: string; count: number }[] = [];
    for (let i = 104; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const datum = d.toISOString().split('T')[0];
      cells.push({ datum, count: dagMap.get(datum) || 0 });
    }
    return cells;
  }, [dagMap]);

  const getKleur = (count: number) => {
    if (count === 0) return kleuren.kaartRand;
    if (count === 1) return kleuren.accent + '55';
    if (count === 2) return kleuren.accent + 'AA';
    return kleuren.accent;
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
        {cellen.map((c, i) => (
          <View
            key={i}
            style={{
              width: CEL, height: CEL, borderRadius: 3,
              backgroundColor: getKleur(c.count),
            }}
          />
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 8, gap: 4 }}>
        <Text style={{ color: kleuren.tekstGedimpt, fontSize: 10, fontFamily: 'Inter_400Regular' }}>Minder</Text>
        {[0, 1, 2, 3].map(n => (
          <View key={n} style={{ width: CEL, height: CEL, borderRadius: 3, backgroundColor: getKleur(n) }} />
        ))}
        <Text style={{ color: kleuren.tekstGedimpt, fontSize: 10, fontFamily: 'Inter_400Regular' }}>Meer</Text>
      </View>
    </View>
  );
}

function DonutChart({ data, kleuren }: { data: SpiergroepVerdeling[]; kleuren: any }) {
  const SIZE = 140;
  const RADIUS = 54;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const STROKE = 18;

  const totaal = data.reduce((s, d) => s + d.sets, 0);
  if (totaal === 0) return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: kleuren.tekstGedimpt, fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' }}>
        Geen data{'\n'}deze week
      </Text>
    </View>
  );

  const omtrek = 2 * Math.PI * RADIUS;
  let offset = 0;
  const segmenten = data.map(d => {
    const fractie = d.sets / totaal;
    const dasharray = `${fractie * omtrek - 2} ${omtrek}`;
    const strokeOffset = -(offset * omtrek) - omtrek * 0.25;
    offset += fractie;
    return { ...d, dasharray, strokeOffset };
  });

  return (
    <Svg width={SIZE} height={SIZE}>
      <Circle cx={CX} cy={CY} r={RADIUS} stroke={kleuren.kaartRand} strokeWidth={STROKE} fill="none" />
      {segmenten.map((seg, i) => (
        <Circle
          key={i}
          cx={CX} cy={CY} r={RADIUS}
          stroke={seg.kleur}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={seg.dasharray}
          strokeDashoffset={seg.strokeOffset}
          strokeLinecap="butt"
        />
      ))}
      <G>
        <Circle cx={CX} cy={CY} r={RADIUS - STROKE / 2 - 2} fill={kleuren.kaart} />
      </G>
    </Svg>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { kleuren } = useThema();
  const router = useRouter();
  const { laadStatistieken, data, laden } = useStatistieken(user?.id);
  const [metingZichtbaar, setMetingZichtbaar] = useState(false);

  useEffect(() => { laadStatistieken(); }, [laadStatistieken]);

  const weekStat = data?.weekStat;
  const heatmap = data?.heatmap ?? [];
  const verdeling = data?.spiergroepVerdeling ?? [];
  const prs = data?.prs ?? [];

  return (
    <SafeAreaView style={[s.veilig, { backgroundColor: kleuren.achtergrond }]}>
      <ScrollView
        contentContainerStyle={s.inhoud}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={laden} onRefresh={laadStatistieken}
            tintColor={kleuren.accent} colors={[kleuren.accent]} />
        }
      >
        <View style={s.headerRij}>
          <View>
            <Text style={[s.headerTitel, { color: kleuren.tekst }]}>Jouw Voortgang</Text>
            <Text style={[s.headerSub, { color: kleuren.tekstGedimpt }]}>Laatste 90 dagen</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[s.metingKnop, { backgroundColor: kleuren.waarschuwing + '22', borderColor: kleuren.waarschuwing + '55' }]}
              onPress={() => setMetingZichtbaar(true)}
              accessibilityLabel="Officiele 1RM meting starten"
            >
              <Ionicons name="trophy-outline" size={16} color={kleuren.waarschuwing} />
              <Text style={[s.metingKnopTekst, { color: kleuren.waarschuwing }]}>1RM</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.instellingenKnop, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}
              onPress={() => router.push('/(tabs)/admin')}
              accessibilityLabel="Onderzoeksdata openen"
            >
              <Ionicons name="settings-outline" size={20} color={kleuren.tekstGedimpt} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[s.kaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
          <Text style={[s.kaartTitel, { color: kleuren.tekstGedimpt }]}>CONSISTENTIE</Text>
          <ConsistencyCalendar heatmap={heatmap} kleuren={kleuren} />
        </View>

        <Text style={[s.sectieLabel, { color: kleuren.tekstGedimpt }]}>DEZE WEEK</Text>
        <View style={s.statRij}>
          {[
            { label: 'Workouts', waarde: String(weekStat?.workouts ?? 0), icoon: 'barbell-outline' },
            { label: 'Volume', waarde: `${((weekStat?.totaalVolume ?? 0) / 1000).toFixed(1)}t`, icoon: 'trending-up-outline' },
            { label: 'Sets', waarde: String(weekStat?.minutenGeraamd ?? 0), icoon: 'checkmark-circle-outline' },
          ].map((stat) => (
            <View key={stat.label} style={[s.statKaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
              <Ionicons name={stat.icoon as any} size={22} color={kleuren.accent} style={{ marginBottom: 8 }} />
              <Text style={[s.statWaarde, { color: kleuren.tekst }]}>{stat.waarde}</Text>
              <Text style={[s.statLabel, { color: kleuren.tekstGedimpt }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <Text style={[s.sectieLabel, { color: kleuren.tekstGedimpt }]}>SPIERGROEP BALANS</Text>
        <View style={[s.kaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
          {verdeling.length === 0 ? (
            <Text style={[s.leegTekst, { color: kleuren.tekstGedimpt }]}>
              Train deze week om je balans te zien!
            </Text>
          ) : (
            <View style={s.donutRij}>
              <DonutChart data={verdeling} kleuren={kleuren} />
              <View style={s.legendaLijst}>
                {verdeling.slice(0, 5).map(d => (
                  <View key={d.groep} style={s.legendaItem}>
                    <View style={[s.legendaDot, { backgroundColor: d.kleur }]} />
                    <Text style={[s.legendaNaam, { color: kleuren.tekst }]}>{d.groep}</Text>
                    <Text style={[s.legendaSets, { color: kleuren.tekstGedimpt }]}>{d.sets} sets</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <Text style={[s.sectieLabel, { color: kleuren.tekstGedimpt }]}>PERSOONLIJKE RECORDS</Text>
        {prs.length === 0 ? (
          <View style={[s.kaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
            <Text style={[s.leegTekst, { color: kleuren.tekstGedimpt }]}>
              Geen PRs gevonden. Start met trainen!
            </Text>
          </View>
        ) : (
          prs.map(pr => (
            <View key={pr.oefeningId} style={[s.prRij, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
              <View style={s.prLinks}>
                <Text style={[s.prNaam, { color: kleuren.tekst }]}>{pr.oefeningNaam}</Text>
                <Text style={[s.prDatum, { color: kleuren.tekstGedimpt }]}>{pr.datum}</Text>
              </View>
              <View style={s.prRechts}>
                <Text style={[s.prEenRM, { color: kleuren.accent }]}>{pr.eenRM} kg</Text>
                <Text style={[s.prDetail, { color: kleuren.tekstGedimpt }]}>
                  {pr.gewicht}kg × {pr.reps}
                </Text>
              </View>
              <Ionicons name="trophy-outline" size={20} color={kleuren.waarschuwing} />
            </View>
          ))
        )}

        <Text style={[s.sectieLabel, { color: kleuren.tekstGedimpt }]}>HERSTELSTATUS (72U)</Text>
        <View style={[s.kaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
          <HerstelHeatmap userId={user?.id} />
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <MetingModal zichtbaar={metingZichtbaar} onSluiten={() => setMetingZichtbaar(false)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  veilig: { flex: 1 },
  inhoud: { padding: 20 },
  headerRij: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitel: { fontSize: 30, fontFamily: 'Inter_900Black', letterSpacing: -1 },
  headerSub: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 2 },
  instellingenKnop: {
    width: 42, height: 42, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  metingKnop: {
    height: 42, borderRadius: 14, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 12, gap: 5,
  },
  metingKnopTekst: {
    fontSize: 13, fontFamily: 'Inter_700Bold',
  },

  kaart: {
    borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16,
  },
  kaartTitel: {
    fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.2,
    marginBottom: 12, textTransform: 'uppercase',
  },

  sectieLabel: {
    fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.2,
    marginBottom: 10, marginTop: 4, textTransform: 'uppercase',
  },

  statRij: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statKaart: {
    flex: 1, borderWidth: 1, borderRadius: 16, padding: 14, alignItems: 'center',
  },
  statWaarde: { fontSize: 22, fontFamily: 'Inter_900Black', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', marginTop: 2 },

  donutRij: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  legendaLijst: { flex: 1, gap: 8 },
  legendaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendaDot: { width: 10, height: 10, borderRadius: 5 },
  legendaNaam: { flex: 1, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  legendaSets: { fontSize: 12, fontFamily: 'Inter_400Regular' },

  prRij: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderRadius: 14, padding: 14, marginBottom: 8,
  },
  prLinks: { flex: 1 },
  prNaam: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  prDatum: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  prRechts: { alignItems: 'flex-end', marginRight: 12 },
  prEenRM: { fontSize: 18, fontFamily: 'Inter_900Black', letterSpacing: -0.5 },
  prDetail: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },

  leegTekst: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', padding: 16, lineHeight: 22 },
});
