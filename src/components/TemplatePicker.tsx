import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { getRoutines, Routine } from '../lib/routineStore';
import { useThema } from '../context/ThemeContext';
import RoutineBuilder from './RoutineBuilder';
import { RADIUS } from '../theme/designTokens';

const WEB_POINTER = Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : undefined;

interface TemplatePickerProps {
  onSelecteer: (routine: Routine) => void;
  actieveOefening?: string;
  verversFlag?: number;
}

function TemplateKaart({
  template,
  actief,
  kleuren,
  onDruk,
}: {
  template: Routine;
  actief: boolean;
  kleuren: any;
  onDruk: () => void;
}) {
  const schaal = useSharedValue(1);

  const animStijl = useAnimatedStyle(() => ({
    transform: [{ scale: schaal.value }],
  }));

  function handleDruk() {
    schaal.value = withSpring(0.95, { damping: 12, stiffness: 300 }, () => {
      schaal.value = withSpring(1, { damping: 12, stiffness: 300 });
    });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onDruk();
  }

  return (
    <Animated.View style={animStijl}>
      <TouchableOpacity
        onPress={handleDruk}
        activeOpacity={0.9}
        style={WEB_POINTER}
        accessibilityLabel={`Template ${template.naam} laden`}
      >
        <LinearGradient
          colors={[kleuren.accent, kleuren.accentLicht]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            stijlen.kaart,
            actief && stijlen.kaartActief,
          ]}
        >
          <Ionicons name="barbell-outline" size={26} color="#FFFFFF" style={stijlen.icoon} />
          <Text style={stijlen.naam} numberOfLines={1}>{template.naam}</Text>
          <Text style={stijlen.detail} numberOfLines={1}>{template.oefeningen.length} oefeningen</Text>
          {actief && (
            <View style={stijlen.actiefBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#FFFFFF" />
              <Text style={stijlen.actiefTekst}>Actief</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function TemplatePicker({ onSelecteer, actieveOefening, verversFlag }: TemplatePickerProps) {
  const { kleuren } = useThema();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [builderZichtbaar, setBuilderZichtbaar] = useState(false);

  const laadRoutines = useCallback(async () => {
    const data = await getRoutines();
    setRoutines(data);
  }, []);

  useEffect(() => {
    laadRoutines();
  }, [laadRoutines, verversFlag]);

  const handleSelecteer = (item: Routine) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelecteer(item);
  };

  return (
    <View style={stijlen.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={stijlen.scroll}
      >
        <TouchableOpacity
          style={[
            stijlen.kaart,
            stijlen.nieuwKnop,
            { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand },
            WEB_POINTER,
          ]}
          onPress={() => setBuilderZichtbaar(true)}
        >
          <Ionicons name="add" size={30} color={kleuren.accentLicht} />
          <Text style={[stijlen.nieuwTekst, { color: kleuren.tekstSecundair }]}>Nieuw</Text>
        </TouchableOpacity>

        {routines.map((r) => (
          <TemplateKaart
            key={r.id}
            template={r}
            actief={actieveOefening === r.naam}
            kleuren={kleuren}
            onDruk={() => handleSelecteer(r)}
          />
        ))}
      </ScrollView>

      <RoutineBuilder
        zichtbaar={builderZichtbaar}
        onSluiten={() => setBuilderZichtbaar(false)}
        onOpslaan={laadRoutines}
      />
    </View>
  );
}

const stijlen = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 10,
    paddingVertical: 4,
  },
  kaart: {
    width: 116,
    borderRadius: RADIUS.lg,
    padding: 14,
    alignItems: 'center',
  },
  nieuwKnop: {
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
  },
  nieuwTekst: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 4,
  },
  kaartActief: {
    transform: [{ scale: 1.03 }],
  },
  icoon: {
    marginBottom: 6,
  },
  naam: {
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    marginBottom: 3,
  },
  detail: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  actiefBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: RADIUS.full,
    paddingVertical: 2,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  actiefTekst: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
});
