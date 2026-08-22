// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Gedeelde TypeScript Type Definities
// ─────────────────────────────────────────────────────────────────────────────

/** Gebruikersprofiel uit de Supabase 'profiles' tabel */
export interface Profile {
  id: string;
  username: string | null;
  group_type: 'app' | 'gevoel';
  created_at: string;
}

/** Workout-rij uit de Supabase 'workouts' tabel */
export interface Workout {
  id: number;
  user_id: string;
  date: string;
  exercise: string;
  sets: number;
  reps: number;
  weight: number;
  volume: number;
  work_joules: number;
  created_at?: string;
}

/** Nieuw workout object om in te voegen (zonder id/created_at) */
export type NieuweWorkout = Omit<Workout, 'id' | 'created_at'>;

/** Algoritme-voorschrift voor de volgende sessie */
export interface Voorschrift {
  sets: number;
  reps: number;
  weight: number;
  status: 'nieuw' | 'progressie' | 'houden' | 'deload';
}

/** Oefening met slaglengte (ROM) */
export interface Oefening {
  label: string;
  value: string;
  rom: number;
}

/** Workout template */
export interface TemplateOefening {
  id: string;
  sets: number;
  reps: number;
  gewicht: number;
}

export interface Template {
  id: string;
  naam: string;
  icoon: string;
  kleur: [string, string]; // gradient tuple
  beschrijving: string;
  oefeningen: TemplateOefening[];
}

/** Thema kleuren-set */
export interface ThemaKleuren {
  achtergrond: string;
  achtergrondSecundair: string;
  kaart: string;
  kaartRand: string;
  tekst: string;
  tekstSecundair: string;
  tekstGedimpt: string;
  accent: string;
  accentLicht: string;
  accentGedimpt: string;
  succes: string;
  fout: string;
  waarschuwing: string;
  isDark: boolean;
}

/** Offline wachtrij item */
export interface OfflineItem {
  id: string;
  data: NieuweWorkout;
  timestamp: number;
}
