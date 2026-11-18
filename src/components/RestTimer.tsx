import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Modal,
  Platform,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Svg, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useThema } from '../context/ThemeContext';
import { RADIUS, SHADOWS } from '../theme/designTokens';

const WEB_POINTER = Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : undefined;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowList: true,
    }),
  });
}

const RING_RADIUS = 56;
const RING_OMTREK = 2 * Math.PI * RING_RADIUS;

const DUUR_OPTIES: Array<{ label: string; seconden: number }> = [
  { label: '60s', seconden: 60 },
  { label: '90s', seconden: 90 },
  { label: '2min', seconden: 120 },
  { label: '3min', seconden: 180 },
];

interface RustTimerProps {
  zichtbaar: boolean;
  onSluiten: () => void;
}

export default function RustTimer({ zichtbaar, onSluiten }: RustTimerProps) {
  const { kleuren } = useThema();
  const [startTijd, setStartTijd] = useState(90);
  const [restTijd, setRestTijd] = useState(90);
  const [loopt, setLoopt] = useState(false);
  const [afgelopen, setAfgelopen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifIdRef = useRef<string | null>(null);
  const restTijdRef = useRef(90);
  const startTijdRef = useRef(90);

  const voortgang = useSharedValue(0);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_OMTREK * voortgang.value,
  }));

  useEffect(() => {
    restTijdRef.current = restTijd;
    const verloop = Math.max(0, Math.min(1, (startTijdRef.current - restTijd) / Math.max(1, startTijdRef.current)));
    voortgang.value = withTiming(verloop, { duration: 400, easing: Easing.out(Easing.quad) });
  }, [restTijd]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      Notifications.requestPermissionsAsync();
    }
  }, []);

  useEffect(() => {
    if (zichtbaar) {
      resetTimer(startTijd);
      setLoopt(true);
    }
  }, [zichtbaar]);

  useEffect(() => {
    if (!zichtbaar || Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleSluiten();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zichtbaar]);

  useEffect(() => {
    if (loopt && restTijd > 0) {
      intervalRef.current = setInterval(() => {
        setRestTijd((v) => {
          const nieuw = v - 1;
          if (nieuw <= 0) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setLoopt(false);
            setAfgelopen(true);
            handleAfgelopen();
          }
          return nieuw;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loopt]);

  const pasTijdAan = useCallback((delta: number) => {
    setRestTijd((prev) => Math.max(0, prev + delta));
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleAfgelopen = useCallback(async () => {
    if (Platform.OS === 'web') return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (notifIdRef.current) {
      await Notifications.cancelScheduledNotificationAsync(notifIdRef.current);
      notifIdRef.current = null;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Rust voorbij!',
        body: 'Klaar om de volgende set te doen? Pak die gewichten!',
        sound: true,
      },
      trigger: null,
    });
  }, []);

  const planNotificatie = useCallback(async (secondenOver: number) => {
    if (Platform.OS === 'web') return;
    if (notifIdRef.current) {
      await Notifications.cancelScheduledNotificationAsync(notifIdRef.current);
    }
    if (secondenOver <= 0) return;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Rust voorbij!',
        body: 'Jouw rusttijd is om. Tijd voor de volgende set!',
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: secondenOver },
    });
    notifIdRef.current = id;
  }, []);

  function resetTimer(nieuweDuur?: number) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const d = nieuweDuur ?? startTijdRef.current;
    startTijdRef.current = d;
    restTijdRef.current = d;
    setRestTijd(d);
    setLoopt(false);
    setAfgelopen(false);
    if (Platform.OS !== 'web' && notifIdRef.current) {
      Notifications.cancelScheduledNotificationAsync(notifIdRef.current);
      notifIdRef.current = null;
    }
  }

  function togglePauze() {
    if (loopt) {
      setLoopt(false);
      planNotificatie(restTijdRef.current);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } else {
      setLoopt(true);
      if (Platform.OS !== 'web' && notifIdRef.current) {
        Notifications.cancelScheduledNotificationAsync(notifIdRef.current);
        notifIdRef.current = null;
      }
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }

  function handleSluiten() {
    resetTimer();
    if (Platform.OS !== 'web' && notifIdRef.current) {
      Notifications.cancelScheduledNotificationAsync(notifIdRef.current);
    }
    onSluiten();
  }

  const minuten = Math.floor(Math.max(0, restTijd) / 60).toString().padStart(2, '0');
  const seconden = (Math.max(0, restTijd) % 60).toString().padStart(2, '0');
  const ringKleur = afgelopen ? kleuren.succes : loopt ? kleuren.accent : kleuren.tekstGedimpt;

  return (
    <Modal
      visible={zichtbaar}
      transparent
      animationType="fade"
      onRequestClose={handleSluiten}
      statusBarTranslucent
    >
      <View style={stijlen.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleSluiten} />

        <View
          style={[
            stijlen.modal,
            { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand },
            SHADOWS.forTheme(kleuren.isDark, 'lg'),
          ]}
        >
          <Text style={[stijlen.titel, { color: kleuren.tekst }]}>
            {afgelopen ? 'Rust voorbij!' : 'Rusttimer'}
          </Text>

          <View style={stijlen.duurRij}>
            {DUUR_OPTIES.map((opt) => {
              const actief = startTijd === opt.seconden;
              return (
                <TouchableOpacity
                  key={opt.seconden}
                  style={[
                    stijlen.duurKnop,
                    {
                      backgroundColor: actief ? kleuren.accentGedimpt : kleuren.achtergrondSecundair,
                      borderColor: actief ? kleuren.accent : kleuren.kaartRand,
                    },
                    WEB_POINTER,
                  ]}
                  onPress={() => {
                    setStartTijd(opt.seconden);
                    startTijdRef.current = opt.seconden;
                    resetTimer(opt.seconden);
                  }}
                  accessibilityLabel={`Rusttijd ${opt.label}`}
                >
                  <Text style={[stijlen.duurTekst, { color: actief ? kleuren.accentLicht : kleuren.tekstSecundair }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={stijlen.ringContainer}>
            <Svg width={144} height={144} viewBox="0 0 144 144">
              <Circle
                cx={72}
                cy={72}
                r={RING_RADIUS}
                stroke={kleuren.kaartRand}
                strokeWidth={10}
                fill="none"
              />
              <AnimatedCircle
                cx={72}
                cy={72}
                r={RING_RADIUS}
                stroke={ringKleur}
                strokeWidth={10}
                fill="none"
                strokeDasharray={RING_OMTREK}
                animatedProps={animatedProps}
                strokeLinecap="round"
                transform="rotate(-90 72 72)"
              />
            </Svg>
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <View style={stijlen.tijdCentreer}>
                <Text style={[stijlen.tijdTekst, { color: afgelopen ? kleuren.succes : kleuren.tekst }]}>
                  {afgelopen ? '00:00' : `${minuten}:${seconden}`}
                </Text>
                <Text style={[stijlen.tijdLabel, { color: kleuren.tekstGedimpt }]}>
                  {afgelopen ? 'Klaar!' : loopt ? 'Bezig...' : 'Gepauzeerd'}
                </Text>
              </View>
            </View>
          </View>

          <View style={stijlen.actieRij}>
            <TouchableOpacity
              style={[
                stijlen.iconKnop,
                { backgroundColor: kleuren.achtergrondSecundair, borderColor: kleuren.kaartRand },
                WEB_POINTER,
              ]}
              onPress={() => pasTijdAan(-15)}
              disabled={afgelopen}
            >
              <Text style={[stijlen.iconTekst, { color: kleuren.tekst }]}>-15s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                stijlen.actieKnop,
                {
                  backgroundColor: !loopt ? kleuren.achtergrondSecundair : kleuren.accent,
                  borderColor: !loopt ? kleuren.kaartRand : kleuren.accent,
                },
                WEB_POINTER,
              ]}
              onPress={togglePauze}
            >
              <Ionicons
                name={!loopt ? 'play' : 'pause'}
                size={15}
                color={!loopt ? kleuren.tekst : '#FFFFFF'}
              />
              <Text style={[stijlen.actieTekst, { color: !loopt ? kleuren.tekst : '#FFFFFF' }]}>
                {!loopt ? 'Hervatten' : 'Pauzeren'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                stijlen.iconKnop,
                { backgroundColor: kleuren.achtergrondSecundair, borderColor: kleuren.kaartRand },
                WEB_POINTER,
              ]}
              onPress={() => pasTijdAan(15)}
              disabled={afgelopen}
            >
              <Text style={[stijlen.iconTekst, { color: kleuren.tekst }]}>+15s</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleSluiten} style={[stijlen.sluitenKnop, WEB_POINTER]} accessibilityLabel="Timer sluiten">
            <Text style={[stijlen.sluitenTekst, { color: kleuren.tekstSecundair }]}>Sluiten</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const stijlen = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 360,
    borderRadius: RADIUS.xl,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  titel: {
    fontSize: 19,
    fontFamily: 'Inter_900Black',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  duurRij: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  duurKnop: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  duurTekst: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
  },
  ringContainer: {
    width: 144,
    height: 144,
    marginBottom: 24,
    position: 'relative',
  },
  tijdCentreer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tijdTekst: {
    fontSize: 32,
    fontFamily: 'Inter_900Black',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  tijdLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 2,
  },
  actieRij: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
    width: '100%',
    alignItems: 'center',
  },
  iconKnop: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  iconTekst: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  actieKnop: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actieTekst: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  sluitenKnop: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  sluitenTekst: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
});
