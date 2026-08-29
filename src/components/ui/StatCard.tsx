import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThema } from '../../context/ThemeContext';

interface StatCardProps {
  waarde: string;
  label: string;
  icoon?: keyof typeof Ionicons.glyphMap;
  kleur?: string;
}

export default function StatCard({ waarde, label, icoon, kleur }: StatCardProps) {
  const { kleuren } = useThema();
  const accentKleur = kleur ?? kleuren.accent;

  return (
    <View style={[stijlen.container, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
      {icoon && <Ionicons name={icoon} size={20} color={accentKleur} style={{ marginBottom: 8 }} />}
      <Text style={[stijlen.waarde, { color: accentKleur }]}>{waarde}</Text>
      <Text style={[stijlen.label, { color: kleuren.tekstGedimpt }]}>{label}</Text>
    </View>
  );
}

const stijlen = StyleSheet.create({
  container: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  waarde: {
    fontSize: 20,
    fontFamily: 'Inter_900Black',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
});
