import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useThema } from '../../context/ThemeContext';
import { RADIUS, SPACING, useResponsive } from '../../theme/designTokens';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ScreenHeader({
  title,
  subtitle,
  badge,
  leftAction,
  rightAction,
  style,
}: ScreenHeaderProps) {
  const { kleuren } = useThema();
  const { isMobile } = useResponsive();

  return (
    <View style={[stijlen.container, style]}>
      <View style={stijlen.rij}>
        {leftAction ? <View style={stijlen.linksActie}>{leftAction}</View> : null}

        <View style={stijlen.titelBlok}>
          {badge ? (
            <View style={[stijlen.badge, { backgroundColor: kleuren.accentGedimpt }]}>
              <Text style={[stijlen.badgeTekst, { color: kleuren.accentLicht }]}>
                {badge}
              </Text>
            </View>
          ) : null}

          <Text
            style={[
              stijlen.titel,
              {
                color: kleuren.tekst,
                fontSize: isMobile ? 26 : 28,
                lineHeight: isMobile ? 32 : 34,
              },
            ]}
            numberOfLines={2}
          >
            {title}
          </Text>

          {subtitle ? (
            <Text style={[stijlen.subtitel, { color: kleuren.tekstSecundair }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightAction ? <View style={stijlen.rechtsActie}>{rightAction}</View> : null}
      </View>
    </View>
  );
}

export default ScreenHeader;

const stijlen = StyleSheet.create({
  container: {
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.base,
  },
  rij: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  linksActie: {
    flexShrink: 0,
  },
  titelBlok: {
    flex: 1,
    minWidth: 0,
  },
  rechtsActie: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: 6,
  },
  badgeTekst: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  titel: {
    fontFamily: 'Inter_900Black',
    letterSpacing: -0.6,
  },
  subtitel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    marginTop: 4,
  },
});
