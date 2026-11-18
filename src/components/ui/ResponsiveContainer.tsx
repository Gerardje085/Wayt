import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useResponsive } from '../../theme/designTokens';

export type ResponsiveVariant = 'narrow' | 'default' | 'wide';

const VARIANT_MAX_WIDTH: Record<ResponsiveVariant, number> = {
  narrow: 560,
  default: 920,
  wide: 1180,
};

export interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  variant?: ResponsiveVariant;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ResponsiveContainer({
  children,
  maxWidth,
  variant = 'default',
  padded = false,
  style,
}: ResponsiveContainerProps) {
  const { contentPadding } = useResponsive();
  const resolvedMaxWidth = maxWidth ?? VARIANT_MAX_WIDTH[variant];

  return (
    <View
      style={[
        stijlen.container,
        { maxWidth: resolvedMaxWidth },
        padded && { paddingHorizontal: contentPadding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export default ResponsiveContainer;

const stijlen = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'center',
  },
});
