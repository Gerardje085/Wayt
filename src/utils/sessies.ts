import { bereken1RM } from '../context/LiveWorkoutContext';
import type { Workout, OpgeslagenSetType } from '../types';

export interface SessieSetInfo {
  reps: number;
  gewicht: number;
  type: OpgeslagenSetType;
}

export interface TrainingsSessie {
  datum: string;
  sets: SessieSetInfo[];
  werkSets: number;
  volume: number;
  joules: number;
  beste1RM: number;
  besteSet: { reps: number; gewicht: number } | null;
}

export function groepeerSessies(rijen: Workout[]): TrainingsSessie[] {
  const perDatum = new Map<string, TrainingsSessie>();
  for (const rij of rijen) {
    if (rij.is_meting) continue;
    const sessie = perDatum.get(rij.date) ?? {
      datum: rij.date, sets: [], werkSets: 0, volume: 0, joules: 0, beste1RM: 0, besteSet: null,
    };
    const reps = Number(rij.reps) || 0;
    const gewicht = Number(rij.weight) || 0;
    const type: OpgeslagenSetType = rij.set_type ?? 'normaal';
    const aantal = Math.max(1, Number(rij.sets) || 1);
    for (let i = 0; i < aantal; i++) sessie.sets.push({ reps, gewicht, type });
    sessie.volume += Number(rij.volume) || 0;
    sessie.joules += Number(rij.work_joules) || 0;
    if (type !== 'warmup') {
      sessie.werkSets += aantal;
      const eenRM = gewicht > 0 && reps > 0 ? bereken1RM(gewicht, reps) : 0;
      if (eenRM > sessie.beste1RM) {
        sessie.beste1RM = eenRM;
        sessie.besteSet = { reps, gewicht };
      }
    }
    perDatum.set(rij.date, sessie);
  }
  return Array.from(perDatum.values()).sort((a, b) => a.datum.localeCompare(b.datum));
}

export function formatKg(waarde: number): string {
  const afgerond = Math.round(waarde * 100) / 100;
  return (Number.isInteger(afgerond) ? String(afgerond) : String(afgerond).replace('.', ',')) + ' kg';
}

export function vatSetsSamen(sets: SessieSetInfo[]): string {
  const werk = sets.filter(s => s.type !== 'warmup');
  if (werk.length === 0) return `${sets.length} warm-up sets`;
  const eerste = werk[0];
  const allemaalGelijk = werk.every(s => s.reps === eerste.reps && s.gewicht === eerste.gewicht);
  if (allemaalGelijk) {
    return eerste.gewicht > 0
      ? `${werk.length} × ${eerste.reps} @ ${formatKg(eerste.gewicht)}`
      : `${werk.length} × ${eerste.reps}`;
  }
  const zwaarste = werk.reduce((a, b) => (b.gewicht > a.gewicht || (b.gewicht === a.gewicht && b.reps > a.reps) ? b : a));
  return zwaarste.gewicht > 0
    ? `${werk.length} sets · zwaarst ${formatKg(zwaarste.gewicht)} × ${zwaarste.reps}`
    : `${werk.length} sets · max ${zwaarste.reps} reps`;
}
