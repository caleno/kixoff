import { motion } from 'framer-motion';
import { colors, spacing, fonts, fontSizes, radii, shadows } from '../../styles/tokens';

interface HUDProps {
  scoreHome: number;
  scoreAway: number;
  timeRemaining: number; // ms
  teamHomeName: string;
  teamAwayName: string;
}

export function MatchHUD({ scoreHome, scoreAway, timeRemaining, teamHomeName, teamAwayName }: HUDProps) {
  const seconds = Math.ceil(timeRemaining / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
  const isLowTime = seconds <= 30;

  return (
    <motion.div
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: spacing.lg,
        padding: `${spacing.sm} ${spacing.xl}`,
        background: colors.overlay,
        borderBottomLeftRadius: radii.lg,
        borderBottomRightRadius: radii.lg,
        fontFamily: fonts.heading,
        zIndex: 100,
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Home team */}
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
        <span style={{ color: colors.teamHome, fontSize: fontSizes.lg, fontWeight: 700 }}>
          {teamHomeName}
        </span>
      </div>

      {/* Score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
        <span style={{ color: colors.teamHome, fontSize: fontSizes.xxl, fontWeight: 700 }}>
          {scoreHome}
        </span>
        <span style={{ color: colors.textMuted, fontSize: fontSizes.md }}>:</span>
        <span style={{ color: colors.teamAway, fontSize: fontSizes.xxl, fontWeight: 700 }}>
          {scoreAway}
        </span>
      </div>

      {/* Away team */}
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
        <span style={{ color: colors.teamAway, fontSize: fontSizes.lg, fontWeight: 700 }}>
          {teamAwayName}
        </span>
      </div>

      {/* Timer */}
      <div
        style={{
          marginLeft: spacing.md,
          padding: `${spacing.xs} ${spacing.md}`,
          borderRadius: radii.sm,
          background: isLowTime ? colors.danger : colors.surfaceHi,
          color: isLowTime ? colors.textPrimary : colors.warning,
          fontSize: fontSizes.lg,
          fontWeight: 700,
          fontFamily: fonts.mono,
          minWidth: '80px',
          textAlign: 'center',
          boxShadow: isLowTime ? `0 0 12px ${colors.danger}` : 'none',
        }}
      >
        {timeStr}
      </div>
    </motion.div>
  );
}
