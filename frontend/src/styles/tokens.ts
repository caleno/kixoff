// ═══════════════════════════════════════════════════════════
// KIXoff Design Tokens — Aura (UI/UX)
// Single source of truth for all visual constants
// ═══════════════════════════════════════════════════════════

export const colors = {
  base:       '#0A0E27',
  surface:    '#111634',
  surfaceAlt: '#1A1F3F',
  surfaceHi:  '#252B52',
  accent:     '#00F0FF',
  highlight:  '#FF006E',
  warning:    '#FFB800',
  success:    '#00E676',
  danger:     '#FF1744',
  textPrimary:   '#FFFFFF',
  textSecondary: '#B0B8D8',
  textMuted:     '#6B7299',
  teamHome: '#00F0FF',
  teamAway: '#FF006E',
  overlay: 'rgba(10, 14, 39, 0.85)',
  glass:   'rgba(26, 31, 63, 0.6)',
} as const;

export const spacing = {
  xs:  '4px',
  sm:  '8px',
  md:  '16px',
  lg:  '24px',
  xl:  '32px',
  xxl: '48px',
  xxxl: '64px',
} as const;

export const radii = {
  sm:   '4px',
  md:   '8px',
  lg:   '16px',
  full: '9999px',
} as const;

export const fonts = {
  heading: '"Rajdhani", sans-serif',
  body:    '"Inter", sans-serif',
  mono:    '"JetBrains Mono", monospace',
} as const;

export const fontSizes = {
  xs:  '0.75rem',
  sm:  '0.875rem',
  md:  '1rem',
  lg:  '1.25rem',
  xl:  '1.5rem',
  xxl: '2rem',
  display: '3.5rem',
} as const;

export const animations = {
  fast:     '150ms',
  normal:   '300ms',
  slow:     '500ms',
  slower:   '800ms',
  ease:     'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce:   'cubic-bezier(0.34, 1.56, 0.64, 1)',
  spring:   'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export const shadows = {
  sm:    '0 2px 8px rgba(0, 0, 0, 0.3)',
  md:    '0 4px 16px rgba(0, 0, 0, 0.4)',
  lg:    '0 8px 32px rgba(0, 0, 0, 0.5)',
  glow:  '0 0 20px rgba(0, 240, 255, 0.4)',
  glowPink: '0 0 20px rgba(255, 0, 110, 0.4)',
} as const;

export const zIndices = {
  base:    0,
  content: 10,
  header:  100,
  overlay: 1000,
  modal:   2000,
  toast:   3000,
} as const;
