export interface Profile {
  id: string;
  username: string | null;
  group_type: 'app' | 'gevoel';
  is_onderzoeker?: boolean;
  created_at: string;
}

export type OpgeslagenSetType = 'normaal' | 'warmup' | 'dropset' | 'failure';

export type MetingMoment = 'week0' | 'week6';

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
  meting_moment?: MetingMoment | null;
  set_type?: OpgeslagenSetType | null;
  prescribed_sets?: number | null;
  prescribed_reps?: number | null;
  prescribed_weight?: number | null;
  created_at?: string;
}

export type NieuweWorkout = Omit<Workout, 'id' | 'created_at'>;

export interface Voorschrift {
  sets: number;
  reps: number;
  weight: number;
  status: 'nieuw' | 'progressie' | 'houden' | 'deload';
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
