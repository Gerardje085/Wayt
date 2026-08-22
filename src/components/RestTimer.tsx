// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Rust-Timer Component
// Circulaire afteltimer die automatisch start na het opslaan van een workout.
// Stuurt een lokale notificatie als de app op de achtergrond staat.
// Geeft haptic feedback als de rust voorbij is.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Svg, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useThema } from '../context/ThemeContext';

// Laat toe dat Animated met SVG-props werkt
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Notificatie-handler instellen (toon ook als app op voorgrond staat)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound:  false,
    shouldSetBadge:   false,
    shouldShowList:   true,
  }),
});

const RING_RADIUS  = 54;
const RING_OMTREK  = 2 * Math.PI * RING_RADIUS;

const DUUR_OPTIES: Array<{ label: string; seconden: number }> = [
  { label: '60s',  seconden: 60  },
  { label: '90s',  seconden: 90  },
  { label: '2min', seconden: 120 },
  { label: '3min', seconden: 180 },
];

interface RustTimerProps {
  zichtbaar:  boolean;
  onSluiten:  () => void;
}

export default function RustTimer({ zichtbaar, onSluiten }: RustTimerProps) {
  const { kleuren }                = useThema();
  const [startTijd,  setStartTijd] = useState(90);
  const [restTijd,   setRestTijd]  = useState(90);
  const [loopt,      setLoopt]     = useState(false);
  const [afgelopen,  setAfgelopen] = useState(false);
  const intervalRef                = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifIdRef                 = useRef<string | null>(null);
  // Ref om restTijd bij te houden zonder re-render te triggeren (voorkomt Reanimated strict mode warning)
  const restTijdRef                = useRef(90);
  const startTijdRef               = useRef(90);

  // Geanimeerde voortgangsring – 0 = volledig gevuld (begin), 1 = leeg (klaar)
  const voortgang  = useSharedValue(0);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_OMTREK * voortgang.value,
  }));

  // ── Animeer ring op basis van restTijd state (buiten render, in effect) ──
  useEffect(() => {
    restTijdRef.current = restTijd;
    const verloop = Math.max(0, Math.min(1, (startTijdRef.current - restTijd) / startTijdRef.current));
    voortgang.value = withTiming(verloop, { duration: 400, easing: Easing.out(Easing.quad) });
  }, [restTijd]);

  // Vraag notificatie-toestemming bij eerste render
  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  // Reset bij openen
  useEffect(() => {
    if (zichtbaar) {
      resetTimer(startTijd);
      setLoopt(true); // automatisch starten
    }
  }, [zichtbaar]);

  // Interval-beheer
  useEffect(() => {
    if (loopt && restTijd > 0) {
      intervalRef.current = setInterval(() => {
        setRestTijd((v) => {
          const nieuw = v - 1;
          if (nieuw <= 0) {
            clearInterval(intervalRef.current!);
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

  // ── +15s / -15s aanpassing: gebruik dezelfde formule als de interval ──────
  const pasTijdAan = useCallback((delta: number) => {
    setRestTijd((prev) => {
      const nieuw = Math.max(0, prev + delta);
      return nieuw;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleAfgelopen = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (notifIdRef.current) {
      await Notifications.cancelScheduledNotificationAsync(notifIdRef.current);
      notifIdRef.current = null;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Rust voorbij!',
        body:  'Klaar om de volgende set te doen? Pak die gewichten!',
        sound: true,
      },
      trigger: null,
    });
  }, []);

  const planNotificatie = useCallback(async (secondenOver: number) => {
    if (notifIdRef.current) {
      await Notifications.cancelScheduledNotificationAsync(notifIdRef.current);
    }
    if (secondenOver <= 0) return;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Rust voorbij!',
        body:  'Jouw rusttijd is om. Tijd voor de volgende set!',
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
    restTijdRef.current  = d;
    setRestTijd(d);
    setLoopt(false);
    setAfgelopen(false);
    if (notifIdRef.current) {
      Notifications.cancelScheduledNotificationAsync(notifIdRef.current);
      notifIdRef.current = null;
    }
  }

  function togglePauze() {
    if (loopt) {
      setLoopt(false);
      planNotificatie(restTijdRef.current);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      setLoopt(true);
      if (notifIdRef.current) {
        Notifications.cancelScheduledNotificationAsync(notifIdRef.current);
        notifIdRef.current = null;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  function handleSluiten() {
    resetTimer();
    if (notifIdRef.current) {
      Notifications.cancelScheduledNotificationAsync(notifIdRef.current);
    }
    onSluiten();
  }

  const minuten  = Math.floor(Math.max(0, restTijd) / 60).toString().padStart(2, '0');
  const seconden = (Math.max(0, restTijd) % 60).toString().padStart(2, '0');

  const ringKleur = afgelopen ? '#34D399' : loopt ? '#7C3AED' : '#9090C0';

  return (
    <Modal
      visible={zichtbaar}
      transparent
      animationType="fade"
      onRequestClose={handleSluiten}
    >
      <View style={stijlen.overlay}>
        <View style={[stijlen.modal, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
          {/* Titel */}
          <Text style={[stijlen.titel, { color: kleuren.tekstSecundair }]}>
            {afgelopen ? 'Rust Voorbij!' : 'Rust-Timer'}
          </Text>

          {/* Duur-knoppen */}
          <View style={stijlen.duurRij}>
            {DUUR_OPTIES.map((opt) => (
              <TouchableOpacity
                key={opt.seconden}
                style={[
                  stijlen.duurKnop,
                  {
                    backgroundColor: startTijd === opt.seconden ? kleuren.accentGedimpt : kleuren.achtergrond,
                    borderColor:     startTijd === opt.seconden ? kleuren.accent : kleuren.kaartRand,
                  },
                ]}
                onPress={() => {
                  setStartTijd(opt.seconden);
                  startTijdRef.current = opt.seconden;
                  resetTimer(opt.seconden);
                }}
                accessibilityLabel={`Rusttijd ${opt.label}`}
              >
                <Text style={[stijlen.duurTekst, { color: startTijd === opt.seconden ? kleuren.accent : kleuren.tekstGedimpt }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Circulaire ring */}
          <View style={stijlen.ringContainer}>
            <Svg width={140} height={140} viewBox="0 0 140 140">
              <Circle
                cx={70} cy={70} r={RING_RADIUS}
                stroke={kleuren.kaartRand}
                strokeWidth={10}
                fill="none"
              />
              <AnimatedCircle
                cx={70} cy={70} r={RING_RADIUS}
                stroke={ringKleur}
                strokeWidth={10}
                fill="none"
                strokeDasharray={RING_OMTREK}
                animatedProps={animatedProps}
                strokeLinecap="round"
                transform="rotate(-90 70 70)"
              />
            </Svg>
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <View style={stijlen.tijdCentreer}>
                <Text style={[stijlen.tijdTekst, { color: afgelopen ? '#34D399' : kleuren.tekst }]}>
                  {afgelopen ? '00:00' : `${minuten}:${seconden}`}
                </Text>
                <Text style={[stijlen.tijdLabel, { color: kleuren.tekstGedimpt }]}>
                  {afgelopen ? 'Klaar!' : loopt ? 'Bezig...' : 'Gepauzeerd'}
                </Text>
              </View>
            </View>
          </View>

          {/* Knoppen */}
          <View style={stijlen.actieRij}>
            <TouchableOpacity
              style={[stijlen.iconKnop, { backgroundColor: kleuren.achtergrond, borderColor: kleuren.kaartRand }]}
              onPress={() => pasTijdAan(-15)}
              disabled={afgelopen}
            >
              <Text style={[stijlen.iconTekst, { color: kleuren.tekstSecundair }]}>-15s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[stijlen.actieKnop, { backgroundColor: !loopt ? kleuren.achtergrondSecundair : kleuren.accent }]}
              onPress={togglePauze}
            >
              <Text style={[stijlen.actieTekst, { color: !loopt ? kleuren.tekst : '#FFFFFF' }]}>
                {!loopt ? '▶ Hervatten' : '⏸ Pauzeren'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[stijlen.iconKnop, { backgroundColor: kleuren.achtergrond, borderColor: kleuren.kaartRand }]}
              onPress={() => pasTijdAan(15)}
              disabled={afgelopen}
            >
              <Text style={[stijlen.iconTekst, { color: kleuren.tekstSecundair }]}>+15s</Text>
            </TouchableOpacity>
          </View>

          {/* Sluiten */}
          <TouchableOpacity onPress={handleSluiten} style={stijlen.sluitenKnop} accessibilityLabel="Timer sluiten">
            <Text style={[stijlen.sluitenTekst, { color: kleuren.tekstGedimpt }]}>Sluiten</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const stijlen = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  titel: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
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
    borderRadius: 20,
    borderWidth: 1,
  },
  duurTekst: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  ringContainer: {
    width: 140,
    height: 140,
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
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -1,
  },
  tijdLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  actieRij: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconKnop: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  iconTekst: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  actieKnop: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actieTekst: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  sluitenKnop: {
    padding: 8,
  },
  sluitenTekst: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
