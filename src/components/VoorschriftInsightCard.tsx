// ─────────────────────────────────────────────────────────────────────────────
// Wayt – VoorschriftInsightCard
// Transparante algoritmische uitleg voor Groep A (onderzoek).
// Toont het voorschrift + de redenering achter de berekening.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThema } from '../context/ThemeContext';
import { RADIUS } from '../theme/designTokens';
import type { Voorschrift } from '../types';

const WEB_POINTER = Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : undefined;

interface Props {
  voorschrift: Voorschrift;
  oefeningNaam: string;
}

const STATUS_CONFIG: Record<
  Voorschrift['status'],
  { icoon: string; kleurKey: 'succes' | 'waarschuwing' | 'accent' | 'fout'; label: string }
> = {
  nieuw: { icoon: 'star-outline', kleurKey: 'accent', label: 'Eerste sessie' },
  progressie: { icoon: 'trending-up-outline', kleurKey: 'succes', label: 'Progressie' },
  houden: { icoon: 'repeat-outline', kleurKey: 'waarschuwing', label: 'Consolideren' },
  deload: { icoon: 'trending-down-outline', kleurKey: 'fout', label: 'Deload' },
};

export default function VoorschriftInsightCard({ voorschrift }: Props) {
  const { kleuren } = useThema();
  const [uitgevouwen, setUitgevouwen] = useState(false);

  const cfg = STATUS_CONFIG[voorschrift.status];
  const accentKleur = kleuren[cfg.kleurKey];

  return (
    <View style={[s.kaart, { backgroundColor: kleuren.kaart, borderColor: accentKleur + '55' }]}>
      <TouchableOpacity
        style={[s.header, WEB_POINTER]}
        onPress={() => setUitgevouwen(v => !v)}
        activeOpacity={0.75}
      >
        <View style={[s.statusBadge, { backgroundColor: accentKleur + '20' }]}>
          <Ionicons name={cfg.icoon as any} size={17} color={accentKleur} />
        </View>

        <View style={s.headerMidden}>
          <Text style={[s.statusLabel, { color: accentKleur }]}>{cfg.label.toUpperCase()}</Text>
          <Text style={[s.voorschriftTekst, { color: kleuren.tekst }]}>
            {voorschrift.sets}×{voorschrift.reps} reps @ {voorschrift.weight} kg
          </Text>
        </View>

        <View style={[s.uitlegBadge, { backgroundColor: kleuren.achtergrondSecundair, borderColor: kleuren.kaartRand }]}>
          <Text style={[s.uitlegBadgeTekst, { color: kleuren.tekstSecundair }]}>
            {uitgevouwen ? 'Minder' : 'Waarom?'}
          </Text>
          <Ionicons
            name={uitgevouwen ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={kleuren.tekstSecundair}
          />
        </View>
      </TouchableOpacity>

      {uitgevouwen && (
        <View>
          <View style={[s.scheidingslijn, { backgroundColor: kleuren.kaartRand }]} />

          {voorschrift.rationale ? (
            <View style={s.rationaleContainer}>
              <Ionicons name="bulb-outline" size={15} color={accentKleur} style={s.rationaleIcoon} />
              <Text style={[s.rationaleTekst, { color: kleuren.tekstSecundair }]}>
                {voorschrift.rationale}
              </Text>
            </View>
          ) : null}

          <View style={s.pillsRij}>
            <Pill icoon="layers-outline" label="Sets" waarde={String(voorschrift.sets)} kleur={accentKleur} kleuren={kleuren} />
            <Pill icoon="repeat-outline" label="Reps" waarde={String(voorschrift.reps)} kleur={accentKleur} kleuren={kleuren} />
            <Pill icoon="barbell-outline" label="Gewicht" waarde={`${voorschrift.weight} kg`} kleur={accentKleur} kleuren={kleuren} />
          </View>

          <Text style={[s.algoritmeTekst, { color: kleuren.tekstGedimpt }]}>
            Berekend via het Wayt Progressive Overload Algoritme
          </Text>
        </View>
      )}
    </View>
  );
}

function Pill({
  icoon, label, waarde, kleur, kleuren,
}: {
  icoon: string; label: string; waarde: string; kleur: string; kleuren: any;
}) {
  return (
    <View style={[s.pill, { backgroundColor: kleuren.achtergrondSecundair, borderColor: kleuren.kaartRand }]}>
      <Ionicons name={icoon as any} size={13} color={kleur} />
      <Text style={[s.pillLabel, { color: kleuren.tekstGedimpt }]}>{label}</Text>
      <Text style={[s.pillWaarde, { color: kleuren.tekst }]}>{waarde}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  kaart: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    marginBottom: 14,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  statusBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerMidden: {
    flex: 1,
    gap: 2,
  },
  statusLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.1,
  },
  voorschriftTekst: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    fontVariant: ['tabular-nums'],
  },
  uitlegBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  uitlegBadgeTekst: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  scheidingslijn: {
    height: 1,
    marginHorizontal: 14,
    marginBottom: 12,
  },
  rationaleContainer: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 8,
  },
  rationaleIcoon: {
    marginTop: 2,
  },
  rationaleTekst: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  pillsRij: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 8,
  },
  pill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    padding: 9,
    alignItems: 'center',
    gap: 3,
  },
  pillLabel: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  pillWaarde: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    fontVariant: ['tabular-nums'],
  },
  algoritmeTekst: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    paddingHorizontal: 14,
    paddingBottom: 12,
    fontStyle: 'italic',
  },
});
