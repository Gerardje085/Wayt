// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Routine Builder Modal
// Bevat twee weergaven: "Bewerken" (normaal) en "Reorder" (drag & drop lijst).
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  LinearTransition,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useThema } from '../context/ThemeContext';
import { saveRoutine, Routine } from '../lib/routineStore';
import { OEFENINGEN_DB } from '../data/exercises';
import ExerciseSelector from './ExerciseSelector';

// ─── Hulpfuncties voor komma-decimalen ───────────────────────────────────────
function formatGewicht(value: number): string {
  if (value === 0) return '0';
  return String(value).replace('.', ',');
}

function parseGewicht(text: string): number {
  const normalized = text.replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : Math.max(0, num);
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface RoutineBuilderProps {
  zichtbaar: boolean;
  initialRoutine?: Routine;
  onOpslaan: () => void;
  onSluiten: () => void;
}

// Uitbreiding met een tijdelijke _key om React remounts (en verlies van gesture state) te voorkomen
type LokaleOefening = Routine['oefeningen'][0] & { _key: string };

// ─── OefeningRij (Normale Modus) ─────────────────────────────────────────────
interface OefeningRijProps {
  item: LokaleOefening;
  index: number;
  onVerwijderOefening: (i: number) => void;
  onVoegSetToe: (oefIndex: number) => void;
  onVerwijderSet: (oefIndex: number, setId: string) => void;
  onWijzigSet: (oefIndex: number, setIndex: number, veld: keyof import('../lib/routineStore').RoutineSet, waarde: number) => void;
  kleuren: any;
}

function SetRij({ set, setIndex, toonGewicht, toonTijd, onWijzig, kleuren }: any) {
  const [gewichtStr, setGewichtStr] = useState(formatGewicht(set.gewicht));
  const externeGewichtRef = useRef(set.gewicht);
  
  const [repsStr, setRepsStr] = useState(String(set.reps));
  const externeRepsRef = useRef(set.reps);

  useEffect(() => {
    if (set.gewicht !== externeGewichtRef.current) {
      externeGewichtRef.current = set.gewicht;
      setGewichtStr(formatGewicht(set.gewicht));
    }
    if (set.reps !== externeRepsRef.current) {
      externeRepsRef.current = set.reps;
      setRepsStr(String(set.reps));
    }
  }, [set.gewicht, set.reps]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, paddingHorizontal: 4 }}>
      <Text style={[stijlen.setNummer, { color: kleuren.tekst }]}>{setIndex + 1}</Text>
      
      {toonGewicht && (
        <View style={{ flex: 1, paddingHorizontal: 4 }}>
          <TextInput 
            style={[stijlen.setMiniInput, { backgroundColor: kleuren.achtergrond, color: kleuren.tekst }]}
            keyboardType="decimal-pad"
            value={gewichtStr}
            onChangeText={(t) => { 
              setGewichtStr(t); 
              const num = parseGewicht(t);
              externeGewichtRef.current = num;
              onWijzig('gewicht', num); 
            }}
            onBlur={() => setGewichtStr(formatGewicht(parseGewicht(gewichtStr)))}
            selectionColor={kleuren.accent}
          />
        </View>
      )}

      <View style={{ flex: 1, paddingHorizontal: 4 }}>
        <TextInput 
          style={[stijlen.setMiniInput, { backgroundColor: kleuren.achtergrond, color: kleuren.tekst }]}
          keyboardType="numeric"
          value={repsStr}
          onChangeText={(t) => { 
            setRepsStr(t); 
            const num = parseInt(t) || 0;
            externeRepsRef.current = num;
            onWijzig('reps', num); 
          }}
          selectionColor={kleuren.accent}
        />
      </View>
    </View>
  );
}

