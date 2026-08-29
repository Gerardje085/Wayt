import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useThema } from '../../context/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  stijl?: ViewStyle;
}

export default function Card({ children, stijl }: CardProps) {
  const { kleuren } = useThema();

  return (
    <View style={[stijlen.container, { backgroundColor: kleuren.kaart, borderColor: kleuren.kaartRand }, stijl]}>
      {children}
    </View>
  );
}

const stijlen = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
});
