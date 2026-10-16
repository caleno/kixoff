import React from 'react';
import { motion } from 'framer-motion';
import { colors, fonts, spacing, radii } from '../../styles/tokens';
import { MenuButton } from '../ui/MenuButton';

interface MainMenuProps {
  playerName: string;
  playerRating: number;
  currency: { kredits: number; gems: number };
  onPlay: () => void;
  onGarage: () => void;
  onCareer: () => void;
  onSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  playerName, playerRating, currency, onPlay, onGarage, onCareer, onSettings,
}) => {
  return (
    <div style={{
      minHeight: '100vh', background: colors.base,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', fontFamily: fonts.body, color: colors.textPrimary,
      gap: spacing.xl, padding: spacing.xl,
    }}>
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center' }}
      >
        <h1 style={{
          fontFamily: fonts.heading, fontSize: '5rem', fontWeight: 700,
          background: `linear-gradient(135deg, ${colors.accent}, ${colors.highlight})`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0,
        }}>KIXoff</h1>
        <p style={{ color: colors.textSecondary, letterSpacing: '0.3em', textTransform: 'uppercase', fontSize: '0.875rem' }}>
          3v3 Neon Arena
        </p>
      </motion.div>

      {/* Player Bar */}
      <div style={{
        display: 'flex', gap: spacing.lg, alignItems: 'center',
        background: colors.surface, borderRadius: radii.lg,
        padding: `${spacing.md} ${spacing.xl}`, border: `1px solid ${colors.surfaceHi}`,
      }}>
        <span style={{ color: colors.textPrimary, fontWeight: 600 }}>{playerName}</span>
        <span style={{ color: colors.accent }}>★ {playerRating}</span>
        <span style={{ color: colors.warning }}>◈ {currency.kredits}</span>
        <span style={{ color: colors.highlight }}>◆ {currency.gems}</span>
      </div>

      {/* Menu Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}
      >
        <MenuButton label="Quick Play" icon="⚡" onClick={onPlay} variant="primary" />
        <MenuButton label="Garage" icon="🔧" onClick={onGarage} variant="secondary" />
        <MenuButton label="Career" icon="📊" onClick={onCareer} variant="secondary" />
        <MenuButton label="Settings" icon="⚙️" onClick={onSettings} variant="secondary" />
      </motion.div>
    </div>
  );
};
