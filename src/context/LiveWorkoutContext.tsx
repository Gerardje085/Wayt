import React, {
  createContext, useContext, useState, useRef, useCallback, useEffect
} from 'react';
import type { RoutineSet } from '../lib/routineStore';
import * as Haptics from 'expo-haptics';

export type SetType = 'normaal' | 'warmup' | 'dropset' | 'failure';

export interface LiveSet extends RoutineSet {
  type: SetType;
  completed: boolean;
  vorige?: { reps: number; gewicht: number } | null;
}

export interface LiveOefening {
  id: string;
  sets: LiveSet[];
  expanded: boolean;
}

export interface LiveWorkoutState {
  isActief: boolean;
  startTijd: number | null;
  routineNaam: string;
  routineId: string | null;
  oefeningen: LiveOefening[];
  rustTimerLoopt: boolean;
  rustTimerResterend: number;
  rustTimerDuur: number;
}

interface LiveWorkoutCtx extends LiveWorkoutState {
  startWorkout: (naam: string, routineId: string | null, oefeningen: LiveOefening[]) => void;
  stopWorkout: () => void;
  toggleSet: (oefeningId: string, setId: string) => void;
  updateSet: (oefeningId: string, setId: string, field: 'reps' | 'gewicht', value: number) => void;
  setSetType: (oefeningId: string, setId: string, type: SetType) => void;
  addSet: (oefeningId: string) => void;
  removeSet: (oefeningId: string, setId: string) => void;
  addOefening: (oefeningId: string) => void;
  toggleOefening: (oefeningId: string) => void;
  startRustTimer: (duurSeconden: number) => void;
  stopRustTimer: () => void;
  verlopenTijd: number;
}

const initState: LiveWorkoutState = {
  isActief: false,
  startTijd: null,
  routineNaam: '',
  routineId: null,
  oefeningen: [],
  rustTimerLoopt: false,
  rustTimerResterend: 0,
  rustTimerDuur: 90,
};

const LiveWorkoutContext = createContext<LiveWorkoutCtx>({
  ...initState,
  verlopenTijd: 0,
  startWorkout: () => {},
  stopWorkout: () => {},
  toggleSet: () => {},
  updateSet: () => {},
  setSetType: () => {},
  addSet: () => {},
  removeSet: () => {},
  addOefening: () => {},
  toggleOefening: () => {},
  startRustTimer: () => {},
  stopRustTimer: () => {},
});

