// ─────────────────────────────────────────────────────────────────────────────
// Wayt – WorkoutForm (TypeScript + Haptic Feedback)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { berekenVolume } from '../utils/physics';
import { useThema } from '../context/ThemeContext';
import { OEFENINGEN_DB } from '../data/exercises';
import type { RoutineSet } from '../lib/routineStore';

export interface WorkoutSet extends RoutineSet {
  completed: boolean;
}

interface WorkoutFormProps {
  initialSets: RoutineSet[];
  oefening: string;
  onOpslaan: (completedSets: RoutineSet[]) => void;
  laden: boolean;
}

export default function WorkoutForm({
  initialSets, oefening, onOpslaan, laden,
}: WorkoutFormProps) {
  const { kleuren } = useThema();
  const [setsList, setSetsList] = useState<WorkoutSet[]>([]);
  const initOef = useRef<string | null>(null);

  useEffect(() => {
    if (initOef.current !== oefening || (setsList.length === 0 && initialSets.length > 0)) {
      setSetsList(initialSets.map(s => ({ ...s, completed: false })));
      initOef.current = oefening;
    }
  }, [initialSets, oefening]);

  const oefInfo = OEFENINGEN_DB.find(o => o.id === oefening);
  const isTijd = oefInfo?.type === 'tijd';
  const isGewicht = oefInfo?.type === 'gewicht';

  const totaalVolume = setsList
    .filter(s => s.completed)
    .reduce((acc, s) => acc + berekenVolume(1, s.reps, isGewicht ? s.gewicht : 0), 0);

  const toggleSet = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSets = [...setsList];
    newSets[index].completed = !newSets[index].completed;
    setSetsList(newSets);
  };

  const updateSet = (index: number, field: 'reps' | 'gewicht', value: string) => {
    const num = parseFloat(value.replace(',', '.'));
    if (isNaN(num)) return;
    
    const newSets = [...setsList];
    newSets[index][field] = Math.max(0, num);
    setSetsList(newSets);
  };

  const voegSetToe = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const lastSet = setsList[setsList.length - 1];
    setSetsList([...setsList, {
      id: Math.random().toString(36).substring(2, 10),
      reps: lastSet ? lastSet.reps : 10,
      gewicht: lastSet ? lastSet.gewicht : 30,
      completed: false
    }]);
  };

  const verwijderSet = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSets = [...setsList];
    newSets.splice(index, 1);
    setSetsList(newSets);
  };

  const handleOpslaan = () => {
    const completed = setsList.filter(s => s.completed);
    onOpslaan(completed);
  };

  return (
    <View>
      {/* Tabel Header */}
      <View style={stijlen.tableHeaderRij}>
        <Text style={[stijlen.tableHeader, { color: kleuren.tekstGedimpt, width: 30, textAlign: 'center' }]}>SET</Text>
        {isGewicht && (
          <Text style={[stijlen.tableHeader, { color: kleuren.tekstGedimpt, flex: 1, textAlign: 'center' }]}>KG</Text>
        )}
        <Text style={[stijlen.tableHeader, { color: kleuren.tekstGedimpt, flex: 1, textAlign: 'center' }]}>
          {isTijd ? 'SEC' : 'REPS'}
        </Text>
        <Ionicons name="checkmark" size={16} color={kleuren.tekstGedimpt} style={{ width: 44, textAlign: 'center' }} />
      </View>

      {/* Sets Lijst */}
      {setsList.map((set, index) => {
        const isCompleted = set.completed;
        const bgKleur = isCompleted ? kleuren.succes + '22' : kleuren.kaart;

        return (
          <View key={set.id} style={[stijlen.setRij, { backgroundColor: bgKleur, borderColor: kleuren.kaartRand }]}>
            <TouchableOpacity onPress={() => verwijderSet(index)} style={stijlen.setNummerKnop}>
              <Text style={[stijlen.setNummer, { color: isCompleted ? kleuren.succes : kleuren.tekst }]}>
                {index + 1}
              </Text>
            </TouchableOpacity>

            {isGewicht && (
              <TextInput
                style={[stijlen.setMiniInput, { color: kleuren.tekst, backgroundColor: kleuren.achtergrond }]}
                value={set.gewicht ? String(set.gewicht) : ''}
                onChangeText={(t) => updateSet(index, 'gewicht', t)}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={kleuren.tekstGedimpt}
                editable={!isCompleted}
              />
            )}

            <View style={{ width: isGewicht ? 10 : 0 }} />

            <TextInput
              style={[stijlen.setMiniInput, { color: kleuren.tekst, backgroundColor: kleuren.achtergrond }]}
              value={set.reps ? String(set.reps) : ''}
              onChangeText={(t) => updateSet(index, 'reps', t)}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={kleuren.tekstGedimpt}
              editable={!isCompleted}
            />

            <TouchableOpacity 
              style={[stijlen.checkKnop, { backgroundColor: isCompleted ? kleuren.succes : kleuren.achtergrond }]}
              onPress={() => toggleSet(index)}
            >
              {isCompleted ? (
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              ) : (
                <View style={[stijlen.checkLeeg, { borderColor: kleuren.tekstGedimpt }]} />
              )}
            </TouchableOpacity>
          </View>
        );
      })}

      {/* Add Set Knop */}
      <TouchableOpacity style={stijlen.addSetKnop} onPress={voegSetToe}>
        <Ionicons name="add" size={16} color={kleuren.accent} style={{ marginRight: 4 }} />
        <Text style={{ color: kleuren.accent, fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>Add Set</Text>
      </TouchableOpacity>

      {/* Live berekeningen */}
      <View style={stijlen.berekenRij}>
        <View style={[stijlen.berekenKaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
          <Text style={[stijlen.berekenLabel, { color: kleuren.tekstGedimpt }]}>Voltooid Volume</Text>
          <Text style={[stijlen.berekenWaarde, { color: kleuren.accent }]}>{totaalVolume.toFixed(0)} kg</Text>
        </View>
      </View>

      {/* Opslaan knop */}
      <TouchableOpacity
        style={stijlen.opslaanContainer}
        onPress={handleOpslaan}
        disabled={laden}
        accessibilityLabel="Training opslaan"
      >
        <LinearGradient colors={['#7C3AED', '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={stijlen.opslaanKnop}>
          {laden
            ? <ActivityIndicator color="#FFFFFF" />
            : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="save-outline" size={18} color="#FFFFFF" />
                <Text style={stijlen.opslaanTekst}>Voltooi Oefening</Text>
              </View>
            )
          }
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const stijlen = StyleSheet.create({
  tableHeaderRij: { flexDirection: 'row', paddingHorizontal: 4, marginBottom: 8, paddingRight: 10 },
  tableHeader: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
  
  setRij: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 12, padding: 8, marginBottom: 8,
  },
  setNummerKnop: {
    width: 30, height: 30, justifyContent: 'center', alignItems: 'center',
  },
  setNummer: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  
  setMiniInput: {
    flex: 1, borderRadius: 8, textAlign: 'center',
    paddingVertical: 8, fontFamily: 'Inter_600SemiBold', fontSize: 15,
  },
  
  checkKnop: {
    width: 34, height: 34, borderRadius: 17,
    justifyContent: 'center', alignItems: 'center',
    marginLeft: 10,
  },
  checkLeeg: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
  },

  addSetKnop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 12, marginBottom: 20,
  },

  berekenRij:   { flexDirection: 'row', gap: 8, marginBottom: 18 },
  berekenKaart: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 10, alignItems: 'center' },
  berekenLabel: { fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase', fontFamily: 'Inter_400Regular', marginBottom: 4 },
  berekenWaarde: { fontSize: 14, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  
  opslaanContainer: {
    borderRadius: 14, overflow: 'hidden',
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  opslaanKnop:  { paddingVertical: 16, alignItems: 'center' },
  opslaanTekst: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', fontFamily: 'Inter_700Bold' },
});
