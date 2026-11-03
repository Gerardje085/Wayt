// ─────────────────────────────────────────────────────────────────────────────
// Wayt – useStatistieken hook
// Haalt dashboard-statistieken op: heatmap data, volume per week,
// spiergroep verdeling en Personal Records per oefening.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { OEFENINGEN_DB, findExercise } from '../data/exercises';
import { bereken1RM } from '../context/LiveWorkoutContext';
import { dagenGeleden } from '../utils/datum';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DagData {
  datum: string;  // YYYY-MM-DD
  count: number;
  volume: number;
}

export interface WeekStat {
  workouts:      number;
  totaalVolume:  number;
  sets:           number;
}

export interface SpiergroepVerdeling {
  groep:    string;
  sets:     number;
  kleur:    string;
}

export interface PersonalRecord {
  oefeningId:   string;
  oefeningNaam: string;
  gewicht:      number;
  reps:         number;
  eenRM:        number;
  datum:        string;
}

export interface StatistiekenData {
  heatmap:    DagData[];
  weekStat:   WeekStat;
  spiergroepVerdeling: SpiergroepVerdeling[];
  prs:        PersonalRecord[];
}

const SPIERGROEP_KLEUREN: Record<string, string> = {
  Borst:      '#EF4444',
  Rug:        '#3B82F6',
  Benen:      '#22C55E',
  Schouders:  '#F59E0B',
  Armen:      '#A855F7',
  Core:       '#06B6D4',
  Cardio:     '#EC4899',
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface StatResult {
  laadStatistieken: () => Promise<void>;
  data:             StatistiekenData | null;
  laden:            boolean;
  fout:             string | null;
}

export function useStatistieken(userId: string | undefined): StatResult {
  const [data,  setData]  = useState<StatistiekenData | null>(null);
  const [laden, setLaden] = useState(false);
  const [fout,  setFout]  = useState<string | null>(null);

  const laadStatistieken = useCallback(async () => {
    if (!userId) return;
    setLaden(true);
    setFout(null);

    try {
      const vanafDatum = dagenGeleden(90);

      const { data: workouts, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .gte('date', vanafDatum)
        .order('date', { ascending: true });

      if (error) throw error;

      // ─── Heatmap (90 dagen) ────────────────────────────────────────────────
      const dagMap = new Map<string, DagData>();
      for (const w of workouts ?? []) {
        const existing = dagMap.get(w.date);
        if (existing) {
          existing.count++;
          existing.volume += parseFloat(String(w.volume)) || 0;
        } else {
          dagMap.set(w.date, { datum: w.date, count: 1, volume: parseFloat(String(w.volume)) || 0 });
        }
      }
      const heatmap = Array.from(dagMap.values());

      // ─── Week statistieken (laatste 7 dagen) ─────────────────────────────
      const weekDatum = dagenGeleden(6);
      const weekWorkouts = (workouts ?? []).filter(w => w.date >= weekDatum && !w.is_meting);

      const uniekeWorkoutDagen = new Set(weekWorkouts.map(w => w.date)).size;
      const weekVolume = weekWorkouts.reduce((acc, w) => acc + (parseFloat(String(w.volume)) || 0), 0);
      const weekStat: WeekStat = {
        workouts:       uniekeWorkoutDagen,
        totaalVolume:   Math.round(weekVolume),
        sets:           weekWorkouts.reduce((acc, w) => acc + (Number(w.sets) || 1), 0),
      };

      // ─── Spiergroep verdeling (laatste 7 dagen) ───────────────────────────
      const groepTelMap = new Map<string, number>();
      for (const w of weekWorkouts) {
        const oef = findExercise(w.exercise);
        if (oef) {
          groepTelMap.set(oef.groep, (groepTelMap.get(oef.groep) || 0) + (w.sets || 1));
        }
      }
      const spiergroepVerdeling: SpiergroepVerdeling[] = Array.from(groepTelMap.entries()).map(([groep, sets]) => ({
        groep, sets, kleur: SPIERGROEP_KLEUREN[groep] || '#888888',
      })).sort((a, b) => b.sets - a.sets);

      // ─── Personal Records ─────────────────────────────────────────────────
      const prMap = new Map<string, PersonalRecord>();
      for (const w of workouts ?? []) {
        const gewicht = parseFloat(String(w.weight)) || 0;
        const reps    = parseInt(String(w.reps))    || 0;
        if (gewicht <= 0 && reps <= 0) continue;
        const eenRM = bereken1RM(gewicht, reps);
        const huidig = prMap.get(w.exercise);
        if (!huidig || eenRM > huidig.eenRM) {
          const oefNaam = findExercise(w.exercise)?.naam ?? w.exercise;
          prMap.set(w.exercise, {
            oefeningId:   w.exercise,
            oefeningNaam: oefNaam,
            gewicht, reps, eenRM,
            datum: w.date,
          });
        }
      }
      const prs = Array.from(prMap.values())
        .sort((a, b) => b.datum.localeCompare(a.datum))
        .slice(0, 6);

      setData({ heatmap, weekStat, spiergroepVerdeling, prs });
    } catch (err) {
      setFout((err as Error).message);
    } finally {
      setLaden(false);
    }
  }, [userId]);

  return { laadStatistieken, data, laden, fout };
}
