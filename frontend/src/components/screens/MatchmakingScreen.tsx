import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { colors, fonts, spacing, radii } from '../../styles/tokens';
import { MenuButton } from '../ui/MenuButton';

interface Props {
  status: 'searching' | 'found' | 'cancelled' | 'error';
  playersFound?: number;
  totalPlayers?: number;
  estimatedWait?: number;
  onMatchFound: (matchId: string) => void;
  onCancel: () => void;
}

export const MatchmakingScreen: React.FC<Props> = ({ status, playersFound = 0, totalPlayers = 6, estimatedWait = 0, onMatchFound, onCancel }) => {
  const [dots, setDots] = useState('');
  React.useEffect(() => {
    const i = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(i);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: colors.base, fontFamily: fonts.body, gap: spacing.xl }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        style={{ width: 80, height: 80, borderRadius: '50%', border: `4px solid ${colors.surfaceHi}`, borderTopColor: colors.accent }} />
      <h1 style={{ fontFamily: fonts.heading, fontSize: '2rem', color: colors.textPrimary, letterSpacing: '0.1em' }}>
        {status === 'searching' ? `Searching${dots}` : status === 'found' ? 'Match Found!' : status === 'error' ? 'Error' : 'Cancelled'}
      </h1>
      {status === 'searching' && (
        <>
          <p style={{ color: colors.textSecondary, fontSize: '1rem' }}>{playersFound}/{totalPlayers} players found</p>
          {estimatedWait > 0 && <p style={{ color: colors.textMuted, fontSize: '0.875rem' }}>Est. wait: {estimatedWait}s</p>}
          <MenuButton label="Cancel" variant="danger" onClick={onCancel} />
        </>
      )}
      {status === 'found' && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
          style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          <p style={{ color: colors.success, fontSize: '1.25rem' }}>All 6 players ready!</p>
          <MenuButton label="Enter Arena" onClick={() => onMatchFound('')} />
        </motion.div>
      )}
    </div>
  );
};
