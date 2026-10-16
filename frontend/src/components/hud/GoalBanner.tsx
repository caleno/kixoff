import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { colors, fonts, spacing, radii, animations } from '../../styles/tokens';

interface GoalBannerProps {
  show: boolean;
  scoringTeam: 'home' | 'away';
  scorerName: string;
}

export const GoalBanner: React.FC<GoalBannerProps> = ({ show, scoringTeam, scorerName }) => {
  const teamColor = scoringTeam === 'home' ? colors.teamHome : colors.teamAway;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.4, ease: animations.bounce }}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 200, textAlign: 'center', pointerEvents: 'none',
          }}
        >
          <div style={{
            fontSize: '5rem', fontWeight: 900, fontFamily: fonts.heading,
            color: teamColor, textShadow: `0 0 40px ${teamColor}, 0 0 80px ${teamColor}`,
            letterSpacing: '0.1em',
          }}>GOAL!</div>
          <div style={{
            fontSize: '1.5rem', color: colors.textPrimary, fontFamily: fonts.body,
            marginTop: spacing.sm,
          }}>{scorerName} scores for {scoringTeam === 'home' ? 'HOME' : 'AWAY'}!</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
