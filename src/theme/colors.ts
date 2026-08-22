// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Kleurpalet (Dark & Light Mode)
// ─────────────────────────────────────────────────────────────────────────────
import { ThemaKleuren } from '../types';

export const donkerThema: ThemaKleuren = {
  achtergrond:          '#08080F',   // bijna OLED zwart
  achtergrondSecundair: '#0D0D1A',
  kaart:                '#12121F',   // kaarten
  kaartRand:            '#1E1E30',   // subtiele rand
  tekst:                '#F0F0FF',
  tekstSecundair:       '#C8C8E8',
  tekstGedimpt:         '#5A5A78',
  accent:               '#7C3AED',   // Neon Paars
  accentLicht:          '#9F67FF',
  accentGedimpt:        'rgba(124, 58, 237, 0.15)',
  succes:               '#22C55E',   // Groen
  fout:                 '#EF4444',   // Rood
  waarschuwing:         '#F59E0B',   // Amber
  isDark:               true,
};

export const lichtThema: ThemaKleuren = {
  achtergrond:          '#F2F2F7',
  achtergrondSecundair: '#FFFFFF',
  kaart:                '#FFFFFF',
  kaartRand:            '#E5E5EA',
  tekst:                '#000000',
  tekstSecundair:       '#1C1C1E',
  tekstGedimpt:         '#8E8E93',
  accent:               '#7C3AED',
  accentLicht:          '#A855F7',
  accentGedimpt:        'rgba(124, 58, 237, 0.1)',
  succes:               '#7C3AED',
  fout:                 '#FF3B30',
  waarschuwing:         '#FF9500',
  isDark:               false,
};

/** Accent-kleuren die altijd gelijk zijn ongeacht thema */
export const ALTIJD_KLEUREN = {
  paars:  '#7C3AED',
  roze:   '#EC4899',
  groen:  '#34D399',
  rood:   '#F87171',
  geel:   '#FBBF24',
  blauw:  '#60A5FA',
};
