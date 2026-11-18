import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThema } from '../../context/ThemeContext';
import { RADIUS, SHADOWS, SPACING, useResponsive } from '../../theme/designTokens';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: number;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 460,
  scrollable = false,
  style,
}: BottomSheetProps) {
  const { kleuren } = useThema();
  const insets = useSafeAreaInsets();
  const { isDesktop, isTablet, height } = useResponsive();
  const isDialog = isDesktop || isTablet;

  // Escape-toets sluit modal op web
  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;
    if (typeof window === 'undefined') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose]);

  const maxSheetHeight = Math.round(height * (isDialog ? 0.86 : 0.9));

  const inhoud = scrollable ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      bounces={false}
    >
      {children}
    </ScrollView>
  ) : (
    children
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType={Platform.OS === 'web' || isDialog ? 'fade' : 'slide'}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={[
          stijlen.overlay,
          isDialog ? stijlen.overlayDialog : stijlen.overlaySheet,
          { backgroundColor: 'rgba(0, 0, 0, 0.55)' },
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Sluit paneel"
        />

        <View
          style={[
            stijlen.kaartBasis,
            {
              backgroundColor: kleuren.kaart,
              borderColor: kleuren.kaartRand,
              maxHeight: maxSheetHeight,
            },
            isDialog
              ? [
                  stijlen.dialogKaart,
                  { maxWidth },
                  SHADOWS.forTheme(kleuren.isDark, 'lg'),
                ]
              : [
                  stijlen.sheetKaart,
                  { paddingBottom: Math.max(insets.bottom, 20) + 8 },
                  SHADOWS.forTheme(kleuren.isDark, 'lg'),
                ],
            style,
          ]}
        >
          {!isDialog ? (
            <View style={stijlen.handvatContainer}>
              <View style={[stijlen.handvat, { backgroundColor: kleuren.kaartRand }]} />
            </View>
          ) : null}

          {title || subtitle ? (
            <View style={stijlen.header}>
              <View style={stijlen.headerTekst}>
                {title ? (
                  <Text style={[stijlen.titel, { color: kleuren.tekst }]}>
                    {title}
                  </Text>
                ) : null}
                {subtitle ? (
                  <Text style={[stijlen.subtitel, { color: kleuren.tekstSecundair }]}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>

              <Pressable
                onPress={onClose}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Sluiten"
                style={({ pressed }) => [
                  stijlen.sluitKnop,
                  {
                    backgroundColor: kleuren.achtergrondSecundair,
                    borderColor: kleuren.kaartRand,
                    opacity: pressed ? 0.7 : 1,
                  },
                  Platform.OS === 'web' && ({ cursor: 'pointer' } as ViewStyle),
                ]}
              >
                <Ionicons name="close" size={18} color={kleuren.tekstSecundair} />
              </Pressable>
            </View>
          ) : null}

          {inhoud}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default BottomSheet;

const stijlen = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  overlaySheet: {
    justifyContent: 'flex-end',
  },
  overlayDialog: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  kaartBasis: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  sheetKaart: {
    width: '100%',
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    borderBottomWidth: 0,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  dialogKaart: {
    width: '100%',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
  },
  handvatContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  handvat: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginBottom: SPACING.base,
  },
  headerTekst: {
    flex: 1,
    minWidth: 0,
  },
  titel: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
  },
  subtitel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
    marginTop: 3,
  },
  sluitKnop: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
