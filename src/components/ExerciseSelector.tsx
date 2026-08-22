// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Exercise Selector Modal
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  FlatList, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThema } from '../context/ThemeContext';
import { OEFENINGEN_DB, Spiergroep } from '../data/exercises';

interface ExerciseSelectorProps {
  zichtbaar: boolean;
  huidigeSelectie: string;
  onSelecteer: (id: string) => void;
  onSluiten: () => void;
}

// GROEP_ICONEN is vervangen door specifieke iconen per oefening in exercises.ts

export default function ExerciseSelector({ zichtbaar, huidigeSelectie, onSelecteer, onSluiten }: ExerciseSelectorProps) {
  const { kleuren } = useThema();
  const [zoekterm, setZoekterm] = useState('');

  const gefilterdeOefeningen = useMemo(() => {
    if (!zoekterm.trim()) return OEFENINGEN_DB;
    const lower = zoekterm.toLowerCase();
    return OEFENINGEN_DB.filter(o => o.naam.toLowerCase().includes(lower) || o.groep.toLowerCase().includes(lower));
  }, [zoekterm]);

  const actieveOefeningNaam = useMemo(() => OEFENINGEN_DB.find(o => o.id === huidigeSelectie)?.naam ?? 'Kies een oefening', [huidigeSelectie]);

  function handleSelect(id: string) {
    onSelecteer(id);
    onSluiten();
    setZoekterm(''); // Reset search on close
  }

  return (
    <Modal visible={zichtbaar} animationType="slide" transparent={true} onRequestClose={onSluiten}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={stijlen.overlay}>
        <View style={[stijlen.modalContainer, { backgroundColor: kleuren.achtergrond }]}>
          {/* Header */}
          <View style={[stijlen.header, { borderBottomColor: kleuren.kaartRand }]}>
            <Text style={[stijlen.headerTitel, { color: kleuren.tekstSecundair }]}>Kies een Oefening</Text>
            <TouchableOpacity onPress={onSluiten} style={stijlen.sluitKnop}>
              <Ionicons name="close" size={24} color={kleuren.tekstGedimpt} />
            </TouchableOpacity>
          </View>

          {/* Zoekbalk */}
          <View style={[stijlen.zoekContainer, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
            <Ionicons name="search" size={20} color={kleuren.tekstGedimpt} style={stijlen.zoekIcoon} />
            <TextInput
              style={[stijlen.zoekInput, { color: kleuren.tekst }]}
              placeholder="Zoek op naam of spiergroep..."
              placeholderTextColor={kleuren.tekstGedimpt}
              value={zoekterm}
              onChangeText={setZoekterm}
              autoCorrect={false}
            />
            {zoekterm.length > 0 && (
              <TouchableOpacity onPress={() => setZoekterm('')}>
                <Ionicons name="close-circle" size={18} color={kleuren.tekstGedimpt} />
              </TouchableOpacity>
            )}
          </View>

          {/* Lijst */}
          <FlatList
            data={gefilterdeOefeningen}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={stijlen.lijstInhoud}
            initialNumToRender={20}
            renderItem={({ item }) => {
              const isActief = item.id === huidigeSelectie;
              return (
                <TouchableOpacity
                  style={[
                    stijlen.oefeningRij,
                    { borderBottomColor: kleuren.kaartRand },
                    isActief && { backgroundColor: kleuren.accentGedimpt },
                  ]}
                  onPress={() => handleSelect(item.id)}
                >
                  <View style={[stijlen.icoonContainer, { backgroundColor: kleuren.kaartRand }]}>
                    <Ionicons name={item.icoon as any} size={18} color={isActief ? kleuren.accent : kleuren.tekstGedimpt} />
                  </View>
                  <View style={stijlen.tekstContainer}>
                    <Text style={[stijlen.oefeningNaam, { color: isActief ? kleuren.accent : kleuren.tekst }]}>{item.naam}</Text>
                    <Text style={[stijlen.oefeningGroep, { color: kleuren.tekstGedimpt }]}>{item.groep}</Text>
                  </View>
                  {isActief && <Ionicons name="checkmark" size={20} color={kleuren.accent} />}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={stijlen.leegContainer}>
                <Ionicons name="search-outline" size={40} color={kleuren.tekstGedimpt} />
                <Text style={[stijlen.leegTekst, { color: kleuren.tekstGedimpt }]}>Geen oefeningen gevonden voor "{zoekterm}"</Text>
              </View>
            }
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const stijlen = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitel: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  sluitKnop: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  zoekContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    height: 44,
  },
  zoekIcoon: {
    marginRight: 8,
  },
  zoekInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    height: '100%',
  },
  lijstInhoud: {
    paddingBottom: 40,
  },
  oefeningRij: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  icoonContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tekstContainer: {
    flex: 1,
  },
  oefeningNaam: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  oefeningGroep: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  leegContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  leegTekst: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
});
