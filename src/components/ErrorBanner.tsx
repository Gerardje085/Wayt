// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Error Banner Component
// Toont foutmeldingen met een consistente stijl en een optionele retry-knop.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThema } from '../context/ThemeContext';
import { RADIUS } from '../theme/designTokens';

const WEB_POINTER = Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : undefined;

interface ErrorBannerProps {
  bericht: string;
  onProbeerOpnieuw?: () => void;
}

export default function ErrorBanner({ bericht, onProbeerOpnieuw }: ErrorBannerProps) {
  const { kleuren } = useThema();

  return (
    <View style={[stijlen.container, { borderColor: kleuren.fout + '44', backgroundColor: kleuren.fout + '14' }]}>
      <View style={[stijlen.icoonWrap, { backgroundColor: kleuren.fout + '20' }]}>
        <Ionicons name="alert-circle-outline" size={18} color={kleuren.fout} />
      </View>
      <View style={stijlen.tekstContainer}>
        <Text style={[stijlen.bericht, { color: kleuren.tekst }]}>{bericht}</Text>
        {onProbeerOpnieuw && (
          <TouchableOpacity
            onPress={onProbeerOpnieuw}
            style={[stijlen.knop, { borderColor: kleuren.fout + '55', backgroundColor: kleuren.fout + '1A' }, WEB_POINTER]}
            accessibilityLabel="Probeer opnieuw"
            activeOpacity={0.75}
          >
            <Ionicons name="refresh" size={13} color={kleuren.fout} />
            <Text style={[stijlen.knopTekst, { color: kleuren.fout }]}>Probeer opnieuw</Text>
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
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: 14,
    gap: 12,
  },
  icoonWrap: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tekstContainer: { flex: 1 },
  bericht: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
  },
  knop: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  knopTekst: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
});
