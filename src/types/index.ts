export interface Profile {
  id: string;
  username: string | null;
  group_type: 'app' | 'gevoel';
  role?: 'deelnemer' | 'admin';
  created_at: string;
}

export type SetTypeDB = 'normaal' | 'warmup' | 'dropset' | 'failure';

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
  is_meting?: boolean;
  test_moment?: 'baseline' | 'endline' | null;
  rpe?: number | null;
  prescribed_weight?: number | null;
  prescribed_reps?: number | null;
  prescribed_sets?: number | null;
  session_id?: string | null;
  set_number?: number | null;
  set_type?: SetTypeDB | null;
  notitie?: string | null;
  created_at?: string;
}

export type NieuweWorkout = Omit<Workout, 'id' | 'created_at'>;

export interface Voorschrift {
  sets: number;
  reps: number;
  weight: number;
  status: 'nieuw' | 'progressie' | 'houden' | 'deload';
  rationale?: string;
}

export interface Oefening {
  label: string;
  value: string;
  rom: number;
}

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
  kleur: [string, string];
  beschrijving: string;
  oefeningen: TemplateOefening[];
}

export interface ThemaKleuren {
  achtergrond: string;
  achtergrondSecundair: string;
  kaart: string;
  kaartRand: string;
  tekst: string;
  tekstSecundair: string;
  tekstGedimpt: string;
  accent: string;
  accentSecundair: string;
  accentLicht: string;
  accentGedimpt: string;
  succes: string;
  fout: string;
  waarschuwing: string;
  warmup: string;
  dropset: string;
  failure: string;
  overlay: string;
  isDark: boolean;
}

export interface OfflineItem {
  id: string;
  data: NieuweWorkout;
  timestamp: number;
}
