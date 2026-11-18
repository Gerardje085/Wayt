// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Templates Modal (Ontdekken)
// Toont de ingebouwde schema's en stelt de gebruiker in staat ze op te slaan.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, Pressable,
  FlatList, Alert, Platform, type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useThema } from '../context/ThemeContext';
import { WORKOUT_TEMPLATES } from '../data/templates';
import { saveRoutine } from '../lib/routineStore';
import type { Template } from '../types';
import { findExercise } from '../data/exercises';
import { RADIUS, SHADOWS, useResponsive } from '../theme/designTokens';

const WEB_POINTER = Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : undefined;

interface TemplatesModalProps {
  zichtbaar: boolean;
  onSluiten: () => void;
  onOpgeslagen: () => void;
}

export default function TemplatesModal({ zichtbaar, onSluiten, onOpgeslagen }: TemplatesModalProps) {
  const { kleuren } = useThema();
  const { isDesktop, isTablet, height } = useResponsive();
  const isDialog = isDesktop || isTablet;

  useEffect(() => {
    if (!zichtbaar || Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSluiten();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zichtbaar, onSluiten]);

  const handleOpslaan = async (template: Template) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    await saveRoutine({
      id: `tmpl_${template.id}_${Date.now()}`,
      naam: template.naam,
      oefeningen: template.oefeningen.map(oe => ({
        id: oe.id,
        sets: Array.from({ length: oe.sets }).map(() => ({
          id: Math.random().toString(36).substring(2, 10),
          reps: oe.reps,
          gewicht: oe.gewicht,
        })),
      })),
    });

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`Opgeslagen\n\n"${template.naam}" is toegevoegd aan Mijn Routines.`);
    } else {
      Alert.alert('Opgeslagen', `"${template.naam}" is toegevoegd aan Mijn Routines.`);
    }
    onOpgeslagen();
    onSluiten();
  };

  return (
    <Modal
      visible={zichtbaar}
      animationType={Platform.OS === 'web' || isDialog ? 'fade' : 'slide'}
      transparent
      onRequestClose={onSluiten}
      statusBarTranslucent
    >
      <View style={[stijlen.overlay, isDialog ? stijlen.overlayDialog : stijlen.overlaySheet]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onSluiten} />

        <View
          style={[
            stijlen.container,
            {
              backgroundColor: kleuren.achtergrond,
              borderColor: kleuren.kaartRand,
              height: isDialog ? Math.min(height * 0.86, 760) : '92%',
            },
            isDialog ? stijlen.dialogContainer : stijlen.sheetContainer,
            SHADOWS.forTheme(kleuren.isDark, 'lg'),
          ]}
        >
          {!isDialog && (
            <View style={stijlen.handvatWrap}>
              <View style={[stijlen.handvat, { backgroundColor: kleuren.kaartRand }]} />
            </View>
          )}

          <View style={[stijlen.header, { borderBottomColor: kleuren.kaartRand }]}>
            <View>
              <Text style={[stijlen.headerTitel, { color: kleuren.tekst }]}>Ontdek Schema's</Text>
              <Text style={[stijlen.headerSub, { color: kleuren.tekstSecundair }]}>
                Kies een kant-en-klaar trainingsschema om toe te voegen
              </Text>
            </View>
            <TouchableOpacity
              onPress={onSluiten}
              style={[
                stijlen.sluitKnop,
                { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand },
                WEB_POINTER,
              ]}
              accessibilityLabel="Sluiten"
            >
              <Ionicons name="close" size={18} color={kleuren.tekstSecundair} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={WORKOUT_TEMPLATES}
            keyExtractor={(item) => item.id}
            contentContainerStyle={stijlen.lijst}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={[stijlen.kaartContainer, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
                <LinearGradient
                  colors={item.kleur}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={stijlen.kaartBanner}
                >
                  <View style={stijlen.bannerIcoonBadge}>
                    <Ionicons name={item.icoon as any} size={26} color="#FFFFFF" />
                  </View>
                  <Text style={stijlen.kaartTitel}>{item.naam}</Text>
                  <Text style={stijlen.kaartBeschrijving}>{item.beschrijving}</Text>
                </LinearGradient>

                <View style={stijlen.kaartInhoud}>
                  {item.oefeningen.map((oe, i) => {
                    const info = findExercise(oe.id);
                    return (
                      <View
                        key={i}
                        style={[
                          stijlen.oefeningRij,
                          { borderBottomColor: kleuren.kaartRand },
                          i === item.oefeningen.length - 1 && { borderBottomWidth: 0 },
                        ]}
                      >
                        <View style={[stijlen.nummerBadge, { backgroundColor: kleuren.accentGedimpt }]}>
                          <Text style={[stijlen.nummerTekst, { color: kleuren.accentLicht }]}>{i + 1}</Text>
                        </View>
                        <Text style={[stijlen.oefeningNaam, { color: kleuren.tekst }]} numberOfLines={1}>
                          {info?.naam ?? oe.id}
                        </Text>
                        <Text style={[stijlen.oefeningDetail, { color: kleuren.tekstSecundair }]}>
                          {oe.sets}×{oe.reps}
                          {info?.type === 'gewicht' ? ` @ ${oe.gewicht} kg` : ''}
                        </Text>
                      </View>
                    );
                  })}

                  <TouchableOpacity
                    style={[
                      stijlen.opslaanKnop,
                      { borderColor: kleuren.accent, backgroundColor: kleuren.accentGedimpt },
                      WEB_POINTER,
                    ]}
                    onPress={() => handleOpslaan(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="download-outline" size={17} color={kleuren.accentLicht} />
                    <Text style={[stijlen.opslaanTekst, { color: kleuren.accentLicht }]}>
                      Opslaan in Mijn Routines
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const stijlen = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.58)',
  },
  overlaySheet: {
    justifyContent: 'flex-end',
  },
  overlayDialog: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    borderWidth: 1,
    overflow: 'hidden',
  },
  sheetContainer: {
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    borderBottomWidth: 0,
  },
  dialogContainer: {
    maxWidth: 620,
    borderRadius: RADIUS.xl,
  },
  handvatWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 2,
  },
  handvat: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTitel: { fontSize: 18, fontFamily: 'Inter_700Bold', letterSpacing: -0.2 },
  headerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  sluitKnop: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lijst: { padding: 16, paddingBottom: 32 },
  kaartContainer: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: 16,
  },
  kaartBanner: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerIcoonBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  kaartTitel: {
    fontSize: 20,
    fontFamily: 'Inter_900Black',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  kaartBeschrijving: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
  },
  kaartInhoud: { padding: 16 },
  oefeningRij: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  nummerBadge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  nummerTekst: { fontSize: 11, fontFamily: 'Inter_700Bold', fontVariant: ['tabular-nums'] },
  oefeningNaam: { flex: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  oefeningDetail: { fontSize: 12, fontFamily: 'Inter_600SemiBold', fontVariant: ['tabular-nums'] },
  opslaanKnop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: 14,
  },
  opslaanTekst: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
});
