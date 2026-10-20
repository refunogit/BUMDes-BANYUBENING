/** Central visual tokens — core palette from the PRD. */
export const palette = {
  primary: '#2F86D1',
  navy: '#0C3B6E',
  gold: '#D8A93E',
  danger: '#D64545',
  dark: '#121212',
  green: '#2E7D32',
  greenAccent: '#22C55E',
  grey: '#8A8A8A',
  sky: '#EAF2FA',
  amberSoft: 'rgba(216,169,62,0.15)',
} as const;

export const radius = 12;
export const radiusLg = 24;

export type ThemeColors = {
  primary: string;
  navy: string;
  gold: string;
  danger: string;
  success: string;
  green: string;
  greenAccent: string;
  bg: string;
  card: string;
  surface: string;
  text: string;
  textMuted: string;
  textOnPrimary: string;
  border: string;
  divider: string;
  overlay: string;
  inputBg: string;
  chipBg: string;
  headerFrom: string;
  headerTo: string;
  amberSoft: string;
};

export const lightColors: ThemeColors = {
  primary: palette.primary,
  navy: palette.navy,
  gold: palette.gold,
  danger: palette.danger,
  success: palette.green,
  green: palette.green,
  greenAccent: '#16A34A',
  bg: '#F2F6FA',
  card: '#FFFFFF',
  surface: '#F1F4F8',
  text: '#16324A',
  textMuted: '#6B7C8F',
  textOnPrimary: '#FFFFFF',
  border: '#DDE3EA',
  divider: '#DDE3EA',
  overlay: 'rgba(9,24,38,0.55)',
  inputBg: '#FFFFFF',
  chipBg: '#EAF1F8',
  headerFrom: '#2F86D1',
  headerTo: '#0C3B6E',
  amberSoft: palette.amberSoft,
};

export const darkColors: ThemeColors = {
  primary: palette.primary,
  navy: palette.navy,
  gold: palette.gold,
  danger: palette.danger,
  success: '#4ADE80',
  green: '#4ADE80',
  greenAccent: '#22C55E',
  bg: '#121212',
  card: '#1B1B1B',
  surface: '#202020',
  text: '#EAF2FA',
  textMuted: '#9AA7B4',
  textOnPrimary: '#FFFFFF',
  border: '#2C2C2C',
  divider: '#2C2C2C',
  overlay: 'rgba(0,0,0,0.72)',
  inputBg: '#232323',
  chipBg: '#242424',
  headerFrom: '#0C3B6E',
  headerTo: '#121212',
  amberSoft: palette.amberSoft,
};
