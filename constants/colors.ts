// LoClock Material Design 3 color tokens
// Derived from the Stitch design system

export const darkColors = {
  // Backgrounds
  bg: '#181c1e',
  surface: '#1c2022',
  surfaceHigh: '#272a2c',
  surfaceHighest: '#333537',
  surfaceLowest: '#0c0f10',

  // Primary (ocean blue)
  primary: '#87d0f4',
  primaryContainer: '#004d66',
  onPrimary: '#003546',
  onPrimaryContainer: '#c0e8ff',

  // Secondary
  secondary: '#b4cad6',
  secondaryContainer: '#364954',
  onSecondary: '#1e333d',
  onSecondaryContainer: '#d0e6f3',

  // Tertiary (teal)
  tertiary: '#5dd8e2',
  tertiaryContainer: '#004f54',
  onTertiary: '#003639',

  // Error
  error: '#ffb4ab',
  errorContainer: '#93000a',
  onError: '#690005',

  // Text / On-surface
  text: '#e2e2e6',
  textMuted: '#bfc8ce',
  textDim: '#899297',

  // Outline
  border: '#3f484d',
  borderLight: '#899297',
  outline: '#899297',
  outlineVariant: '#3f484d',

  // Aliases for existing usage
  accent: '#87d0f4',
  accentLight: '#c0e8ff',
  accentMuted: 'rgba(135,208,244,0.15)',
  alarm: '#87d0f4',
  alarmDark: '#004d66',
  alarmMuted: 'rgba(135,208,244,0.10)',
  location: '#5dd8e2',
  locationMuted: 'rgba(93,216,226,0.15)',
  danger: '#ffb4ab',
  surfaceElevated: '#272a2c',
  surfaceLight: '#1c2022',
};

export const lightColors = {
  // Backgrounds
  bg: '#f7f9fc',
  surface: '#ffffff',
  surfaceHigh: '#e8eaed',
  surfaceHighest: '#dfe1e4',
  surfaceLowest: '#f0f2f5',

  // Primary (ocean blue)
  primary: '#006686',
  primaryContainer: '#c0e8ff',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#001e2b',

  // Secondary
  secondary: '#4d616c',
  secondaryContainer: '#d0e6f3',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#081e27',

  // Tertiary (teal)
  tertiary: '#004f54',
  tertiaryContainer: '#7df4ff',
  onTertiary: '#ffffff',

  // Error
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onError: '#ffffff',

  // Text / On-surface
  text: '#181c1e',
  textMuted: '#3f484d',
  textDim: '#899297',

  // Outline
  border: '#bfc8ce',
  borderLight: '#dfe1e4',
  outline: '#6f797e',
  outlineVariant: '#bfc8ce',

  // Aliases for existing usage
  accent: '#006686',
  accentLight: '#87d0f4',
  accentMuted: 'rgba(0,102,134,0.10)',
  alarm: '#006686',
  alarmDark: '#004d66',
  alarmMuted: 'rgba(0,102,134,0.08)',
  location: '#006970',
  locationMuted: 'rgba(0,105,112,0.10)',
  danger: '#ba1a1a',
  surfaceElevated: '#e8eaed',
  surfaceLight: '#f0f2f5',
};

export type Colors = typeof darkColors;
