import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
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
    schaal.value = withSpring(0.93, { damping: 10, stiffness: 300 }, () => {
      schaal.value = withSpring(1, { damping: 10, stiffness: 300 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDruk();
  }

  return (
    <Animated.View style={animStijl}>
      <TouchableOpacity
        onPress={handleDruk}
        activeOpacity={0.9}
        accessibilityLabel={`Template ${template.naam} laden`}
      >
        <LinearGradient
          colors={[kleuren.accentSecundair, kleuren.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            stijlen.kaart,
            { shadowColor: kleuren.accent },
            actief && stijlen.kaartActief,
          ]}
        >
          <Ionicons name="barbell-outline" size={28} color="#FFFFFF" style={stijlen.icoon} />
          <Text style={stijlen.naam}>{template.naam}</Text>
          <Text style={stijlen.detail} numberOfLines={1}>{template.oefeningen.length} oefeningen</Text>
          {actief && (
            <View style={[stijlen.actiefBadge, { flexDirection: 'row', alignItems: 'center', gap: 3 }]}>
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
          style={[stijlen.kaart, stijlen.nieuwKnop, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }]}
          onPress={() => setBuilderZichtbaar(true)}
        >
          <Ionicons name="add" size={32} color={kleuren.accent} />
          <Text style={[stijlen.detail, { color: kleuren.tekstGedimpt }]}>Nieuw</Text>
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
    width: 110,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  nieuwKnop: {
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
  },
  kaartActief: {
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
    transform: [{ scale: 1.05 }],
  },
  icoon: {
    fontSize: 28,
    marginBottom: 6,
  },
  naam: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  detail: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 14,
  },
  actiefBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  actiefTekst: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
});
