import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThema } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { findExercise } from '../data/exercises';
import type { Spiergroep } from '../data/exercises';
import { RADIUS } from '../theme/designTokens';
import { EmptyState } from './ui/EmptyState';

interface SpiergroepStatus {
  groep: Spiergroep;
  setsIn48u: number;
  setsIn72u: number;
  herstel: 'hersteld' | 'bezig' | 'vermoeid';
}

const SPIERGROEP_VOLGORDE: Spiergroep[] = ['Borst', 'Rug', 'Benen', 'Kuiten', 'Schouders', 'Armen', 'Core'];

interface HerstelHeatmapProps {
  userId: string | undefined;
}

export default function HerstelHeatmap({ userId }: HerstelHeatmapProps) {
  const { kleuren } = useThema();
  const [statussen, setStatussen] = useState<SpiergroepStatus[]>([]);

  const laadHerstel = useCallback(async () => {
    if (!userId) return;
    const nu = new Date();
    const v72u = new Date(nu.getTime() - 72 * 60 * 60 * 1000).toISOString();
    const v48u = new Date(nu.getTime() - 48 * 60 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', v72u);

    if (!data) return;

    const setsPerGroep72: Record<string, number> = {};
    const setsPerGroep48: Record<string, number> = {};

    for (const row of data) {
      if (row.set_type === 'warmup') continue;
      const oef = findExercise(row.exercise);
      if (!oef) continue;
      const sets = Number(row.sets) || 1;
      setsPerGroep72[oef.groep] = (setsPerGroep72[oef.groep] || 0) + sets;
      const createdAt = new Date(row.created_at as string);
      if (createdAt >= new Date(v48u)) {
        setsPerGroep48[oef.groep] = (setsPerGroep48[oef.groep] || 0) + sets;
      }
    }

    const resultaat: SpiergroepStatus[] = SPIERGROEP_VOLGORDE.map(groep => {
      const in48u = setsPerGroep48[groep] || 0;
      const in72u = setsPerGroep72[groep] || 0;
      let herstel: SpiergroepStatus['herstel'];
      if (in48u >= 6) herstel = 'vermoeid';
      else if (in72u >= 3) herstel = 'bezig';
      else herstel = 'hersteld';
      return { groep, setsIn48u: in48u, setsIn72u: in72u, herstel };
    });

    setStatussen(resultaat);
  }, [userId]);

  useEffect(() => { laadHerstel(); }, [laadHerstel]);

  const herstelKleur = (status: SpiergroepStatus['herstel']) => {
    if (status === 'hersteld') return kleuren.succes;
    if (status === 'bezig') return kleuren.waarschuwing;
    return kleuren.fout;
  };

  const herstelLabel = (status: SpiergroepStatus['herstel']) => {
    if (status === 'hersteld') return 'Hersteld';
    if (status === 'bezig') return 'In herstel';
    return 'Vermoeid';
  };

  if (statussen.length === 0 || statussen.every(st => st.setsIn72u === 0)) {
    return (
      <EmptyState
        icoon="pulse-outline"
        titel="Alle spiergroepen fris"
        subtekst="Log een training om de herstelstatus van de afgelopen 72 uur te volgen."
        compact
      />
    );
  }

  return (
    <View style={s.grid}>
      {statussen.map(status => {
        const kleur = herstelKleur(status.herstel);
        return (
          <View
            key={status.groep}
            style={[
              s.blok,
              {
                backgroundColor: kleuren.achtergrondSecundair,
                borderColor: status.setsIn72u > 0 ? kleur + '55' : kleuren.kaartRand,
              },
            ]}
          >
            <View style={[s.indicator, { backgroundColor: kleur }]} />
            <Text style={[s.groepNaam, { color: kleuren.tekst }]} numberOfLines={1}>
              {status.groep}
            </Text>
            <View style={s.statusRij}>
              <View style={[s.statusDot, { backgroundColor: kleur }]} />
              <Text style={[s.statusTekst, { color: kleur }]} numberOfLines={1}>
                {herstelLabel(status.herstel)}
              </Text>
            </View>
            <Text style={[s.setsTekst, { color: kleuren.tekstGedimpt }]}>
              {status.setsIn72u > 0 ? `${status.setsIn72u} sets / 72u` : '0 sets / 72u'}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  blok: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 96,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 11,
    paddingTop: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  groepNaam: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  statusRij: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusTekst: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  setsTekst: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
});
