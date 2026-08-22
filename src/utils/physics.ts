// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Fysica & Berekeningen (Vereenvoudigd, zonder ROM/Joules)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Berekent het totale trainingsvolume.
 * @param sets Aantal sets
 * @param reps Aantal herhalingen per set
 * @param weight Gewicht in kg
 * @returns Volume in kg
 */
export function berekenVolume(sets: number, reps: number, weight: number): number {
  return sets * reps * weight;
}
