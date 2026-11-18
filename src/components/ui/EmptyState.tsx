import React from 'react';
import { Text, View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThema } from '../../context/ThemeContext';
import { RADIUS, SHADOWS, SPACING } from '../../theme/designTokens';
import PrimaryButton from './PrimaryButton';

export interface EmptyStateProps {
  icoon: keyof typeof Ionicons.glyphMap;
  titel: string;
  subtekst: string;
  actieTekst?: string;
  onActie?: () => void;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  icoon,
  titel,
  subtekst,
  actieTekst,
  onActie,
  compact = false,
  style,
}: EmptyStateProps) {
  const { kleuren } = useThema();

  return (
    <View
      style={[
        stijlen.container,
        compact && stijlen.compactContainer,
        {
          backgroundColor: kleuren.kaart,
          borderColor: kleuren.kaartRand,
        },
        SHADOWS.forTheme(kleuren.isDark, 'sm'),
        style,
      ]}
    >
      <View
        style={[
          stijlen.icoonBadge,
          compact && stijlen.icoonBadgeCompact,
          { backgroundColor: kleuren.accentGedimpt },
        ]}
      >
        <Ionicons
          name={icoon}
          size={compact ? 24 : 28}
          color={kleuren.accentLicht}
        />
      </View>

      <Text style={[stijlen.titel, { color: kleuren.tekst }]}>{titel}</Text>
      <Text style={[stijlen.subtekst, { color: kleuren.tekstSecundair }]}>
        {subtekst}
      </Text>

      {actieTekst && onActie ? (
        <View style={stijlen.actieWrapper}>
          <PrimaryButton titel={actieTekst} onPress={onActie} size="md" />
        </View>
      ) : null}
    </View>
  );
}

export default EmptyState;

const stijlen = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
  },
  compactContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  icoonBadge: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.base,
  },
  icoonBadgeCompact: {
    width: 48,
    height: 48,
    marginBottom: SPACING.md,
  },
  titel: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.2,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtekst: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 340,
  },
  actieWrapper: {
    marginTop: SPACING.lg,
    width: '100%',
    maxWidth: 260,
  },
});
