import React from 'react';
import {
  View, Text, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThema } from '../context/ThemeContext';
import { BottomSheet } from './ui/BottomSheet';
import { PrimaryButton } from './ui/PrimaryButton';
import { RADIUS } from '../theme/designTokens';

interface WarmupSet {
  percentage: number;
  reps: number;
  gewicht: number;
}

interface WarmupModalProps {
  zichtbaar: boolean;
  onSluiten: () => void;
  werkGewicht: number;
  oefeningNaam: string;
}

export default function WarmupModal({ zichtbaar, onSluiten, werkGewicht, oefeningNaam }: WarmupModalProps) {
  const { kleuren } = useThema();

  const warmupSets: WarmupSet[] = [
    { percentage: 50, reps: 10, gewicht: Math.round(werkGewicht * 0.5 * 2) / 2 },
    { percentage: 70, reps: 5, gewicht: Math.round(werkGewicht * 0.7 * 2) / 2 },
    { percentage: 85, reps: 2, gewicht: Math.round(werkGewicht * 0.85 * 2) / 2 },
  ];

  return (
    <BottomSheet
      visible={zichtbaar}
      onClose={onSluiten}
      title="Opwarmschema"
      subtitle={oefeningNaam}
      maxWidth={480}
    >
      <View style={[s.werkGewichtRij, { backgroundColor: kleuren.accentGedimpt, borderColor: kleuren.accent + '44' }]}>
        <View style={s.werkGewichtLinks}>
          <View style={[s.icoon, { backgroundColor: kleuren.warmup + '22' }]}>
            <Ionicons name="flame-outline" size={20} color={kleuren.warmup} />
          </View>
          <View>
            <Text style={[s.werkGewichtLabel, { color: kleuren.tekstSecundair }]}>Werkgewicht</Text>
            <Text style={[s.werkGewichtSub, { color: kleuren.tekstGedimpt }]}>Basis voor berekening</Text>
          </View>
        </View>
        <Text style={[s.werkGewichtWaarde, { color: kleuren.accentLicht }]}>{werkGewicht} kg</Text>
      </View>

      <Text style={[s.sectionLabel, { color: kleuren.tekstGedimpt }]}>OPWARMSETS</Text>

      <View style={s.lijst}>
        {warmupSets.map((set, i) => (
          <View
            key={i}
            style={[s.setRij, { backgroundColor: kleuren.achtergrondSecundair, borderColor: kleuren.kaartRand }]}
          >
            <View style={[s.setNummer, { backgroundColor: kleuren.warmup + '22' }]}>
              <Text style={[s.setNummerTekst, { color: kleuren.warmup }]}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.setGewicht, { color: kleuren.tekst }]}>{set.gewicht} kg</Text>
              <Text style={[s.setReps, { color: kleuren.tekstSecundair }]}>{set.reps} herhalingen</Text>
            </View>
            <View style={[s.percentageBadge, { backgroundColor: kleuren.warmup + '20' }]}>
              <Text style={[s.percentageTekst, { color: kleuren.warmup }]}>{set.percentage}%</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={[s.nota, { color: kleuren.tekstGedimpt }]}>
        Gewichten afgerond op 0,5 kg nauwkeurigheid.
      </Text>

      <PrimaryButton
        titel="Begrepen"
        onPress={onSluiten}
        variant="secondary"
        volledigeBreedte
      />
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  werkGewichtRij: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 14,
    marginBottom: 18,
  },
  werkGewichtLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icoon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  werkGewichtLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  werkGewichtSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  werkGewichtWaarde: {
    fontSize: 22,
    fontFamily: 'Inter_900Black',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  lijst: {
    gap: 8,
    marginBottom: 10,
  },
  setRij: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 13,
  },
  setNummer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setNummerTekst: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    fontVariant: ['tabular-nums'],
  },
  setGewicht: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    fontVariant: ['tabular-nums'],
  },
  setReps: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  percentageBadge: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  percentageTekst: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    fontVariant: ['tabular-nums'],
  },
  nota: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    fontStyle: 'italic',
  },
});
