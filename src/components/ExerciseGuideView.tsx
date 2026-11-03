// ─────────────────────────────────────────────────────────────────────────────
// Wayt – ExerciseGuideView Component
// Displays movement GIF, target muscle badges, and NL/EN step-by-step instructions.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThema } from '../context/ThemeContext';
import { findExerciseMatch, type ExerciseDbItem } from '../services/exerciseDb';

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
  
  // Standaard altijd Nederlands ('nl')
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
    } catch (err) {
      setFout('Kon instructies niet laden.');
    } finally {
      setLaden(false);
    }
  };

  useEffect(() => {
    laadInstructies();
  }, [oefeningId, oefeningNaam]);

  // Huidige stappen: uitsluitend NL of EN
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
      <View style={[s.kaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
        <View style={[s.mediaContainer, s.skeletonMedia, { backgroundColor: kleuren.achtergrondSecundair }]}>
          <ActivityIndicator color={kleuren.accent} size="small" />
          <Text style={[s.ladenTekst, { color: kleuren.tekstGedimpt }]}>Instructies laden...</Text>
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
      <View style={[s.kaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
        <View style={s.foutContainer}>
          <Ionicons name="barbell-outline" size={36} color={kleuren.tekstGedimpt} />
          <Text style={[s.foutTitel, { color: kleuren.tekst }]}>Geen animatie beschikbaar</Text>
          <Text style={[s.foutSub, { color: kleuren.tekstGedimpt }]}>
            {fout || 'Voor deze oefening zijn momenteel geen instructies beschikbaar.'}
          </Text>
          <TouchableOpacity
            style={[s.herlaadKnop, { borderColor: kleuren.kaartRand, backgroundColor: kleuren.achtergrond }]}
            onPress={laadInstructies}
          >
            <Ionicons name="refresh" size={14} color={kleuren.accent} />
            <Text style={[s.herlaadTekst, { color: kleuren.accentTekst }]}>Opnieuw proberen</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const formatStap = (stap: string) => {
    return stap.replace(/^Step:?\s*\d+\s*:?\s*/i, '').trim();
  };

  const mediaBron = !mediaFout && data.gifUrl ? data.gifUrl : data.imageUrl;

  return (
    <View style={[s.kaart, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}>
      {/* Visual Movement Animation (GIF / Video) */}
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

      {/* Target Muscles & Equipment Badges */}
      <View style={s.badgesContainer}>
        {data.targetMuscles.map(m => (
          <View key={m} style={[s.badge, { backgroundColor: kleuren.accent + '22', borderColor: kleuren.accent + '55' }]}>
            <Ionicons name="flash-outline" size={12} color={kleuren.accent} />
            <Text style={[s.badgeTekst, { color: kleuren.accentTekst }]}>{m.toUpperCase()}</Text>
          </View>
        ))}

        {data.bodyParts.map(bp => (
          <View key={bp} style={[s.badge, { backgroundColor: kleuren.kaartRand, borderColor: kleuren.kaartRand }]}>
            <Ionicons name="body-outline" size={12} color={kleuren.tekstSecundair} />
            <Text style={[s.badgeTekst, { color: kleuren.tekstSecundair }]}>{bp}</Text>
          </View>
        ))}

        {data.equipments.map(eq => (
          <View key={eq} style={[s.badge, { backgroundColor: kleuren.kaartRand, borderColor: kleuren.kaartRand }]}>
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

      {/* Language Selector: Uitsluitend Nederlands (NL) of Engels (EN) */}
      <View style={s.taalHeaderRij}>
        <Text style={[s.instructiesTitel, { color: kleuren.tekstSecundair }]}>STAP-VOOR-STAP UITVOERING</Text>
        <View style={[s.taalSwitchContainer, { backgroundColor: kleuren.achtergrond, borderColor: kleuren.kaartRand }]}>
          <TouchableOpacity
            style={[
              s.taalKnop,
              actieveTaal === 'nl' && { backgroundColor: kleuren.accent, borderColor: kleuren.accent },
            ]}
            onPress={() => setActieveTaal('nl')}
          >
            <Text style={[s.taalKnopTekst, { color: actieveTaal === 'nl' ? '#FFF' : kleuren.tekstGedimpt }]}>
              NL
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              s.taalKnop,
              actieveTaal === 'en' && { backgroundColor: kleuren.accent, borderColor: kleuren.accent },
            ]}
            onPress={() => setActieveTaal('en')}
          >
            <Text style={[s.taalKnopTekst, { color: actieveTaal === 'en' ? '#FFF' : kleuren.tekstGedimpt }]}>
              EN
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Step-by-Step Instructions */}
      {huidigeStappen.length > 0 ? (
        <View style={s.stappenLijst}>
          {huidigeStappen.map((stap, index) => (
            <View key={index} style={s.stapRij}>
              <View style={[s.stapNummerBadge, { backgroundColor: kleuren.accent + '1A', borderColor: kleuren.accent + '44' }]}>
                <Text style={[s.stapNummer, { color: kleuren.accentTekst }]}>{index + 1}</Text>
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

      {/* Attribution Footer */}
      {data.attribution && (
        <View style={s.attributionBox}>
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
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  mediaContainer: {
    width: '100%',
    height: 230,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gif: {
    width: '100%',
    height: '100%',
  },
  spinnerOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  mediaFoutBox: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  mediaFoutTekst: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  skeletonMedia: {
    gap: 10,
  },
  ladenTekst: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  skeletonLijn: {
    height: 12,
    borderRadius: 6,
  },
  foutContainer: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  foutTitel: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    marginTop: 4,
  },
  foutSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  herlaadKnop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
  },
  herlaadTekst: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
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
  badgeTekst: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.3,
  },
  taalHeaderRij: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.1)',
  },
  instructiesTitel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.2,
  },
  taalSwitchContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    padding: 2,
    gap: 2,
  },
  taalKnop: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  taalKnopTekst: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  stappenLijst: {
    gap: 10,
  },
  stapRij: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stapNummerBadge: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  stapNummer: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  stapTekst: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
  },
  geenStappenTekst: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  attributionBox: {
    marginTop: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.1)',
  },
  attributionTekst: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
