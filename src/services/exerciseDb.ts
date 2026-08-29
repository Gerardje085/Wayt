// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Exercise Database Service (1.324 fitnessoefeningen)
// Directe offline-first integratie met hasaneyldrm/exercises-dataset.
// Biedt snelle lookups, meertalige instructies, zoekfunctionaliteit en filters.
// ─────────────────────────────────────────────────────────────────────────────
import {
  OEFENINGEN_DB,
  findExercise,
  getMediaUrl,
  formatCategoryDutch,
  formatEquipmentDutch,
  formatTargetDutch,
  getExerciseInstructions,
  type OefeningDef,
  type RawExerciseItem,
  type Spiergroep,
} from '../data/exercises';

export interface ExerciseDbItem {
  exerciseId: string;
  name: string;
  gifUrl: string;
  imageUrl: string;
  bodyParts: string[];
  equipments: string[];
  targetMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  instruction_steps?: Record<string, string[] | undefined>;
  category: string;
  muscle_group: string;
  attribution?: string;
  raw?: OefeningDef;
}

export interface ExerciseDbResponse {
  success: boolean;
  data: ExerciseDbItem[];
}

export function mapOefeningToDbItem(oef: OefeningDef, lang: 'nl' | 'en' | string = 'nl'): ExerciseDbItem {
  return {
    exerciseId: oef.id,
    name: oef.naam || oef.name,
    gifUrl: getMediaUrl(oef.gif_url),
    imageUrl: getMediaUrl(oef.image),
    bodyParts: [formatCategoryDutch(oef.category || oef.body_part)],
    equipments: [formatEquipmentDutch(oef.equipment)],
    targetMuscles: [formatTargetDutch(oef.target)],
    secondaryMuscles: (oef.secondary_muscles || []).map(formatTargetDutch),
    instructions: getExerciseInstructions(oef, lang),
    instruction_steps: oef.instruction_steps,
    category: oef.category,
    muscle_group: oef.muscle_group,
    attribution: oef.attribution,
    raw: oef,
  };
}

export async function fetchAllExercises(limit = 100): Promise<ExerciseDbItem[]> {
  return OEFENINGEN_DB.slice(0, limit).map(o => mapOefeningToDbItem(o, 'nl'));
}

export async function fetchExercisesByCategory(category: string): Promise<ExerciseDbItem[]> {
  const catLower = category.toLowerCase();
  return OEFENINGEN_DB
    .filter(o => o.category.toLowerCase() === catLower || o.body_part.toLowerCase() === catLower || o.groep.toLowerCase() === catLower)
    .map(o => mapOefeningToDbItem(o, 'nl'));
}

export async function fetchExercisesByTarget(target: string): Promise<ExerciseDbItem[]> {
  const targetLower = target.toLowerCase();
  return OEFENINGEN_DB
    .filter(o => o.target.toLowerCase() === targetLower || (o.secondary_muscles && o.secondary_muscles.some(m => m.toLowerCase() === targetLower)))
    .map(o => mapOefeningToDbItem(o, 'nl'));
}

export async function fetchExercisesByEquipment(equipment: string): Promise<ExerciseDbItem[]> {
  const eqLower = equipment.toLowerCase();
  return OEFENINGEN_DB
    .filter(o => o.equipment.toLowerCase() === eqLower || o.apparaat.toLowerCase() === eqLower)
    .map(o => mapOefeningToDbItem(o, 'nl'));
}

export async function fetchExerciseById(id: string, lang: 'nl' | 'en' | string = 'nl'): Promise<ExerciseDbItem | null> {
  const found = findExercise(id);
  if (!found) return null;
  return mapOefeningToDbItem(found, lang);
}

export async function searchExercises(query: string, limit = 20, lang: 'nl' | 'en' | string = 'nl'): Promise<ExerciseDbItem[]> {
  if (!query || !query.trim()) {
    return OEFENINGEN_DB.slice(0, limit).map(o => mapOefeningToDbItem(o, lang));
  }
  const q = query.toLowerCase().trim();
  const results = OEFENINGEN_DB.filter(o =>
    o.name.toLowerCase().includes(q) ||
    o.naam.toLowerCase().includes(q) ||
    o.target.toLowerCase().includes(q) ||
    o.category.toLowerCase().includes(q) ||
    o.equipment.toLowerCase().includes(q)
  );
  return results.slice(0, limit).map(o => mapOefeningToDbItem(o, lang));
}

export async function findExerciseMatch(oefeningId: string, oefeningNaam?: string, lang: 'nl' | 'en' | string = 'nl'): Promise<ExerciseDbItem | null> {
  const found = findExercise(oefeningId) || (oefeningNaam ? findExercise(oefeningNaam) : undefined);
  if (found) {
    return mapOefeningToDbItem(found, lang);
  }
  return null;
}
