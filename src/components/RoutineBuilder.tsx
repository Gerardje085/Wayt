// ─────────────────────────────────────────────────────────────────────────────
// Wayt – Routine Builder Component
// Creates and edits workout routines with thumbnail images, set deletion,
// custom rest times, default rest time integration, and exercise guide modal.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, Pressable,
  TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert, Image, type ViewStyle,
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
import { RADIUS, SHADOWS, useResponsive } from '../theme/designTokens';

const WEB_POINTER = Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : undefined;

const REST_OPTIES: Array<{ label: string; seconden: number }> = [
  { label: '60s', seconden: 60 },
  { label: '90s', seconden: 90 },
  { label: '2min', seconden: 120 },
  { label: '3min', seconden: 180 },
];

function toonAlert(titel: string, bericht: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${titel}\n\n${bericht}`);
  } else {
    Alert.alert(titel, bericht);
  }
}

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

function SetRij({ set, setIndex, toonGewicht, onWijzig, onVerwijder, kleuren }: any) {
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
    <View style={stijlen.setRij}>
      <View style={[stijlen.setNummerBadge, { backgroundColor: kleuren.achtergrondSecundair, borderColor: kleuren.kaartRand }]}>
        <Text style={[stijlen.setNummer, { color: kleuren.tekstSecundair }]}>{setIndex + 1}</Text>
      </View>

      {toonGewicht && (
        <View style={{ flex: 1 }}>
          <TextInput
            style={[
              stijlen.setMiniInput,
              { backgroundColor: kleuren.achtergrondSecundair, borderColor: kleuren.kaartRand, color: kleuren.tekst },
            ]}
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

      <View style={{ flex: 1 }}>
        <TextInput
          style={[
            stijlen.setMiniInput,
            { backgroundColor: kleuren.achtergrondSecundair, borderColor: kleuren.kaartRand, color: kleuren.tekst },
          ]}
          keyboardType="numeric"
          value={repsStr}
          onChangeText={(t) => {
            setRepsStr(t);
            const num = parseInt(t, 10) || 0;
            externeRepsRef.current = num;
            onWijzig('reps', num);
          }}
          selectionColor={kleuren.accent}
        />
      </View>

      <TouchableOpacity
        onPress={() => onVerwijder(set.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={[stijlen.verwijderSetKnop, WEB_POINTER]}
        accessibilityLabel={`Set ${setIndex + 1} verwijderen`}
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
    const bericht = `Weet je zeker dat je ${oefInfo?.naam || 'deze oefening'} wilt verwijderen uit de routine?`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(`Oefening verwijderen\n\n${bericht}`)) {
        onVerwijderOefening(index);
      }
      return;
    }

    Alert.alert(
      'Oefening verwijderen',
      bericht,
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
    <View style={[stijlen.oefKaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
      <View style={stijlen.oefHeaderNormaal}>
        <TouchableOpacity
          style={[{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }, WEB_POINTER]}
          onPress={() => onToonUitleg(item.id, oefInfo?.naam || oefInfo?.name)}
          activeOpacity={0.7}
        >
          <View style={[stijlen.thumbContainer, { backgroundColor: '#FFFFFF', borderColor: kleuren.kaartRand }]}>
            {mediaUri ? (
              <Image source={{ uri: mediaUri }} style={stijlen.thumbImage} resizeMode="contain" />
            ) : (
              <Ionicons name={(oefInfo?.icoon as any) ?? 'barbell-outline'} size={20} color={kleuren.accent} />
            )}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[stijlen.oefNaam, { color: kleuren.tekst }]} numberOfLines={1}>
              {oefInfo?.naam ?? item.id}
            </Text>
            <Text style={[stijlen.oefSub, { color: kleuren.tekstGedimpt }]}>
              {oefInfo?.groep ?? 'Spiergroep'} • {item.sets.length} {item.sets.length === 1 ? 'set' : 'sets'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={stijlen.headerActies}>
          <TouchableOpacity
            onPress={() => onToonUitleg(item.id, oefInfo?.naam || oefInfo?.name)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[stijlen.actieIcoonKnop, { backgroundColor: kleuren.accentGedimpt }, WEB_POINTER]}
            accessibilityLabel="Oefening uitleg bekijken"
          >
            <Ionicons name="information-circle-outline" size={19} color={kleuren.accentLicht} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={bevestigVerwijder}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[stijlen.actieIcoonKnop, { backgroundColor: kleuren.fout + '14' }, WEB_POINTER]}
            accessibilityLabel="Oefening verwijderen"
          >
            <Ionicons name="trash-outline" size={18} color={kleuren.fout} />
          </TouchableOpacity>
        </View>
      </View>

      <TextInput
        style={[
          stijlen.notitiesInput,
          { color: kleuren.tekst, backgroundColor: kleuren.achtergrondSecundair, borderColor: kleuren.kaartRand },
        ]}
        value={item.notities ?? ''}
        onChangeText={(t) => onWijzigNotities(index, t)}
        placeholder="Voeg een notitie toe (optioneel)"
        placeholderTextColor={kleuren.tekstGedimpt}
        multiline
      />

      <View style={stijlen.tableHeaderRij}>
        <Text style={[stijlen.tableHeader, { width: 32, textAlign: 'center', color: kleuren.tekstGedimpt }]}>SET</Text>
        {toonGewicht && <Text style={[stijlen.tableHeader, { flex: 1, textAlign: 'center', color: kleuren.tekstGedimpt }]}>KG</Text>}
        <Text style={[stijlen.tableHeader, { flex: 1, textAlign: 'center', color: kleuren.tekstGedimpt }]}>
          {toonTijd ? 'TIJD' : 'REPS'}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {item.sets.map((set, setIndex) => (
        <SetRij
          key={set.id}
          set={set}
          setIndex={setIndex}
          toonGewicht={toonGewicht}
          onWijzig={(veld: any, waarde: any) => onWijzigSet(index, setIndex, veld, waarde)}
          onVerwijder={(setId: string) => onVerwijderSet(index, setId)}
          kleuren={kleuren}
        />
      ))}

      <TouchableOpacity
        style={[
          stijlen.addSetKnop,
          { backgroundColor: kleuren.achtergrondSecundair, borderColor: kleuren.kaartRand },
          WEB_POINTER,
        ]}
        onPress={() => onVoegSetToe(index)}
        activeOpacity={0.75}
      >
        <Ionicons name="add" size={16} color={kleuren.accentLicht} style={{ marginRight: 6 }} />
        <Text style={{ color: kleuren.tekst, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>Set toevoegen</Text>
      </TouchableOpacity>

      <View style={[stijlen.rustRij, { borderTopColor: kleuren.kaartRand }]}>
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
                    backgroundColor: actief ? kleuren.accentGedimpt : kleuren.achtergrondSecundair,
                    borderColor: actief ? kleuren.accent : kleuren.kaartRand,
                  },
                  WEB_POINTER,
                ]}
                onPress={() => onWijzigRustTijd(index, opt.seconden)}
              >
                <Text style={{ color: actief ? kleuren.accentLicht : kleuren.tekstSecundair, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[
              stijlen.rustKnop,
              {
                backgroundColor: !isPresetActief ? kleuren.accentGedimpt : kleuren.achtergrondSecundair,
                borderColor: !isPresetActief ? kleuren.accent : kleuren.kaartRand,
              },
              WEB_POINTER,
            ]}
            onPress={() => onOpenCustomRust(index, huidigeRust)}
          >
            <Text style={{ color: !isPresetActief ? kleuren.accentLicht : kleuren.tekstSecundair, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>
              {!isPresetActief ? `${huidigeRust}s (Aangepast)` : '+ Aangepast'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

interface ReorderRowProps {
  item: LokaleOefening;
  index: number;
  positions: import('react-native-reanimated').SharedValue<Record<string, number>>;
  totaal: number;
  onVerwijder: (key: string) => void;
  onVerplaats: (index: number, richting: -1 | 1) => void;
  onDragEnd: (volgordeIds: string[]) => void;
  kleuren: any;
  itemHoogte: number;
}

function ReorderRow({
  item, index, positions, totaal, onVerwijder, onVerplaats, onDragEnd, kleuren, itemHoogte,
}: ReorderRowProps) {
  const oefInfo = findExercise(item.id);
  const id = item._key;
  const mediaUri = oefInfo?.image_url || getMediaUrl(oefInfo?.image);

  const isDragging = useSharedValue(false);
  const top = useSharedValue((positions.value[id] ?? index) * itemHoogte);
  const initialIndex = useSharedValue(index);

  useEffect(() => {
    top.value = withTiming(index * itemHoogte, { duration: 150 });
  }, [index, itemHoogte, top]);

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
    backgroundColor: isDragging.value ? kleuren.achtergrondSecundair : kleuren.kaart,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: isDragging.value ? kleuren.accent : kleuren.kaartRand,
    justifyContent: 'center',
  }));

  return (
    <Animated.View style={animStyle}>
      <View style={[stijlen.reorderRij, { height: '100%' }]}>
        <TouchableOpacity style={[stijlen.reorderVerwijder, WEB_POINTER]} onPress={() => onVerwijder(id)}>
          <Ionicons name="remove-circle" size={22} color={kleuren.fout} />
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

        {Platform.OS === 'web' ? (
          <View style={stijlen.webMoveKnoppen}>
            <TouchableOpacity
              style={[
                stijlen.webMoveKnop,
                { backgroundColor: kleuren.achtergrondSecundair, borderColor: kleuren.kaartRand, opacity: index === 0 ? 0.35 : 1 },
                WEB_POINTER,
              ]}
              onPress={() => onVerplaats(index, -1)}
              disabled={index === 0}
              accessibilityLabel="Omhoog verplaatsen"
            >
              <Ionicons name="chevron-up" size={16} color={kleuren.tekst} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                stijlen.webMoveKnop,
                { backgroundColor: kleuren.achtergrondSecundair, borderColor: kleuren.kaartRand, opacity: index === totaal - 1 ? 0.35 : 1 },
                WEB_POINTER,
              ]}
              onPress={() => onVerplaats(index, 1)}
              disabled={index === totaal - 1}
              accessibilityLabel="Omlaag verplaatsen"
            >
              <Ionicons name="chevron-down" size={16} color={kleuren.tekst} />
            </TouchableOpacity>
          </View>
        ) : (
          <GestureDetector gesture={dragGesture}>
            <View style={stijlen.reorderHandle} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="reorder-three-outline" size={26} color={kleuren.tekstGedimpt} />
            </View>
          </GestureDetector>
        )}
      </View>
    </Animated.View>
  );
}

export default function RoutineBuilder({ zichtbaar, initialRoutine, onOpslaan, onSluiten }: RoutineBuilderProps) {
  const { kleuren } = useThema();
  const { isDesktop, isTablet, height } = useResponsive();
  const isDialog = isDesktop || isTablet;

  const [naam, setNaam] = useState('');
  const [oefeningen, setOefeningen] = useState<LokaleOefening[]>([]);
  const [selectorZichtbaar, setSelectorZichtbaar] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const [guideModal, setGuideModal] = useState<{ zichtbaar: boolean; oefeningId: string; oefeningNaam?: string }>({
    zichtbaar: false,
    oefeningId: '',
    oefeningNaam: '',
  });

  const [customRustState, setCustomRustState] = useState<{ zichtbaar: boolean; oefIndex: number; waarde: string }>({
    zichtbaar: false,
    oefIndex: 0,
    waarde: '',
  });

  const positions = useSharedValue<Record<string, number>>({});
  const REORDER_ITEM_HOOGTE = 66;

  useEffect(() => {
    if (!zichtbaar || Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (selectorZichtbaar || guideModal.zichtbaar || customRustState.zichtbaar) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isReordering) setIsReordering(false);
        else onSluiten();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zichtbaar, isReordering, selectorZichtbaar, guideModal.zichtbaar, customRustState.zichtbaar, onSluiten]);

  useEffect(() => {
    if (isReordering) {
      const pos: Record<string, number> = {};
      oefeningen.forEach((item, index) => {
        pos[item._key] = index;
      });
      positions.value = pos;
    }
  }, [isReordering, oefeningen]);

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

  const verplaatsOefening = useCallback((index: number, richting: -1 | 1) => {
    setOefeningen(prev => {
      const doel = index + richting;
      if (doel < 0 || doel >= prev.length) return prev;
      const kopie = [...prev];
      const [item] = kopie.splice(index, 1);
      kopie.splice(doel, 0, item);
      return kopie;
    });
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
      toonAlert('Ongeldige tijd', 'Voer een tijd in tussen 5 en 600 seconden.');
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
      toonAlert('Naam verplicht', 'Geef je routine een naam.');
      return;
    }
    if (oefeningen.length === 0) {
      toonAlert('Geen oefeningen', 'Voeg minimaal één oefening toe.');
      return;
    }

    const schoneOefeningen = oefeningen.map(({ _key, ...rest }) => rest);

    await saveRoutine({
      id: initialRoutine ? initialRoutine.id : Date.now().toString(),
      naam: naam.trim(),
      oefeningen: schoneOefeningen,
    });
    onOpslaan();
    onSluiten();
  }

  const containerStyle = [
    stijlen.modalContainer,
    {
      backgroundColor: kleuren.achtergrond,
      borderColor: kleuren.kaartRand,
      height: isDialog ? Math.min(height * 0.88, 820) : '92%',
    },
    isDialog ? stijlen.dialogContainer : stijlen.sheetContainer,
    SHADOWS.forTheme(kleuren.isDark, 'lg'),
  ];

  if (isReordering) {
    return (
      <Modal
        visible={zichtbaar}
        animationType={Platform.OS === 'web' || isDialog ? 'fade' : 'slide'}
        transparent
        onRequestClose={() => setIsReordering(false)}
        statusBarTranslucent
      >
        <View style={[stijlen.overlay, isDialog ? stijlen.overlayDialog : stijlen.overlaySheet]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsReordering(false)} />
          <View style={containerStyle}>
            {!isDialog && (
              <View style={stijlen.handvatWrap}>
                <View style={[stijlen.handvat, { backgroundColor: kleuren.kaartRand }]} />
              </View>
            )}
            <View style={[stijlen.header, { borderBottomColor: kleuren.kaartRand }]}>
              <View style={{ width: 64 }} />
              <Text style={[stijlen.headerTitel, { color: kleuren.tekst }]}>Volgorde aanpassen</Text>
              <View style={{ width: 64 }} />
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              <View style={{ height: oefeningen.length * REORDER_ITEM_HOOGTE, position: 'relative', margin: 16 }}>
                {oefeningen.map((item, idx) => (
                  <ReorderRow
                    key={item._key}
                    item={item}
                    index={idx}
                    positions={positions}
                    totaal={oefeningen.length}
                    onVerwijder={verwijderOefeningByKey}
                    onVerplaats={verplaatsOefening}
                    onDragEnd={handleDragEnd}
                    kleuren={kleuren}
                    itemHoogte={REORDER_ITEM_HOOGTE}
                  />
                ))}
              </View>
            </ScrollView>

            <View style={[stijlen.footer, { borderTopColor: kleuren.kaartRand }]}>
              <TouchableOpacity
                style={[stijlen.doneKnop, { backgroundColor: kleuren.accent }, WEB_POINTER]}
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
    <Modal
      visible={zichtbaar}
      animationType={Platform.OS === 'web' || isDialog ? 'fade' : 'slide'}
      transparent
      onRequestClose={onSluiten}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[stijlen.overlay, isDialog ? stijlen.overlayDialog : stijlen.overlaySheet]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onSluiten} />

        <View style={containerStyle}>
          {!isDialog && (
            <View style={stijlen.handvatWrap}>
              <View style={[stijlen.handvat, { backgroundColor: kleuren.kaartRand }]} />
            </View>
          )}

          <View style={[stijlen.header, { borderBottomColor: kleuren.kaartRand }]}>
            <TouchableOpacity onPress={onSluiten} style={[stijlen.headerKnop, WEB_POINTER]}>
              <Text style={{ color: kleuren.tekstSecundair, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>
                Annuleer
              </Text>
            </TouchableOpacity>
            <Text style={[stijlen.headerTitel, { color: kleuren.tekst }]}>
              {initialRoutine ? 'Routine aanpassen' : 'Nieuwe routine'}
            </Text>
            <TouchableOpacity
              onPress={handleOpslaan}
              style={[stijlen.opslaanHeaderKnop, { backgroundColor: kleuren.accent }, WEB_POINTER]}
            >
              <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_700Bold', fontSize: 13 }}>Opslaan</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={stijlen.scrollInhoud} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={stijlen.sectie}>
              <Text style={[stijlen.veldLabel, { color: kleuren.tekstGedimpt }]}>NAAM VAN ROUTINE</Text>
              <TextInput
                style={[
                  stijlen.naamInput,
                  { color: kleuren.tekst, backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand },
                ]}
                placeholder="Bijv. Push Dag, Upper Body..."
                placeholderTextColor={kleuren.tekstGedimpt}
                value={naam}
                onChangeText={setNaam}
              />
            </View>

            <View style={stijlen.sectieHeaderRij}>
              <Text style={[stijlen.sectieLabel, { color: kleuren.tekstGedimpt }]}>
                OEFENINGEN ({oefeningen.length})
              </Text>
              {oefeningen.length > 1 && (
                <TouchableOpacity
                  onPress={() => setIsReordering(true)}
                  style={[stijlen.reorderTrigger, { backgroundColor: kleuren.accentGedimpt }, WEB_POINTER]}
                >
                  <Ionicons name="swap-vertical" size={14} color={kleuren.accentLicht} />
                  <Text style={{ color: kleuren.accentLicht, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>
                    Volgorde
                  </Text>
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
              style={[
                stijlen.groteVoegToeKnop,
                { borderColor: kleuren.accent, backgroundColor: kleuren.accentGedimpt },
                WEB_POINTER,
              ]}
              onPress={() => setSelectorZichtbaar(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle" size={20} color={kleuren.accentLicht} style={{ marginRight: 8 }} />
              <Text style={[stijlen.groteVoegToeTekst, { color: kleuren.accentLicht }]}>Oefening toevoegen</Text>
            </TouchableOpacity>

            <View style={{ height: 32 }} />
          </ScrollView>

          <ExerciseSelector
            zichtbaar={selectorZichtbaar}
            huidigeSelectie=""
            onSelecteer={voegOefeningToe}
            onSluiten={() => setSelectorZichtbaar(false)}
          />

          <ExerciseGuideModal
            zichtbaar={guideModal.zichtbaar}
            oefeningId={guideModal.oefeningId}
            oefeningNaam={guideModal.oefeningNaam}
            onSluiten={() => setGuideModal({ zichtbaar: false, oefeningId: '', oefeningNaam: '' })}
          />

          <Modal
            visible={customRustState.zichtbaar}
            transparent
            animationType="fade"
            onRequestClose={() => setCustomRustState({ zichtbaar: false, oefIndex: 0, waarde: '' })}
          >
            <View style={stijlen.customModalOverlay}>
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={() => setCustomRustState({ zichtbaar: false, oefIndex: 0, waarde: '' })}
              />
              <View
                style={[
                  stijlen.customModalBox,
                  { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand },
                  SHADOWS.forTheme(kleuren.isDark, 'lg'),
                ]}
              >
                <Text style={[stijlen.customModalTitel, { color: kleuren.tekst }]}>Aangepaste rusttijd</Text>
                <Text style={[stijlen.customModalSub, { color: kleuren.tekstSecundair }]}>
                  Voer het aantal seconden rust in voor deze oefening (5 – 600s):
                </Text>

                <TextInput
                  style={[
                    stijlen.customInput,
                    { backgroundColor: kleuren.achtergrondSecundair, borderColor: kleuren.kaartRand, color: kleuren.tekst },
                  ]}
                  keyboardType="numeric"
                  placeholder="bijv. 75"
                  placeholderTextColor={kleuren.tekstGedimpt}
                  value={customRustState.waarde}
                  onChangeText={(val) => setCustomRustState(p => ({ ...p, waarde: val }))}
                  autoFocus
                />

                <View style={stijlen.customModalKnoppen}>
                  <TouchableOpacity
                    style={[
                      stijlen.customModalKnop,
                      { backgroundColor: kleuren.achtergrondSecundair, borderColor: kleuren.kaartRand },
                      WEB_POINTER,
                    ]}
                    onPress={() => setCustomRustState({ zichtbaar: false, oefIndex: 0, waarde: '' })}
                  >
                    <Text style={{ color: kleuren.tekstSecundair, fontFamily: 'Inter_600SemiBold' }}>Annuleren</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      stijlen.customModalKnop,
                      { backgroundColor: kleuren.accent, borderColor: kleuren.accent },
                      WEB_POINTER,
                    ]}
                    onPress={bewaarCustomRust}
                  >
                    <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_700Bold' }}>Opslaan</Text>
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
  modalContainer: {
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
    maxWidth: 640,
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
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitel: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.2,
  },
  headerKnop: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  opslaanHeaderKnop: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  scrollInhoud: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectie: {
    marginTop: 16,
    marginBottom: 8,
  },
  veldLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  naamInput: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sectieHeaderRij: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  sectieLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.1,
  },
  reorderTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  oefKaart: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: 15,
    marginBottom: 14,
  },
  oefHeaderNormaal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  thumbContainer: {
    width: 42,
    height: 42,
    borderRadius: 11,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbContainerSmall: {
    width: 36,
    height: 36,
    borderRadius: 9,
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
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  headerActies: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actieIcoonKnop: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notitiesInput: {
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 12,
    minHeight: 38,
  },
  tableHeaderRij: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
    gap: 8,
  },
  tableHeader: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.9,
  },
  setRij: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
    gap: 8,
  },
  setNummerBadge: {
    width: 32,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNummer: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  setMiniInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 8,
    textAlign: 'center',
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  verwijderSetKnop: {
    width: 32,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSetKnop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 6,
  },
  rustRij: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  rustLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  rustKnop: {
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 8,
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
  webMoveKnoppen: {
    flexDirection: 'row',
    gap: 6,
  },
  webMoveKnop: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groteVoegToeKnop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: 4,
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
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  doneTekst: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  customModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  customModalBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: 22,
  },
  customModalTitel: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    marginBottom: 6,
  },
  customModalSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
    marginBottom: 16,
  },
  customInput: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: 16,
    fontVariant: ['tabular-nums'],
  },
  customModalKnoppen: {
    flexDirection: 'row',
    gap: 10,
  },
  customModalKnop: {
    flex: 1,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
});
