import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl, TouchableOpacity, Platform, type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useThema } from '../../src/context/ThemeContext';
import { useLiveWorkout } from '../../src/context/LiveWorkoutContext';
import { useStatistieken } from '../../src/hooks/useStatistieken';
import type { DagData, SpiergroepVerdeling } from '../../src/hooks/useStatistieken';
import MetingModal from '../../src/components/MetingModal';
import HerstelHeatmap from '../../src/components/HerstelHeatmap';
import ErrorBanner from '../../src/components/ErrorBanner';
import { ResponsiveContainer } from '../../src/components/ui/ResponsiveContainer';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { Card } from '../../src/components/ui/Card';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { NAV_METRICS, RADIUS, SPACING, useResponsive } from '../../src/theme/designTokens';

const WEB_POINTER = Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : undefined;

function ConsistencyCalendar({ heatmap, kleuren }: { heatmap: DagData[]; kleuren: any }) {
  const { isMobile } = useResponsive();
  const CEL = isMobile ? 14 : 16;
  const GAP = 4;

  const dagMap = useMemo(() => {
    const m = new Map<string, number>();
    heatmap.forEach(d => m.set(d.datum, d.count));
    return m;
  }, [heatmap]);

  const { cellen, actieveDagen } = useMemo(() => {
    const cells: { datum: string; count: number }[] = [];
    let actief = 0;
    for (let i = 104; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const datum = d.toISOString().split('T')[0];
      const count = dagMap.get(datum) || 0;
      if (count > 0) actief++;
      cells.push({ datum, count });
    }
    return { cellen: cells, actieveDagen: actief };
  }, [dagMap]);

  const getKleur = (count: number) => {
    if (count === 0) return kleuren.isDark ? '#27272A' : '#E4E4E7';
    if (count === 1) return kleuren.accent + '55';
    if (count === 2) return kleuren.accent + 'AA';
    return kleuren.accent;
  };

  return (
    <View>
      <View style={cal.topRij}>
        <Text style={[cal.metaTekst, { color: kleuren.tekstSecundair }]}>
          Laatste 15 weken
        </Text>
        <View style={[cal.pil, { backgroundColor: kleuren.accentGedimpt }]}>
          <Text style={[cal.pilTekst, { color: kleuren.accentLicht }]}>
            {actieveDagen} {actieveDagen === 1 ? 'dag' : 'dagen'} actief
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
        {cellen.map((c, i) => (
          <View
            key={i}
            style={{
              width: CEL,
              height: CEL,
              borderRadius: 4,
              backgroundColor: getKleur(c.count),
            }}
          />
        ))}
      </View>

      <View style={cal.legendaRij}>
        <Text style={[cal.legendaTekst, { color: kleuren.tekstGedimpt }]}>Minder</Text>
        {[0, 1, 2, 3].map(n => (
          <View
            key={n}
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              backgroundColor: getKleur(n),
            }}
          />
        ))}
        <Text style={[cal.legendaTekst, { color: kleuren.tekstGedimpt }]}>Meer</Text>
      </View>
    </View>
  );
}

const cal = StyleSheet.create({
  topRij: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaTekst: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  pil: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  pilTekst: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    fontVariant: ['tabular-nums'],
  },
  legendaRij: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 12,
    gap: 5,
  },
  legendaTekst: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
});

