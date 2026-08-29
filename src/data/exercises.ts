// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Oefeningen Database (1.324 fitnessoefeningen)
// Bron: https://github.com/hasaneyldrm/exercises-dataset (MIT License)
// Bevat volledige meertalige instructies, GIF animaties, thumbnails, spiergroepen.
// ─────────────────────────────────────────────────────────────────────────────
import rawExercisesData from './exercises.json';

export type Spiergroep =
  | 'Borst'
  | 'Rug'
  | 'Benen'
  | 'Kuiten'
  | 'Schouders'
  | 'Armen'
  | 'Core'
  | 'Cardio'
  | 'Nek';

export type OefeningType = 'gewicht' | 'lichaamsgewicht' | 'tijd';

export type Apparaat =
  | 'Barbell'
  | 'Dumbbell'
  | 'Machine'
  | 'Kabel'
  | 'Lichaamsgewicht'
  | 'Kettlebell'
  | 'Weerstandsband'
  | 'Overig';

export interface ExerciseInstructionSteps {
  en?: string[];
  it?: string[];
  tr?: string[];
  es?: string[];
  ru?: string[];
  zh?: string[];
  hi?: string[];
  pl?: string[];
  ko?: string[];
  fr?: string[];
  [lang: string]: string[] | undefined;
}

export interface ExerciseInstructions {
  en?: string;
  it?: string;
  tr?: string;
  es?: string;
  ru?: string;
  zh?: string;
  hi?: string;
  pl?: string;
  ko?: string;
  fr?: string;
  [lang: string]: string | undefined;
}

export interface RawExerciseItem {
  id: string;
  name: string;
  category: string;
  body_part: string;
  equipment: string;
  instructions: ExerciseInstructions;
  instruction_steps: ExerciseInstructionSteps;
  muscle_group: string;
  secondary_muscles: string[];
  target: string;
  image: string;
  gif_url: string;
  media_id: string;
  created_at?: string;
  attribution?: string;
}

export interface OefeningDef extends RawExerciseItem {
  naam: string;
  groep: Spiergroep;
  type: OefeningType;
  apparaat: Apparaat;
  icoon: string;
  startWaarde: number;
  image_url: string;
  gif_full_url: string;
}

const MEDIA_BASE_URL = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main';
const MEDIA_CDN_URL = 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main';

export function getMediaUrl(path?: string, useCdn = false): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = useCdn ? MEDIA_CDN_URL : MEDIA_BASE_URL;
  return `${base}/${path.replace(/^\/+/, '')}`;
}

export const CATEGORIE_VERTALING: Record<string, Spiergroep> = {
  chest: 'Borst',
  back: 'Rug',
  'upper legs': 'Benen',
  'lower legs': 'Kuiten',
  shoulders: 'Schouders',
  'upper arms': 'Armen',
  'lower arms': 'Armen',
  waist: 'Core',
  cardio: 'Cardio',
  neck: 'Nek',
};

export const APPARAAT_VERTALING: Record<string, Apparaat> = {
  barbell: 'Barbell',
  'olympic barbell': 'Barbell',
  'ez barbell': 'Barbell',
  'trap bar': 'Barbell',
  dumbbell: 'Dumbbell',
  cable: 'Kabel',
  'leverage machine': 'Machine',
  'smith machine': 'Machine',
  assisted: 'Machine',
  'body weight': 'Lichaamsgewicht',
  weighted: 'Lichaamsgewicht',
  kettlebell: 'Kettlebell',
  band: 'Weerstandsband',
  'resistance band': 'Weerstandsband',
  roller: 'Overig',
  'wheel roller': 'Overig',
  'medicine ball': 'Overig',
  'stability ball': 'Overig',
  'bosu ball': 'Overig',
  'skierg machine': 'Machine',
  'elliptical machine': 'Machine',
  'stationary bike': 'Machine',
  rope: 'Overig',
  'upper body ergometer': 'Machine',
  'sled machine': 'Machine',
  hammer: 'Overig',
  tire: 'Overig',
};

