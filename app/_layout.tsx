// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Root Layout (TypeScript + ThemaProvider + LiveWorkoutProvider)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  type ViewStyle,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ThemaProvider, useThema } from '../src/context/ThemeContext';
import { LiveWorkoutProvider, useLiveWorkout, formatTijd } from '../src/context/LiveWorkoutContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import OnboardingModal from '../src/components/OnboardingModal';
import { NAV_METRICS, RADIUS, SHADOWS, SPACING, useResponsive } from '../src/theme/designTokens';

function NavBewaker() {
  const { user, laden, isAdmin } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (laden) return;
    const inAuthGroep = segments[0] === '(auth)';
    const isOpAdmin = segments[0] === 'admin';

    if (!user) {
      if (!inAuthGroep) router.replace('/(auth)');
      return;
    }

    if (isAdmin) {
      if (!isOpAdmin) router.replace('/admin');
    } else {
      if (inAuthGroep) router.replace('/(tabs)/workout');
      else if (isOpAdmin) router.replace('/(tabs)/dashboard');
    }
  }, [user, isAdmin, laden, segments, router]);

  return null;
}

// ─── Zwevende Workout Mini-Player Pil ─────────────────────────────────────────

const webPointer: ViewStyle | undefined =
  Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : undefined;

function ZwevendeWorkoutPil() {
  const { kleuren } = useThema();
  const { isAdmin } = useAuth();
  const {
    isActief,
    rustTimerLoopt,
    rustTimerResterend,
    verlopenTijd,
  } = useLiveWorkout();
  const { isDesktopNav } = useResponsive();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const segments = useSegments();

  const isOpWorkoutSessie =
    segments[0] === 'workout-session' || segments.includes('workout-session');
  const inAuth = segments[0] === '(auth)';
  const isOpAdmin = segments[0] === 'admin';
  const inTabs = segments[0] === '(tabs)';

  if (isAdmin || isOpAdmin || !isActief || isOpWorkoutSessie || inAuth) return null;

  // Op mobiel zweeft de pil netjes boven de zwevende tab bar (of onderaan op sub-schermen)
  const mobieleBottom = inTabs
    ? Math.max(insets.bottom, NAV_METRICS.mobileTabBarMarginBottom) +
      NAV_METRICS.mobileTabBarHeight +
      10
    : Math.max(insets.bottom, 16);

  const Wrapper = Platform.OS === 'web' ? View : Animated.View;
  const wrapperAnimProps =
    Platform.OS === 'web'
      ? {}
      : {
          entering: FadeIn.duration(200),
          exiting: FadeOut.duration(150),
        };

  return (
    <View
      pointerEvents="box-none"
      style={[
        stijlen.miniPlayerAnker,
        isDesktopNav
          ? stijlen.miniPlayerDesktopAnker
          : [stijlen.miniPlayerMobielAnker, { bottom: mobieleBottom }],
      ]}
    >
      <Wrapper
        {...wrapperAnimProps}
        style={[
          stijlen.miniPlayerKaart,
          isDesktopNav ? stijlen.miniPlayerDesktopKaart : stijlen.miniPlayerMobielKaart,
          {
            backgroundColor: kleuren.kaart,
            borderColor: kleuren.kaartRand,
          },
          SHADOWS.forTheme(kleuren.isDark, 'lg'),
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            stijlen.miniPlayerInhoud,
            pressed && { opacity: 0.9 },
            webPointer,
          ]}
          onPress={() => router.navigate('/workout-session')}
          accessibilityRole="button"
          accessibilityLabel="Actieve training hervatten"
        >
          <View style={stijlen.miniPlayerLinks}>
            <View style={[stijlen.actiefPunt, { backgroundColor: kleuren.succes }]} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={[stijlen.miniPlayerTekst, { color: kleuren.tekst }]}
                numberOfLines={1}
              >
                Training bezig • {formatTijd(verlopenTijd)}
              </Text>
              {rustTimerLoopt ? (
                <Text
                  style={[stijlen.miniPlayerRustTekst, { color: kleuren.accentLicht }]}
                  numberOfLines={1}
                >
                  Rust: {formatTijd(rustTimerResterend)}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={[stijlen.hervattenKnop, { backgroundColor: kleuren.accent }]}>
            <Ionicons name="play" size={12} color="#FFFFFF" />
            <Text style={stijlen.hervattenTekst}>Hervatten</Text>
          </View>
        </Pressable>
      </Wrapper>
    </View>
  );
}

const WEB_POLISH_STYLE_ID = 'wayt-web-polish';

const WEB_POLISH_CSS = `
html, body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  overscroll-behavior: none;
}

* {
  box-sizing: border-box;
  scrollbar-width: thin;
  scrollbar-color: rgba(113, 113, 122, 0.45) transparent;
}

*::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

*::-webkit-scrollbar-track {
  background: transparent;
}

*::-webkit-scrollbar-thumb {
  background-color: rgba(113, 113, 122, 0.42);
  border-radius: 9999px;
}

*::-webkit-scrollbar-thumb:hover {
  background-color: rgba(161, 161, 170, 0.65);
}

input, textarea, select {
  outline: none;
}

input:focus, textarea:focus, select:focus {
  outline: none;
}

button:focus:not(:focus-visible),
[role="button"]:focus:not(:focus-visible),
[role="tab"]:focus:not(:focus-visible),
a:focus:not(:focus-visible) {
  outline: none;
}

button:focus-visible,
[role="button"]:focus-visible,
[role="tab"]:focus-visible,
a:focus-visible {
  outline: 2px solid rgba(59, 130, 246, 0.7);
  outline-offset: 2px;
}
`;

function AppInhoud() {
  const { kleuren } = useThema();

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    let styleEl = document.getElementById(WEB_POLISH_STYLE_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = WEB_POLISH_STYLE_ID;
      styleEl.textContent = WEB_POLISH_CSS;
      document.head.appendChild(styleEl);
    }

    const colorScheme = kleuren.isDark ? 'dark' : 'light';
    document.documentElement.style.backgroundColor = kleuren.achtergrond;
    document.documentElement.style.colorScheme = colorScheme;
    if (document.body) {
      document.body.style.backgroundColor = kleuren.achtergrond;
      document.body.style.colorScheme = colorScheme;
    }

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', kleuren.achtergrond);
    }
  }, [kleuren.achtergrond, kleuren.isDark]);

  return (
    <>
      <StatusBar style={kleuren.isDark ? 'light' : 'dark'} />
      <NavBewaker />
      <Stack screenOptions={{ headerShown: false }} />
      <ZwevendeWorkoutPil />
      <OnboardingModal />
    </>
  );
}

