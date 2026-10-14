import React from 'react';
import { motion } from 'framer-motion';
import { colors, fonts, spacing, radii } from '../../styles/tokens';
import { MenuButton } from '../ui/MenuButton';

interface Props {
  result: 'win' | 'loss' | 'draw';
  scoreHome: number;
  scoreAway: number;
  ratingChange: number;
  kreditsEarned: number;
  goals: number;
  assists: number;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const PostMatchScreen: React.FC<Props> = ({ result, scoreHome, scoreAway, ratingChange, kreditsEarned, goals, assists, onPlayAgain, onMainMenu }) => {
  const resultText = result === 'win' ? 'VICTORY' : result === 'loss' ? 'DEFEAT' : 'DRAW';
  const resultColor = result === 'win' ? colors.success : result === 'loss' ? colors.danger : colors.warning;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: colors.base, fontFamily: fonts.body, gap: spacing.lg }}>
      <motion.h1 initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        style={{ fontFamily: fonts.heading, fontSize: '3.5rem', color: resultColor, letterSpacing: '0.15em', textShadow: `0 0 30px ${resultColor}` }}>
        {resultText}
      </motion.h1>
      <div style={{ display: 'flex', gap: spacing.xl, alignItems: 'center' }}>
        <span style={{ color: colors.teamHome, fontSize: '3rem', fontWeight: 800, fontFamily: fonts.heading }}>{scoreHome}</span>
        <span style={{ color: colors.textMuted, fontSize: '2rem' }}>-</span>
        <span style={{ color: colors.teamAway, fontSize: '3rem', fontWeight: 800, fontFamily: fonts.heading }}>{scoreAway}</span>
      </div>
      <div style={{ display: 'flex', gap: spacing.xl, background: colors.surface, borderRadius: radii.lg, padding: spacing.lg }}>
        <Stat label="Rating" value={`${ratingChange >= 0 ? '+' : ''}${ratingChange}`} color={ratingChange >= 0 ? colors.success : colors.danger} />
        <Stat label="Kredits" value={`+${kreditsEarned}`} color={colors.warning} />
        <Stat label="Goals" value={String(goals)} color={colors.accent} />
        <Stat label="Assists" value={String(assists)} color={colors.highlight} />
      </div>
      <div style={{ display: 'flex', gap: spacing.md }}>
        <MenuButton label="Play Again" onClick={onPlayAgain} />
        <MenuButton label="Main Menu" variant="secondary" onClick={onMainMenu} />
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ color: colors.textMuted, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
    <div style={{ color, fontSize: '1.5rem', fontWeight: 700, fontFamily: fonts.heading }}>{value}</div>
  </div>
);
