import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThema } from '../context/ThemeContext';
import { formatTijd } from '../context/LiveWorkoutContext';
import { BottomSheet } from './ui/BottomSheet';
import { RADIUS } from '../theme/designTokens';

const WEB_POINTER = Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : undefined;

export interface WorkoutSamenvattingData {
  duurSeconden: number;
  voltooidesets: number;
  totaalVolume: number;
  totaalJoules: number;
  prs: { oefeningNaam: string; eenRM: number }[];
}

interface WorkoutSamenvattingProps {
  zichtbaar: boolean;
  data: WorkoutSamenvattingData;
  onOpslaan: () => void;
  onAnnuleren: () => void;
}

export default function WorkoutSamenvatting({ zichtbaar, data, onOpslaan, onAnnuleren }: WorkoutSamenvattingProps) {
  const { kleuren } = useThema();

  const stats = [
    { icoon: 'timer-outline', label: 'Duur', waarde: formatTijd(data.duurSeconden), kleur: kleuren.accentLicht },
    { icoon: 'checkmark-circle-outline', label: 'Sets voltooid', waarde: String(data.voltooidesets), kleur: kleuren.succes },
    { icoon: 'trending-up-outline', label: 'Volume', waarde: `${data.totaalVolume.toFixed(0)} kg`, kleur: kleuren.tekst },
    { icoon: 'flash-outline', label: 'Arbeid', waarde: `${data.totaalJoules.toFixed(0)} J`, kleur: kleuren.waarschuwing },
  ];

  return (
    <BottomSheet
      visible={zichtbaar}
      onClose={onAnnuleren}
      maxWidth={500}
      scrollable
    >
      <View style={s.header}>
        <View style={[s.icoonRing, { backgroundColor: kleuren.succes + '1F' }]}>
          <Ionicons name="checkmark-done" size={30} color={kleuren.succes} />
        </View>
        <Text style={[s.titel, { color: kleuren.tekst }]}>Workout afgerond!</Text>
        <Text style={[s.subtitel, { color: kleuren.tekstSecundair }]}>
          Goed gedaan. Controleer je samenvatting en sla op.
        </Text>
      </View>

      <View style={s.statGrid}>
        {stats.map(stat => (
          <View
            key={stat.label}
            style={[s.statKaart, { backgroundColor: kleuren.achtergrondSecundair, borderColor: kleuren.kaartRand }]}
          >
            <View style={[s.statIcoonWrap, { backgroundColor: stat.kleur + '1A' }]}>
              <Ionicons name={stat.icoon as any} size={18} color={stat.kleur} />
            </View>
            <Text style={[s.statWaarde, { color: kleuren.tekst }]}>{stat.waarde}</Text>
            <Text style={[s.statLabel, { color: kleuren.tekstGedimpt }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {data.prs.length > 0 && (
        <View style={s.prSectie}>
          <Text style={[s.sectionLabel, { color: kleuren.tekstGedimpt }]}>NIEUWE PERSOONLIJKE RECORDS</Text>
          {data.prs.map((pr, i) => (
            <View
              key={i}
              style={[s.prRij, { backgroundColor: kleuren.waarschuwing + '16', borderColor: kleuren.waarschuwing + '44' }]}
            >
              <Ionicons name="trophy" size={16} color={kleuren.waarschuwing} />
              <Text style={[s.prNaam, { color: kleuren.tekst }]} numberOfLines={1}>{pr.oefeningNaam}</Text>
              <Text style={[s.prWaarde, { color: kleuren.waarschuwing }]}>{pr.eenRM} kg</Text>
            </View>
          ))}
        </View>
      )}

      <View style={s.knoppen}>
        <TouchableOpacity
          style={[
            s.annulerenKnop,
            { backgroundColor: kleuren.achtergrondSecundair, borderColor: kleuren.kaartRand },
            WEB_POINTER,
          ]}
          onPress={onAnnuleren}
          activeOpacity={0.75}
        >
          <Text style={[s.annulerenTekst, { color: kleuren.tekstSecundair }]}>Doorgaan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.opslaanKnop, { backgroundColor: kleuren.succes }, WEB_POINTER]}
          onPress={onOpslaan}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          <Text style={s.opslaanTekst}>Opslaan & Afsluiten</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 4,
  },
  icoonRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  titel: {
    fontSize: 22,
    fontFamily: 'Inter_900Black',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  statKaart: {
    flex: 1,
    minWidth: '44%',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  statIcoonWrap: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statWaarde: {
    fontSize: 20,
    fontFamily: 'Inter_900Black',
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 2,
  },
  prSectie: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  prRij: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  prNaam: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  prWaarde: {
    fontSize: 16,
    fontFamily: 'Inter_900Black',
    fontVariant: ['tabular-nums'],
  },
  knoppen: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  annulerenKnop: {
    flex: 1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  annulerenTekst: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  opslaanKnop: {
    flex: 2,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  opslaanTekst: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
});
