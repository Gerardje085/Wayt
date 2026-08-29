// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Root Layout (TypeScript + ThemaProvider + LiveWorkoutProvider)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator
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
import { Ionicons }                     from '@expo/vector-icons';
import { useRouter as useRouterHook }   from 'expo-router';
import OnboardingModal                  from '../src/components/OnboardingModal';

function NavBewaker() {
  const { user, laden } = useAuth();
  const segments        = useSegments();
  const router          = useRouter();

  useEffect(() => {
    if (laden) return;
    const inAuthGroep = segments[0] === '(auth)';
    if (!user && !inAuthGroep) router.replace('/(auth)');
    else if (user && inAuthGroep) router.replace('/(tabs)/workout');
  }, [user, laden, segments, router]);

  return null;
}

// ─── Zwevende Rust Timer Pil ──────────────────────────────────────────────────

function ZwevendeTimerPil() {
  const { kleuren } = useThema();
  const { rustTimerLoopt, rustTimerResterend, rustTimerDuur, stopRustTimer, isActief } = useLiveWorkout();
  const router = useRouterHook();
  const segments = useSegments();
  const isOpWorkoutSessie = segments[0] === 'workout-session' || segments.includes('workout-session');

  if (!rustTimerLoopt || !isActief || isOpWorkoutSessie) return null;

  const voortgang = rustTimerResterend / rustTimerDuur;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={[stijlen.timerPil, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}
    >
      <TouchableOpacity
        style={stijlen.timerPilInhoud}
        onPress={() => {
          if (!isOpWorkoutSessie) router.navigate('/workout-session');
        }}
        activeOpacity={0.8}
      >
        <View style={stijlen.timerVoortgangBalk}>
          <View style={[
            stijlen.timerVoortgangVulling,
            {
              backgroundColor: rustTimerResterend <= 10 ? kleuren.fout : kleuren.accent,
              width: `${voortgang * 100}%` as any,
            }
          ]} />
        </View>
        <Ionicons name="timer-outline" size={16} color={rustTimerResterend <= 10 ? kleuren.fout : kleuren.accent} />
        <Text style={[stijlen.timerPilTekst, { color: kleuren.tekst }]}>
          {formatTijd(rustTimerResterend)}
        </Text>
        <TouchableOpacity onPress={stopRustTimer} style={stijlen.timerPilSluiten}>
          <Ionicons name="close" size={16} color={kleuren.tekstGedimpt} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Zwevende Workout Indicatie (als workout actief maar timer niet loopt) ────

function WorkoutIndicator() {
  const { kleuren } = useThema();
  const { isActief, rustTimerLoopt, verlopenTijd, routineNaam } = useLiveWorkout();
  const router = useRouterHook();
  const segments = useSegments();
  const isOpWorkoutSessie = segments[0] === 'workout-session' || segments.includes('workout-session');

  if (!isActief || rustTimerLoopt || isOpWorkoutSessie) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={{ position: 'absolute', top: 52, alignSelf: 'center', zIndex: 9998 }}
    >
      <TouchableOpacity
        style={[stijlen.workoutIndicator, { backgroundColor: kleuren.accent + 'DD', borderColor: kleuren.accentLicht }]}
        onPress={() => {
          if (!isOpWorkoutSessie) router.navigate('/workout-session');
        }}
        activeOpacity={0.8}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="barbell-outline" size={14} color="#FFFFFF" />
          <Text style={stijlen.workoutIndicatorTekst}>
            {routineNaam || 'Workout'} · {formatTijd(verlopenTijd)}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function AppInhoud() {
  const { kleuren } = useThema();
  return (
    <>
      <StatusBar style={kleuren.isDark ? 'light' : 'dark'} backgroundColor={kleuren.achtergrond} />
      <NavBewaker />
      <Stack screenOptions={{ headerShown: false }} />
      <ZwevendeTimerPil />
      <WorkoutIndicator />
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
        <ActivityIndicator color="#7C3AED" size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemaProvider>
        <AuthProvider>
          <LiveWorkoutProvider>
            <AppInhoud />
          </LiveWorkoutProvider>
        </AuthProvider>
      </ThemaProvider>
    </GestureHandlerRootView>
  );
}

const stijlen = StyleSheet.create({
  laden: { flex: 1, backgroundColor: '#08080F', alignItems: 'center', justifyContent: 'center' },

  // Zwevende rust timer pil
  timerPil: {
    position: 'absolute',
    top: 52,
    alignSelf: 'center',
    borderRadius: 30,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 9999,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  timerVoortgangBalk: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  timerVoortgangVulling: {
    height: 3, borderRadius: 3,
  },
  timerPilInhoud: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, gap: 10,
  },
  timerPilTekst: { fontSize: 15, fontFamily: 'Inter_700Bold', flex: 1 },
  timerPilSluiten: { padding: 4 },

  // Workout indicatie banner
  workoutIndicator: {
    position: 'absolute',
    top: 52,
    alignSelf: 'center',
    borderRadius: 30,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 9,
    zIndex: 9998,
  },
  workoutIndicatorTekst: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
});
