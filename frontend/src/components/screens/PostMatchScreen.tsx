import React from 'react';
import { motion } from 'framer-motion';
import { colors, fonts, spacing, radii } from '../../styles/tokens';

interface PostMatchProps {
  result: 'win' | 'loss' | 'draw';
  scoreHome: number;
  scoreAway: number;
  ratingChange: number;
  kreditsEarned: number;
  stats: { goals: number; assists: number; saves: number; passes: number };
  onContinue: () => void;
}

export const PostMatchScreen: React.FC<PostMatchProps> = ({
  result, scoreHome, scoreAway, ratingChange, kreditsEarned, stats, onContinue,
}) => {
  const resultColor = result === 'win' ? colors.success : result === 'loss' ? colors.danger : colors.warning;
  const resultText = result === 'win' ? 'VICTORY' : result === 'loss' ? 'DEFEAT' : 'DRAW';

  return (
    <div style={{
      minHeight: '100vh', background: colors.base,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: spacing.xl, gap: spacing.lg,
    }}>
      <motion.h1
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        style={{
          fontFamily: fonts.heading, fontSize: '4rem', fontWeight: 900,
          color: resultColor, textShadow: `0 0 30px ${resultColor}`,
          margin: 0,
        }}
      >{resultText}</motion.h1>

      <div style={{ fontFamily: fonts.heading, fontSize: '2rem', color: colors.textPrimary }}>
        {scoreHome} - {scoreAway}
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing.md,
        width: '400px',
      }}>
        {[
          { label: 'Rating', value: `${ratingChange > 0 ? '+' : ''}${ratingChange}`, color: ratingChange >= 0 ? colors.success : colors.danger },
          { label: 'Kredits', value: `+${kreditsEarned}`, color: colors.warning },
          { label: 'Goals', value: stats.goals, color: colors.accent },
          { label: 'Assists', value: stats.assists, color: colors.accent },
          { label: 'Saves', value: stats.saves, color: colors.highlight },
          { label: 'Passes', value: stats.passes, color: colors.textSecondary },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: colors.surfaceAlt, borderRadius: radii.md,
            padding: spacing.md, textAlign: 'center',
          }}>
            <div style={{ color: colors.textMuted, fontSize: '0.75rem', fontFamily: fonts.body }}>{stat.label}</div>
            <div style={{ color: stat.color, fontSize: '1.5rem', fontWeight: 700, fontFamily: fonts.heading }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onContinue}
        style={{
          padding: `${spacing.md} ${spacing.xxl}`, marginTop: spacing.lg,
          background: `linear-gradient(135deg, ${colors.accent}, ${colors.highlight})`,
          border: 'none', borderRadius: radii.md, cursor: 'pointer',
          fontFamily: fonts.heading, fontSize: '1.25rem', fontWeight: 700,
          color: colors.base,
        }}
      >CONTINUE</motion.button>
    </div>
  );
};