export function LiveWorkoutProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LiveWorkoutState>(initState);
  const [verlopenTijd, setVerlopenTijd] = useState(0);

  const workoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rustTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state.isActief && state.startTijd) {
      workoutTimerRef.current = setInterval(() => {
        setVerlopenTijd(Math.floor((Date.now() - state.startTijd!) / 1000));
      }, 1000);
    } else {
      if (workoutTimerRef.current) clearInterval(workoutTimerRef.current);
      setVerlopenTijd(0);
    }
    return () => {
      if (workoutTimerRef.current) clearInterval(workoutTimerRef.current);
    };
  }, [state.isActief, state.startTijd]);

  const startWorkout = useCallback((naam: string, routineId: string | null, oefeningen: LiveOefening[]) => {
    setState({
      isActief: true,
      startTijd: Date.now(),
      routineNaam: naam,
      routineId,
      oefeningen: oefeningen.map((o, i) => ({ ...o, expanded: i === 0 })),
      rustTimerLoopt: false,
      rustTimerResterend: 0,
      rustTimerDuur: 90,
    });
  }, []);

  const stopWorkout = useCallback(() => {
    if (rustTimerRef.current) clearInterval(rustTimerRef.current);
    setState(initState);
  }, []);

  const toggleSet = useCallback((oefeningId: string, setId: string) => {
    setState(prev => ({
      ...prev,
      oefeningen: prev.oefeningen.map(o =>
        o.id !== oefeningId ? o : {
          ...o,
          sets: o.sets.map(s =>
            s.id !== setId ? s : { ...s, completed: !s.completed }
          )
        }
      )
    }));
  }, []);

  const updateSet = useCallback((oefeningId: string, setId: string, field: 'reps' | 'gewicht', value: number) => {
    setState(prev => ({
      ...prev,
      oefeningen: prev.oefeningen.map(o =>
        o.id !== oefeningId ? o : {
          ...o,
          sets: o.sets.map(s =>
            s.id !== setId ? s : { ...s, [field]: Math.max(0, value) }
          )
        }
      )
    }));
  }, []);

  const setSetType = useCallback((oefeningId: string, setId: string, type: SetType) => {
    setState(prev => ({
      ...prev,
      oefeningen: prev.oefeningen.map(o =>
        o.id !== oefeningId ? o : {
          ...o,
          sets: o.sets.map(s => s.id !== setId ? s : { ...s, type })
        }
      )
    }));
  }, []);

  const addSet = useCallback((oefeningId: string) => {
    setState(prev => ({
      ...prev,
      oefeningen: prev.oefeningen.map(o => {
        if (o.id !== oefeningId) return o;
        const last = o.sets[o.sets.length - 1];
        const newSet: LiveSet = {
          id: Math.random().toString(36).substring(2, 10),
          reps: last?.reps ?? 10,
          gewicht: last?.gewicht ?? 0,
          type: 'normaal',
          completed: false,
        };
        return { ...o, sets: [...o.sets, newSet] };
      })
    }));
  }, []);

  const removeSet = useCallback((oefeningId: string, setId: string) => {
    setState(prev => ({
      ...prev,
      oefeningen: prev.oefeningen.map(o =>
        o.id !== oefeningId ? o : {
          ...o,
          sets: o.sets.filter(s => s.id !== setId)
        }
      )
    }));
  }, []);

  const addOefening = useCallback((oefeningId: string) => {
    setState(prev => {
      if (prev.oefeningen.some(o => o.id === oefeningId)) return prev;
      const nieuweOefening: LiveOefening = {
        id: oefeningId,
        expanded: true,
        sets: Array.from({ length: 3 }).map(() => ({
          id: Math.random().toString(36).substring(2, 10),
          reps: 10,
          gewicht: 0,
          type: 'normaal',
          completed: false,
        })),
      };
      return {
        ...prev,
        oefeningen: [
          ...prev.oefeningen.map(o => ({ ...o, expanded: false })),
          nieuweOefening,
        ],
      };
    });
  }, []);

  const toggleOefening = useCallback((oefeningId: string) => {
    setState(prev => ({
      ...prev,
      oefeningen: prev.oefeningen.map(o =>
        o.id !== oefeningId ? o : { ...o, expanded: !o.expanded }
      )
    }));
  }, []);

  const startRustTimer = useCallback((duurSeconden: number) => {
    if (rustTimerRef.current) clearInterval(rustTimerRef.current);
    setState(prev => ({
      ...prev,
      rustTimerLoopt: true,
      rustTimerResterend: duurSeconden,
      rustTimerDuur: duurSeconden,
    }));
    rustTimerRef.current = setInterval(() => {
      setState(prev => {
        if (prev.rustTimerResterend <= 1) {
          if (rustTimerRef.current) clearInterval(rustTimerRef.current);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return { ...prev, rustTimerLoopt: false, rustTimerResterend: 0 };
        }
        if (prev.rustTimerResterend <= 3) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        return { ...prev, rustTimerResterend: prev.rustTimerResterend - 1 };
      });
    }, 1000);
  }, []);

  const stopRustTimer = useCallback(() => {
    if (rustTimerRef.current) clearInterval(rustTimerRef.current);
    setState(prev => ({ ...prev, rustTimerLoopt: false, rustTimerResterend: 0 }));
  }, []);

  return (
    <LiveWorkoutContext.Provider value={{
      ...state,
      verlopenTijd,
      startWorkout, stopWorkout,
      toggleSet, updateSet, setSetType,
      addSet, removeSet, addOefening,
      toggleOefening,
      startRustTimer, stopRustTimer,
    }}>
      {children}
    </LiveWorkoutContext.Provider>
  );
}

export function useLiveWorkout() {
  return useContext(LiveWorkoutContext);
}

export function formatTijd(seconden: number): string {
  const h = Math.floor(seconden / 3600);
  const m = Math.floor((seconden % 3600) / 60);
  const s = seconden % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function bereken1RM(gewicht: number, reps: number): number {
  if (reps === 1) return gewicht;
  return Math.round(gewicht * (1 + reps / 30));
}
