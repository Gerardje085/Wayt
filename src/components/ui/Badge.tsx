import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

interface BadgeProps {
  label: string;
  kleur: string;
  achtergrond?: string;
}

export default function Badge({ label, kleur, achtergrond }: BadgeProps) {
  return (
    <View style={[stijlen.badge, { backgroundColor: achtergrond ?? kleur + '22', borderColor: kleur + '55' }]}>
      <Text style={[stijlen.tekst, { color: kleur }]}>{label}</Text>
    </View>
  );
}

const stijlen = StyleSheet.create({
  badge: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  tekst: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
});
