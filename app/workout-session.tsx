import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, Image, Platform, type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useThema } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import {
  useLiveWorkout, formatTijd, bereken1RM,
  type LiveSet, type LiveOefening, type SetType,
} from '../src/context/LiveWorkoutContext';
import { useOpslaanWorkout, useVorigeSessie } from '../src/hooks/useWorkouts';
import { findExercise, getMediaUrl } from '../src/data/exercises';
import ExerciseSelector from '../src/components/ExerciseSelector';
import { berekenVolume, berekenArbeid } from '../src/utils/physics';
import { genereerUuid } from '../src/utils/sessieGroepering';
import WarmupModal from '../src/components/WarmupModal';
import PrCelebratie from '../src/components/PrCelebratie';
import WorkoutSamenvatting, { type WorkoutSamenvattingData } from '../src/components/WorkoutSamenvatting';
import ExerciseGuideModal from '../src/components/ExerciseGuideModal';
import { getDefaultRestTime } from '../src/lib/settingsStore';
import { getRoutines, saveRoutine } from '../src/lib/routineStore';
import type { NieuweWorkout } from '../src/types';
import { supabase } from '../src/lib/supabase';
import { ResponsiveContainer } from '../src/components/ui/ResponsiveContainer';
import { Card } from '../src/components/ui/Card';
import { BottomSheet } from '../src/components/ui/BottomSheet';
import { PrimaryButton } from '../src/components/ui/PrimaryButton';
import { RADIUS, SPACING, SHADOWS, useResponsive } from '../src/theme/designTokens';

const WEB_POINTER = Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : undefined;

function setTypeConfig(kleuren: any): Record<SetType, { label: string; kleur: string; beschrijving: string }> {
  return {
    normaal: { label: '', kleur: kleuren.tekstSecundair, beschrijving: 'Standaard werkset' },
    warmup: { label: 'W', kleur: kleuren.warmup, beschrijving: 'Opwarmset (telt niet voor PR)' },
    dropset: { label: 'D', kleur: kleuren.dropset, beschrijving: 'Verlaag gewicht zonder rust' },
    failure: { label: 'F', kleur: kleuren.failure, beschrijving: 'Tot spierfalen getraind' },
  };
}

