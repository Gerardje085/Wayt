// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Templates Modal (Ontdekken)
// Toont de ingebouwde schema's en stelt de gebruiker in staat ze op te slaan.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  FlatList, SafeAreaView, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useThema } from '../context/ThemeContext';
import { WORKOUT_TEMPLATES } from '../data/templates';
import { saveRoutine } from '../lib/routineStore';
import type { Template } from '../types';
import { findExercise } from '../data/exercises';

interface TemplatesModalProps {
  zichtbaar: boolean;
  onSluiten: () => void;
  onOpgeslagen: () => void;
}

export default function TemplatesModal({ zichtbaar, onSluiten, onOpgeslagen }: TemplatesModalProps) {
  const { kleuren } = useThema();

  const handleOpslaan = async (template: Template) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    await saveRoutine({
      id: `tmpl_${template.id}_${Date.now()}`,
      naam: template.naam,
      oefeningen: template.oefeningen.map(oe => ({
        id: oe.id,
        sets: Array.from({ length: oe.sets }).map(() => ({
          id: Math.random().toString(36).substring(2, 10),
          reps: oe.reps,
          gewicht: oe.gewicht
        }))
      })),
    });

    Alert.alert('Opgeslagen', `"${template.naam}" is toegevoegd aan Mijn Routines.`);
    onOpgeslagen();
    onSluiten();
  };

  return (
    <Modal visible={zichtbaar} animationType="slide" presentationStyle="pageSheet" onRequestClose={onSluiten}>
      <SafeAreaView style={[stijlen.container, { backgroundColor: kleuren.achtergrond }]}>
        <View style={[stijlen.header, { borderBottomColor: kleuren.kaartRand }]}>
          <TouchableOpacity onPress={onSluiten} style={stijlen.headerKnop}>
            <Ionicons name="close" size={24} color={kleuren.tekstGedimpt} />
          </TouchableOpacity>
          <Text style={[stijlen.headerTitel, { color: kleuren.tekstSecundair }]}>Ontdek Schema's</Text>
          <View style={{ width: 24 }} />
        </View>

        <FlatList
          data={WORKOUT_TEMPLATES}
          keyExtractor={(item) => item.id}
          contentContainerStyle={stijlen.lijst}
          renderItem={({ item }) => (
            <View style={[stijlen.kaartContainer, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
              <LinearGradient
                colors={item.kleur}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={stijlen.kaartBanner}
              >
                <Ionicons name={item.icoon as any} size={32} color="#FFFFFF" style={{ marginBottom: 8 }} />
                <Text style={stijlen.kaartTitel}>{item.naam}</Text>
                <Text style={stijlen.kaartBeschrijving}>{item.beschrijving}</Text>
              </LinearGradient>

              <View style={stijlen.kaartInhoud}>
                {/* Oefeningen lijst */}
                {item.oefeningen.map((oe, i) => {
                  const info = findExercise(oe.id);
                  return (
                    <View key={i} style={[stijlen.oefeningRij, { borderBottomColor: kleuren.kaartRand }]}>
                      <View style={[stijlen.nummerBadge, { backgroundColor: kleuren.accentGedimpt }]}>
                        <Text style={[stijlen.nummerTekst, { color: kleuren.accentTekst }]}>{i + 1}</Text>
                      </View>
                      <Text style={[stijlen.oefeningNaam, { color: kleuren.tekst }]} numberOfLines={1}>
                        {info?.naam ?? oe.id}
                      </Text>
                      <Text style={[stijlen.oefeningDetail, { color: kleuren.tekstGedimpt }]}>
                        {oe.sets}×{oe.reps}
                        {info?.type === 'gewicht' ? ` @ ${oe.gewicht}kg` : ''}
                      </Text>
                    </View>
                  );
                })}

                <TouchableOpacity
                  style={[stijlen.opslaanKnop, { borderColor: kleuren.accent }]}
                  onPress={() => handleOpslaan(item)}
                >
                  <Ionicons name="download-outline" size={18} color={kleuren.accent} style={{ marginRight: 6 }} />
                  <Text style={{ color: kleuren.accentTekst, fontFamily: 'Inter_600SemiBold' }}>Opslaan in Mijn Routines</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

const stijlen = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1,
  },
  headerKnop: { padding: 4 },
  headerTitel: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  lijst: { padding: 16, paddingBottom: 40 },
  kaartContainer: {
    borderWidth: 1, borderRadius: 16, overflow: 'hidden', marginBottom: 20,
  },
  kaartBanner: {
    padding: 24, alignItems: 'center', justifyContent: 'center',
  },
  kaartTitel: {
    fontSize: 22, fontFamily: 'Inter_700Bold', color: '#FFFFFF', marginBottom: 4,
  },
  kaartBeschrijving: {
    fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.8)',
  },
  kaartInhoud: { padding: 16 },
  oefeningRij: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1,
  },
  nummerBadge: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  nummerTekst: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  oefeningNaam: { flex: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  oefeningDetail: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  opslaanKnop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed',
    marginTop: 14,
  },
});
