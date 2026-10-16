import React from 'react';
import { motion } from 'framer-motion';
import { colors, fonts, spacing, radii, shadows } from '../../styles/tokens';

interface MenuButtonProps {
  label: string;
  icon?: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

const variantStyles = {
  primary: { background: `linear-gradient(135deg, ${colors.accent}, #0099CC)`, color: colors.base, border: 'none', shadow: shadows.glow },
  secondary: { background: 'transparent', color: colors.textPrimary, border: `1px solid ${colors.surfaceHi}`, shadow: 'none' },
  danger: { background: `linear-gradient(135deg, ${colors.danger}, #CC0033)`, color: colors.textPrimary, border: 'none', shadow: 'none' },
};

export const MenuButton: React.FC<MenuButtonProps> = ({ label, icon, onClick, variant = 'primary', disabled }) => {
  const vs = variantStyles[variant];
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: fonts.heading, fontSize: '1.125rem', fontWeight: 600, letterSpacing: '0.05em',
        padding: `${spacing.md} ${spacing.xl}`, borderRadius: radii.md,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        boxShadow: vs.shadow, background: vs.background, color: vs.color, border: vs.border,
        display: 'flex', alignItems: 'center', gap: spacing.sm, justifyContent: 'center',
        minWidth: '200px', transition: 'all 200ms ease',
      }}
    >
      {icon && <span style={{ fontSize: '1.25rem' }}>{icon}</span>}
      {label}
    </motion.button>
  );
};
