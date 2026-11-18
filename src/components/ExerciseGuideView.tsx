// ─────────────────────────────────────────────────────────────────────────────
// Wayt – ExerciseGuideView Component
// Displays movement GIF, target muscle badges, and NL/EN step-by-step instructions.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Platform, type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThema } from '../context/ThemeContext';
import { findExerciseMatch, type ExerciseDbItem } from '../services/exerciseDb';
import { RADIUS } from '../theme/designTokens';

const WEB_POINTER = Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : undefined;

interface ExerciseGuideViewProps {
  oefeningId: string;
  oefeningNaam?: string;
  data?: ExerciseDbItem | null;
}

export default function ExerciseGuideView({ oefeningId, oefeningNaam, data: dataProp }: ExerciseGuideViewProps) {
  const { kleuren } = useThema();
  const [data, setData] = useState<ExerciseDbItem | null>(dataProp || null);
  const [laden, setLaden] = useState(!dataProp);
  const [mediaLaden, setMediaLaden] = useState(true);
  const [mediaFout, setMediaFout] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [actieveTaal, setActieveTaal] = useState<'nl' | 'en'>('nl');

  const laadInstructies = async () => {
    if (dataProp) {
      setData(dataProp);
      setLaden(false);
      return;
    }
    setLaden(true);
    setFout(null);
    setMediaFout(false);
    try {
      const match = await findExerciseMatch(oefeningId, oefeningNaam, actieveTaal);
      if (match) {
        setData(match);
      } else {
        setFout('Geen visuele instructies gevonden voor deze oefening.');
      }
    } catch {
      setFout('Kon instructies niet laden.');
    } finally {
      setLaden(false);
    }
  };

  useEffect(() => {
    laadInstructies();
  }, [oefeningId, oefeningNaam]);

  const huidigeStappen = useMemo(() => {
    if (!data) return [];
    if (data.instruction_steps && data.instruction_steps[actieveTaal]) {
      const stappen = data.instruction_steps[actieveTaal];
      if (Array.isArray(stappen) && stappen.length > 0) return stappen;
    }
    if (actieveTaal === 'nl' && data.instruction_steps?.['nl']) {
      return data.instruction_steps['nl'];
    }
    if (data.instruction_steps?.['en']) {
      return data.instruction_steps['en'];
    }
    return data.instructions || [];
  }, [data, actieveTaal]);

  if (laden) {
    return (
      <View style={[s.kaart, { backgroundColor: kleuren.achtergrondSecundair, borderColor: kleuren.kaartRand }]}>
        <View style={[s.mediaContainer, s.skeletonMedia, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
          <ActivityIndicator color={kleuren.accent} size="small" />
          <Text style={[s.ladenTekst, { color: kleuren.tekstSecundair }]}>Instructies laden...</Text>
        </View>
        <View style={{ gap: 8, marginTop: 14 }}>
          <View style={[s.skeletonLijn, { width: '60%', backgroundColor: kleuren.kaartRand }]} />
          <View style={[s.skeletonLijn, { width: '80%', backgroundColor: kleuren.kaartRand }]} />
          <View style={[s.skeletonLijn, { width: '100%', backgroundColor: kleuren.kaartRand }]} />
        </View>
      </View>
    );
  }

  if (fout || !data) {
    return (
      <View style={[s.kaart, { backgroundColor: kleuren.achtergrondSecundair, borderColor: kleuren.kaartRand }]}>
        <View style={s.foutContainer}>
          <View style={[s.foutIcoonBadge, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
            <Ionicons name="barbell-outline" size={28} color={kleuren.tekstGedimpt} />
          </View>
          <Text style={[s.foutTitel, { color: kleuren.tekst }]}>Geen animatie beschikbaar</Text>
          <Text style={[s.foutSub, { color: kleuren.tekstSecundair }]}>
            {fout || 'Voor deze oefening zijn momenteel geen instructies beschikbaar.'}
          </Text>
          <TouchableOpacity
            style={[s.herlaadKnop, { borderColor: kleuren.kaartRand, backgroundColor: kleuren.kaart }, WEB_POINTER]}
            onPress={laadInstructies}
          >
            <Ionicons name="refresh" size={14} color={kleuren.accentLicht} />
            <Text style={[s.herlaadTekst, { color: kleuren.accentLicht }]}>Opnieuw proberen</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const formatStap = (stap: string) => stap.replace(/^Step:?\s*\d+\s*:?\s*/i, '').trim();
  const mediaBron = !mediaFout && data.gifUrl ? data.gifUrl : data.imageUrl;

  return (
    <View style={[s.kaart, { backgroundColor: kleuren.achtergrondSecundair, borderColor: kleuren.kaartRand }]}>
      <View style={[s.mediaContainer, { backgroundColor: '#FFFFFF', borderColor: kleuren.kaartRand }]}>
        {mediaLaden && (
          <View style={[StyleSheet.absoluteFill, s.spinnerOverlay]}>
            <ActivityIndicator color={kleuren.accent} size="small" />
          </View>
        )}

        {mediaBron ? (
          <Image
            source={{ uri: mediaBron }}
            style={s.gif}
            resizeMode="contain"
            onLoadStart={() => setMediaLaden(true)}
            onLoadEnd={() => setMediaLaden(false)}
            onError={() => {
              setMediaLaden(false);
              setMediaFout(true);
            }}
          />
        ) : (
          <View style={s.mediaFoutBox}>
            <Ionicons name="image-outline" size={32} color={kleuren.tekstGedimpt} />
            <Text style={[s.mediaFoutTekst, { color: kleuren.tekstGedimpt }]}>Geen visual beschikbaar</Text>
          </View>
        )}
      </View>

      <View style={s.badgesContainer}>
        {data.targetMuscles.map(m => (
          <View key={m} style={[s.badge, { backgroundColor: kleuren.accentGedimpt, borderColor: kleuren.accent + '44' }]}>
            <Ionicons name="flash-outline" size={12} color={kleuren.accentLicht} />
            <Text style={[s.badgeTekst, { color: kleuren.accentLicht }]}>{m.toUpperCase()}</Text>
          </View>
        ))}

        {data.bodyParts.map(bp => (
          <View key={bp} style={[s.badge, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
            <Ionicons name="body-outline" size={12} color={kleuren.tekstSecundair} />
            <Text style={[s.badgeTekst, { color: kleuren.tekstSecundair }]}>{bp}</Text>
          </View>
        ))}

        {data.equipments.map(eq => (
          <View key={eq} style={[s.badge, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
            <Ionicons name="construct-outline" size={12} color={kleuren.tekstSecundair} />
            <Text style={[s.badgeTekst, { color: kleuren.tekstSecundair }]}>{eq}</Text>
          </View>
        ))}

        {data.secondaryMuscles.map(sm => (
          <View key={sm} style={[s.badge, { backgroundColor: kleuren.achtergrond, borderColor: kleuren.kaartRand }]}>
            <Text style={[s.badgeTekst, { color: kleuren.tekstGedimpt }]}>+ {sm}</Text>
          </View>
        ))}
      </View>

      <View style={[s.taalHeaderRij, { borderTopColor: kleuren.kaartRand }]}>
        <Text style={[s.instructiesTitel, { color: kleuren.tekstGedimpt }]}>STAP-VOOR-STAP UITVOERING</Text>
        <View style={[s.taalSwitchContainer, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
          <TouchableOpacity
            style={[
              s.taalKnop,
              actieveTaal === 'nl' && { backgroundColor: kleuren.accent },
              WEB_POINTER,
            ]}
            onPress={() => setActieveTaal('nl')}
          >
            <Text style={[s.taalKnopTekst, { color: actieveTaal === 'nl' ? '#FFFFFF' : kleuren.tekstSecundair }]}>
              NL
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              s.taalKnop,
              actieveTaal === 'en' && { backgroundColor: kleuren.accent },
              WEB_POINTER,
            ]}
            onPress={() => setActieveTaal('en')}
          >
            <Text style={[s.taalKnopTekst, { color: actieveTaal === 'en' ? '#FFFFFF' : kleuren.tekstSecundair }]}>
              EN
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {huidigeStappen.length > 0 ? (
        <View style={s.stappenLijst}>
          {huidigeStappen.map((stap, index) => (
            <View key={index} style={s.stapRij}>
              <View style={[s.stapNummerBadge, { backgroundColor: kleuren.accentGedimpt, borderColor: kleuren.accent + '44' }]}>
                <Text style={[s.stapNummer, { color: kleuren.accentLicht }]}>{index + 1}</Text>
              </View>
              <Text style={[s.stapTekst, { color: kleuren.tekst }]}>
                {formatStap(stap)}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={[s.geenStappenTekst, { color: kleuren.tekstGedimpt }]}>
          Geen stappen beschikbaar voor deze taal.
        </Text>
      )}

      {data.attribution && (
        <View style={[s.attributionBox, { borderTopColor: kleuren.kaartRand }]}>
          <Text style={[s.attributionTekst, { color: kleuren.tekstGedimpt }]}>
            {data.attribution}
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  kaart: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    overflow: 'hidden',
  },
  mediaContainer: {
    width: '100%',
    height: 224,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gif: { width: '100%', height: '100%' },
  spinnerOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  mediaFoutBox: { justifyContent: 'center', alignItems: 'center', gap: 6 },
  mediaFoutTekst: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  skeletonMedia: { gap: 10 },
  ladenTekst: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  skeletonLijn: { height: 12, borderRadius: 6 },
  foutContainer: { padding: 20, alignItems: 'center', gap: 8 },
  foutIcoonBadge: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  foutTitel: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  foutSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 280,
  },
  herlaadKnop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    marginTop: 6,
  },
  herlaadTekst: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
    marginBottom: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeTekst: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.3 },
  taalHeaderRij: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  instructiesTitel: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.2 },
  taalSwitchContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    padding: 2,
    gap: 2,
  },
  taalKnop: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  taalKnopTekst: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  stappenLijst: { gap: 10 },
  stapRij: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stapNummerBadge: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  stapNummer: { fontSize: 11, fontFamily: 'Inter_700Bold', fontVariant: ['tabular-nums'] },
  stapTekst: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  geenStappenTekst: { fontSize: 12, fontFamily: 'Inter_400Regular', fontStyle: 'italic', paddingVertical: 8 },
  attributionBox: { marginTop: 16, paddingTop: 10, borderTopWidth: 1 },
  attributionTekst: { fontSize: 10, fontFamily: 'Inter_400Regular', fontStyle: 'italic', textAlign: 'center' },
});