function SetTypeModal({
  zichtbaar, onSluiten, onKies, onVerwijder, huidigType, kleuren,
}: {
  zichtbaar: boolean;
  onSluiten: () => void;
  onKies: (t: SetType) => void;
  onVerwijder: () => void;
  huidigType: SetType;
  kleuren: any;
}) {
  const types: SetType[] = ['normaal', 'warmup', 'dropset', 'failure'];
  const labels: Record<SetType, string> = {
    normaal: 'Normaal',
    warmup: 'Warm-up (W)',
    dropset: 'Drop-set (D)',
    failure: 'Failure (F)',
  };
  const cfg = setTypeConfig(kleuren);

  return (
    <BottomSheet
      visible={zichtbaar}
      onClose={onSluiten}
      title="Set type"
      subtitle="Kies het type voor deze set of verwijder hem"
    >
      <View style={stm.lijst}>
        {types.map((t) => {
          const actief = huidigType === t;
          return (
            <TouchableOpacity
              key={t}
              style={[
                stm.optie,
                {
                  borderColor: actief ? kleuren.accent : kleuren.kaartRand,
                  backgroundColor: actief ? kleuren.accentGedimpt : kleuren.achtergrondSecundair,
                },
                WEB_POINTER,
              ]}
              onPress={() => {
                onKies(t);
                onSluiten();
              }}
              activeOpacity={0.75}
            >
              {cfg[t].label ? (
                <View style={[stm.typeBadge, { backgroundColor: cfg[t].kleur }]}>
                  <Text style={stm.typeBadgeTekst}>{cfg[t].label}</Text>
                </View>
              ) : (
                <View style={[stm.typeBadge, { backgroundColor: kleuren.kaartRand }]}>
                  <Text style={[stm.typeBadgeTekst, { color: kleuren.tekst }]}>#</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[stm.optieNaam, { color: kleuren.tekst }]}>{labels[t]}</Text>
                <Text style={[stm.optieSub, { color: kleuren.tekstGedimpt }]}>{cfg[t].beschrijving}</Text>
              </View>
              {actief && <Ionicons name="checkmark-circle" size={20} color={kleuren.accent} />}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[
            stm.verwijderKnop,
            { backgroundColor: kleuren.fout + '14', borderColor: kleuren.fout + '44' },
            WEB_POINTER,
          ]}
          onPress={() => {
            onVerwijder();
            onSluiten();
          }}
          activeOpacity={0.75}
        >
          <Ionicons name="trash-outline" size={18} color={kleuren.fout} />
          <Text style={[stm.verwijderTekst, { color: kleuren.fout }]}>Set verwijderen</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const stm = StyleSheet.create({
  lijst: { gap: 8 },
  optie: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  optieNaam: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  optieSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  typeBadge: {
    width: 32,
    height: 32,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadgeTekst: { color: '#FFF', fontSize: 13, fontFamily: 'Inter_700Bold' },
  verwijderKnop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: 6,
  },
  verwijderTekst: { fontSize: 15, fontFamily: 'Inter_700Bold' },
});

function OefeningOptiesModal({
  zichtbaar,
  oefeningNaam,
  toonWarmup,
  onSluiten,
  onUitleg,
  onWarmup,
  onVerwijder,
  kleuren,
}: {
  zichtbaar: boolean;
  oefeningNaam: string;
  toonWarmup: boolean;
  onSluiten: () => void;
  onUitleg: () => void;
  onWarmup: () => void;
  onVerwijder: () => void;
  kleuren: any;
}) {
  return (
    <BottomSheet
      visible={zichtbaar}
      onClose={onSluiten}
      title={oefeningNaam}
      subtitle="Oefening opties"
    >
      <View style={stm.lijst}>
        <TouchableOpacity
          style={[
            stm.optie,
            { borderColor: kleuren.kaartRand, backgroundColor: kleuren.achtergrondSecundair },
            WEB_POINTER,
          ]}
          onPress={() => {
            onSluiten();
            onUitleg();
          }}
          activeOpacity={0.75}
        >
          <View style={[stm.typeBadge, { backgroundColor: kleuren.accentGedimpt }]}>
            <Ionicons name="book-outline" size={17} color={kleuren.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[stm.optieNaam, { color: kleuren.tekst }]}>Oefening uitleg</Text>
            <Text style={[stm.optieSub, { color: kleuren.tekstGedimpt }]}>Bekijk beweging en stap-voor-stap instructies</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={kleuren.tekstGedimpt} />
        </TouchableOpacity>

        {toonWarmup && (
          <TouchableOpacity
            style={[
              stm.optie,
              { borderColor: kleuren.kaartRand, backgroundColor: kleuren.achtergrondSecundair },
              WEB_POINTER,
            ]}
            onPress={() => {
              onSluiten();
              onWarmup();
            }}
            activeOpacity={0.75}
          >
            <View style={[stm.typeBadge, { backgroundColor: kleuren.warmup + '22' }]}>
              <Ionicons name="flame-outline" size={17} color={kleuren.warmup} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[stm.optieNaam, { color: kleuren.tekst }]}>Opwarmsets berekenen</Text>
              <Text style={[stm.optieSub, { color: kleuren.tekstGedimpt }]}>Bereken 50%, 70% en 85% opwarmgewichten</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={kleuren.tekstGedimpt} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            stm.verwijderKnop,
            { backgroundColor: kleuren.fout + '14', borderColor: kleuren.fout + '44' },
            WEB_POINTER,
          ]}
          onPress={() => {
            onSluiten();
            onVerwijder();
          }}
          activeOpacity={0.75}
        >
          <Ionicons name="trash-outline" size={18} color={kleuren.fout} />
          <Text style={[stm.verwijderTekst, { color: kleuren.fout }]}>Oefening verwijderen</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

interface PrState {
  zichtbaar: boolean;
  oefeningNaam: string;
  eenRM: number;
}

function SetRij({
  set, index, oefeningId, toonGewicht, vorige, kleuren, bestaandePR, onNieuwPR, rustSeconden,
}: {
  set: LiveSet;
  index: number;
  oefeningId: string;
  toonGewicht: boolean;
  vorige: { reps: number; gewicht: number } | null | undefined;
  kleuren: any;
  bestaandePR: number;
  onNieuwPR: (eenRM: number) => void;
  rustSeconden: number;
}) {
  const { toggleSet, updateSet, setSetType, removeSet, startRustTimer } = useLiveWorkout();
  const [typeModal, setTypeModal] = useState(false);
  const [gewichtStr, setGewichtStr] = useState(set.gewicht > 0 ? String(set.gewicht) : '');
  const [repsStr, setRepsStr] = useState(set.reps > 0 ? String(set.reps) : '');
  const isCompleted = set.completed;
  const cfg = setTypeConfig(kleuren);

  useEffect(() => {
    if (!isCompleted && set.gewicht > 0) {
      setGewichtStr(String(set.gewicht));
    }
  }, [set.gewicht, isCompleted]);

  useEffect(() => {
    if (!isCompleted && set.reps > 0) {
      setRepsStr(String(set.reps));
    }
  }, [set.reps, isCompleted]);

  const fallbackGewicht = toonGewicht ? (vorige?.gewicht ?? 0) : 0;
  const fallbackReps = vorige?.reps ?? 0;

  const handleCheck = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    const rawGewicht = gewichtStr.trim();
    const rawReps = repsStr.trim();

    const gewicht = rawGewicht === ''
      ? fallbackGewicht
      : (parseFloat(rawGewicht.replace(',', '.')) || 0);
    const reps = rawReps === ''
      ? fallbackReps
      : (parseInt(rawReps, 10) || 0);

    if (rawGewicht === '' && fallbackGewicht > 0) {
      setGewichtStr(String(fallbackGewicht));
    }
    if (rawReps === '' && fallbackReps > 0) {
      setRepsStr(String(fallbackReps));
    }

    updateSet(oefeningId, set.id, 'gewicht', gewicht);
    updateSet(oefeningId, set.id, 'reps', reps);
    toggleSet(oefeningId, set.id);
    if (!isCompleted) {
      startRustTimer(rustSeconden);
      if (set.type !== 'warmup' && gewicht > 0 && reps > 0) {
        const nieuwEenRM = bereken1RM(gewicht, reps);
        if (nieuwEenRM > bestaandePR) {
          onNieuwPR(nieuwEenRM);
        }
      }
    }
  };

  const bgKleur = isCompleted
    ? kleuren.succes + '1C'
    : index % 2 === 1
      ? kleuren.achtergrondSecundair
      : 'transparent';
  const typeLabel = cfg[set.type].label || String(index + 1);
  const typeKleur = cfg[set.type].kleur;

  return (
    <View style={[sr.rij, { backgroundColor: bgKleur }]}>
      <TouchableOpacity
        onPress={() => setTypeModal(true)}
        style={[sr.nummerKnop, WEB_POINTER]}
        activeOpacity={0.7}
        accessibilityLabel={`Set ${index + 1} type wijzigen`}
      >
        <View
          style={[
            sr.nummerBadge,
            {
              backgroundColor: isCompleted
                ? kleuren.succes + '2A'
                : set.type === 'normaal'
                  ? kleuren.achtergrondSecundair
                  : typeKleur + '22',
              borderColor: isCompleted
                ? kleuren.succes + '55'
                : set.type === 'normaal'
                  ? kleuren.kaartRand
                  : typeKleur + '55',
            },
          ]}
        >
          <Text style={[sr.nummerTekst, { color: isCompleted ? kleuren.succes : typeKleur }]}>
            {typeLabel}
          </Text>
        </View>
      </TouchableOpacity>

      <Text style={[sr.vorige, { color: kleuren.tekstGedimpt }]} numberOfLines={1}>
        {vorige ? `${vorige.gewicht}×${vorige.reps}` : '—'}
      </Text>

      {toonGewicht && (
        <TextInput
          style={[
            sr.input,
            {
              color: isCompleted ? kleuren.succes : kleuren.tekst,
              backgroundColor: isCompleted ? 'transparent' : kleuren.achtergrondSecundair,
              borderColor: isCompleted ? 'transparent' : kleuren.kaartRand,
            },
          ]}
          value={gewichtStr}
          onChangeText={setGewichtStr}
          keyboardType="decimal-pad"
          placeholder={fallbackGewicht > 0 ? String(fallbackGewicht) : '0'}
          placeholderTextColor={kleuren.tekstGedimpt}
          editable={!isCompleted}
          selectTextOnFocus
          accessibilityLabel={`Gewicht in kg voor set ${index + 1}`}
        />
      )}

      <TextInput
        style={[
          sr.input,
          {
            color: isCompleted ? kleuren.succes : kleuren.tekst,
            backgroundColor: isCompleted ? 'transparent' : kleuren.achtergrondSecundair,
            borderColor: isCompleted ? 'transparent' : kleuren.kaartRand,
          },
        ]}
        value={repsStr}
        onChangeText={setRepsStr}
        keyboardType="number-pad"
        placeholder={fallbackReps > 0 ? String(fallbackReps) : '0'}
        placeholderTextColor={kleuren.tekstGedimpt}
        editable={!isCompleted}
        selectTextOnFocus
        accessibilityLabel={`Herhalingen voor set ${index + 1}`}
      />

      <TouchableOpacity
        onPress={handleCheck}
        style={[
          sr.checkKnop,
          {
            backgroundColor: isCompleted ? kleuren.succes : kleuren.achtergrondSecundair,
            borderColor: isCompleted ? kleuren.succes : kleuren.kaartRand,
          },
          WEB_POINTER,
        ]}
        activeOpacity={0.75}
        accessibilityLabel={isCompleted ? `Set ${index + 1} ongedaan maken` : `Set ${index + 1} voltooien`}
      >
        <Ionicons
          name="checkmark"
          size={18}
          color={isCompleted ? '#FFFFFF' : kleuren.tekstGedimpt}
        />
      </TouchableOpacity>

      <SetTypeModal
        zichtbaar={typeModal}
        onSluiten={() => setTypeModal(false)}
        onKies={(t) => setSetType(oefeningId, set.id, t)}
        onVerwijder={() => removeSet(oefeningId, set.id)}
        huidigType={set.type}
        kleuren={kleuren}
      />
    </View>
  );
}

const sr = StyleSheet.create({
  rij: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 8,
    borderRadius: 10,
    marginHorizontal: 6,
    marginBottom: 4,
  },
  nummerKnop: { width: 36, alignItems: 'center' },
  nummerBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nummerTekst: { fontSize: 13, fontFamily: 'Inter_700Bold', fontVariant: ['tabular-nums'] },
  vorige: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  input: {
    flex: 1.15,
    borderRadius: 9,
    borderWidth: 1,
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    fontVariant: ['tabular-nums'],
    minHeight: 38,
  },
  checkKnop: {
    width: 40,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

function OefeningKaart({
  oefening, kleuren, bestaandePRs, onNieuwPR, userId, rustSeconden,
}: {
  oefening: LiveOefening;
  kleuren: any;
  bestaandePRs: Record<string, number>;
  onNieuwPR: (oefeningId: string, eenRM: number) => void;
  userId: string | undefined;
  rustSeconden: number;
}) {
  const { addSet, removeOefening, updateNotitie } = useLiveWorkout();
  const info = findExercise(oefening.id);
  const toonGewicht = info?.type === 'gewicht';
  const [warmupZicht, setWarmupZicht] = useState(false);
  const [guideZicht, setGuideZicht] = useState(false);
  const [optiesZicht, setOptiesZicht] = useState(false);

  const { haalLaatsteOp, vorigeSessie, vorigeSets, vorigeWarmupSets } = useVorigeSessie(userId);
  const geladeLaatste = useRef(false);

  useEffect(() => {
    if (userId && !geladeLaatste.current) {
      geladeLaatste.current = true;
      haalLaatsteOp(oefening.id);
    }
  }, [userId, oefening.id, haalLaatsteOp]);

  const effectieveRust = oefening.rustTijd && oefening.rustTijd > 0 ? oefening.rustTijd : rustSeconden;

  const werkGewicht =
    oefening.sets.find(s => s.type === 'normaal' && s.gewicht > 0)?.gewicht
    ?? oefening.sets.find(s => s.gewicht > 0)?.gewicht
    ?? vorigeSets[0]?.gewicht
    ?? 0;
  const mediaUri = info?.image_url || (info?.image ? getMediaUrl(info.image) : '');
  const voltooideCount = oefening.sets.filter(s => s.completed).length;

  const openOefeningOpties = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setOptiesZicht(true);
  };

  return (
    <Card padding={0} style={ok.kaart}>
      <View style={ok.header}>
        <TouchableOpacity
          style={[ok.titelLinks, WEB_POINTER]}
          onPress={() => setGuideZicht(true)}
          activeOpacity={0.75}
        >
          <View style={[ok.thumbContainer, { backgroundColor: '#FFFFFF', borderColor: kleuren.kaartRand }]}>
            {mediaUri ? (
              <Image source={{ uri: mediaUri }} style={ok.thumbImage} resizeMode="contain" />
            ) : (
              <Ionicons name={(info?.icoon as any) || 'barbell-outline'} size={20} color={kleuren.accent} />
            )}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[ok.naam, { color: kleuren.tekst }]} numberOfLines={1}>
              {info?.naam || oefening.id}
            </Text>
            <Text style={[ok.subMeta, { color: kleuren.tekstGedimpt }]} numberOfLines={1}>
              {info?.groep ? `${info.groep} • ` : ''}{voltooideCount}/{oefening.sets.length} sets voltooid
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            ok.optieKnop,
            { backgroundColor: kleuren.achtergrondSecundair, borderColor: kleuren.kaartRand },
            WEB_POINTER,
          ]}
          onPress={openOefeningOpties}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Oefening opties"
        >
          <Ionicons name="ellipsis-horizontal" size={18} color={kleuren.tekstSecundair} />
        </TouchableOpacity>
      </View>

      <View style={ok.notitieWrap}>
        <Ionicons name="create-outline" size={14} color={kleuren.tekstGedimpt} />
        <TextInput
          style={[ok.notitieInput, { color: kleuren.tekstSecundair }]}
          value={oefening.notitie ?? ''}
          onChangeText={(tekst) => updateNotitie(oefening.id, tekst)}
          placeholder="Notitie toevoegen..."
          placeholderTextColor={kleuren.tekstGedimpt}
          multiline={false}
          returnKeyType="done"
          accessibilityLabel={`Notitie voor ${info?.naam || oefening.id}`}
        />
      </View>

      <View style={[ok.kolomHeaders, { borderTopColor: kleuren.kaartRand }]}>
        <Text style={[ok.kolomHeader, { color: kleuren.tekstGedimpt, width: 36, textAlign: 'center' }]}>SET</Text>
        <Text style={[ok.kolomHeader, { color: kleuren.tekstGedimpt, flex: 1, textAlign: 'center' }]}>VORIG</Text>
        {toonGewicht && (
          <Text style={[ok.kolomHeader, { color: kleuren.tekstGedimpt, flex: 1.15, textAlign: 'center' }]}>KG</Text>
        )}
        <Text style={[ok.kolomHeader, { color: kleuren.tekstGedimpt, flex: 1.15, textAlign: 'center' }]}>REPS</Text>
        <View style={{ width: 40, alignItems: 'center' }}>
          <Ionicons name="checkmark" size={13} color={kleuren.tekstGedimpt} />
        </View>
      </View>

      <View style={{ paddingVertical: 4 }}>
        {(() => {
          let werkTeller = 0;
          let warmupTeller = 0;
          return oefening.sets.map((set, i) => {
            let vorigPunt = set.vorige ?? null;
            if (!vorigPunt) {
              if (set.type === 'warmup') {
                const matchWarmup = vorigeWarmupSets[warmupTeller];
                warmupTeller++;
                if (matchWarmup) {
                  vorigPunt = { gewicht: matchWarmup.gewicht, reps: matchWarmup.reps };
                }
              } else {
                const matchWerk =
                  vorigeSets[werkTeller] ??
                  (vorigeSets.length === 1 ? vorigeSets[0] : undefined);
                werkTeller++;
                if (matchWerk) {
                  vorigPunt = { gewicht: matchWerk.gewicht, reps: matchWerk.reps };
                } else if (vorigeSets.length === 0 && vorigeSessie) {
                  vorigPunt = {
                    gewicht: Number(vorigeSessie.weight),
                    reps: Number(vorigeSessie.reps),
                  };
                }
              }
            }

            return (
              <SetRij
                key={set.id}
                set={set}
                index={i}
                oefeningId={oefening.id}
                toonGewicht={toonGewicht}
                vorige={vorigPunt}
                kleuren={kleuren}
                bestaandePR={bestaandePRs[oefening.id] ?? 0}
                onNieuwPR={(eenRM) => onNieuwPR(oefening.id, eenRM)}
                rustSeconden={effectieveRust}
              />
            );
          });
        })()}
      </View>

      <View style={ok.footer}>
        <TouchableOpacity
          style={[
            ok.addSetKnop,
            {
              backgroundColor: kleuren.achtergrondSecundair,
              borderColor: kleuren.kaartRand,
            },
            WEB_POINTER,
          ]}
          onPress={() => addSet(oefening.id)}
          activeOpacity={0.75}
        >
          <Ionicons name="add" size={17} color={kleuren.accentLicht} />
          <Text style={[ok.addSetTekst, { color: kleuren.tekst }]}>Set toevoegen</Text>
        </TouchableOpacity>
      </View>

      <OefeningOptiesModal
        zichtbaar={optiesZicht}
        oefeningNaam={info?.naam || oefening.id}
        toonWarmup={toonGewicht}
        onSluiten={() => setOptiesZicht(false)}
        onUitleg={() => setGuideZicht(true)}
        onWarmup={() => setWarmupZicht(true)}
        onVerwijder={() => removeOefening(oefening.id)}
        kleuren={kleuren}
      />

      <WarmupModal
        zichtbaar={warmupZicht}
        onSluiten={() => setWarmupZicht(false)}
        werkGewicht={werkGewicht > 0 ? werkGewicht : 20}
        oefeningNaam={info?.naam ?? oefening.id}
      />

      <ExerciseGuideModal
        zichtbaar={guideZicht}
        onSluiten={() => setGuideZicht(false)}
        oefeningId={oefening.id}
        oefeningNaam={info?.naam}
      />
    </Card>
  );
}

const ok = StyleSheet.create({
  kaart: {
    marginBottom: SPACING.base,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.base,
    paddingBottom: SPACING.sm,
    gap: 12,
  },
  titelLinks: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
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
  thumbImage: { width: '100%', height: '100%' },
  naam: { fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: -0.2 },
  subMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  optieKnop: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notitieWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.md,
  },
  notitieInput: {
    flex: 1,
    paddingVertical: 4,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  kolomHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
    borderTopWidth: 1,
    gap: 8,
  },
  kolomHeader: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.9 },
  footer: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.base,
  },
  addSetKnop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addSetTekst: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
});

export default function WorkoutSession() {
  const router = useRouter();
  const { kleuren } = useThema();
  const { user } = useAuth();
  const { isMobile, contentPadding } = useResponsive();
  const { slaOp, laden: ladenOpslaan, fout: foutOpslaan } = useOpslaanWorkout();
  const {
    isActief, routineNaam, routineId, oefeningen, verlopenTijd,
    stopWorkout, rustTimerLoopt, rustTimerResterend, rustTimerDuur,
    pasRustTimerAan, stopRustTimer, addOefening,
  } = useLiveWorkout();

  const [selectorZicht, setSelectorZicht] = useState(false);
  const [rustTijdInstelling, setRustTijdInstelling] = useState(120);
  const [bestaandePRs, setBestaandePRs] = useState<Record<string, number>>({});
  const [prState, setPrState] = useState<PrState>({ zichtbaar: false, oefeningNaam: '', eenRM: 0 });
  const [samenvattingData, setSamenvattingData] = useState<WorkoutSamenvattingData | null>(null);
  const verlatenRef = useRef(false);

  const veiligTerug = useCallback(() => {
    if (verlatenRef.current) return;
    verlatenRef.current = true;
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/workout');
    }
  }, [router]);

  useEffect(() => {
    if (foutOpslaan) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`Opslaan mislukt\n\n${foutOpslaan}`);
      } else {
        Alert.alert('Opslaan mislukt', foutOpslaan);
      }
    }
  }, [foutOpslaan]);

  useEffect(() => {
    if (!isActief && !verlatenRef.current) {
      verlatenRef.current = true;
      router.replace('/(tabs)/workout');
    }
  }, [isActief, router]);

  useEffect(() => {
    getDefaultRestTime().then(setRustTijdInstelling);
  }, []);

  useEffect(() => {
    if (!user?.id || oefeningen.length === 0) return;
    const oefeningIds = oefeningen.map(o => o.id);
    supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .in('exercise', oefeningIds)
      .then(({ data }) => {
        if (!data) return;
        const prs: Record<string, number> = {};
        for (const row of data) {
          if (row.set_type === 'warmup') continue;
          const eenRM = bereken1RM(Number(row.weight), Number(row.reps));
          if (!prs[row.exercise] || eenRM > prs[row.exercise]) {
            prs[row.exercise] = eenRM;
          }
        }
        setBestaandePRs(prs);
      });
  }, [user?.id, oefeningen.length]);

  const handleNieuwPR = useCallback((oefeningId: string, eenRM: number) => {
    const info = findExercise(oefeningId);
    setPrState({ zichtbaar: true, oefeningNaam: info?.naam ?? oefeningId, eenRM });
    setBestaandePRs(prev => ({ ...prev, [oefeningId]: eenRM }));
  }, []);

  const berekenSamenvatting = useCallback((): WorkoutSamenvattingData => {
    const voltooidesets = oefeningen.reduce((acc, o) => acc + o.sets.filter(s => s.completed).length, 0);
    let totaalVolume = 0;
    let totaalJoules = 0;
    const prLijst: { oefeningNaam: string; eenRM: number }[] = [];
    const afgemerkteOefeningIds = new Set<string>();

    for (const o of oefeningen) {
      const voltooid = o.sets.filter(s => s.completed);
      for (const s of voltooid) {
        totaalVolume += berekenVolume(1, s.reps, s.gewicht);
        totaalJoules += berekenArbeid(o.id, s.reps, s.gewicht);
        const eenRM = bereken1RM(s.gewicht, s.reps);
        const oud = bestaandePRs[o.id] ?? 0;
        if (s.type !== 'warmup' && eenRM > oud && !afgemerkteOefeningIds.has(o.id)) {
          const info = findExercise(o.id);
          prLijst.push({ oefeningNaam: info?.naam ?? o.id, eenRM });
          afgemerkteOefeningIds.add(o.id);
        }
      }
    }
    return { duurSeconden: verlopenTijd, voltooidesets, totaalVolume, totaalJoules, prs: prLijst };
  }, [oefeningen, verlopenTijd, bestaandePRs]);

  const handleAfronden = useCallback(() => {
    const samenvatting = berekenSamenvatting();
    setSamenvattingData(samenvatting);
  }, [berekenSamenvatting]);

  const handleOpslaanEnAfsluiten = useCallback(async () => {
    if (!user?.id) return;
    const vandaag = new Date().toISOString().split('T')[0];
    const sessionId = genereerUuid();

    // Optie 1: sla elke voltooide set als een eigen losse rij op (0% dataverlies)
    const workoutsData: NieuweWorkout[] = oefeningen.flatMap((o) => {
      const voltooideSets = o.sets.filter(s => s.completed);
      if (voltooideSets.length === 0) return [];
      const notitieSchoon = o.notitie?.trim() ? o.notitie.trim() : null;

      return voltooideSets.map((s, idx): NieuweWorkout => ({
        user_id: user.id,
        date: vandaag,
        exercise: o.id,
        sets: 1,
        reps: s.reps,
        weight: s.gewicht,
        volume: parseFloat(berekenVolume(1, s.reps, s.gewicht).toFixed(2)),
        work_joules: parseFloat(berekenArbeid(o.id, s.reps, s.gewicht).toFixed(2)),
        rpe: s.rpe ?? null,
        prescribed_sets: null,
        prescribed_reps: null,
        prescribed_weight: null,
        is_meting: false,
        test_moment: null,
        session_id: sessionId,
        set_number: idx + 1,
        set_type: s.type,
        notitie: idx === 0 ? notitieSchoon : null,
      }));
    });

    if (workoutsData.length > 0) {
      const gelukt = await slaOp(workoutsData);
      if (!gelukt) return;
    }

    if (routineId) {
      try {
        const routines = await getRoutines();
        const bestaandeRoutine = routines.find(r => r.id === routineId);
        if (bestaandeRoutine) {
          const bijgewerkteOefeningen = bestaandeRoutine.oefeningen.map(ro => {
            const liveOef = oefeningen.find(o => o.id === ro.id);
            if (!liveOef) return ro;
            const werkSets = liveOef.sets.filter(setItem => setItem.completed && setItem.type !== 'warmup');
            const bronSets = werkSets.length > 0 ? werkSets : liveOef.sets.filter(setItem => setItem.completed);
            if (bronSets.length === 0) return ro;
            const nieuwSets = ro.sets.map((rs, idx) => {
              const bron = bronSets[idx] ?? bronSets[bronSets.length - 1];
              return {
                ...rs,
                gewicht: bron ? bron.gewicht : rs.gewicht,
                reps: bron && bron.reps > 0 ? bron.reps : rs.reps,
              };
            });
            return { ...ro, sets: nieuwSets };
          });
          await saveRoutine({ ...bestaandeRoutine, oefeningen: bijgewerkteOefeningen });
        }
      } catch (err) {
        console.warn('Kon routine-gewichten niet bijwerken:', err);
      }
    }

    setSamenvattingData(null);
    verlatenRef.current = true;
    stopWorkout();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/workout');
    }
  }, [oefeningen, routineId, user?.id, slaOp, stopWorkout, router]);

  const handleAnnuleerWorkout = useCallback(() => {
    const voerAnnulerenUit = () => {
      verlatenRef.current = true;
      stopWorkout();
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/workout');
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const bevestigd = window.confirm(
        'Workout annuleren?\n\nWeet je zeker dat je deze training wilt verwijderen zonder op te slaan?'
      );
      if (bevestigd) {
        voerAnnulerenUit();
      }
      return;
    }

    Alert.alert(
      'Workout annuleren?',
      'Weet je zeker dat je deze training wilt verwijderen zonder op te slaan?',
      [
        { text: 'Doorgaan', style: 'cancel' },
        {
          text: 'Verwijderen',
          style: 'destructive',
          onPress: voerAnnulerenUit,
        },
      ]
    );
  }, [stopWorkout, router]);

  const handleOefeningToevoegen = (oefeningId: string) => {
    addOefening(oefeningId);
    setSelectorZicht(false);
  };

  if (!isActief) return null;

  const liveTotaalSets = oefeningen.reduce((acc, o) => acc + o.sets.length, 0);
  const liveVoltooideSets = oefeningen.reduce(
    (acc, o) => acc + o.sets.filter(setItem => setItem.completed).length,
    0
  );
  const liveVolume = oefeningen.reduce(
    (acc, o) =>
      acc +
      o.sets
        .filter(setItem => setItem.completed)
        .reduce((som, setItem) => som + berekenVolume(1, setItem.reps, setItem.gewicht), 0),
    0
  );
  const rustVoortgangPct = Math.max(
    0,
    Math.min(100, (rustTimerResterend / Math.max(1, rustTimerDuur)) * 100)
  );

  return (
    <SafeAreaView style={[s.veilig, { backgroundColor: kleuren.achtergrond }]}>
      {/* Sticky Top Header Bar */}
      <View
        style={[
          s.headerWrapper,
          { backgroundColor: kleuren.achtergrondSecundair, borderBottomColor: kleuren.kaartRand },
        ]}
      >
        <ResponsiveContainer maxWidth={780}>
          <View style={[s.header, { paddingHorizontal: contentPadding }]}>
            <TouchableOpacity
              style={[
                s.minimaliseerKnop,
                { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand },
                WEB_POINTER,
              ]}
              onPress={veiligTerug}
              accessibilityLabel="Workout minimaliseren"
            >
              <Ionicons name="chevron-down" size={20} color={kleuren.tekstSecundair} />
            </TouchableOpacity>

            <View style={s.headerMidden}>
              <Text style={[s.routineNaam, { color: kleuren.tekst }]} numberOfLines={1}>
                {routineNaam}
              </Text>
              <View style={s.liveTimerPil}>
                <View style={[s.liveDot, { backgroundColor: kleuren.succes }]} />
                <Text style={[s.liveTimerTekst, { color: kleuren.accentLicht }]}>
                  {formatTijd(verlopenTijd)}
                </Text>
              </View>
            </View>

            <View style={s.headerActies}>
              <TouchableOpacity
                style={[
                  s.annuleerHeaderKnop,
                  { backgroundColor: kleuren.fout + '14', borderColor: kleuren.fout + '40' },
                  WEB_POINTER,
                ]}
                onPress={handleAnnuleerWorkout}
                activeOpacity={0.75}
                accessibilityLabel="Workout annuleren"
              >
                <Ionicons name="close" size={16} color={kleuren.fout} />
                {!isMobile && (
                  <Text style={[s.annuleerHeaderTekst, { color: kleuren.fout }]}>Annuleren</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  s.afrondenKnop,
                  { backgroundColor: kleuren.succes },
                  WEB_POINTER,
                ]}
                onPress={handleAfronden}
                disabled={ladenOpslaan}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                <Text style={s.afrondenTekst}>Afronden</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Live Summary Strip */}
          <View style={[s.statsBalk, { borderTopColor: kleuren.kaartRand, paddingHorizontal: contentPadding }]}>
            <View style={s.statItem}>
              <Text style={[s.statLabel, { color: kleuren.tekstGedimpt }]}>TIJD</Text>
              <Text style={[s.statWaarde, { color: kleuren.accentLicht }]}>
                {formatTijd(verlopenTijd)}
              </Text>
            </View>
            <View style={[s.statScheider, { backgroundColor: kleuren.kaartRand }]} />
            <View style={s.statItem}>
              <Text style={[s.statLabel, { color: kleuren.tekstGedimpt }]}>VOLUME</Text>
              <Text style={[s.statWaarde, { color: kleuren.tekst }]}>
                {liveVolume.toFixed(0)} kg
              </Text>
            </View>
            <View style={[s.statScheider, { backgroundColor: kleuren.kaartRand }]} />
            <View style={s.statItem}>
              <Text style={[s.statLabel, { color: kleuren.tekstGedimpt }]}>VOLTOOIDE SETS</Text>
              <Text style={[s.statWaarde, { color: liveVoltooideSets > 0 ? kleuren.succes : kleuren.tekst }]}>
                {liveVoltooideSets} / {liveTotaalSets}
              </Text>
            </View>
          </View>
        </ResponsiveContainer>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          s.scrollInhoud,
          { paddingHorizontal: contentPadding },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ResponsiveContainer maxWidth={780}>
          {oefeningen.map((o) => (
            <OefeningKaart
              key={o.id}
              oefening={o}
              kleuren={kleuren}
              bestaandePRs={bestaandePRs}
              onNieuwPR={handleNieuwPR}
              userId={user?.id}
              rustSeconden={rustTijdInstelling}
            />
          ))}

          {/* Bottom Action Bar */}
          <View style={s.bottomActions}>
            <PrimaryButton
              titel="Oefening toevoegen"
              icoon="add-circle-outline"
              onPress={() => setSelectorZicht(true)}
              variant="primary"
              size="lg"
              volledigeBreedte
            />

            <PrimaryButton
              titel="Workout annuleren"
              icoon="trash-outline"
              onPress={handleAnnuleerWorkout}
              variant="ghost"
              size="md"
              volledigeBreedte
              style={{ marginTop: 8 }}
            />
          </View>

          <View style={{ height: rustTimerLoopt ? 104 : 36 }} />
        </ResponsiveContainer>
      </ScrollView>

      {/* Vaste Rusttimer Onderaan */}
      {rustTimerLoopt && (
        <View
          style={[
            s.rustBalkOnderaan,
            {
              backgroundColor: kleuren.kaart,
              borderTopColor: kleuren.kaartRand,
            },
            SHADOWS.forTheme(kleuren.isDark, 'lg'),
          ]}
        >
          <View style={[s.rustVoortgangTrack, { backgroundColor: kleuren.kaartRand }]}>
            <View
              style={[
                s.rustVoortgangVulling,
                {
                  width: `${rustVoortgangPct}%`,
                  backgroundColor: rustTimerResterend <= 10 ? kleuren.fout : kleuren.accent,
                },
              ]}
            />
          </View>
          <ResponsiveContainer maxWidth={780}>
            <View style={[s.rustBalkInhoud, { paddingHorizontal: contentPadding }]}>
              <View style={s.rustTijdLinks}>
                <View
                  style={[
                    s.rustIcoonBadge,
                    {
                      backgroundColor: (rustTimerResterend <= 10 ? kleuren.fout : kleuren.accent) + '1F',
                    },
                  ]}
                >
                  <Ionicons
                    name="timer-outline"
                    size={18}
                    color={rustTimerResterend <= 10 ? kleuren.fout : kleuren.accentLicht}
                  />
                </View>
                <View>
                  <Text style={[s.rustBalkSub, { color: kleuren.tekstGedimpt }]}>RUSTTIMER</Text>
                  <Text
                    style={[
                      s.rustBalkTijd,
                      { color: rustTimerResterend <= 10 ? kleuren.fout : kleuren.tekst },
                    ]}
                  >
                    {formatTijd(rustTimerResterend)}
                  </Text>
                </View>
              </View>

              <View style={s.rustKnoppenRechts}>
                <TouchableOpacity
                  style={[
                    s.rustStapKnop,
                    { backgroundColor: kleuren.achtergrondSecundair, borderColor: kleuren.kaartRand },
                    WEB_POINTER,
                  ]}
                  onPress={() => pasRustTimerAan(-15)}
                  activeOpacity={0.75}
                >
                  <Text style={[s.rustStapTekst, { color: kleuren.tekst }]}>-15s</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    s.rustStapKnop,
                    { backgroundColor: kleuren.achtergrondSecundair, borderColor: kleuren.kaartRand },
                    WEB_POINTER,
                  ]}
                  onPress={() => pasRustTimerAan(15)}
                  activeOpacity={0.75}
                >
                  <Text style={[s.rustStapTekst, { color: kleuren.tekst }]}>+15s</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.rustOverslaanKnop, { backgroundColor: kleuren.accent }, WEB_POINTER]}
                  onPress={stopRustTimer}
                  activeOpacity={0.8}
                >
                  <Text style={s.rustOverslaanTekst}>Overslaan</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ResponsiveContainer>
        </View>
      )}

      <ExerciseSelector
        zichtbaar={selectorZicht}
        huidigeSelectie=""
        onSelecteer={handleOefeningToevoegen}
        onSluiten={() => setSelectorZicht(false)}
      />

      <PrCelebratie
        zichtbaar={prState.zichtbaar}
        oefeningNaam={prState.oefeningNaam}
        eenRM={prState.eenRM}
        onSluiten={() => setPrState(p => ({ ...p, zichtbaar: false }))}
      />

      {samenvattingData && (
        <WorkoutSamenvatting
          zichtbaar={true}
          data={samenvattingData}
          onOpslaan={handleOpslaanEnAfsluiten}
          onAnnuleren={() => setSamenvattingData(null)}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  veilig: { flex: 1 },
  headerWrapper: {
    borderBottomWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  minimaliseerKnop: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerMidden: {
    flex: 1,
    minWidth: 0,
  },
  routineNaam: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.2,
  },
  liveTimerPil: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  liveTimerTekst: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    fontVariant: ['tabular-nums'],
  },
  headerActies: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  annuleerHeaderKnop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 36,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  annuleerHeaderTekst: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  afrondenKnop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: RADIUS.sm,
  },
  afrondenTekst: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
  },
  statsBalk: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.9,
    marginBottom: 2,
  },
  statWaarde: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    fontVariant: ['tabular-nums'],
  },
  statScheider: {
    width: 1,
    height: 24,
  },
  scrollInhoud: {
    paddingTop: SPACING.base,
    paddingBottom: SPACING.xl,
  },
  bottomActions: {
    marginTop: SPACING.xs,
  },
  rustBalkOnderaan: {
    borderTopWidth: 1,
  },
  rustVoortgangTrack: {
    height: 3,
    width: '100%',
  },
  rustVoortgangVulling: {
    height: '100%',
  },
  rustBalkInhoud: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 10,
  },
  rustTijdLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rustIcoonBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rustBalkSub: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.9,
  },
  rustBalkTijd: {
    fontSize: 19,
    fontFamily: 'Inter_900Black',
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  rustKnoppenRechts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rustStapKnop: {
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  rustStapTekst: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    fontVariant: ['tabular-nums'],
  },
  rustOverslaanKnop: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  rustOverslaanTekst: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
});
