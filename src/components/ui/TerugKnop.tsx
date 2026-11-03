import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThema } from '../../context/ThemeContext';

export default function TerugKnop({ label = 'Terug' }: { label?: string }) {
  const router = useRouter();
  const { kleuren } = useThema();

  return (
    <TouchableOpacity
      style={stijlen.knop}
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profiel'))}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
    >
      <Ionicons name="chevron-back" size={22} color={kleuren.accentTekst} />
      <Text style={[stijlen.tekst, { color: kleuren.accentTekst }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const stijlen = StyleSheet.create({
  knop: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', minHeight: 44, marginLeft: -6, marginBottom: 4 },
  tekst: { fontSize: 17, fontFamily: 'Inter_400Regular' },
});