export const SPIER_VERTALING: Record<string, string> = {
  abs: 'Buikspieren (Abs)',
  quads: 'Bovenbenen (Quadriceps)',
  lats: 'Brede rugspier (Lats)',
  calves: 'Kuiten (Calves)',
  pectorals: 'Grote borstspier (Borst)',
  glutes: 'Bilspieren (Glutes)',
  hamstrings: 'Achterkant benen (Hamstrings)',
  adductors: 'Binnenkant benen (Adductoren)',
  abductors: 'Buitenkant heup (Abductoren)',
  triceps: 'Achterkant arm (Triceps)',
  biceps: 'Voorkant arm (Biceps)',
  delts: 'Schouderspieren (Deltoids)',
  forearms: 'Onderarmen (Forearms)',
  traps: 'Bovenrug (Trapezius)',
  'upper back': 'Bovenrug',
  'lower back': 'Onderrug',
  'spine': 'Rugstrekkers',
  'cardiovascular system': 'Hart & Conditie',
  'hip flexors': 'Heupbuigers',
  'serratus anterior': 'Zijkant borstkas',
};

export function formatCategoryDutch(category: string): string {
  return CATEGORIE_VERTALING[category.toLowerCase()] || category;
}

export function formatTargetDutch(target: string): string {
  return SPIER_VERTALING[target.toLowerCase()] || target;
}

export function formatEquipmentDutch(equipment: string): string {
  return APPARAAT_VERTALING[equipment.toLowerCase()] || equipment;
}

function bepaalIcoon(category: string, equipment: string, type: OefeningType): string {
  if (type === 'tijd' || category === 'cardio') return 'timer-outline';
  if (equipment === 'barbell' || equipment === 'olympic barbell' || equipment === 'ez barbell') return 'barbell-outline';
  if (equipment === 'dumbbell' || equipment === 'kettlebell') return 'barbell-outline';
  if (equipment === 'cable') return 'git-compare-outline';
  if (equipment === 'body weight') return 'body-outline';
  if (equipment.includes('machine')) return 'git-merge-outline';
  return 'barbell-outline';
}

function bepaalStartWaarde(equipment: string, type: OefeningType): number {
  if (type === 'tijd') return 60;
  if (type === 'lichaamsgewicht') return 0;
  if (equipment === 'barbell' || equipment === 'olympic barbell') return 20;
  if (equipment === 'dumbbell' || equipment === 'kettlebell') return 10;
  if (equipment === 'cable') return 15;
  if (equipment.includes('machine')) return 25;
  return 10;
}

