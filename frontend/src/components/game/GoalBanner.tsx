import { motion, AnimatePresence } from 'framer-motion';
import { colors, spacing, fonts, fontSizes, radii, shadows } from '../../styles/tokens';

interface GoalBannerProps {
  show: boolean;
  scoringTeam: 'home' | 'away';
  teamName: string;
}

export function GoalBanner({ show, scoringTeam, teamName }: GoalBannerProps) {
  const teamColor = scoringTeam === 'home' ? colors.teamHome : colors.teamAway;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 200,
            pointerEvents: 'none',
          }}
        >
          <motion.span
            style={{
              fontFamily: fonts.heading,
              fontSize: fontSizes.display,
              fontWeight: 700,
              color: teamColor,
              textShadow: `0 0 30px ${teamColor}, 0 0 60px ${teamColor}`,
              letterSpacing: '0.1em',
            }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.8, repeat: 2 }}
          >
            GOAL!
          </motion.span>
          <motion.span
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              fontFamily: fonts.body,
              fontSize: fontSizes.lg,
              color: colors.textSecondary,
            }}
          >
            {teamName} scores!
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
