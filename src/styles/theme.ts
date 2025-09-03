import { Platform } from 'react-native';

export const BRAND_COLOR = '#70C5BE';

export const theme = {
  light: {
    background: '#FFFFFF',
    surface: '#F8F9FA',
    surfaceVariant: '#F1F3F5',
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    primary: BRAND_COLOR,
    primaryDark: '#5BA8A2',
    primaryLight: '#8ED2CC',
  },
  dark: {
    background: '#121417',
    surface: '#1A1E23',
    surfaceVariant: '#242A31',
    text: '#FFFFFF',
    textSecondary: '#9CA3AF',
    border: '#2D3643',
    primary: BRAND_COLOR,
    primaryDark: '#5BA8A2',
    primaryLight: '#8ED2CC',
  },
};

export const typography = {
  h1: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  h2: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
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
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
};

export const elevation = {
  small: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
    },
    android: {
      elevation: 2,
    },
    web: {
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15)',
    },
  }),
  medium: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    android: {
      elevation: 4,
    },
    web: {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
    },
  }),
  large: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: {
      elevation: 8,
    },
    web: {
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
    },
  }),
};
