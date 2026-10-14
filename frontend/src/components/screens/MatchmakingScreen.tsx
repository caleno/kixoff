import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { colors, fonts, spacing, radii } from '../../styles/tokens';

interface MatchmakingScreenProps {
  onMatchFound: () => void;
  onCancel: () => void;
}

export const MatchmakingScreen: React.FC<MatchmakingScreenProps> = ({ onMatchFound, onCancel }) => {
  const [elapsed, setElapsed] = useState(0);
  const [playersFound, setPlayersFound] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((e) => e + 1);
      if (playersFound < 6 && Math.random() > 0.6) {
        setPlayersFound((p) => Math.min(p + 1, 6));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [playersFound]);

  useEffect(() => {
    if (playersFound === 6) {
      const timeout = setTimeout(onMatchFound, 1500);
      return () => clearTimeout(timeout);
    }
  }, [playersFound, onMatchFound]);

  return (
    <div style={{
      minHeight: '100vh', background: colors.base,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: spacing.xl,
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        style={{
          width: 80, height: 80, borderRadius: '50%',
          border: `4px solid ${colors.surfaceAlt}`,
          borderTopColor: colors.accent,
        }}
      />
      <div style={{ fontFamily: fonts.heading, fontSize: '2rem', color: colors.textPrimary }}>
        Finding Match...
      </div>
      <div style={{ color: colors.textSecondary, fontFamily: fonts.body }}>
        {playersFound}/6 players found · {elapsed}s
      </div>
      <div style={{ display: 'flex', gap: spacing.sm }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{
            width: 12, height: 12, borderRadius: '50%',
            background: i < playersFound ? colors.accent : colors.surfaceHi,
            boxShadow: i < playersFound ? `0 0 8px ${colors.accent}` : 'none',
          }} />
        ))}
      </div>
      <button
        onClick={onCancel}
        style={{
          padding: `${spacing.sm} ${spacing.xl}`,
          background: 'transparent', border: `1px solid ${colors.danger}`,
          borderRadius: radii.md, color: colors.danger,
          fontFamily: fonts.body, cursor: 'pointer', fontSize: '1rem',
        }}
      >Cancel</button>
    </div>
  );
};
