import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThema } from '../../context/ThemeContext';
import PrimaryButton from './PrimaryButton';

interface EmptyStateProps {
  icoon: keyof typeof Ionicons.glyphMap;
  titel: string;
  subtekst: string;
  actieTekst?: string;
  onActie?: () => void;
}

export default function EmptyState({ icoon, titel, subtekst, actieTekst, onActie }: EmptyStateProps) {
  const { kleuren } = useThema();

  return (
    <View style={[stijlen.container, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
      <Ionicons name={icoon} size={40} color={kleuren.tekstGedimpt} style={{ marginBottom: 12 }} />
      <Text style={[stijlen.titel, { color: kleuren.tekst }]}>{titel}</Text>
      <Text style={[stijlen.subtekst, { color: kleuren.tekstGedimpt }]}>{subtekst}</Text>
      {actieTekst && onActie && (
        <View style={{ marginTop: 20, alignSelf: 'stretch' }}>
          <PrimaryButton titel={actieTekst} onPress={onActie} />
        </View>
      )}
    </View>
  );
}

const stijlen = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  titel: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
  },
  subtekst: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
});
