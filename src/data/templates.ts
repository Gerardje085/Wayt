// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Workout Templates
// Voorgedefinieerde trainingsschema's die met één klik geladen kunnen worden.
// Elke template bevat een volwaardige routine met meerdere oefeningen.
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
      { id: 'bench_press',           sets: 4, reps: 8,  gewicht: 40  },
      { id: 'incline_dumbbell_press', sets: 3, reps: 10, gewicht: 14  },
      { id: 'overhead_press',         sets: 3, reps: 10, gewicht: 20  },
      { id: 'lateral_raise',          sets: 3, reps: 15, gewicht: 6   },
      { id: 'triceps_pushdown',        sets: 3, reps: 12, gewicht: 15  },
    ],
  },
  {
    id: 't2',
    naam: 'Pull Day',
    icoon: 'arrow-down-circle-outline',
    kleur: ['#3B82F6', '#1D4ED8'],
    beschrijving: 'Rug & biceps',
    oefeningen: [
      { id: 'deadlift',       sets: 3, reps: 5,  gewicht: 60  },
      { id: 'lat_pulldown',   sets: 4, reps: 10, gewicht: 35  },
      { id: 'barbell_row',    sets: 3, reps: 8,  gewicht: 40  },
      { id: 'face_pull',      sets: 3, reps: 15, gewicht: 15  },
      { id: 'barbell_curl',   sets: 3, reps: 12, gewicht: 15  },
    ],
  },
  {
    id: 't3',
    naam: 'Leg Day',
    icoon: 'body-outline',
    kleur: ['#065F46', '#10B981'],
    beschrijving: 'Quadriceps, hamstrings & kuiten',
    oefeningen: [
      { id: 'squat',          sets: 4, reps: 6,  gewicht: 50  },
      { id: 'leg_press',      sets: 4, reps: 10, gewicht: 80  },
      { id: 'leg_extension',  sets: 3, reps: 12, gewicht: 25  },
      { id: 'leg_curl',       sets: 3, reps: 12, gewicht: 25  },
      { id: 'calf_raise',     sets: 4, reps: 15, gewicht: 40  },
    ],
  },
  {
    id: 't4',
    naam: 'Upper Body',
    icoon: 'barbell-outline',
    kleur: ['#7C3AED', '#4C1D95'],
    beschrijving: 'Volledig bovenlichaam',
    oefeningen: [
      { id: 'bench_press',         sets: 3, reps: 8,  gewicht: 40  },
      { id: 'barbell_row',         sets: 3, reps: 8,  gewicht: 40  },
      { id: 'overhead_press',      sets: 3, reps: 10, gewicht: 20  },
      { id: 'lat_pulldown',        sets: 3, reps: 10, gewicht: 35  },
      { id: 'dumbbell_curl',       sets: 3, reps: 12, gewicht: 10  },
      { id: 'triceps_pushdown',     sets: 3, reps: 12, gewicht: 15  },
    ],
  },
];
