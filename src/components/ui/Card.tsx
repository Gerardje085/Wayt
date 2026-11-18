import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useThema } from '../../context/ThemeContext';
import { RADIUS, SHADOWS } from '../../theme/designTokens';

export interface CardProps {
  children: React.ReactNode;
  padding?: number;
  elevated?: boolean;
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
  /** @deprecated Gebruik bij voorkeur `style`; behouden voor achterwaartse compatibiliteit */
  stijl?: StyleProp<ViewStyle>;
}

export function Card({
  children,
  padding = 18,
  elevated = true,
  bordered = true,
  style,
  stijl,
}: CardProps) {
  const { kleuren } = useThema();

  return (
    <View
      style={[
        stijlen.container,
        {
          backgroundColor: kleuren.kaart,
          padding,
          borderColor: bordered ? kleuren.kaartRand : 'transparent',
          borderWidth: bordered ? 1 : 0,
        },
        elevated && SHADOWS.forTheme(kleuren.isDark, 'sm'),
        stijl,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export default Card;

const stijlen = StyleSheet.create({
  container: {
    borderRadius: RADIUS.lg,
  },
});