function DonutChart({ data, kleuren }: { data: SpiergroepVerdeling[]; kleuren: any }) {
  const SIZE = 148;
  const RADIUS_CIRCLE = 56;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const STROKE = 18;

  const totaal = data.reduce((s, d) => s + d.sets, 0);
  if (totaal === 0) {
    return (
      <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: kleuren.tekstGedimpt, fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' }}>
          Geen data{'\n'}deze week
        </Text>
      </View>
    );
  }

  const omtrek = 2 * Math.PI * RADIUS_CIRCLE;
  let offset = 0;
  const segmenten = data.map(d => {
    const fractie = d.sets / totaal;
    const lengte = Math.max(0, fractie * omtrek - (data.length > 1 ? 3 : 0));
    const dasharray = `${lengte} ${omtrek}`;
    const strokeOffset = -(offset * omtrek) - omtrek * 0.25;
    offset += fractie;
    return { ...d, dasharray, strokeOffset };
  });

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={CX}
          cy={CY}
          r={RADIUS_CIRCLE}
          stroke={kleuren.kaartRand}
          strokeWidth={STROKE}
          fill="none"
        />
        {segmenten.map((seg, i) => (
          <Circle
            key={i}
            cx={CX}
            cy={CY}
            r={RADIUS_CIRCLE}
            stroke={seg.kleur}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={seg.dasharray}
            strokeDashoffset={seg.strokeOffset}
            strokeLinecap="butt"
          />
        ))}
        <G>
          <Circle cx={CX} cy={CY} r={RADIUS_CIRCLE - STROKE / 2 - 2} fill={kleuren.kaart} />
        </G>
      </Svg>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: kleuren.tekst, fontSize: 22, fontFamily: 'Inter_900Black', fontVariant: ['tabular-nums'] }}>
            {totaal}
          </Text>
          <Text style={{ color: kleuren.tekstGedimpt, fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.6 }}>
            SETS
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const { user, profile } = useAuth();
  const { kleuren } = useThema();
  const { isActief } = useLiveWorkout();
  const router = useRouter();
  const { isDesktopNav, isMobile } = useResponsive();
  const { laadStatistieken, data, laden, fout } = useStatistieken(user?.id);
  const [metingZichtbaar, setMetingZichtbaar] = useState(false);

  useEffect(() => { laadStatistieken(); }, [laadStatistieken]);

  const weekStat = data?.weekStat;
  const heatmap = data?.heatmap ?? [];
  const verdeling = data?.spiergroepVerdeling ?? [];
  const prs = data?.prs ?? [];
  const totaalSetsWeek = verdeling.reduce((acc, d) => acc + d.sets, 0);

  const begroeting = profile?.username ? `Hoi, ${profile.username}` : 'Profiel';

  const kpiStats = [
    {
      label: 'Workouts',
      sublabel: 'deze week',
      waarde: String(weekStat?.workouts ?? 0),
      icoon: 'barbell-outline' as const,
      kleur: kleuren.accent,
    },
    {
      label: 'Volume',
      sublabel: 'verplaatst',
      waarde: `${((weekStat?.totaalVolume ?? 0) / 1000).toFixed(1)}t`,
      icoon: 'trending-up-outline' as const,
      kleur: kleuren.succes,
    },
    {
      label: 'Sets',
      sublabel: 'voltooid',
      waarde: String(weekStat?.totaalSets ?? 0),
      icoon: 'checkmark-circle-outline' as const,
      kleur: kleuren.waarschuwing,
    },
  ];

  const consistentieKaart = (
    <Card style={s.sectieKaart}>
      <View style={s.kaartKop}>
        <Text style={[s.kaartTitel, { color: kleuren.tekstGedimpt }]}>CONSISTENTIE</Text>
      </View>
      <ConsistencyCalendar heatmap={heatmap} kleuren={kleuren} />
    </Card>
  );

  const herstelKaart = (
    <Card style={s.sectieKaart}>
      <View style={s.kaartKop}>
        <Text style={[s.kaartTitel, { color: kleuren.tekstGedimpt }]}>HERSTELSTATUS (72U)</Text>
      </View>
      <HerstelHeatmap userId={user?.id} />
    </Card>
  );

  const balansKaart = (
    <Card style={s.sectieKaart}>
      <View style={s.kaartKop}>
        <Text style={[s.kaartTitel, { color: kleuren.tekstGedimpt }]}>SPIERGROEP BALANS</Text>
        <Text style={[s.kaartMeta, { color: kleuren.tekstGedimpt }]}>Deze week</Text>
      </View>
      {verdeling.length === 0 ? (
        <EmptyState
          icoon="pie-chart-outline"
          titel="Nog geen sets deze week"
          subtekst="Start een workout om je verdeling per spiergroep te zien."
          compact
        />
      ) : (
        <View style={[s.donutRij, isMobile && { gap: 16 }]}>
          <DonutChart data={verdeling} kleuren={kleuren} />
          <View style={s.legendaLijst}>
            {verdeling.slice(0, 6).map(d => {
              const pct = totaalSetsWeek > 0 ? Math.round((d.sets / totaalSetsWeek) * 100) : 0;
              return (
                <View key={d.groep} style={s.legendaItem}>
                  <View style={[s.legendaDot, { backgroundColor: d.kleur }]} />
                  <Text style={[s.legendaNaam, { color: kleuren.tekst }]} numberOfLines={1}>
                    {d.groep}
                  </Text>
                  <Text style={[s.legendaSets, { color: kleuren.tekstSecundair }]}>
                    {d.sets} ({pct}%)
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </Card>
  );

  const prKaart = (
    <Card style={s.sectieKaart}>
      <View style={s.kaartKop}>
        <Text style={[s.kaartTitel, { color: kleuren.tekstGedimpt }]}>PERSOONLIJKE RECORDS</Text>
        {prs.length > 0 && (
          <Text style={[s.kaartMeta, { color: kleuren.tekstGedimpt }]}>{prs.length} PRs</Text>
        )}
      </View>
      {prs.length === 0 ? (
        <EmptyState
          icoon="trophy-outline"
          titel="Geen PRs gevonden"
          subtekst="Log je sets tijdens een training om automatisch 1RM-records bij te houden."
          compact
        />
      ) : (
        <View style={s.prLijst}>
          {prs.map((pr, idx) => (
            <View
              key={pr.oefeningId}
              style={[
                s.prRij,
                {
                  backgroundColor: kleuren.achtergrondSecundair,
                  borderColor: kleuren.kaartRand,
                },
                idx === prs.length - 1 && { marginBottom: 0 },
              ]}
            >
              <View style={[s.prTrofeeBadge, { backgroundColor: kleuren.waarschuwing + '1F' }]}>
                <Ionicons name="trophy" size={16} color={kleuren.waarschuwing} />
              </View>
              <View style={s.prLinks}>
                <Text style={[s.prNaam, { color: kleuren.tekst }]} numberOfLines={1}>
                  {pr.oefeningNaam}
                </Text>
                <Text style={[s.prDatum, { color: kleuren.tekstGedimpt }]}>{pr.datum}</Text>
              </View>
              <View style={s.prRechts}>
                <Text style={[s.prEenRM, { color: kleuren.accentLicht }]}>{pr.eenRM} kg</Text>
                <Text style={[s.prDetail, { color: kleuren.tekstGedimpt }]}>
                  {pr.gewicht} kg × {pr.reps}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </Card>
  );

  return (
    <SafeAreaView style={[s.veilig, { backgroundColor: kleuren.achtergrond }]}>
      <ScrollView
        contentContainerStyle={[
          s.scrollInhoud,
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
            onRefresh={laadStatistieken}
            tintColor={kleuren.accent}
            colors={[kleuren.accent]}
          />
        }
      >
        <ResponsiveContainer variant="wide" padded>
          <ScreenHeader
            title={begroeting}
            subtitle="Je wekelijkse overzicht, balans en records"
            rightAction={
              <View style={s.headerActies}>
                <TouchableOpacity
                  style={[
                    s.metingKnop,
                    {
                      backgroundColor: kleuren.waarschuwing + '1C',
                      borderColor: kleuren.waarschuwing + '4D',
                    },
                    WEB_POINTER,
                  ]}
                  onPress={() => setMetingZichtbaar(true)}
                  activeOpacity={0.75}
                  accessibilityLabel="Officiële 1RM meting starten"
                >
                  <Ionicons name="trophy-outline" size={15} color={kleuren.waarschuwing} />
                  <Text style={[s.metingKnopTekst, { color: kleuren.waarschuwing }]}>1RM Meting</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    s.instellingenKnop,
                    { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand },
                    WEB_POINTER,
                  ]}
                  onPress={() => router.push('/instellingen')}
                  activeOpacity={0.75}
                  accessibilityLabel="Instellingen openen"
                >
                  <Ionicons name="settings-outline" size={19} color={kleuren.tekstSecundair} />
                </TouchableOpacity>
              </View>
            }
          />

          {fout && <ErrorBanner bericht={fout} onProbeerOpnieuw={laadStatistieken} />}

          {/* Top Row: 3 KPI Stat Cards */}
          <Text style={[s.sectieLabel, { color: kleuren.tekstGedimpt }]}>DEZE WEEK</Text>
          <View style={[s.statRij, !isMobile && { gap: 16 }]}>
            {kpiStats.map((stat) => (
              <Card key={stat.label} padding={isMobile ? 14 : 18} style={s.statKaart}>
                <View style={[s.statIcoonBadge, { backgroundColor: stat.kleur + '1D' }]}>
                  <Ionicons name={stat.icoon} size={20} color={stat.kleur} />
                </View>
                <Text
                  style={[
                    s.statWaarde,
                    { color: kleuren.tekst, fontSize: isMobile ? 24 : 28 },
                  ]}
                  numberOfLines={1}
                >
                  {stat.waarde}
                </Text>
                <Text style={[s.statLabel, { color: kleuren.tekstSecundair }]}>{stat.label}</Text>
                {!isMobile && (
                  <Text style={[s.statSub, { color: kleuren.tekstGedimpt }]}>{stat.sublabel}</Text>
                )}
              </Card>
            ))}
          </View>

          {/* Responsive 2-column Desktop Grid vs. Mobile Vertical Stack */}
          {isDesktopNav ? (
            <View style={s.desktopGrid}>
              <View style={s.desktopKolom}>
                {consistentieKaart}
                {herstelKaart}
              </View>
              <View style={s.desktopKolom}>
                {balansKaart}
                {prKaart}
              </View>
            </View>
          ) : (
            <View>
              {consistentieKaart}
              {balansKaart}
              {prKaart}
              {herstelKaart}
            </View>
          )}
        </ResponsiveContainer>
      </ScrollView>

      <MetingModal zichtbaar={metingZichtbaar} onSluiten={() => setMetingZichtbaar(false)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  veilig: { flex: 1 },
  scrollInhoud: {
    paddingTop: SPACING.sm,
  },
  headerActies: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metingKnop: {
    height: 38,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 13,
    gap: 6,
  },
  metingKnopTekst: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  instellingenKnop: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectieLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  statRij: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: SPACING.lg,
  },
  statKaart: {
    flex: 1,
    alignItems: 'center',
  },
  statIcoonBadge: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statWaarde: {
    fontFamily: 'Inter_900Black',
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 3,
  },
  statSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  desktopGrid: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },
  desktopKolom: {
    flex: 1,
    minWidth: 0,
  },
  sectieKaart: {
    marginBottom: SPACING.base,
  },
  kaartKop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  kaartTitel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  kaartMeta: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  donutRij: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
  },
  legendaLijst: {
    flex: 1,
    gap: 10,
    minWidth: 0,
  },
  legendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  legendaDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendaNaam: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  legendaSets: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
  },
  prLijst: {
    gap: 8,
  },
  prRij: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 12,
    gap: 12,
  },
  prTrofeeBadge: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prLinks: {
    flex: 1,
    minWidth: 0,
  },
  prNaam: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  prDatum: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  prRechts: {
    alignItems: 'flex-end',
  },
  prEenRM: {
    fontSize: 17,
    fontFamily: 'Inter_900Black',
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  prDetail: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
    fontVariant: ['tabular-nums'],
  },
});
