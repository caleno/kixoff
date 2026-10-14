import React from 'react';
import { motion } from 'framer-motion';
import { colors, fonts, spacing, radii } from '../../styles/tokens';

interface MainMenuProps {
  playerName: string;
  playerRating: number;
  currency: { kredits: number; gems: number };
  onPlay: () => void;
  onGarage: () => void;
  onCareer: () => void;
  onSettings: () => void;
}

const MenuButton: React.FC<{ label: string; icon: string; onClick: () => void; primary?: boolean }> = ({ label, icon, onClick, primary }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    style={{
      width: '100%', padding: `${spacing.md} ${spacing.xl}`,
      background: primary ? `linear-gradient(135deg, ${colors.accent}, ${colors.highlight})` : colors.surfaceAlt,
      border: 'none', borderRadius: radii.md, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: spacing.md,
      fontFamily: fonts.heading, fontSize: '1.25rem', fontWeight: 700,
      color: primary ? colors.base : colors.textPrimary,
      boxShadow: primary ? `0 0 20px ${colors.accent}40` : 'none',
    }}
  >
    <span style={{ fontSize: '1.5rem' }}>{icon}</span>
    {label}
  </motion.button>
);

export const MainMenu: React.FC<MainMenuProps> = ({
  playerName, playerRating, currency, onPlay, onGarage, onCareer, onSettings,
}) => (
  <div style={{
    minHeight: '100vh', background: colors.base,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: spacing.xl, gap: spacing.lg,
  }}>
    <motion.h1
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      style={{
        fontFamily: fonts.heading, fontSize: '4rem', fontWeight: 900,
        background: `linear-gradient(135deg, ${colors.accent}, ${colors.highlight})`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        letterSpacing: '0.05em', margin: 0,
      }}
    >KIXoff</motion.h1>

    <div style={{ color: colors.textSecondary, fontFamily: fonts.body, marginBottom: spacing.xl }}>
      {playerName} · ★ {playerRating} · {currency.kredits} K · {currency.gems} 💎
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md, width: '320px' }}>
      <MenuButton label="PLAY" icon="▶" onClick={onPlay} primary />
      <MenuButton label="GARAGE" icon="🔧" onClick={onGarage} />
      <MenuButton label="CAREER" icon="📊" onClick={onCareer} />
      <MenuButton label="SETTINGS" icon="⚙" onClick={onSettings} />
    </div>
  </div>
);
