// ─────────────────────────────────────────────────────────────────────────────
// Wayt – VoorschriftInsightCard
// Transparante algoritmische uitleg voor Groep A (onderzoek).
// Toont het voorschrift + de redenering achter de berekening.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useThema } from '../context/ThemeContext';
import type { Voorschrift } from '../types';

interface Props {
  voorschrift: Voorschrift;
  oefeningNaam: string;
}

const STATUS_CONFIG: Record<
  Voorschrift['status'],
  { icoon: string; kleurKey: 'succes' | 'waarschuwing' | 'accent' | 'fout'; label: string }
> = {
  nieuw:      { icoon: 'star-outline',          kleurKey: 'accent',       label: 'Eerste sessie' },
  progressie: { icoon: 'trending-up-outline',   kleurKey: 'succes',       label: 'Progressie' },
  houden:     { icoon: 'repeat-outline',        kleurKey: 'waarschuwing', label: 'Consolideren' },
  deload:     { icoon: 'trending-down-outline', kleurKey: 'fout',         label: 'Deload' },
};

export default function VoorschriftInsightCard({ voorschrift, oefeningNaam }: Props) {
  const { kleuren } = useThema();
  const [uitgevouwen, setUitgevouwen] = useState(false);

  const cfg = STATUS_CONFIG[voorschrift.status];
  const accentKleur = kleuren[cfg.kleurKey];

  return (
    <View style={[s.kaart, { backgroundColor: accentKleur + '12', borderColor: accentKleur + '44' }]}>
      {/* Header – altijd zichtbaar */}
      <TouchableOpacity
        style={s.header}
        onPress={() => setUitgevouwen(v => !v)}
        activeOpacity={0.7}
      >
        <View style={[s.statusBadge, { backgroundColor: accentKleur + '22' }]}>
          <Ionicons name={cfg.icoon as any} size={16} color={accentKleur} />
        </View>

        <View style={s.headerMidden}>
          <Text style={[s.statusLabel, { color: accentKleur }]}>{cfg.label.toUpperCase()}</Text>
          <Text style={[s.voorschriftTekst, { color: kleuren.tekst }]}>
            {voorschrift.sets}×{voorschrift.reps} reps @ {voorschrift.weight} kg
          </Text>
        </View>

        <View style={s.uitlegBadge}>
          <Text style={[s.uitlegBadgeTekst, { color: kleuren.tekstGedimpt }]}>
            {uitgevouwen ? 'Minder' : 'Waarom?'}
          </Text>
          <Ionicons
            name={uitgevouwen ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={kleuren.tekstGedimpt}
          />
        </View>
      </TouchableOpacity>

      {/* Uitleg – verschijnt bij tappen */}
      {uitgevouwen && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
          <View style={[s.scheidingslijn, { backgroundColor: accentKleur + '33' }]} />

          {voorschrift.rationale ? (
            <View style={s.rationaleContainer}>
              <Ionicons name="bulb-outline" size={14} color={accentKleur} style={s.rationaleIcoon} />
              <Text style={[s.rationaleTekst, { color: kleuren.tekstSecundair }]}>
                {voorschrift.rationale}
              </Text>
            </View>
          ) : null}

          <View style={s.pillsRij}>
            <Pill icoon="layers-outline" label="Sets"    waarde={String(voorschrift.sets)}       kleur={accentKleur} kleuren={kleuren} />
            <Pill icoon="repeat-outline" label="Reps"    waarde={String(voorschrift.reps)}       kleur={accentKleur} kleuren={kleuren} />
            <Pill icoon="barbell-outline" label="Gewicht" waarde={`${voorschrift.weight} kg`}   kleur={accentKleur} kleuren={kleuren} />
          </View>

          <Text style={[s.algoritmeTekst, { color: kleuren.tekstGedimpt }]}>
            Berekend via het Wayt Progressive Overload Algoritme
          </Text>
        </Animated.View>
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
    <View style={[s.pill, { backgroundColor: kleur + '15', borderColor: kleur + '33' }]}>
      <Ionicons name={icoon as any} size={12} color={kleur} />
      <Text style={[s.pillLabel, { color: kleuren.tekstGedimpt }]}>{label}</Text>
      <Text style={[s.pillWaarde, { color: kleur }]}>{waarde}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  kaart: {
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 14,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  statusBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerMidden: {
    flex: 1,
    gap: 1,
  },
  statusLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.2,
  },
  voorschriftTekst: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  uitlegBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  uitlegBadgeTekst: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  scheidingslijn: {
    height: 1,
    marginHorizontal: 12,
    marginBottom: 12,
  },
  rationaleContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  rationaleIcoon: {
    marginTop: 1,
  },
  rationaleTekst: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  pillsRij: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  pill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    gap: 3,
  },
  pillLabel: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
  },
  pillWaarde: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  algoritmeTekst: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    fontStyle: 'italic',
  },
});
