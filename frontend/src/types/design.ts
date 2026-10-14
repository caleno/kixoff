import { ReactNode } from 'react';

/**
 * Aura Design System — Color Tokens
 * KIXoff neon-arcade palette
 */

export const colors = {
  // Base
  base: '#0A0E27',
  baseLight: '#141B3D',
  baseLighter: '#1E2750',

  // Accents
  accent: '#00F0FF',      // Cyan — primary UI
  accentDim: '#00A8B5',
  highlight: '#FF006E',    // Magenta — secondary
  highlightDim: '#B5004F',
  warning: '#FFB800',      // Amber — warnings, timer
  success: '#00FF88',      // Green — success, win
  danger: '#FF3333',       // Red — danger, loss

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A8C0',
  textMuted: '#5A6080',

  // Field
  fieldGreen: '#0D5F2D',
  fieldLine: '#FFFFFF40',
} as const;

export const typography = {
  heading: "'Rajdhani', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '48px',
  xxl: '96px',
} as const;

export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '16px',
  full: '9999px',
} as const;

export const shadows = {
  neon: `0 0 20px ${colors.accent}40`,
  neonHighlight: `0 0 20px ${colors.highlight}40`,
  card: '0 4px 24px rgba(0, 0, 0, 0.4)',
} as const;

export const animations = {
  fast: '0.15s',
  normal: '0.3s',
  slow: '0.5s',
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

export interface ScreenProps {
  children?: ReactNode;
}
