import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useThema } from '../../src/context/ThemeContext';
import { useResponsive } from '../../src/theme/designTokens';
import CustomTabBar, { DesktopSidebar } from '../../src/components/ui/CustomTabBar';

export default function TabLayout() {
  const { kleuren } = useThema();
  const { isDesktopNav } = useResponsive();

  return (
    <View
      style={[
        stijlen.root,
        {
          backgroundColor: kleuren.achtergrond,
          flexDirection: isDesktopNav ? 'row' : 'column',
        },
      ]}
    >
      {isDesktopNav ? <DesktopSidebar /> : null}

      <View style={stijlen.inhoud}>
        <Tabs
          tabBar={(props) => (isDesktopNav ? null : <CustomTabBar {...props} />)}
          screenOptions={{
            headerShown: false,
            sceneStyle: { backgroundColor: kleuren.achtergrond },
          }}
        >
          <Tabs.Screen name="workout" options={{ title: 'Trainen' }} />
          <Tabs.Screen name="exercises" options={{ title: 'Oefeningen' }} />
          <Tabs.Screen name="dashboard" options={{ title: 'Profiel' }} />
          <Tabs.Screen
            name="progress"
            options={{
              href: null,
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

const stijlen = StyleSheet.create({
  root: {
    flex: 1,
  },
  inhoud: {
    flex: 1,
    minWidth: 0,
  },
});
