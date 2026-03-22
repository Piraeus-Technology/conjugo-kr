import { useThemeStore } from '../store/themeStore';

const lightColors = {
  primary: '#003478',
  primaryLight: '#1A5DAD',
  primaryDark: '#001F4D',

  accent: '#C60C30',
  accentLight: '#FCE4EC',

  bg: '#FAFAFA',
  card: '#FFFFFF',
  searchBg: '#F0EEEB',

  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textMuted: '#9E9E9E',

  border: '#E8E5E0',
  divider: '#F0EEEB',

  pillBg: '#F0EEEB',
  pillActiveBg: '#003478',
  pillText: '#4A4A4A',
  pillActiveText: '#FFFFFF',

  regularTag: '#E8F5E9',
  regularTagText: '#2E7D32',
  irregularTag: '#FFF3E0',
  irregularTagText: '#E65100',
};

const darkColors = {
  primary: '#5B8FD4',
  primaryLight: '#7BAFE4',
  primaryDark: '#9EC5F0',

  accent: '#F48FB1',
  accentLight: '#3D1A2A',

  bg: '#121212',
  card: '#1E1E1E',
  searchBg: '#2A2A2A',

  textPrimary: '#F0F0F0',
  textSecondary: '#A0A0A0',
  textMuted: '#666666',

  border: '#333333',
  divider: '#2A2A2A',

  pillBg: '#2A2A2A',
  pillActiveBg: '#5B8FD4',
  pillText: '#A0A0A0',
  pillActiveText: '#FFFFFF',

  regularTag: '#1B3A1B',
  regularTagText: '#66BB6A',
  irregularTag: '#3E2200',
  irregularTagText: '#FFB74D',
};

export type ThemeColors = typeof lightColors;

export const themes = { light: lightColors, dark: darkColors };

export function useColors(): ThemeColors {
  const isDark = useThemeStore((s) => s.isDark);
  return isDark ? darkColors : lightColors;
}

export const colors = lightColors;

export const fonts = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
    hero: 40,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  full: 999,
};
