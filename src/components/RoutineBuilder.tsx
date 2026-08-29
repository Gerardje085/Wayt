// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Routine Builder Component
// Creates and edits workout routines with thumbnail images, set deletion,
// custom rest times, default rest time integration, and exercise guide modal.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert, Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useThema } from '../context/ThemeContext';
import { saveRoutine, Routine } from '../lib/routineStore';
import { findExercise, getMediaUrl } from '../data/exercises';
import { getDefaultRestTime, STANDAARD_RUST_TIJD } from '../lib/settingsStore';
import ExerciseSelector from './ExerciseSelector';
import ExerciseGuideModal from './ExerciseGuideModal';

const REST_OPTIES: Array<{ label: string; seconden: number }> = [
  { label: '60s', seconden: 60 },
  { label: '90s', seconden: 90 },
  { label: '2min', seconden: 120 },
  { label: '3min', seconden: 180 },
];

function formatGewicht(value: number): string {
  if (value === 0) return '0';
  return String(value).replace('.', ',');
}

function parseGewicht(text: string): number {
  const normalized = text.replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : Math.max(0, num);
}

interface RoutineBuilderProps {
  zichtbaar: boolean;
  initialRoutine?: Routine;
  onOpslaan: () => void;
  onSluiten: () => void;
}

type LokaleOefening = Routine['oefeningen'][0] & { _key: string };

interface OefeningRijProps {
  item: LokaleOefening;
  index: number;
  onVerwijderOefening: (i: number) => void;
  onToonUitleg: (id: string, naam?: string) => void;
  onVoegSetToe: (oefIndex: number) => void;
  onVerwijderSet: (oefIndex: number, setId: string) => void;
  onWijzigSet: (oefIndex: number, setIndex: number, veld: keyof import('../lib/routineStore').RoutineSet, waarde: number) => void;
  onWijzigNotities: (oefIndex: number, tekst: string) => void;
  onWijzigRustTijd: (oefIndex: number, seconden: number) => void;
  onOpenCustomRust: (oefIndex: number, huidigeTijd: number) => void;
  kleuren: any;
}

