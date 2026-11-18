import { useWindowDimensions, type ViewStyle } from 'react-native';

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const RADIUS = {
  xs: 6,
  sm: 10,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export const BREAKPOINTS = {
  tablet: 768,
  sidebar: 900,
  desktop: 1024,
  wide: 1280,
} as const;

export const NAV_METRICS = {
  sidebarWidth: 240,
  mobileTabBarHeight: 64,
  mobileTabBarMarginBottom: 12,
  mobileContentBottomPadding: 108,
} as const;

export type ShadowLevel = 'sm' | 'md' | 'lg';

function buildShadow(isDark: boolean, level: ShadowLevel): ViewStyle {
  if (isDark) {
    switch (level) {
      case 'sm':
        return {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 2,
        };
      case 'md':
        return {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 14,
          elevation: 5,
        };
      case 'lg':
        return {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.48,
          shadowRadius: 24,
          elevation: 10,
        };
    }
  }

  switch (level) {
    case 'sm':
      return {
        shadowColor: '#09090B',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
      };
    case 'md':
      return {
        shadowColor: '#09090B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
      };
    case 'lg':
      return {
        shadowColor: '#09090B',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 8,
      };
  }
}

export const SHADOWS = {
  sm: buildShadow(false, 'sm'),
  md: buildShadow(false, 'md'),
  lg: buildShadow(false, 'lg'),
  darkSm: buildShadow(true, 'sm'),
  darkMd: buildShadow(true, 'md'),
  darkLg: buildShadow(true, 'lg'),
  forTheme: (isDark: boolean, level: ShadowLevel = 'sm'): ViewStyle =>
    buildShadow(isDark, level),
};

export interface ResponsiveInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWideDesktop: boolean;
  isDesktopNav: boolean;
  contentPadding: number;
}

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();

  const isMobile = width < BREAKPOINTS.tablet;
  const isTablet = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
  const isDesktop = width >= BREAKPOINTS.desktop;
  const isWideDesktop = width >= BREAKPOINTS.wide;
  const isDesktopNav = width >= BREAKPOINTS.sidebar;

  const contentPadding = isDesktop ? SPACING.xxl : isTablet ? SPACING.xl : SPACING.base;

  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isWideDesktop,
    isDesktopNav,
    contentPadding,
  };
}
