import React from 'react';
import {
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  View,
  Platform,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useThema } from '../../context/ThemeContext';
import { RADIUS } from '../../theme/designTokens';

export type PrimaryButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type PrimaryButtonSize = 'sm' | 'md' | 'lg';

export interface PrimaryButtonProps {
  titel: string;
  onPress: () => void;
  icoon?: keyof typeof Ionicons.glyphMap;
  bezig?: boolean;
  uitgeschakeld?: boolean;
  variant?: PrimaryButtonVariant;
  size?: PrimaryButtonSize;
  volledigeBreedte?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SIZE_STIJLEN: Record<
  PrimaryButtonSize,
  { paddingVertical: number; paddingHorizontal: number; fontSize: number; iconSize: number; radius: number }
> = {
  sm: { paddingVertical: 10, paddingHorizontal: 14, fontSize: 13, iconSize: 15, radius: RADIUS.sm },
  md: { paddingVertical: 14, paddingHorizontal: 18, fontSize: 15, iconSize: 17, radius: 14 },
  lg: { paddingVertical: 16, paddingHorizontal: 22, fontSize: 16, iconSize: 18, radius: 14 },
};

export function PrimaryButton({
  titel,
  onPress,
  icoon,
  bezig = false,
  uitgeschakeld = false,
  variant = 'primary',
  size = 'md',
  volledigeBreedte = true,
  style,
}: PrimaryButtonProps) {
  const { kleuren } = useThema();
  const actief = !bezig && !uitgeschakeld;
  const maat = SIZE_STIJLEN[size];

  const tekstKleur = (() => {
    if (!actief && variant !== 'primary') return kleuren.tekstGedimpt;
    switch (variant) {
      case 'primary':
        return actief ? '#FFFFFF' : kleuren.tekstGedimpt;
      case 'danger':
        return '#FFFFFF';
      case 'secondary':
        return kleuren.tekst;
      case 'ghost':
        return kleuren.accentLicht;
    }
  })();

  const webCursor: ViewStyle | undefined =
    Platform.OS === 'web'
      ? ({ cursor: actief ? 'pointer' : 'not-allowed' } as ViewStyle)
      : undefined;

  const inhoud = bezig ? (
    <ActivityIndicator color={tekstKleur} size="small" />
  ) : (
    <View style={stijlen.inhoud}>
      {icoon ? (
        <Ionicons
          name={icoon}
          size={maat.iconSize}
          color={tekstKleur}
          style={stijlen.icoon}
        />
      ) : null}
      <Text
        style={[
          stijlen.tekst,
          { color: tekstKleur, fontSize: maat.fontSize },
        ]}
        numberOfLines={1}
      >
        {titel}
      </Text>
    </View>
  );

  return (
    <Pressable
      disabled={!actief}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: !actief, busy: bezig }}
      style={({ pressed }) => [
        volledigeBreedte ? stijlen.volledig : stijlen.compact,
        pressed && actief && stijlen.ingedrukt,
        !actief && variant !== 'primary' && stijlen.uitgeschakeld,
        webCursor,
        style,
      ]}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={
            actief
              ? [kleuren.accent, kleuren.accentLicht]
              : [kleuren.kaartRand, kleuren.kaartRand]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            stijlen.knopBasis,
            {
              paddingVertical: maat.paddingVertical,
              paddingHorizontal: maat.paddingHorizontal,
              borderRadius: maat.radius,
              shadowColor: kleuren.accent,
              shadowOpacity: actief ? (kleuren.isDark ? 0.32 : 0.22) : 0,
              shadowOffset: { width: 0, height: 6 },
              shadowRadius: 14,
              elevation: actief ? 4 : 0,
            },
          ]}
        >
          {inhoud}
        </LinearGradient>
      ) : (
        <View
          style={[
            stijlen.knopBasis,
            {
              paddingVertical: maat.paddingVertical,
              paddingHorizontal: maat.paddingHorizontal,
              borderRadius: maat.radius,
              backgroundColor:
                variant === 'danger'
                  ? kleuren.fout
                  : variant === 'secondary'
                    ? kleuren.kaart
                    : 'transparent',
              borderWidth: variant === 'secondary' ? 1 : 0,
              borderColor: variant === 'secondary' ? kleuren.kaartRand : 'transparent',
            },
          ]}
        >
          {inhoud}
        </View>
      )}
    </Pressable>
  );
}

export default PrimaryButton;

const stijlen = StyleSheet.create({
  volledig: {
    width: '100%',
  },
  compact: {
    alignSelf: 'flex-start',
  },
  ingedrukt: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  uitgeschakeld: {
    opacity: 0.5,
  },
  knopBasis: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inhoud: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icoon: {
    marginRight: 8,
  },
  tekst: {
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.1,
  },
});
