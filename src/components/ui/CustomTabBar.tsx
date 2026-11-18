import React, { type ComponentProps } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Platform,
  type ViewStyle,
} from 'react-native';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThema } from '../../context/ThemeContext';
import { useLiveWorkout } from '../../context/LiveWorkoutContext';
import { NAV_METRICS, RADIUS, SHADOWS, SPACING } from '../../theme/designTokens';

type ExpoTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

interface NavItemConfig {
  routeName: 'workout' | 'exercises' | 'dashboard';
  href: '/(tabs)/workout' | '/(tabs)/exercises' | '/(tabs)/dashboard';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}

export const NAV_ITEMS: NavItemConfig[] = [
  {
    routeName: 'workout',
    href: '/(tabs)/workout',
    label: 'Trainen',
    icon: 'barbell-outline',
    activeIcon: 'barbell',
  },
  {
    routeName: 'exercises',
    href: '/(tabs)/exercises',
    label: 'Oefeningen',
    icon: 'library-outline',
    activeIcon: 'library',
  },
  {
    routeName: 'dashboard',
    href: '/(tabs)/dashboard',
    label: 'Profiel',
    icon: 'person-outline',
    activeIcon: 'person',
  },
];

const NAV_BY_ROUTE = new Map<string, NavItemConfig>(
  NAV_ITEMS.map((item) => [item.routeName, item])
);

const webPointer: ViewStyle | undefined =
  Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : undefined;

const webGlassBlur: ViewStyle | undefined =
  Platform.OS === 'web'
    ? ({
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      } as unknown as ViewStyle)
    : undefined;

// ─── Mobiele Zwevende Tab Bar ─────────────────────────────────────────────────

