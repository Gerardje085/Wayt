// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Workout Templates
// Voorgedefinieerde trainingsschema's die met één klik geladen kunnen worden.
// Elke template bevat een volwaardige routine gekoppeld aan de 1.324 dataset.
// ─────────────────────────────────────────────────────────────────────────────
import type { Template } from '../types';

export const WORKOUT_TEMPLATES: Template[] = [
  {
    id: 't1',
    naam: 'Push Day',
    icoon: 'arrow-up-circle-outline',
    kleur: ['#F43F5E', '#BE123C'],
    beschrijving: 'Borst, schouders & triceps',
    oefeningen: [
      { id: '0025', sets: 4, reps: 8,  gewicht: 40 }, // Barbell Bench Press
      { id: '0314', sets: 3, reps: 10, gewicht: 14 }, // Dumbbell Incline Bench Press
      { id: '0091', sets: 3, reps: 10, gewicht: 20 }, // Barbell Overhead Press
      { id: '0334', sets: 3, reps: 15, gewicht: 6  }, // Dumbbell Lateral Raise
      { id: '0201', sets: 3, reps: 12, gewicht: 15 }, // Cable Pushdown
    ],
  },
  {
    id: 't2',
    naam: 'Pull Day',
    icoon: 'arrow-down-circle-outline',
    kleur: ['#3B82F6', '#1D4ED8'],
    beschrijving: 'Rug & biceps',
    oefeningen: [
      { id: '0032', sets: 3, reps: 5,  gewicht: 60 }, // Barbell Deadlift
      { id: '0150', sets: 4, reps: 10, gewicht: 35 }, // Cable Lateral Pulldown
      { id: '0027', sets: 3, reps: 8,  gewicht: 40 }, // Barbell Bent Over Row
      { id: '0652', sets: 3, reps: 8,  gewicht: 0  }, // Pull-up
      { id: '0031', sets: 3, reps: 12, gewicht: 15 }, // Barbell Curl
    ],
  },
  {
    id: 't3',
    naam: 'Leg Day',
    icoon: 'body-outline',
    kleur: ['#065F46', '#10B981'],
    beschrijving: 'Quadriceps, hamstrings & kuiten',
    oefeningen: [
      { id: '0043', sets: 4, reps: 6,  gewicht: 50 }, // Barbell Full Squat
      { id: '0739', sets: 4, reps: 10, gewicht: 80 }, // Sled 45° Leg Press
      { id: '0585', sets: 3, reps: 12, gewicht: 25 }, // Lever Leg Extension
      { id: '0586', sets: 3, reps: 12, gewicht: 25 }, // Lever Lying Leg Curl
      { id: '1372', sets: 4, reps: 15, gewicht: 40 }, // Standing Calf Raise
    ],
  },
  {
    id: 't4',
    naam: 'Upper Body',
    icoon: 'barbell-outline',
    kleur: ['#7C3AED', '#4C1D95'],
    beschrijving: 'Volledig bovenlichaam',
    oefeningen: [
      { id: '0025', sets: 3, reps: 8,  gewicht: 40 }, // Barbell Bench Press
      { id: '0027', sets: 3, reps: 8,  gewicht: 40 }, // Barbell Bent Over Row
      { id: '0091', sets: 3, reps: 10, gewicht: 20 }, // Barbell Overhead Press
      { id: '0150', sets: 3, reps: 10, gewicht: 35 }, // Cable Lateral Pulldown
      { id: '0294', sets: 3, reps: 12, gewicht: 10 }, // Dumbbell Biceps Curl
      { id: '0201', sets: 3, reps: 12, gewicht: 15 }, // Cable Pushdown
    ],
  },
];
