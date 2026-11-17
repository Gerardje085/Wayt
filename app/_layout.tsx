// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Root Layout (TypeScript + ThemaProvider + LiveWorkoutProvider)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform
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
import { AuthProvider, useAuth }        from '../src/context/AuthContext';
import { ThemaProvider, useThema }      from '../src/context/ThemeContext';
import { LiveWorkoutProvider, useLiveWorkout, formatTijd } from '../src/context/LiveWorkoutContext';
import { GestureHandlerRootView }       from 'react-native-gesture-handler';
import { SafeAreaProvider }           from 'react-native-safe-area-context';
import { Ionicons }                     from '@expo/vector-icons';
import { useRouter as useRouterHook }   from 'expo-router';
import OnboardingModal                  from '../src/components/OnboardingModal';

function NavBewaker() {
  const { user, laden, isAdmin } = useAuth();
  const segments = useSegments();
  const router   = useRouter();

  useEffect(() => {
    if (laden) return;
    const inAuthGroep = segments[0] === '(auth)';
    const isOpAdmin   = segments[0] === 'admin';

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

// ─── Hevy-stijl Mini-Player Balk ──────────────────────────────────────────────

function ZwevendeWorkoutPil() {
  const { kleuren } = useThema();
  const { isAdmin } = useAuth();
  const {
    isActief, rustTimerLoopt, rustTimerResterend,
    verlopenTijd,
  } = useLiveWorkout();
  const router = useRouterHook();
  const segments = useSegments();
  const isOpWorkoutSessie = segments[0] === 'workout-session' || segments.includes('workout-session');
  const inAuth = segments[0] === '(auth)';
  const isOpAdmin = segments[0] === 'admin';

  if (isAdmin || isOpAdmin || !isActief || isOpWorkoutSessie || inAuth) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={[
        stijlen.miniPlayerContainer,
        {
          backgroundColor: kleuren.achtergrondSecundair,
          borderTopColor: kleuren.kaartRand,
        },
      ]}
    >
      <TouchableOpacity
        style={stijlen.miniPlayerInhoud}
        onPress={() => router.navigate('/workout-session')}
        activeOpacity={0.85}
      >
        <View style={stijlen.miniPlayerLinks}>
          <View style={[stijlen.actiefPunt, { backgroundColor: kleuren.succes }]} />
          <View style={{ flex: 1 }}>
            <Text style={[stijlen.miniPlayerTekst, { color: kleuren.tekst }]} numberOfLines={1}>
              Training bezig • {formatTijd(verlopenTijd)}
            </Text>
            {rustTimerLoopt && (
              <Text style={[stijlen.miniPlayerRustTekst, { color: kleuren.accentLicht }]} numberOfLines={1}>
                Rust: {formatTijd(rustTimerResterend)}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[stijlen.hervattenKnop, { backgroundColor: kleuren.accent }]}
          onPress={() => router.navigate('/workout-session')}
          activeOpacity={0.85}
        >
          <Ionicons name="play" size={13} color="#FFFFFF" />
          <Text style={stijlen.hervattenTekst}>Hervatten</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

function AppInhoud() {
  const { kleuren } = useThema();
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
  laden: { flex: 1, backgroundColor: '#0F1014', alignItems: 'center', justifyContent: 'center' },

  // Hevy Mini-Player Balk direct boven de onderste Tab Bar
  miniPlayerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 82 : 62,
    borderTopWidth: 1,
    zIndex: 9999,
    elevation: 10,
  },
  miniPlayerInhoud: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  miniPlayerLinks: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actiefPunt: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  miniPlayerTekst: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  miniPlayerRustTekst: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 1,
  },
  hervattenKnop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  hervattenTekst: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
});
