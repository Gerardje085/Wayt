// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Error Banner Component
// Toont foutmeldingen met een consistente stijl en een optionele retry-knop.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThema } from '../context/ThemeContext';

interface ErrorBannerProps {
  bericht:     string;
  onProbeerOpnieuw?: () => void;
}

export default function ErrorBanner({ bericht, onProbeerOpnieuw }: ErrorBannerProps) {
  const { kleuren } = useThema();

  return (
    <View style={[stijlen.container, { borderColor: kleuren.fout + '55', backgroundColor: kleuren.fout + '15' }]}>
      <Ionicons name="alert-circle-outline" size={20} color={kleuren.fout} style={stijlen.icoon} />
      <View style={stijlen.tekstContainer}>
        <Text style={[stijlen.bericht, { color: kleuren.fout }]}>{bericht}</Text>
        {onProbeerOpnieuw && (
          <TouchableOpacity onPress={onProbeerOpnieuw} style={stijlen.knop} accessibilityLabel="Probeer opnieuw">
            <Text style={[stijlen.knopTekst, { color: kleuren.fout }]}>↺ Probeer opnieuw</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const stijlen = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 10,
  },
  icoon:         { fontSize: 18 },
  tekstContainer: { flex: 1 },
  bericht: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  knop:     { marginTop: 6 },
  knopTekst: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    textDecorationLine: 'underline',
  },
});
