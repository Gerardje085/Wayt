// ─────────────────────────────────────────────────────────────────────────────
// Wayt – ThemeContext
// Biedt automatische dark/light mode detectie via systeeminstellingen.
// Gebruikers kunnen het thema handmatig overschrijven.
// ─────────────────────────────────────────────────────────────────────────────
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { donkerThema, lichtThema } from '../theme/colors';
import type { ThemaKleuren } from '../types';

const OPSLAG_SLEUTEL = 'wayt_thema_voorkeur';

type ThemaVoorkeur = 'donker' | 'licht' | 'systeem';

interface ThemaContextType {
  kleuren: ThemaKleuren;
  voorkeur: ThemaVoorkeur;
  setVoorkeur: (v: ThemaVoorkeur) => void;
}

const ThemaContext = createContext<ThemaContextType | null>(null);

export function useThema(): ThemaContextType {
  const ctx = useContext(ThemaContext);
  if (!ctx) throw new Error('useThema vereist ThemaProvider');
  return ctx;
}

export function ThemaProvider({ children }: { children: ReactNode }) {
  const systeemSchema = useColorScheme(); // 'dark' | 'light' | null
  const [voorkeur, setVoorkeurState] = useState<ThemaVoorkeur>('systeem');

  // Laad opgeslagen voorkeur bij opstarten
  useEffect(() => {
    AsyncStorage.getItem(OPSLAG_SLEUTEL).then((waarde) => {
      if (waarde === 'donker' || waarde === 'licht' || waarde === 'systeem') {
        setVoorkeurState(waarde);
      }
    });
  }, []);

  const setVoorkeur = useCallback((v: ThemaVoorkeur) => {
    setVoorkeurState(v);
    AsyncStorage.setItem(OPSLAG_SLEUTEL, v);
  }, []);

  // Bepaal actief thema
  const isDark =
    voorkeur === 'donker' ||
    (voorkeur === 'systeem' && systeemSchema === 'dark');

  const kleuren = isDark ? donkerThema : lichtThema;

  return (
    <ThemaContext.Provider value={{ kleuren, voorkeur, setVoorkeur }}>
      {children}
    </ThemaContext.Provider>
  );
}