function formatTitel(name: string): string {
  if (!name) return '';
  return name
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

// ─── Legacy Alias Map voor naadloze backward compatibility ──────────────────
export const LEGACY_ID_MAP: Record<string, string> = {
  bench_press: '0025',
  incline_bench_press: '0047',
  decline_bench_press: '0033',
  dumbbell_press: '0289',
  incline_dumbbell_press: '0314',
  decline_dumbbell_press: '0291',
  dumbbell_flye: '0308',
  pec_deck: '0590',
  cable_crossover: '0153',
  cable_fly_high: '0154',
  cable_fly_low: '0155',
  push_up: '0662',
  wide_push_up: '0662',
  dips_chest: '0251',
  dips_chest_weighted: '0251',
  deadlift: '0032',
  sumo_deadlift: '0117',
  rack_pull: '0098',
  pull_up: '0652',
  chin_up: '1326',
  weighted_pull_up: '0652',
  lat_pulldown: '0150',
  lat_pulldown_neutral: '2616',
  barbell_row: '0027',
  pendlay_row: '0027',
  dumbbell_row: '0293',
  seated_cable_row: '0239',
  cable_row_wide: '0239',
  t_bar_row: '0027',
  face_pull: '0174',
  hyperextension: '0489',
  straight_arm_pulldown: '0238',
  squat: '0043',
  front_squat: '0042',
  goblet_squat: '0320',
  leg_press: '0739',
  leg_press_narrow: '0739',
  bulgarian_split_squat: '0410',
  leg_extension: '0585',
  leg_curl: '0586',
  leg_curl_lying: '0586',
  leg_curl_seated: '0599',
  romanian_deadlift: '0085',
  rdl_dumbbell: '0380',
  lunges: '0336',
  walking_lunges: '0434',
  calf_raise: '1372',
  calf_raise_standing: '1372',
  calf_raise_seated: '0594',
  step_up: '0419',
  hip_thrust: '3236',
  glute_bridge: '3236',
  overhead_press: '0091',
  dumbbell_shoulder_press: '0426',
  arnold_press: '0262',
  seated_shoulder_press: '0091',
  lateral_raise: '0334',
  lateral_raise_cable: '0180',
  front_raise: '0310',
  rear_delt_flye: '0379',
  reverse_pec_deck: '0154',
  upright_row: '0121',
  shrugs: '0095',
  barbell_curl: '0031',
  ez_bar_curl: '0447',
  dumbbell_curl: '0294',
  hammer_curl: '0313',
  incline_curl: '0315',
  preacher_curl: '0070',
  cable_curl: '0163',
  concentration_curl: '0270',
  spider_curl: '0408',
  triceps_pushdown: '0201',
  triceps_pushdown_bar: '0201',
  skull_crusher: '0060',
  overhead_tricep_ext: '0429',
  close_grip_bench: '0030',
  dips_tricep: '0251',
  diamond_push_up: '0662',
  crunch: '0274',
  cable_crunch: '0175',
  plank: '0464',
  side_plank: '3544',
  leg_raise: '0472',
  knee_raise: '0472',
  ab_rollout: '0858',
  russian_twist: '0711',
  dead_bug: '0274',
  dragon_flag: '0472',
  treadmill: '3666',
  cycling: '2138',
  rowing: '2142',
  stair_climber: '3666',
  jump_rope: '2612',
};

// ─── Build OEFENINGEN_DB (Alle 1.324 Oefeningen) ──────────────────────────────
export const OEFENINGEN_DB: OefeningDef[] = (rawExercisesData as RawExerciseItem[]).map(raw => {
  const groep: Spiergroep = CATEGORIE_VERTALING[raw.category] || CATEGORIE_VERTALING[raw.body_part] || 'Core';
  const apparaat: Apparaat = APPARAAT_VERTALING[raw.equipment] || 'Overig';
  
  let type: OefeningType = 'gewicht';
  if (raw.category === 'cardio' || raw.body_part === 'cardio') {
    type = 'tijd';
  } else if (raw.equipment === 'body weight') {
    type = 'lichaamsgewicht';
  }

  const icoon = bepaalIcoon(raw.category, raw.equipment, type);
  const startWaarde = bepaalStartWaarde(raw.equipment, type);

  return {
    ...raw,
    naam: formatTitel(raw.name),
    groep,
    type,
    apparaat,
    icoon,
    startWaarde,
    image_url: getMediaUrl(raw.image),
    gif_full_url: getMediaUrl(raw.gif_url),
  };
});

// Snelle lookup Map
const ID_LOOKUP_MAP = new Map<string, OefeningDef>();
OEFENINGEN_DB.forEach(oef => ID_LOOKUP_MAP.set(oef.id, oef));

export function findExercise(idOrAlias?: string): OefeningDef | undefined {
  if (!idOrAlias) return undefined;
  
  // 1. Directe ID lookup
  if (ID_LOOKUP_MAP.has(idOrAlias)) {
    return ID_LOOKUP_MAP.get(idOrAlias);
  }

  // 2. Legacy alias lookup
  const targetId = LEGACY_ID_MAP[idOrAlias];
  if (targetId && ID_LOOKUP_MAP.has(targetId)) {
    return ID_LOOKUP_MAP.get(targetId);
  }

  // 3. Fallback zoekopdracht op naam
  const lower = idOrAlias.toLowerCase().replace(/_/g, ' ');
  return OEFENINGEN_DB.find(o => o.name.toLowerCase() === lower || o.naam.toLowerCase() === lower);
}

export function getExerciseInstructions(exercise?: RawExerciseItem | OefeningDef | null, preferredLang: 'nl' | 'en' | string = 'nl'): string[] {
  if (!exercise || !exercise.instruction_steps) return [];
  
  const steps = exercise.instruction_steps[preferredLang] ||
                exercise.instruction_steps['nl'] ||
                exercise.instruction_steps['en'];

  if (Array.isArray(steps) && steps.length > 0) {
    return steps;
  }

  // Fallback naar enkelvoudige string als instruction_steps leeg is
  if (exercise.instructions) {
    const single = exercise.instructions[preferredLang] || exercise.instructions['nl'] || exercise.instructions['en'];
    if (single) return [single];
  }

  return [];
}
