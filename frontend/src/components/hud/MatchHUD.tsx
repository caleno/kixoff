import React from 'react';
import { motion } from 'framer-motion';
import { colors, fonts, spacing, radii } from '../../styles/tokens';

interface HUDProps {
  scoreHome: number;
  scoreAway: number;
  timeRemaining: number;
  playerName: string;
  playerRating: number;
  fps: number;
  ping: number;
}

export const MatchHUD: React.FC<HUDProps> = ({
  scoreHome, scoreAway, timeRemaining, playerName, playerRating, fps, ping,
}) => {
  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const isLowTime = timeRemaining < 30000;

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      padding: spacing.md, display: 'flex',
      justifyContent: 'space-between', alignItems: 'flex-start',
      pointerEvents: 'none', zIndex: 100, fontFamily: fonts.body,
    }}>
      {/* Player Info */}
      <div style={{
        background: colors.glass, backdropFilter: 'blur(10px)',
        borderRadius: radii.md, padding: `${spacing.sm} ${spacing.md}`,
        border: `1px solid ${colors.surfaceHi}`,
      }}>
        <div style={{ color: colors.textPrimary, fontWeight: 700, fontSize: '0.875rem' }}>{playerName}</div>
        <div style={{ color: colors.accent, fontSize: '0.75rem' }}>★ {playerRating}</div>
      </div>

      {/* Score + Timer */}
      <motion.div
        animate={{ scale: isLowTime ? [1, 1.05, 1] : 1 }}
        transition={{ duration: 0.5, repeat: isLowTime ? Infinity : 0 }}
        style={{
          background: colors.glass, backdropFilter: 'blur(10px)',
          borderRadius: radii.lg, padding: `${spacing.sm} ${spacing.xl}`,
          border: `1px solid ${isLowTime ? colors.warning : colors.surfaceHi}`,
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: spacing.md, alignItems: 'center' }}>
          <span style={{ color: colors.teamHome, fontSize: '1.5rem', fontWeight: 800, fontFamily: fonts.heading }}>{scoreHome}</span>
          <span style={{ color: colors.textMuted, fontSize: '1rem' }}>VS</span>
          <span style={{ color: colors.teamAway, fontSize: '1.5rem', fontWeight: 800, fontFamily: fonts.heading }}>{scoreAway}</span>
        </div>
        <div style={{
          color: isLowTime ? colors.warning : colors.textSecondary,
          fontSize: '1.25rem', fontWeight: 700, fontFamily: fonts.heading,
          letterSpacing: '0.05em',
        }}>{timeStr}</div>
      </motion.div>

      {/* Performance */}
      <div style={{
        background: colors.glass, backdropFilter: 'blur(10px)',
        borderRadius: radii.md, padding: `${spacing.sm} ${spacing.md}`,
        border: `1px solid ${colors.surfaceHi}`, textAlign: 'right',
      }}>
        <div style={{ color: fps > 50 ? colors.success : colors.warning, fontSize: '0.75rem' }}>{fps} FPS</div>
        <div style={{ color: ping < 50 ? colors.success : ping < 100 ? colors.warning : colors.danger, fontSize: '0.75rem' }}>{ping}ms</div>
      </div>
    </div>
  );
};