function SetRij({ set, setIndex, toonGewicht, toonTijd, onWijzig, onVerwijder, kleuren }: any) {
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

      {/* Delete Set Button */}
      <TouchableOpacity
        onPress={() => onVerwijder(set.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={stijlen.verwijderSetKnop}
      >
        <Ionicons name="close-circle-outline" size={20} color={kleuren.fout} />
      </TouchableOpacity>
    </View>
  );
}

function OefeningRij({
  item, index, onVerwijderOefening, onToonUitleg, onVoegSetToe, onVerwijderSet, onWijzigSet,
  onWijzigNotities, onWijzigRustTijd, onOpenCustomRust, kleuren,
}: OefeningRijProps) {
  const oefInfo = findExercise(item.id);
  const toonGewicht = oefInfo?.type === 'gewicht';
  const toonTijd = oefInfo?.type === 'tijd';
  const huidigeRust = item.rustTijd ?? STANDAARD_RUST_TIJD;
  const mediaUri = oefInfo?.image_url || getMediaUrl(oefInfo?.image);

  const isPresetActief = REST_OPTIES.some(opt => opt.seconden === huidigeRust);

  const bevestigVerwijder = () => {
    Alert.alert(
      'Oefening verwijderen',
      `Weet je zeker dat je ${oefInfo?.naam || 'deze oefening'} wilt verwijderen uit de routine?`,
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Verwijderen',
          style: 'destructive',
          onPress: () => onVerwijderOefening(index),
        },
      ]
    );
  };

  return (
    <View style={[stijlen.oefKaart, { backgroundColor: kleuren.isDark ? '#000000' : kleuren.kaart, borderColor: kleuren.kaartRand }]}>
      <View style={stijlen.oefHeaderNormaal}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}
          onPress={() => onToonUitleg(item.id, oefInfo?.naam || oefInfo?.name)}
          activeOpacity={0.7}
        >
          {/* Thumbnail Preview Image */}
          <View style={[stijlen.thumbContainer, { backgroundColor: '#FFFFFF', borderColor: kleuren.kaartRand }]}>
            {mediaUri ? (
              <Image source={{ uri: mediaUri }} style={stijlen.thumbImage} resizeMode="contain" />
            ) : (
              <Ionicons name={(oefInfo?.icoon as any) ?? 'barbell-outline'} size={20} color={kleuren.accent} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[stijlen.oefNaam, { color: kleuren.tekst }]} numberOfLines={1}>
              {oefInfo?.naam ?? item.id}
            </Text>
            <Text style={[stijlen.oefSub, { color: kleuren.tekstGedimpt }]}>
              {oefInfo?.groep ?? 'Spiergroep'} • {item.sets.length} {item.sets.length === 1 ? 'set' : 'sets'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Action Buttons: Information & Trash */}
        <View style={stijlen.headerActies}>
          <TouchableOpacity
            onPress={() => onToonUitleg(item.id, oefInfo?.naam || oefInfo?.name)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={stijlen.actieIcoonKnop}
            accessibilityLabel="Oefening uitleg bekijken"
          >
            <Ionicons name="information-circle-outline" size={22} color={kleuren.accent} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={bevestigVerwijder}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={stijlen.actieIcoonKnop}
            accessibilityLabel="Oefening verwijderen"
          >
            <Ionicons name="trash-outline" size={19} color={kleuren.fout} />
          </TouchableOpacity>
        </View>
      </View>

      <TextInput
        style={[stijlen.notitiesInput, { color: kleuren.tekst, backgroundColor: kleuren.achtergrond, borderColor: kleuren.kaartRand }]}
        value={item.notities ?? ''}
        onChangeText={(t) => onWijzigNotities(index, t)}
        placeholder="Voeg een notitie toe (optioneel)"
        placeholderTextColor={kleuren.tekstGedimpt}
        multiline
      />

      <View style={{ flexDirection: 'row', marginBottom: 8, paddingHorizontal: 4, alignItems: 'center' }}>
        <Text style={[stijlen.tableHeader, { width: 32, textAlign: 'center', color: kleuren.tekstGedimpt }]}>SET</Text>
        {toonGewicht && <Text style={[stijlen.tableHeader, { flex: 1, textAlign: 'center', color: kleuren.tekstGedimpt }]}>KG</Text>}
        <Text style={[stijlen.tableHeader, { flex: 1, textAlign: 'center', color: kleuren.tekstGedimpt }]}>{toonTijd ? 'TIME' : 'REPS'}</Text>
        <View style={{ width: 32 }} />
      </View>

      {item.sets.map((set, setIndex) => (
        <SetRij
          key={set.id}
          set={set}
          setIndex={setIndex}
          toonGewicht={toonGewicht}
          toonTijd={toonTijd}
          onWijzig={(veld: any, waarde: any) => onWijzigSet(index, setIndex, veld, waarde)}
          onVerwijder={(setId: string) => onVerwijderSet(index, setId)}
          kleuren={kleuren}
        />
      ))}

      <TouchableOpacity
        style={[stijlen.addSetKnop, { backgroundColor: kleuren.achtergrond, borderColor: kleuren.kaartRand }]}
        onPress={() => onVoegSetToe(index)}
      >
        <Ionicons name="add" size={16} color={kleuren.accent} style={{ marginRight: 6 }} />
        <Text style={{ color: kleuren.accent, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>Set toevoegen</Text>
      </TouchableOpacity>

      {/* Rusttijd Sectie met Presets en Custom Rusttijd */}
      <View style={stijlen.rustRij}>
        <Text style={[stijlen.rustLabel, { color: kleuren.tekstGedimpt }]}>RUST TUSSEN SETS</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {REST_OPTIES.map(opt => {
            const actief = huidigeRust === opt.seconden;
            return (
              <TouchableOpacity
                key={opt.seconden}
                style={[
                  stijlen.rustKnop,
                  {
                    backgroundColor: actief ? kleuren.accentGedimpt : kleuren.achtergrond,
                    borderColor: actief ? kleuren.accent : kleuren.kaartRand,
                  },
                ]}
                onPress={() => onWijzigRustTijd(index, opt.seconden)}
              >
                <Text style={{ color: actief ? kleuren.accent : kleuren.tekstGedimpt, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Custom Rusttijd Knop */}
          <TouchableOpacity
            style={[
              stijlen.rustKnop,
              {
                backgroundColor: !isPresetActief ? kleuren.accentGedimpt : kleuren.achtergrond,
                borderColor: !isPresetActief ? kleuren.accent : kleuren.kaartRand,
              },
            ]}
            onPress={() => onOpenCustomRust(index, huidigeRust)}
          >
            <Text style={{ color: !isPresetActief ? kleuren.accent : kleuren.tekstGedimpt, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>
              {!isPresetActief ? `${huidigeRust}s (Aangepast)` : '+ Custom'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

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
  const oefInfo = findExercise(item.id);
  const id = item._key;
  const mediaUri = oefInfo?.image_url || getMediaUrl(oefInfo?.image);

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
        <TouchableOpacity style={stijlen.reorderVerwijder} onPress={() => onVerwijder(id)}>
          <Ionicons name="remove-circle" size={24} color={kleuren.fout} />
        </TouchableOpacity>

        <View style={[stijlen.thumbContainerSmall, { backgroundColor: '#FFFFFF', borderColor: kleuren.kaartRand }]}>
          {mediaUri ? (
            <Image source={{ uri: mediaUri }} style={stijlen.thumbImage} resizeMode="contain" />
          ) : (
            <Ionicons name={(oefInfo?.icoon as any) ?? 'barbell-outline'} size={18} color={kleuren.tekstGedimpt} />
          )}
        </View>
        <Text style={[stijlen.reorderNaam, { color: kleuren.tekst }]} numberOfLines={1}>
          {oefInfo?.naam ?? item.id}
        </Text>

        <GestureDetector gesture={dragGesture}>
          <View style={stijlen.reorderHandle} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="reorder-three-outline" size={26} color={kleuren.tekstGedimpt} />
          </View>
        </GestureDetector>
      </View>
    </Animated.View>
  );
}

export default function RoutineBuilder({ zichtbaar, initialRoutine, onOpslaan, onSluiten }: RoutineBuilderProps) {
  const { kleuren } = useThema();
  const [naam, setNaam] = useState('');
  const [oefeningen, setOefeningen] = useState<LokaleOefening[]>([]);
  const [selectorZichtbaar, setSelectorZichtbaar] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  // Guide modal state
  const [guideModal, setGuideModal] = useState<{ zichtbaar: boolean; oefeningId: string; oefeningNaam?: string }>({
    zichtbaar: false,
    oefeningId: '',
    oefeningNaam: '',
  });

  // Custom rust modal state
  const [customRustState, setCustomRustState] = useState<{ zichtbaar: boolean; oefIndex: number; waarde: string }>({
    zichtbaar: false,
    oefIndex: 0,
    waarde: '',
  });

  const positions = useSharedValue<Record<string, number>>({});
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

  async function voegOefeningToe(id: string) {
    const oefInfo = findExercise(id);
    const startGewicht = oefInfo?.type === 'gewicht' ? (oefInfo.startWaarde ?? 20) : 0;
    const defaultRust = await getDefaultRestTime();

    setOefeningen(prev => [...prev, {
      id,
      sets: [
        { id: Math.random().toString(36).substring(2, 10), reps: 10, gewicht: startGewicht },
        { id: Math.random().toString(36).substring(2, 10), reps: 10, gewicht: startGewicht },
        { id: Math.random().toString(36).substring(2, 10), reps: 10, gewicht: startGewicht },
      ],
      notities: '',
      rustTijd: defaultRust,
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

  const toonUitlegModal = useCallback((id: string, oefNaam?: string) => {
    setGuideModal({
      zichtbaar: true,
      oefeningId: id,
      oefeningNaam: oefNaam,
    });
  }, []);

  const openCustomRustModal = useCallback((oefIndex: number, huidigeTijd: number) => {
    setCustomRustState({
      zichtbaar: true,
      oefIndex,
      waarde: String(huidigeTijd),
    });
  }, []);

  const bewaarCustomRust = useCallback(() => {
    const num = parseInt(customRustState.waarde, 10);
    if (isNaN(num) || num < 5 || num > 600) {
      Alert.alert('Ongeldige tijd', 'Voer een tijd in tussen 5 en 600 seconden.');
      return;
    }
    setOefeningen(prev => {
      const lijst = [...prev];
      if (lijst[customRustState.oefIndex]) {
        lijst[customRustState.oefIndex] = { ...lijst[customRustState.oefIndex], rustTijd: num };
      }
      return lijst;
    });
    setCustomRustState({ zichtbaar: false, oefIndex: 0, waarde: '' });
  }, [customRustState]);

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

  const wijzigNotities = useCallback((oefIndex: number, tekst: string) => {
    setOefeningen(prev => {
      const lijst = [...prev];
      lijst[oefIndex] = { ...lijst[oefIndex], notities: tekst };
      return lijst;
    });
  }, []);

  const wijzigRustTijd = useCallback((oefIndex: number, seconden: number) => {
    setOefeningen(prev => {
      const lijst = [...prev];
      lijst[oefIndex] = { ...lijst[oefIndex], rustTijd: seconden };
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

    const schoneOefeningen = oefeningen.map(({ _key, ...rest }) => rest);

    await saveRoutine({
      id: initialRoutine ? initialRoutine.id : Date.now().toString(),
      naam,
      oefeningen: schoneOefeningen,
    });
    onOpslaan();
    onSluiten();
  }

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

            <View style={[stijlen.footer, { borderTopColor: kleuren.kaartRand }]}>
              <TouchableOpacity
                style={[stijlen.doneKnop, { backgroundColor: kleuren.accent }]}
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

  return (
    <Modal visible={zichtbaar} animationType="slide" transparent={true} onRequestClose={onSluiten}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={stijlen.overlay}>
        <View style={[stijlen.modalContainer, { backgroundColor: kleuren.achtergrond }]}>
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

          <ScrollView style={stijlen.scrollInhoud} showsVerticalScrollIndicator={false}>
            <View style={stijlen.sectie}>
              <TextInput
                style={[stijlen.naamInput, { color: kleuren.tekst, borderBottomColor: kleuren.kaartRand }]}
                placeholder="Naam van de Routine..."
                placeholderTextColor={kleuren.tekstGedimpt}
                value={naam}
                onChangeText={setNaam}
              />
            </View>

            <View style={stijlen.sectieHeaderRij}>
              <Text style={[stijlen.sectieLabel, { color: kleuren.accent }]}>OEFENINGEN</Text>
              {oefeningen.length > 1 && (
                <TouchableOpacity onPress={() => setIsReordering(true)} style={stijlen.reorderTrigger}>
                  <Ionicons name="swap-vertical" size={16} color={kleuren.accent} style={{ marginRight: 4 }} />
                  <Text style={{ color: kleuren.accent, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>Volgorde</Text>
                </TouchableOpacity>
              )}
            </View>

            {oefeningen.map((item, index) => (
              <OefeningRij
                key={item._key}
                item={item}
                index={index}
                onVerwijderOefening={verwijderOefening}
                onToonUitleg={toonUitlegModal}
                onVoegSetToe={voegSetToe}
                onVerwijderSet={verwijderSet}
                onWijzigSet={wijzigSetVeld}
                onWijzigNotities={wijzigNotities}
                onWijzigRustTijd={wijzigRustTijd}
                onOpenCustomRust={openCustomRustModal}
                kleuren={kleuren}
              />
            ))}

            <TouchableOpacity
              style={[stijlen.groteVoegToeKnop, { borderColor: kleuren.accent, backgroundColor: kleuren.accentGedimpt }]}
              onPress={() => setSelectorZichtbaar(true)}
            >
              <Ionicons name="add-circle" size={20} color={kleuren.accent} style={{ marginRight: 8 }} />
              <Text style={[stijlen.groteVoegToeTekst, { color: kleuren.accent }]}>Oefening toevoegen</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>

          {/* Exercise Selector */}
          <ExerciseSelector
            zichtbaar={selectorZichtbaar}
            huidigeSelectie=""
            onSelecteer={voegOefeningToe}
            onSluiten={() => setSelectorZichtbaar(false)}
          />

          {/* Exercise Guide Modal */}
          <ExerciseGuideModal
            zichtbaar={guideModal.zichtbaar}
            oefeningId={guideModal.oefeningId}
            oefeningNaam={guideModal.oefeningNaam}
            onSluiten={() => setGuideModal({ zichtbaar: false, oefeningId: '', oefeningNaam: '' })}
          />

          {/* Custom Rest Time Modal for Exercise in Routine */}
          <Modal
            visible={customRustState.zichtbaar}
            transparent
            animationType="fade"
            onRequestClose={() => setCustomRustState({ zichtbaar: false, oefIndex: 0, waarde: '' })}
          >
            <View style={stijlen.customModalOverlay}>
              <View style={[stijlen.customModalBox, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
                <Text style={[stijlen.customModalTitel, { color: kleuren.tekst }]}>Aangepaste Rusttijd</Text>
                <Text style={[stijlen.customModalSub, { color: kleuren.tekstGedimpt }]}>
                  Voer het aantal seconden rust in voor deze oefening:
                </Text>

                <TextInput
                  style={[stijlen.customInput, { backgroundColor: kleuren.achtergrond, borderColor: kleuren.kaartRand, color: kleuren.tekst }]}
                  keyboardType="numeric"
                  placeholder="bijv. 75"
                  placeholderTextColor={kleuren.tekstGedimpt}
                  value={customRustState.waarde}
                  onChangeText={(val) => setCustomRustState(p => ({ ...p, waarde: val }))}
                  autoFocus
                />

                <View style={stijlen.customModalKnoppen}>
                  <TouchableOpacity
                    style={[stijlen.customModalKnop, { backgroundColor: kleuren.achtergrond, borderColor: kleuren.kaartRand }]}
                    onPress={() => setCustomRustState({ zichtbaar: false, oefIndex: 0, waarde: '' })}
                  >
                    <Text style={{ color: kleuren.tekstGedimpt, fontFamily: 'Inter_600SemiBold' }}>Annuleren</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[stijlen.customModalKnop, { backgroundColor: kleuren.accent, borderColor: kleuren.accent }]}
                    onPress={bewaarCustomRust}
                  >
                    <Text style={{ color: '#FFF', fontFamily: 'Inter_700Bold' }}>Opslaan</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
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
    height: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitel: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  headerKnop: {
    padding: 4,
  },
  scrollInhoud: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectie: {
    marginVertical: 12,
  },
  naamInput: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  sectieHeaderRij: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  sectieLabel: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  reorderTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  oefKaart: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  oefHeaderNormaal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  thumbContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbContainerSmall: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  oefNaam: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  oefSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  headerActies: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actieIcoonKnop: {
    padding: 6,
    borderRadius: 8,
  },
  notitiesInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 12,
    minHeight: 36,
  },
  tableHeader: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  setNummer: {
    width: 32,
    textAlign: 'center',
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
  },
  setMiniInput: {
    borderRadius: 8,
    paddingVertical: 8,
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  verwijderSetKnop: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSetKnop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  rustRij: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.1)',
  },
  rustLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
    marginBottom: 6,
  },
  rustKnop: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  reorderRij: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  reorderVerwijder: {
    marginRight: 10,
  },
  reorderNaam: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  reorderHandle: {
    padding: 6,
  },
  groteVoegToeKnop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 6,
  },
  groteVoegToeTekst: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  doneKnop: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneTekst: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  customModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  customModalBox: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
  },
  customModalTitel: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    marginBottom: 6,
  },
  customModalSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
    marginBottom: 16,
  },
  customInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  customModalKnoppen: {
    flexDirection: 'row',
    gap: 10,
  },
  customModalKnop: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
});
