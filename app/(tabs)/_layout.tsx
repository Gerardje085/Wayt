import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThema } from '../../src/context/ThemeContext';
import { useLiveWorkout } from '../../src/context/LiveWorkoutContext';

function TabIcoon({ naam, focused, label }: {
  naam: string; focused: boolean; label: string;
}) {
  const { kleuren } = useThema();
  const color = focused ? kleuren.accentTekst : kleuren.tekstGedimpt;
  return (
    <View style={stijlen.tabItem}>
      <Ionicons name={naam as any} size={22} color={color} />
      <Text style={[stijlen.tabLabel, { color }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const { kleuren } = useThema();
  const { isActief } = useLiveWorkout();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: kleuren.kaart,
          borderTopColor: kleuren.kaartRand,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 82 : 62,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: kleuren.accentTekst,
        tabBarInactiveTintColor: kleuren.tekstGedimpt,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcoon naam={focused ? 'home' : 'home-outline'} focused={focused} label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          tabBarIcon: ({ focused }) => (
            <View>
              <TabIcoon naam={focused ? 'barbell' : 'barbell-outline'} focused={focused} label="Trainen" />
              {isActief && (
                <View style={[stijlen.actieveBadge, { backgroundColor: kleuren.succes }]} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcoon naam={focused ? 'stats-chart' : 'stats-chart-outline'} focused={focused} label="Voortgang" />
          ),
        }}
      />
      <Tabs.Screen
        name="profiel"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcoon naam={focused ? 'person' : 'person-outline'} focused={focused} label="Profiel" />
          ),
        }}
      />
    </Tabs>
  );
}

const stijlen = StyleSheet.create({
  tabItem: { alignItems: 'center', gap: 2, minWidth: 60 },
  tabLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.2 },
  actieveBadge: {
    position: 'absolute', top: -2, right: -6,
    width: 8, height: 8, borderRadius: 4,
  },
});