export default function RootLayout() {
  const [fontsLaden] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
  });

  if (!fontsLaden) {
    return (
      <View style={stijlen.laden}>
        <ActivityIndicator color="#2563EB" size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemaProvider>
          <AuthProvider>
            <LiveWorkoutProvider>
              <AppInhoud />
            </LiveWorkoutProvider>
          </AuthProvider>
        </ThemaProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const stijlen = StyleSheet.create({
  laden: {
    flex: 1,
    backgroundColor: '#09090B',
    alignItems: 'center',
    justifyContent: 'center',
  },

  miniPlayerAnker: {
    position: 'absolute',
    zIndex: 9999,
  },
  miniPlayerMobielAnker: {
    left: SPACING.base,
    right: SPACING.base,
    alignItems: 'center',
  },
  miniPlayerDesktopAnker: {
    right: SPACING.xl,
    bottom: SPACING.xl,
    alignItems: 'flex-end',
  },
  miniPlayerKaart: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  miniPlayerMobielKaart: {
    width: '100%',
    maxWidth: 440,
  },
  miniPlayerDesktopKaart: {
    width: 320,
  },
  miniPlayerInhoud: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 12,
  },
  miniPlayerLinks: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actiefPunt: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  miniPlayerTekst: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    fontVariant: ['tabular-nums'],
  },
  miniPlayerRustTekst: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
    marginTop: 1,
  },
  hervattenKnop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    flexShrink: 0,
  },
  hervattenTekst: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
});
