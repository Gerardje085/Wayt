const ZWAARTEKRACHT = 9.81;

const BEWEGINGSBAAN: Record<string, number> = {
  // Nieuwe IDs uit 1.324 dataset
  '0025': 0.4,  // barbell bench press
  '0150': 0.6,  // cable bar lateral pulldown
  '0585': 0.5,  // lever leg extension
  '0043': 0.55, // barbell full squat
  '0032': 0.5,  // barbell deadlift
  '0091': 0.45, // barbell overhead press
  // Legacy aliases
  bench_press: 0.4,
  lat_pulldown: 0.6,
  leg_extension: 0.5,
  squat: 0.55,
  deadlift: 0.5,
};

const STANDAARD_BEWEGINGSBAAN = 0.45;

export function berekenVolume(sets: number, reps: number, weight: number): number {
  return sets * reps * weight;
}

export function berekenArbeid(oefeningId: string, reps: number, gewicht: number): number {
  const rom = BEWEGINGSBAAN[oefeningId] ?? STANDAARD_BEWEGINGSBAAN;
  return gewicht * ZWAARTEKRACHT * rom * reps;
}
