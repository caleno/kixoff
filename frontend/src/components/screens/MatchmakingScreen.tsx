import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { colors, fonts, spacing, radii } from '../../styles/tokens';

interface MatchmakingScreenProps {
  onMatchFound: (matchId: string) => void;
  onCancel: () => void;
}

export const MatchmakingScreen: React.FC<MatchmakingScreenProps> = ({ onMatchFound, onCancel }) => {
  const [elapsed, setElapsed] = useState(0);
  const [playersFound, setPlayersFound] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((e) => e + 1);
      setPlayersFound((p) => Math.min(p + Math.random() > 0.7 ? 1 : 0, 6));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      minHeight: '100vh', background: colors.base, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: fonts.body, color: colors.textPrimary, gap: spacing.xl,
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        style={{
          width: '80px', height: '80px',
          border: `4px solid ${colors.surfaceHi}`,
          borderTopColor: colors.accent,
          borderRadius: '50%',
        }}
      />
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: fonts.heading, fontSize: '2rem', color: colors.accent, margin: 0 }}>
          Searching for Match
        </h2>
        <p style={{ color: colors.textSecondary, marginTop: spacing.sm }}>
          {playersFound}/6 players found · {formatTime(elapsed)}
        </p>
      </div>
      <div style={{ display: 'flex', gap: spacing.md }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: i < playersFound ? colors.accent : colors.surfaceAlt,
            border: `2px solid ${i < playersFound ? colors.accent : colors.surfaceHi}`,
            boxShadow: i < playersFound ? `0 0 12px ${colors.accent}80` : 'none',
            transition: 'all 300ms ease',
          }} />
        ))}
      </div>
      <button
        onClick={onCancel}
        style={{
          fontFamily: fonts.heading, fontSize: '1rem',
          padding: `${spacing.sm} ${spacing.xl}`, borderRadius: radii.md,
          background: 'transparent', color: colors.danger,
          border: `1px solid ${colors.danger}`, cursor: 'pointer',
        }}
      >Cancel</button>
    </div>
  );
};
