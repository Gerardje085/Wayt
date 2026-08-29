import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThema } from '../../context/ThemeContext';

interface SecondaryButtonProps {
  titel: string;
  onPress: () => void;
  icoon?: keyof typeof Ionicons.glyphMap;
  uitgeschakeld?: boolean;
}

export default function SecondaryButton({ titel, onPress, icoon, uitgeschakeld }: SecondaryButtonProps) {
  const { kleuren } = useThema();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={uitgeschakeld}
      onPress={onPress}
      style={[
        stijlen.knop,
        { borderColor: kleuren.kaartRand, backgroundColor: kleuren.kaart, opacity: uitgeschakeld ? 0.5 : 1 },
      ]}
    >
      {icoon && <Ionicons name={icoon} size={18} color={kleuren.accent} style={{ marginRight: 8 }} />}
      <Text style={[stijlen.tekst, { color: kleuren.accent }]}>{titel}</Text>
    </TouchableOpacity>
  );
}

const stijlen = StyleSheet.create({
  knop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
  },
  tekst: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
