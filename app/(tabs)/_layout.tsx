import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThema } from '../../src/context/ThemeContext';
import { useLiveWorkout } from '../../src/context/LiveWorkoutContext';

function TabIcoon({ naam, focused, color, label }: {
  naam: string; focused: boolean; color: string; label: string;
}) {
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
        tabBarActiveTintColor: kleuren.accent,
        tabBarInactiveTintColor: kleuren.tekstGedimpt,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcoon naam={focused ? 'home' : 'home-outline'} focused={focused} color={color} label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View>
              <TabIcoon naam={focused ? 'barbell' : 'barbell-outline'} focused={focused} color={color} label="Trainen" />
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
          tabBarIcon: ({ focused, color }) => (
            <TabIcoon naam={focused ? 'stats-chart' : 'stats-chart-outline'} focused={focused} color={color} label="Voortgang" />
          ),
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcoon naam={focused ? 'library' : 'library-outline'} focused={focused} color={color} label="Oefeningen" />
          ),
        }}
      />
      <Tabs.Screen name="admin" options={{ href: null }} />
    </Tabs>
  );
}

const stijlen = StyleSheet.create({
  tabItem: { alignItems: 'center', gap: 2, minWidth: 60 },
  tabLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: -0.2 },
  actieveBadge: {
    position: 'absolute', top: -2, right: -6,
    width: 8, height: 8, borderRadius: 4,
  },
});