function OefeningRij({ item, index, onVerwijderOefening, onVoegSetToe, onVerwijderSet, onWijzigSet, kleuren }: OefeningRijProps) {
  const oefInfo     = OEFENINGEN_DB.find(o => o.id === item.id);
  const toonGewicht = oefInfo?.type === 'gewicht';
  const toonTijd    = oefInfo?.type === 'tijd';

  return (
    <View style={[stijlen.oefKaart, { backgroundColor: kleuren.isDark ? '#000000' : kleuren.kaart }]}>
      {/* Header */}
      <View style={stijlen.oefHeaderNormaal}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={[stijlen.reorderIcoonKaart, { backgroundColor: kleuren.achtergrond, marginRight: 12, width: 36, height: 36, borderRadius: 18 }]}>
            <Ionicons name={(oefInfo?.icoon as any) ?? 'barbell-outline'} size={20} color={kleuren.tekst} />
          </View>
          <Text style={[stijlen.oefNaam, { color: kleuren.accent, fontSize: 16 }]} numberOfLines={1}>
            {oefInfo?.naam ?? item.id}
          </Text>
        </View>
        <TouchableOpacity onPress={() => onVerwijderOefening(index)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="ellipsis-vertical" size={20} color={kleuren.tekstGedimpt} />
        </TouchableOpacity>
      </View>

      <Text style={{ color: kleuren.tekstGedimpt, fontSize: 13, marginBottom: 12, marginLeft: 4 }}>Add routine notes here</Text>
      
      {/* Table Header */}
      <View style={{ flexDirection: 'row', marginBottom: 8, paddingHorizontal: 4 }}>
        <Text style={[stijlen.tableHeader, { width: 40, textAlign: 'center', color: kleuren.tekstGedimpt }]}>SET</Text>
        {toonGewicht && <Text style={[stijlen.tableHeader, { flex: 1, textAlign: 'center', color: kleuren.tekstGedimpt }]}>KG</Text>}
        <Text style={[stijlen.tableHeader, { flex: 1, textAlign: 'center', color: kleuren.tekstGedimpt }]}>{toonTijd ? 'TIME' : 'REPS'}</Text>
      </View>

      {/* Sets */}
      {item.sets.map((set, setIndex) => (
        <SetRij
          key={set.id}
          set={set}
          setIndex={setIndex}
          toonGewicht={toonGewicht}
          toonTijd={toonTijd}
          onWijzig={(veld: any, waarde: any) => onWijzigSet(index, setIndex, veld, waarde)}
          kleuren={kleuren}
        />
      ))}

      {/* Add Set Button */}
      <TouchableOpacity 
        style={[stijlen.addSetKnop, { backgroundColor: kleuren.achtergrond }]} 
        onPress={() => onVoegSetToe(index)}
      >
        <Ionicons name="add" size={16} color={kleuren.tekst} style={{ marginRight: 6 }} />
        <Text style={{ color: kleuren.tekst, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>Add Set</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── ReorderRow (Reorder Modus) ──────────────────────────────────────────────
interface ReorderRowProps {
  item: LokaleOefening;
  positions: import('react-native-reanimated').SharedValue<Record<string, number>>;
  totaal: number;
  onVerwijder: (key: string) => void;
  onDragEnd: (volgordeIds: string[]) => void;
  kleuren: any;
  itemHoogte: number;
}

function ReorderRow({
  item, positions, totaal, onVerwijder, onDragEnd, kleuren, itemHoogte
}: ReorderRowProps) {
  const oefInfo = OEFENINGEN_DB.find(o => o.id === item.id);
  const id = item._key;

  const isDragging = useSharedValue(false);
  const top = useSharedValue((positions.value[id] ?? 0) * itemHoogte);
  const initialIndex = useSharedValue(0);

  useAnimatedReaction(
    () => positions.value[id],
    (newIndex, prevIndex) => {
      if (newIndex !== undefined && newIndex !== prevIndex) {
        if (!isDragging.value) {
          top.value = withTiming(newIndex * itemHoogte, { duration: 150 });
        }
      }
    }
  );

  const dragGesture = Gesture.Pan()
    .activateAfterLongPress(150)
    .onStart(() => {
      'worklet';
      isDragging.value = true;
      initialIndex.value = positions.value[id];
    })
    .onUpdate((e) => {
      'worklet';
      const newTop = (initialIndex.value * itemHoogte) + e.translationY;
      top.value = newTop;

      const newIndex = Math.max(0, Math.min(totaal - 1, Math.round(newTop / itemHoogte)));
      
      const currentIndex = positions.value[id];
      if (newIndex !== currentIndex) {
        const idToSwap = Object.keys(positions.value).find(key => positions.value[key] === newIndex);
        if (idToSwap) {
          const newPositions = Object.assign({}, positions.value);
          newPositions[id] = newIndex;
          newPositions[idToSwap] = currentIndex;
          positions.value = newPositions;
        }
      }
    })
    .onEnd(() => {
      'worklet';
      top.value = withTiming(positions.value[id] * itemHoogte, { duration: 150 });
      runOnJS(onDragEnd)(Object.keys(positions.value).sort((a, b) => positions.value[a] - positions.value[b]));
    })
    .onFinalize(() => {
      'worklet';
      if (isDragging.value) {
        top.value = withTiming(positions.value[id] * itemHoogte, { duration: 150 });
        isDragging.value = false;
      }
    });

  const animStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    top: top.value,
    left: 0,
    right: 0,
    height: itemHoogte - 8,
    zIndex: isDragging.value ? 100 : 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: isDragging.value ? 10 : 0 },
    shadowOpacity: isDragging.value ? 0.3 : 0,
    shadowRadius: isDragging.value ? 15 : 0,
    elevation: isDragging.value ? 10 : 0,
    backgroundColor: isDragging.value ? (kleuren.isDark ? '#2A2A3A' : '#F5F5FA') : kleuren.kaart,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDragging.value ? kleuren.accent : kleuren.kaartRand,
    justifyContent: 'center',
  }));

  return (
    <Animated.View style={animStyle}>
      <View style={[stijlen.reorderRij, { height: '100%', paddingVertical: 0 }]}>
        
        {/* Verwijder Knop */}
        <TouchableOpacity style={stijlen.reorderVerwijder} onPress={() => onVerwijder(id)}>
          <Ionicons name="remove-circle" size={24} color="#F43F5E" />
        </TouchableOpacity>

        {/* Icoon & Naam */}
        <View style={[stijlen.reorderIcoonKaart, { backgroundColor: kleuren.achtergrond }]}>
          <Ionicons name={(oefInfo?.icoon as any) ?? 'barbell-outline'} size={18} color={kleuren.tekstGedimpt} />
        </View>
        <Text style={[stijlen.reorderNaam, { color: kleuren.tekst }]} numberOfLines={1}>
          {oefInfo?.naam ?? item.id}
        </Text>

        {/* Drag Handle */}
        <GestureDetector gesture={dragGesture}>
          <View style={stijlen.reorderHandle} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="reorder-three-outline" size={26} color={kleuren.tekstGedimpt} />
          </View>
        </GestureDetector>

      </View>
    </Animated.View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RoutineBuilder({ zichtbaar, initialRoutine, onOpslaan, onSluiten }: RoutineBuilderProps) {
  const { kleuren } = useThema();
  const [naam, setNaam]             = useState('');
  const [oefeningen, setOefeningen] = useState<LokaleOefening[]>([]);
  const [selectorZichtbaar, setSelectorZichtbaar] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const positions = useSharedValue<Record<string, number>>({});

  // Exacte hoogte = 12 paddingTop + 12 paddingBottom + 32 icoon hoogte + 2 border + 8 margin = 66
  const REORDER_ITEM_HOOGTE = 66;

  useEffect(() => {
    if (isReordering) {
      const pos: Record<string, number> = {};
      oefeningen.forEach((item, index) => {
        pos[item._key] = index;
      });
      positions.value = pos;
    }
  }, [isReordering, oefeningen.length]);

  useEffect(() => {
    if (zichtbaar) {
      setIsReordering(false);
      if (initialRoutine) {
        setNaam(initialRoutine.naam);
        setOefeningen(initialRoutine.oefeningen.map(o => ({
          ...o,
          _key: Math.random().toString(36).substring(2, 10),
        })));
      } else {
        setNaam('');
        setOefeningen([]);
      }
    }
  }, [initialRoutine, zichtbaar]);

  function voegOefeningToe(id: string) {
    const oefInfo      = OEFENINGEN_DB.find(o => o.id === id);
    const startGewicht = oefInfo?.type === 'gewicht' ? (oefInfo.startWaarde ?? 20) : 0;
    setOefeningen(prev => [...prev, { 
      id,
      sets: [
        { id: Math.random().toString(36).substring(2, 10), reps: 10, gewicht: startGewicht },
        { id: Math.random().toString(36).substring(2, 10), reps: 10, gewicht: startGewicht },
        { id: Math.random().toString(36).substring(2, 10), reps: 10, gewicht: startGewicht },
      ],
      _key: Math.random().toString(36).substring(2, 10),
    }]);
    setSelectorZichtbaar(false);
  }

  const verwijderOefening = useCallback((index: number) => {
    setOefeningen(prev => prev.filter((_, i) => i !== index));
  }, []);

  const verwijderOefeningByKey = useCallback((key: string) => {
    setOefeningen(prev => prev.filter(item => item._key !== key));
  }, []);

  const wijzigSetVeld = useCallback((oefIndex: number, setIndex: number, veld: keyof import('../lib/routineStore').RoutineSet, waarde: number) => {
    setOefeningen(prev => {
      const lijst = [...prev];
      const oef = { ...lijst[oefIndex] };
      const sets = [...oef.sets];
      sets[setIndex] = { ...sets[setIndex], [veld]: waarde };
      oef.sets = sets;
      lijst[oefIndex] = oef;
      return lijst;
    });
  }, []);

  const voegSetToe = useCallback((oefIndex: number) => {
    setOefeningen(prev => {
      const lijst = [...prev];
      const oef = { ...lijst[oefIndex] };
      const lastSet = oef.sets[oef.sets.length - 1];
      oef.sets = [...oef.sets, {
        id: Math.random().toString(36).substring(2, 10),
        reps: lastSet ? lastSet.reps : 10,
        gewicht: lastSet ? lastSet.gewicht : 0,
      }];
      lijst[oefIndex] = oef;
      return lijst;
    });
  }, []);

  const verwijderSet = useCallback((oefIndex: number, setId: string) => {
    setOefeningen(prev => {
      const lijst = [...prev];
      const oef = { ...lijst[oefIndex] };
      oef.sets = oef.sets.filter(s => s.id !== setId);
      if (oef.sets.length === 0) {
        return lijst.filter((_, i) => i !== oefIndex);
      }
      lijst[oefIndex] = oef;
      return lijst;
    });
  }, []);

  const handleDragEnd = useCallback((sortedIds: string[]) => {
    setOefeningen(prev => {
      const newOrder = sortedIds.map(id => prev.find(p => p._key === id)).filter(Boolean) as LokaleOefening[];
      const missing = prev.filter(p => !sortedIds.includes(p._key));
      return [...newOrder, ...missing];
    });
  }, []);

  async function handleOpslaan() {
    if (!naam.trim()) {
      Alert.alert('Naam verplicht', 'Geef je routine een naam.');
      return;
    }
    if (oefeningen.length === 0) {
      Alert.alert('Geen oefeningen', 'Voeg minimaal één oefening toe.');
      return;
    }
    
    // Verwijder de tijdelijke _key voor we opslaan
    const schoneOefeningen = oefeningen.map(({ _key, ...rest }) => rest);
    
    await saveRoutine({
      id: initialRoutine ? initialRoutine.id : Date.now().toString(),
      naam,
      oefeningen: schoneOefeningen,
    });
    onOpslaan();
    onSluiten();
  }

  // ─── Weergave: Reorder Modus ───
  if (isReordering) {
    return (
      <Modal visible={zichtbaar} animationType="slide" transparent={true} onRequestClose={() => setIsReordering(false)}>
        <View style={stijlen.overlay}>
          <View style={[stijlen.modalContainer, { backgroundColor: kleuren.isDark ? '#000000' : '#FFFFFF' }]}>
            
            <View style={[stijlen.header, { borderBottomColor: kleuren.kaartRand }]}>
              <View style={{ width: 60 }} />
              <Text style={[stijlen.headerTitel, { color: kleuren.tekstSecundair }]}>Volgorde Aanpassen</Text>
              <View style={{ width: 60 }} />
            </View>

            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={{ height: oefeningen.length * REORDER_ITEM_HOOGTE, position: 'relative', margin: 16 }}>
                {oefeningen.map((item) => (
                  <ReorderRow
                    key={item._key}
                    item={item}
                    positions={positions}
                    totaal={oefeningen.length}
                    onVerwijder={verwijderOefeningByKey}
                    onDragEnd={handleDragEnd}
                    kleuren={kleuren}
                    itemHoogte={REORDER_ITEM_HOOGTE}
                  />
                ))}
              </View>
            </ScrollView>

            {/* Done Button */}
            <View style={[stijlen.footer, { borderTopColor: kleuren.kaartRand }]}>
              <TouchableOpacity
                style={[stijlen.doneKnop, { backgroundColor: '#3B82F6' }]}
                onPress={() => setIsReordering(false)}
              >
                <Text style={stijlen.doneTekst}>Gereed</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    );
  }

  // ─── Weergave: Normale Modus ───
  return (
    <Modal visible={zichtbaar} animationType="slide" transparent={true} onRequestClose={onSluiten}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={stijlen.overlay}>
        <View style={[stijlen.modalContainer, { backgroundColor: kleuren.achtergrond }]}>

          {/* Header */}
          <View style={[stijlen.header, { borderBottomColor: kleuren.kaartRand }]}>
            <TouchableOpacity onPress={onSluiten} style={stijlen.headerKnop}>
              <Text style={{ color: kleuren.tekstGedimpt, fontFamily: 'Inter_600SemiBold' }}>Annuleer</Text>
            </TouchableOpacity>
            <Text style={[stijlen.headerTitel, { color: kleuren.tekstSecundair }]}>
              {initialRoutine ? 'Routine Aanpassen' : 'Nieuwe Routine'}
            </Text>
            <TouchableOpacity onPress={handleOpslaan} style={stijlen.headerKnop}>
              <Text style={{ color: kleuren.accent, fontFamily: 'Inter_700Bold' }}>Opslaan</Text>
            </TouchableOpacity>
          </View>

          {/* Naam Invoer */}
          <View style={stijlen.naamSectie}>
            <Text style={[stijlen.label, { color: kleuren.tekstGedimpt }]}>Routine Naam</Text>
            <TextInput
              style={[stijlen.input, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand, color: kleuren.tekst }]}
              placeholder="bijv. Push Day"
              placeholderTextColor={kleuren.tekstGedimpt}
              value={naam}
              onChangeText={setNaam}
            />
          </View>

          {/* Oefeningen Lijst + Volgorde Knop */}
          <View style={stijlen.lijstLabel}>
            <Text style={[stijlen.label, { color: kleuren.tekstGedimpt }]}>
              Oefeningen ({oefeningen.length})
            </Text>
            {oefeningen.length > 1 ? (
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center' }}
                onPress={() => setIsReordering(true)}
              >
                <Ionicons name="swap-vertical-outline" size={16} color={kleuren.accent} style={{ marginRight: 4 }} />
                <Text style={{ color: kleuren.accent, fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>
                  Volgorde Aanpassen
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={stijlen.scrollInhoud}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {oefeningen.map((item, index) => (
              <OefeningRij
                key={item._key}
                item={item}
                index={index}
                onVerwijderOefening={verwijderOefening}
                onVoegSetToe={voegSetToe}
                onVerwijderSet={verwijderSet}
                onWijzigSet={wijzigSetVeld}
                kleuren={kleuren}
              />
            ))}

            <TouchableOpacity
              style={[stijlen.toevoegKnop, { borderColor: kleuren.accent }]}
              onPress={() => setSelectorZichtbaar(true)}
            >
              <Ionicons name="add" size={20} color={kleuren.accent} style={{ marginRight: 6 }} />
              <Text style={{ color: kleuren.accent, fontFamily: 'Inter_600SemiBold' }}>Oefening Toevoegen</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <ExerciseSelector
        zichtbaar={selectorZichtbaar}
        huidigeSelectie=""
        onSelecteer={voegOefeningToe}
        onSluiten={() => setSelectorZichtbaar(false)}
      />
    </Modal>
  );
}

const stijlen = StyleSheet.create({
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContainer: { height: '94%', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  
  // Algemeen
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1,
  },
  headerTitel:  { fontSize: 16, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  headerKnop:   { paddingHorizontal: 8 },
  naamSectie:   { padding: 16, paddingBottom: 8 },
  lijstLabel:   {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 4, marginTop: 4,
  },
  label:        { fontSize: 12, textTransform: 'uppercase', fontFamily: 'Inter_700Bold', letterSpacing: 0.8 },
  input:        { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, fontFamily: 'Inter_400Regular' },
  scrollInhoud: { padding: 16, paddingTop: 8, paddingBottom: 40 },
  
  // OefeningRij (Normaal)
  oefKaart:     { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12 },
  oefHeaderNormaal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  oefNaam:      { flex: 1, fontSize: 15, fontFamily: 'Inter_600SemiBold', marginRight: 8 },
  
  tableHeader: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
  setNummer: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  setMiniInput: {
    borderRadius: 6, textAlign: 'center',
    paddingVertical: 6, width: '100%', fontFamily: 'Inter_600SemiBold', fontSize: 15,
  },
  addSetKnop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 10, borderRadius: 8, marginTop: 8,
  },
  
  toevoegKnop:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 14, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', marginTop: 4,
  },

  // Reorder Modus
  reorderRij: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
  },
  reorderVerwijder: {
    marginRight: 14,
  },
  reorderIcoonKaart: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  reorderNaam: {
    flex: 1, fontSize: 15, fontFamily: 'Inter_600SemiBold',
  },
  reorderHandle: {
    paddingLeft: 16, paddingVertical: 8,
    justifyContent: 'center', alignItems: 'flex-end',
  },
  footer: {
    padding: 16, borderTopWidth: 1, paddingBottom: 32,
  },
  doneKnop: {
    paddingVertical: 16, borderRadius: 14, alignItems: 'center',
  },
  doneTekst: {
    color: '#FFF', fontSize: 16, fontFamily: 'Inter_700Bold',
  },
});
