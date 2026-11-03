import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThema } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { findExercise } from '../data/exercises';
import type { Spiergroep } from '../data/exercises';

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
      .select('exercise, sets, created_at')
      .eq('user_id', userId)
      .gte('created_at', v72u);

    if (!data) return;

    const setsPerGroep72: Record<string, number> = {};
    const setsPerGroep48: Record<string, number> = {};

    for (const row of data) {
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

  if (statussen.every(s => s.setsIn72u === 0)) {
    return (
      <View style={[s.leeg, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
        <Text style={[s.leegTekst, { color: kleuren.tekstGedimpt }]}>
          Train om je herstelstatus te zien.
        </Text>
      </View>
    );
  }

  return (
    <View style={s.grid}>
      {statussen.map(status => {
        const kleur = herstelKleur(status.herstel);
        return (
          <View
            key={status.groep}
            style={[s.blok, { backgroundColor: kleur + '18', borderColor: kleur + '55' }]}
          >
            <View style={[s.indicator, { backgroundColor: kleur }]} />
            <Text style={[s.groepNaam, { color: kleuren.tekst }]}>{status.groep}</Text>
            <Text style={[s.statusTekst, { color: kleur }]}>{herstelLabel(status.herstel)}</Text>
            {status.setsIn72u > 0 && (
              <Text style={[s.setsTekst, { color: kleuren.tekstGedimpt }]}>
                {status.setsIn72u} sets / 72u
              </Text>
            )}
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
    width: '30.5%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  groepNaam: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    marginTop: 6,
    marginBottom: 4,
  },
  statusTekst: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  setsTekst: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  leeg: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  leegTekst: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});
