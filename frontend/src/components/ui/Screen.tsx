import React from 'react';
import { motion } from 'framer-motion';
import { colors, fonts, spacing, radii } from '../../styles/tokens';

interface ScreenProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

export const Screen: React.FC<ScreenProps> = ({ title, subtitle, children, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      style={{
        minHeight: '100vh',
        background: colors.base,
        color: colors.textPrimary,
        fontFamily: fonts.body,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: spacing.xl,
      }}
    >
      <div style={{ width: '100%', maxWidth: '1200px', flex: 1 }}>
        <div style={{ marginBottom: spacing.xl, textAlign: 'center' }}>
          <h1 style={{
            fontFamily: fonts.heading,
            fontSize: '3rem',
            fontWeight: 700,
            color: colors.accent,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            margin: 0,
            textShadow: `0 0 30px ${colors.accent}40`,
          }}>{title}</h1>
          {subtitle && (
            <p style={{ color: colors.textSecondary, fontSize: '1rem', marginTop: spacing.sm }}>
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>
    </motion.div>
  );
};
