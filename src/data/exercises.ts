// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Oefeningen Database (80+ oefeningen)
// ─────────────────────────────────────────────────────────────────────────────

export type Spiergroep = 'Borst' | 'Rug' | 'Benen' | 'Schouders' | 'Armen' | 'Core' | 'Cardio';
export type OefeningType = 'gewicht' | 'lichaamsgewicht' | 'tijd';
export type Apparaat = 'Barbell' | 'Dumbbell' | 'Machine' | 'Kabel' | 'Lichaamsgewicht' | 'Overig';

export interface OefeningDef {
  id: string;
  naam: string;
  groep: Spiergroep;
  type: OefeningType;
  icoon: string;
  startWaarde: number; // kg of seconden of reps (afh. van type)
  apparaat?: Apparaat;
}

export const OEFENINGEN_DB: OefeningDef[] = [

  // ─── BORST ────────────────────────────────────────────────────────────────
  { id: 'bench_press',            naam: 'Bench Press',                    groep: 'Borst',     type: 'gewicht',         icoon: 'barbell-outline',             startWaarde: 60,  apparaat: 'Barbell' },
  { id: 'incline_bench_press',    naam: 'Incline Bench Press',            groep: 'Borst',     type: 'gewicht',         icoon: 'barbell-outline',             startWaarde: 50,  apparaat: 'Barbell' },
  { id: 'decline_bench_press',    naam: 'Decline Bench Press',            groep: 'Borst',     type: 'gewicht',         icoon: 'barbell-outline',             startWaarde: 55,  apparaat: 'Barbell' },
  { id: 'dumbbell_press',         naam: 'Dumbbell Press',                 groep: 'Borst',     type: 'gewicht',         icoon: 'barbell-outline',             startWaarde: 20,  apparaat: 'Dumbbell' },
  { id: 'incline_dumbbell_press', naam: 'Incline Dumbbell Press',         groep: 'Borst',     type: 'gewicht',         icoon: 'barbell-outline',             startWaarde: 16,  apparaat: 'Dumbbell' },
  { id: 'decline_dumbbell_press', naam: 'Decline Dumbbell Press',         groep: 'Borst',     type: 'gewicht',         icoon: 'barbell-outline',             startWaarde: 18,  apparaat: 'Dumbbell' },
  { id: 'dumbbell_flye',          naam: 'Dumbbell Flye',                  groep: 'Borst',     type: 'gewicht',         icoon: 'expand-outline',              startWaarde: 12,  apparaat: 'Dumbbell' },
  { id: 'incline_dumbbell_flye',  naam: 'Incline Dumbbell Flye',          groep: 'Borst',     type: 'gewicht',         icoon: 'expand-outline',              startWaarde: 10,  apparaat: 'Dumbbell' },
  { id: 'cable_crossover',        naam: 'Cable Crossover',                groep: 'Borst',     type: 'gewicht',         icoon: 'git-compare-outline',         startWaarde: 12,  apparaat: 'Kabel' },
  { id: 'cable_fly_high',         naam: 'Cable Fly High-to-Low',          groep: 'Borst',     type: 'gewicht',         icoon: 'git-compare-outline',         startWaarde: 10,  apparaat: 'Kabel' },
  { id: 'cable_fly_low',          naam: 'Cable Fly Low-to-High',          groep: 'Borst',     type: 'gewicht',         icoon: 'git-compare-outline',         startWaarde: 10,  apparaat: 'Kabel' },
  { id: 'pec_deck',               naam: 'Pec Deck Machine',               groep: 'Borst',     type: 'gewicht',         icoon: 'git-merge-outline',           startWaarde: 40,  apparaat: 'Machine' },
  { id: 'chest_press_machine',    naam: 'Chest Press Machine',            groep: 'Borst',     type: 'gewicht',         icoon: 'git-merge-outline',           startWaarde: 50,  apparaat: 'Machine' },
  { id: 'push_up',                naam: 'Push-Up',                        groep: 'Borst',     type: 'lichaamsgewicht', icoon: 'body-outline',                startWaarde: 0,   apparaat: 'Lichaamsgewicht' },
  { id: 'wide_push_up',           naam: 'Wide Grip Push-Up',              groep: 'Borst',     type: 'lichaamsgewicht', icoon: 'body-outline',                startWaarde: 0,   apparaat: 'Lichaamsgewicht' },
  { id: 'dips_chest',             naam: 'Dips (Borst)',                   groep: 'Borst',     type: 'lichaamsgewicht', icoon: 'arrow-down-circle-outline',   startWaarde: 0,   apparaat: 'Lichaamsgewicht' },
  { id: 'dips_chest_weighted',    naam: 'Weighted Dips',                  groep: 'Borst',     type: 'gewicht',         icoon: 'arrow-down-circle-outline',   startWaarde: 10,  apparaat: 'Lichaamsgewicht' },

  // ─── RUG ──────────────────────────────────────────────────────────────────
  { id: 'deadlift',               naam: 'Deadlift',                       groep: 'Rug',       type: 'gewicht',         icoon: 'barbell-outline',             startWaarde: 80,  apparaat: 'Barbell' },
  { id: 'sumo_deadlift',          naam: 'Sumo Deadlift',                  groep: 'Rug',       type: 'gewicht',         icoon: 'barbell-outline',             startWaarde: 80,  apparaat: 'Barbell' },
  { id: 'rack_pull',              naam: 'Rack Pull',                      groep: 'Rug',       type: 'gewicht',         icoon: 'barbell-outline',             startWaarde: 100, apparaat: 'Barbell' },
  { id: 'pull_up',                naam: 'Pull-Up',                        groep: 'Rug',       type: 'lichaamsgewicht', icoon: 'arrow-up-circle-outline',     startWaarde: 0,   apparaat: 'Lichaamsgewicht' },
  { id: 'chin_up',                naam: 'Chin-Up',                        groep: 'Rug',       type: 'lichaamsgewicht', icoon: 'arrow-up-circle-outline',     startWaarde: 0,   apparaat: 'Lichaamsgewicht' },
  { id: 'weighted_pull_up',       naam: 'Weighted Pull-Up',               groep: 'Rug',       type: 'gewicht',         icoon: 'arrow-up-circle-outline',     startWaarde: 10,  apparaat: 'Lichaamsgewicht' },
  { id: 'lat_pulldown',           naam: 'Lat Pulldown',                   groep: 'Rug',       type: 'gewicht',         icoon: 'arrow-down-circle-outline',   startWaarde: 50,  apparaat: 'Machine' },
  { id: 'lat_pulldown_neutral',   naam: 'Lat Pulldown Neutral Grip',      groep: 'Rug',       type: 'gewicht',         icoon: 'arrow-down-circle-outline',   startWaarde: 50,  apparaat: 'Machine' },
  { id: 'barbell_row',            naam: 'Barbell Row',                    groep: 'Rug',       type: 'gewicht',         icoon: 'barbell-outline',             startWaarde: 60,  apparaat: 'Barbell' },
  { id: 'pendlay_row',            naam: 'Pendlay Row',                    groep: 'Rug',       type: 'gewicht',         icoon: 'barbell-outline',             startWaarde: 60,  apparaat: 'Barbell' },
  { id: 'dumbbell_row',           naam: 'Dumbbell Row',                   groep: 'Rug',       type: 'gewicht',         icoon: 'barbell-outline',             startWaarde: 24,  apparaat: 'Dumbbell' },
  { id: 'seated_cable_row',       naam: 'Seated Cable Row',               groep: 'Rug',       type: 'gewicht',         icoon: 'boat-outline',                startWaarde: 50,  apparaat: 'Kabel' },
  { id: 'cable_row_wide',         naam: 'Wide Grip Cable Row',            groep: 'Rug',       type: 'gewicht',         icoon: 'boat-outline',                startWaarde: 45,  apparaat: 'Kabel' },
  { id: 't_bar_row',              naam: 'T-Bar Row',                      groep: 'Rug',       type: 'gewicht',         icoon: 'barbell-outline',             startWaarde: 50,  apparaat: 'Barbell' },
  { id: 'face_pull',              naam: 'Face Pull',                      groep: 'Rug',       type: 'gewicht',         icoon: 'git-pull-request-outline',    startWaarde: 20,  apparaat: 'Kabel' },
  { id: 'hyperextension',         naam: 'Hyperextension',                 groep: 'Rug',       type: 'lichaamsgewicht', icoon: 'body-outline',                startWaarde: 0,   apparaat: 'Machine' },
  { id: 'straight_arm_pulldown',  naam: 'Straight Arm Pulldown',          groep: 'Rug',       type: 'gewicht',         icoon: 'arrow-down-outline',          startWaarde: 20,  apparaat: 'Kabel' },

  // ─── BENEN ────────────────────────────────────────────────────────────────
  { id: 'squat',                  naam: 'Back Squat',                     groep: 'Benen',     type: 'gewicht',         icoon: 'walk-outline',                startWaarde: 70,  apparaat: 'Barbell' },
  { id: 'front_squat',            naam: 'Front Squat',                    groep: 'Benen',     type: 'gewicht',         icoon: 'walk-outline',                startWaarde: 50,  apparaat: 'Barbell' },
  { id: 'goblet_squat',           naam: 'Goblet Squat',                   groep: 'Benen',     type: 'gewicht',         icoon: 'walk-outline',                startWaarde: 20,  apparaat: 'Dumbbell' },
  { id: 'leg_press',              naam: 'Leg Press',                      groep: 'Benen',     type: 'gewicht',         icoon: 'caret-up-circle-outline',     startWaarde: 100, apparaat: 'Machine' },
  { id: 'leg_press_narrow',       naam: 'Narrow Leg Press',               groep: 'Benen',     type: 'gewicht',         icoon: 'caret-up-circle-outline',     startWaarde: 90,  apparaat: 'Machine' },
  { id: 'bulgarian_split_squat',  naam: 'Bulgarian Split Squat',          groep: 'Benen',     type: 'gewicht',         icoon: 'walk-outline',                startWaarde: 16,  apparaat: 'Dumbbell' },
  { id: 'leg_extension',          naam: 'Leg Extension',                  groep: 'Benen',     type: 'gewicht',         icoon: 'arrow-forward-circle-outline',startWaarde: 35,  apparaat: 'Machine' },
  { id: 'leg_curl_lying',         naam: 'Leg Curl (liggend)',             groep: 'Benen',     type: 'gewicht',         icoon: 'arrow-down-circle-outline',   startWaarde: 30,  apparaat: 'Machine' },
  { id: 'leg_curl_seated',        naam: 'Leg Curl (zittend)',             groep: 'Benen',     type: 'gewicht',         icoon: 'arrow-down-circle-outline',   startWaarde: 30,  apparaat: 'Machine' },
  { id: 'romanian_deadlift',      naam: 'Romanian Deadlift (RDL)',        groep: 'Benen',     type: 'gewicht',         icoon: 'barbell-outline',             startWaarde: 60,  apparaat: 'Barbell' },
  { id: 'rdl_dumbbell',           naam: 'Dumbbell RDL',                   groep: 'Benen',     type: 'gewicht',         icoon: 'barbell-outline',             startWaarde: 20,  apparaat: 'Dumbbell' },
  { id: 'lunges',                 naam: 'Lunges',                         groep: 'Benen',     type: 'gewicht',         icoon: 'walk-outline',                startWaarde: 14,  apparaat: 'Dumbbell' },
  { id: 'walking_lunges',         naam: 'Walking Lunges',                 groep: 'Benen',     type: 'gewicht',         icoon: 'walk-outline',                startWaarde: 12,  apparaat: 'Dumbbell' },
  { id: 'calf_raise_standing',    naam: 'Standing Calf Raise',            groep: 'Benen',     type: 'gewicht',         icoon: 'arrow-up-circle-outline',     startWaarde: 50,  apparaat: 'Machine' },
  { id: 'calf_raise_seated',      naam: 'Seated Calf Raise',              groep: 'Benen',     type: 'gewicht',         icoon: 'arrow-up-circle-outline',     startWaarde: 30,  apparaat: 'Machine' },
  { id: 'step_up',                naam: 'Step-Up',                        groep: 'Benen',     type: 'gewicht',         icoon: 'walk-outline',                startWaarde: 14,  apparaat: 'Dumbbell' },
  { id: 'hip_thrust',             naam: 'Hip Thrust',                     groep: 'Benen',     type: 'gewicht',         icoon: 'body-outline',                startWaarde: 60,  apparaat: 'Barbell' },
  { id: 'glute_bridge',           naam: 'Glute Bridge',                   groep: 'Benen',     type: 'gewicht',         icoon: 'body-outline',                startWaarde: 0,   apparaat: 'Lichaamsgewicht' },

  // ─── SCHOUDERS ────────────────────────────────────────────────────────────
  { id: 'overhead_press',         naam: 'Overhead Press (Barbell)',       groep: 'Schouders', type: 'gewicht',         icoon: 'barbell-outline',             startWaarde: 40,  apparaat: 'Barbell' },
  { id: 'dumbbell_shoulder_press',naam: 'Dumbbell Shoulder Press',        groep: 'Schouders', type: 'gewicht',         icoon: 'barbell-outline',             startWaarde: 16,  apparaat: 'Dumbbell' },
  { id: 'arnold_press',           naam: 'Arnold Press',                   groep: 'Schouders', type: 'gewicht',         icoon: 'barbell-outline',             startWaarde: 14,  apparaat: 'Dumbbell' },
  { id: 'seated_shoulder_press',  naam: 'Seated Machine Shoulder Press',  groep: 'Schouders', type: 'gewicht',         icoon: 'barbell-outline',             startWaarde: 40,  apparaat: 'Machine' },
  { id: 'lateral_raise',          naam: 'Lateral Raise (Dumbbell)',       groep: 'Schouders', type: 'gewicht',         icoon: 'expand-outline',              startWaarde: 8,   apparaat: 'Dumbbell' },
  { id: 'lateral_raise_cable',    naam: 'Lateral Raise (Kabel)',          groep: 'Schouders', type: 'gewicht',         icoon: 'expand-outline',              startWaarde: 7,   apparaat: 'Kabel' },
  { id: 'front_raise',            naam: 'Front Raise',                    groep: 'Schouders', type: 'gewicht',         icoon: 'arrow-up-outline',            startWaarde: 8,   apparaat: 'Dumbbell' },
  { id: 'rear_delt_flye',         naam: 'Rear Delt Flye',                 groep: 'Schouders', type: 'gewicht',         icoon: 'git-compare-outline',         startWaarde: 8,   apparaat: 'Dumbbell' },
  { id: 'reverse_pec_deck',       naam: 'Reverse Pec Deck',               groep: 'Schouders', type: 'gewicht',         icoon: 'git-compare-outline',         startWaarde: 30,  apparaat: 'Machine' },
  { id: 'upright_row',            naam: 'Upright Row',                    groep: 'Schouders', type: 'gewicht',         icoon: 'barbell-outline',             startWaarde: 30,  apparaat: 'Barbell' },
  { id: 'shrugs',                 naam: 'Shrugs',                         groep: 'Schouders', type: 'gewicht',         icoon: 'barbell-outline',             startWaarde: 40,  apparaat: 'Dumbbell' },

  // ─── ARMEN ────────────────────────────────────────────────────────────────
  { id: 'barbell_curl',           naam: 'Barbell Curl',                   groep: 'Armen',     type: 'gewicht',         icoon: 'barbell-outline',             startWaarde: 25,  apparaat: 'Barbell' },
  { id: 'ez_bar_curl',            naam: 'EZ Bar Curl',                    groep: 'Armen',     type: 'gewicht',         icoon: 'barbell-outline',             startWaarde: 22,  apparaat: 'Barbell' },
  { id: 'dumbbell_curl',          naam: 'Dumbbell Curl',                  groep: 'Armen',     type: 'gewicht',         icoon: 'barbell-outline',             startWaarde: 12,  apparaat: 'Dumbbell' },
  { id: 'hammer_curl',            naam: 'Hammer Curl',                    groep: 'Armen',     type: 'gewicht',         icoon: 'hammer-outline',              startWaarde: 12,  apparaat: 'Dumbbell' },
  { id: 'incline_curl',           naam: 'Incline Dumbbell Curl',          groep: 'Armen',     type: 'gewicht',         icoon: 'barbell-outline',             startWaarde: 10,  apparaat: 'Dumbbell' },
  { id: 'preacher_curl',          naam: 'Preacher Curl',                  groep: 'Armen',     type: 'gewicht',         icoon: 'barbell-outline',             startWaarde: 15,  apparaat: 'Machine' },
  { id: 'cable_curl',             naam: 'Cable Curl',                     groep: 'Armen',     type: 'gewicht',         icoon: 'barbell-outline',             startWaarde: 15,  apparaat: 'Kabel' },
  { id: 'concentration_curl',     naam: 'Concentration Curl',             groep: 'Armen',     type: 'gewicht',         icoon: 'barbell-outline',             startWaarde: 10,  apparaat: 'Dumbbell' },
  { id: 'spider_curl',            naam: 'Spider Curl',                    groep: 'Armen',     type: 'gewicht',         icoon: 'barbell-outline',             startWaarde: 12,  apparaat: 'Dumbbell' },
  { id: 'triceps_pushdown',       naam: 'Triceps Pushdown (touw)',        groep: 'Armen',     type: 'gewicht',         icoon: 'arrow-down-outline',          startWaarde: 20,  apparaat: 'Kabel' },
  { id: 'triceps_pushdown_bar',   naam: 'Triceps Pushdown (rechte stang)',groep: 'Armen',     type: 'gewicht',         icoon: 'arrow-down-outline',          startWaarde: 22,  apparaat: 'Kabel' },
  { id: 'skull_crusher',          naam: 'Skull Crusher (EZ bar)',         groep: 'Armen',     type: 'gewicht',         icoon: 'barbell-outline',             startWaarde: 20,  apparaat: 'Barbell' },
  { id: 'overhead_tricep_ext',    naam: 'Overhead Tricep Extension',      groep: 'Armen',     type: 'gewicht',         icoon: 'barbell-outline',             startWaarde: 14,  apparaat: 'Dumbbell' },
  { id: 'close_grip_bench',       naam: 'Close Grip Bench Press',         groep: 'Armen',     type: 'gewicht',         icoon: 'barbell-outline',             startWaarde: 50,  apparaat: 'Barbell' },
  { id: 'dips_tricep',            naam: 'Dips (Tricep)',                  groep: 'Armen',     type: 'lichaamsgewicht', icoon: 'arrow-down-circle-outline',   startWaarde: 0,   apparaat: 'Lichaamsgewicht' },
  { id: 'diamond_push_up',        naam: 'Diamond Push-Up',                groep: 'Armen',     type: 'lichaamsgewicht', icoon: 'body-outline',                startWaarde: 0,   apparaat: 'Lichaamsgewicht' },

  // ─── CORE ─────────────────────────────────────────────────────────────────
  { id: 'crunch',                 naam: 'Crunch',                         groep: 'Core',      type: 'lichaamsgewicht', icoon: 'body-outline',                startWaarde: 0,   apparaat: 'Lichaamsgewicht' },
  { id: 'cable_crunch',           naam: 'Cable Crunch',                   groep: 'Core',      type: 'gewicht',         icoon: 'git-pull-request-outline',    startWaarde: 20,  apparaat: 'Kabel' },
  { id: 'plank',                  naam: 'Plank',                          groep: 'Core',      type: 'tijd',            icoon: 'timer-outline',               startWaarde: 60,  apparaat: 'Lichaamsgewicht' },
  { id: 'side_plank',             naam: 'Side Plank',                     groep: 'Core',      type: 'tijd',            icoon: 'timer-outline',               startWaarde: 30,  apparaat: 'Lichaamsgewicht' },
  { id: 'leg_raise',              naam: 'Hanging Leg Raise',              groep: 'Core',      type: 'lichaamsgewicht', icoon: 'arrow-up-outline',            startWaarde: 0,   apparaat: 'Lichaamsgewicht' },
  { id: 'knee_raise',             naam: 'Knee Raise',                     groep: 'Core',      type: 'lichaamsgewicht', icoon: 'body-outline',                startWaarde: 0,   apparaat: 'Lichaamsgewicht' },
  { id: 'ab_rollout',             naam: 'Ab Rollout',                     groep: 'Core',      type: 'lichaamsgewicht', icoon: 'reload-circle-outline',       startWaarde: 0,   apparaat: 'Overig' },
  { id: 'russian_twist',          naam: 'Russian Twist',                  groep: 'Core',      type: 'gewicht',         icoon: 'sync-outline',                startWaarde: 5,   apparaat: 'Dumbbell' },
  { id: 'dead_bug',               naam: 'Dead Bug',                       groep: 'Core',      type: 'lichaamsgewicht', icoon: 'body-outline',                startWaarde: 0,   apparaat: 'Lichaamsgewicht' },
  { id: 'dragon_flag',            naam: 'Dragon Flag',                    groep: 'Core',      type: 'lichaamsgewicht', icoon: 'flag-outline',                startWaarde: 0,   apparaat: 'Lichaamsgewicht' },

  // ─── CARDIO ───────────────────────────────────────────────────────────────
  { id: 'treadmill',              naam: 'Loopband',                       groep: 'Cardio',    type: 'tijd',            icoon: 'walk-outline',                startWaarde: 1200, apparaat: 'Machine' },
  { id: 'cycling',                naam: 'Stationaire Fiets',              groep: 'Cardio',    type: 'tijd',            icoon: 'bicycle-outline',             startWaarde: 1200, apparaat: 'Machine' },
  { id: 'rowing',                 naam: 'Roeimachine',                    groep: 'Cardio',    type: 'tijd',            icoon: 'boat-outline',                startWaarde: 600,  apparaat: 'Machine' },
  { id: 'stair_climber',          naam: 'Stair Climber',                  groep: 'Cardio',    type: 'tijd',            icoon: 'trending-up-outline',         startWaarde: 600,  apparaat: 'Machine' },
  { id: 'jump_rope',              naam: 'Springtouw',                     groep: 'Cardio',    type: 'tijd',            icoon: 'refresh-circle-outline',      startWaarde: 120,  apparaat: 'Overig' },
];