export function CustomTabBar({ state, emitter, navigateToTab, insets: tabBarInsets }: ExpoTabBarProps) {
  const { kleuren } = useThema();
  const { isActief } = useLiveWorkout();
  const safeInsets = useSafeAreaInsets();
  const bottomInset = tabBarInsets?.bottom ?? safeInsets.bottom;

  const bottomOffset = Math.max(bottomInset, NAV_METRICS.mobileTabBarMarginBottom);
  const activeColor = kleuren.isDark ? kleuren.accentLicht : kleuren.accent;
  const barBackground = kleuren.isDark
    ? 'rgba(24, 24, 27, 0.92)'
    : 'rgba(255, 255, 255, 0.94)';

  const visibleRoutes = state.routes.filter((route) => NAV_BY_ROUTE.has(route.name));

  return (
    <View
      pointerEvents="box-none"
      style={[stijlen.floatingWrapper, { bottom: bottomOffset }]}
    >
      <View
        style={[
          stijlen.floatingBar,
          {
            backgroundColor: barBackground,
            borderColor: kleuren.kaartRand,
          },
          SHADOWS.forTheme(kleuren.isDark, 'lg'),
          webGlassBlur,
        ]}
      >
        {visibleRoutes.map((route) => {
          const item = NAV_BY_ROUTE.get(route.name);
          if (!item) return null;

          const routeIndex = state.routes.findIndex((r) => r.key === route.key);
          const isFocused = state.index === routeIndex;

          const onPress = () => {
            const event = emitter.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              if (Platform.OS !== 'web') {
                Haptics.selectionAsync().catch(() => {});
              }
              navigateToTab(route.key);
            }
          };

          const onLongPress = () => {
            emitter.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={item.label}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed }) => [
                stijlen.tabKnop,
                isFocused && { backgroundColor: kleuren.accentGedimpt },
                pressed && stijlen.tabIngedrukt,
                webPointer,
              ]}
            >
              <View style={stijlen.icoonWrapper}>
                <Ionicons
                  name={isFocused ? item.activeIcon : item.icon}
                  size={20}
                  color={isFocused ? activeColor : kleuren.tekstGedimpt}
                />
                {item.routeName === 'workout' && isActief ? (
                  <View
                    style={[
                      stijlen.actieveDot,
                      {
                        backgroundColor: kleuren.succes,
                        borderColor: kleuren.kaart,
                      },
                    ]}
                  />
                ) : null}
              </View>
              <Text
                style={[
                  stijlen.tabLabel,
                  {
                    color: isFocused ? activeColor : kleuren.tekstGedimpt,
                    fontFamily: isFocused ? 'Inter_700Bold' : 'Inter_600SemiBold',
                  },
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Desktop Linker Zijbalk Navigatie ─────────────────────────────────────────

export function DesktopSidebar() {
  const { kleuren } = useThema();
  const { isActief } = useLiveWorkout();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();

  const activeColor = kleuren.isDark ? kleuren.accentLicht : kleuren.accent;

  const isRouteActief = (routeName: NavItemConfig['routeName']) => {
    if (pathname.includes(`/${routeName}`)) return true;
    if (routeName === 'workout' && (pathname === '/' || pathname === '/(tabs)')) {
      return true;
    }
    return false;
  };

  return (
    <View
      style={[
        stijlen.sidebar,
        {
          backgroundColor: kleuren.achtergrondSecundair,
          borderRightColor: kleuren.kaartRand,
          paddingTop: Math.max(insets.top + SPACING.md, SPACING.xl),
          paddingBottom: Math.max(insets.bottom + SPACING.sm, SPACING.base),
        },
      ]}
    >
      {/* Merk / Logo */}
      <View style={stijlen.merkHeader}>
        <View
          style={[
            stijlen.logoMark,
            {
              backgroundColor: kleuren.kaart,
              borderColor: kleuren.accent + '44',
            },
          ]}
        >
          <Image
            source={require('../../../assets/icon.png')}
            style={stijlen.logoAfbeelding}
            resizeMode="cover"
          />
        </View>
        <View style={stijlen.merkTekst}>
          <Text style={[stijlen.merkNaam, { color: kleuren.tekst }]}>Wayt</Text>
          <Text style={[stijlen.merkSub, { color: kleuren.tekstGedimpt }]}>
            Kracht & Progressie
          </Text>
        </View>
      </View>

      {/* Navigatie */}
      <Text style={[stijlen.sectieLabel, { color: kleuren.tekstGedimpt }]}>
        NAVIGATIE
      </Text>

      <View style={stijlen.navLijst}>
        {NAV_ITEMS.map((item) => {
          const actief = isRouteActief(item.routeName);

          return (
            <Pressable
              key={item.routeName}
              accessibilityRole="tab"
              accessibilityState={actief ? { selected: true } : {}}
              onPress={() => {
                if (!actief) {
                  router.navigate(item.href);
                }
              }}
              style={({ pressed }) => [
                stijlen.sidebarItem,
                actief && { backgroundColor: kleuren.accentGedimpt },
                pressed && { opacity: 0.8 },
                webPointer,
              ]}
            >
              {actief ? (
                <View
                  style={[
                    stijlen.actieveBalk,
                    { backgroundColor: kleuren.accent },
                  ]}
                />
              ) : null}

              <View style={stijlen.sidebarIcoon}>
                <Ionicons
                  name={actief ? item.activeIcon : item.icon}
                  size={19}
                  color={actief ? activeColor : kleuren.tekstSecundair}
                />
              </View>

              <Text
                style={[
                  stijlen.sidebarLabel,
                  {
                    color: actief ? activeColor : kleuren.tekstSecundair,
                    fontFamily: actief ? 'Inter_700Bold' : 'Inter_600SemiBold',
                  },
                ]}
              >
                {item.label}
              </Text>

              {item.routeName === 'workout' && isActief ? (
                <View
                  style={[
                    stijlen.sidebarActiefBadge,
                    { backgroundColor: 'rgba(16, 185, 129, 0.16)' },
                  ]}
                >
                  <View
                    style={[
                      stijlen.sidebarActiefPunt,
                      { backgroundColor: kleuren.succes },
                    ]}
                  />
                  <Text
                    style={[
                      stijlen.sidebarActiefTekst,
                      { color: kleuren.succes },
                    ]}
                  >
                    Live
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      {/* Voettekst: Instellingen snelkoppeling */}
      <View
        style={[
          stijlen.sidebarFooter,
          { borderTopColor: kleuren.kaartRand },
        ]}
      >
        <Pressable
          onPress={() => router.push('/instellingen')}
          style={({ pressed }) => [
            stijlen.sidebarItem,
            pressed && { opacity: 0.78 },
            webPointer,
          ]}
        >
          <View style={stijlen.sidebarIcoon}>
            <Ionicons
              name="settings-outline"
              size={19}
              color={kleuren.tekstGedimpt}
            />
          </View>
          <Text
            style={[
              stijlen.sidebarLabel,
              { color: kleuren.tekstSecundair, fontFamily: 'Inter_600SemiBold' },
            ]}
          >
            Instellingen
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default CustomTabBar;

const stijlen = StyleSheet.create({
  // Mobiele zwevende dock
  floatingWrapper: {
    position: 'absolute',
    left: SPACING.base,
    right: SPACING.base,
    alignItems: 'center',
    zIndex: 100,
  },
  floatingBar: {
    width: '100%',
    maxWidth: 440,
    height: NAV_METRICS.mobileTabBarHeight,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    gap: 4,
  },
  tabKnop: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 8,
  },
  tabIngedrukt: {
    opacity: 0.8,
  },
  icoonWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actieveDot: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: -0.1,
  },

  // Desktop zijbalk
  sidebar: {
    width: NAV_METRICS.sidebarWidth,
    borderRightWidth: 1,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.base,
    flexShrink: 0,
  },
  merkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xs,
    marginBottom: SPACING.xl,
  },
  logoMark: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoAfbeelding: {
    width: '100%',
    height: '100%',
  },
  merkTekst: {
    flex: 1,
    minWidth: 0,
  },
  merkNaam: {
    fontSize: 18,
    fontFamily: 'Inter_900Black',
    letterSpacing: 0.4,
  },
  merkSub: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 1,
  },
  sectieLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  navLijst: {
    gap: 4,
  },
  sidebarItem: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
  },
  actieveBalk: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 3,
    borderRadius: 2,
  },
  sidebarIcoon: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarLabel: {
    flex: 1,
    fontSize: 14,
  },
  sidebarActiefBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  sidebarActiefPunt: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  sidebarActiefTekst: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  sidebarFooter: {
    borderTopWidth: 1,
    paddingTop: SPACING.md,
  },
});
