import { colors, typography } from '../types/design';

/**
 * HUD — Heads-Up Display overlay
 * Aura (UI) — KIXoff
 *
 * Shows score, timer, stamina, and match state.
 */

interface HUDProps {
  score: { home: number; away: number };
  timeRemaining: number; // ms
  stamina: number; // 0-100
  connected: boolean;
}

export function HUD({ score, timeRemaining, stamina, connected }: HUDProps) {
  const seconds = Math.ceil(timeRemaining / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
  const isLowTime = seconds <= 30;

  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0,
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      pointerEvents: 'none',
      fontFamily: typography.body,
    }}>
      {/* Score */}
      <div style={{
        display: 'flex',
        gap: '24px',
        alignItems: 'center',
        background: `${colors.base}CC`,
        padding: '8px 20px',
        borderRadius: '8px',
        backdropFilter: 'blur(8px)',
      }}>
        <span style={{ color: colors.accent, fontSize: '28px', fontWeight: 700, fontFamily: typography.heading }}>
          {score.home}
        </span>
        <span style={{ color: colors.textMuted, fontSize: '16px' }}>VS</span>
        <span style={{ color: colors.highlight, fontSize: '28px', fontWeight: 700, fontFamily: typography.heading }}>
          {score.away}
        </span>
      </div>

      {/* Timer */}
      <div style={{
        background: `${colors.base}CC`,
        padding: '8px 20px',
        borderRadius: '8px',
        backdropFilter: 'blur(8px)',
      }}>
        <span style={{
          color: isLowTime ? colors.danger : colors.warning,
          fontSize: '32px',
          fontWeight: 700,
          fontFamily: typography.heading,
          textShadow: isLowTime ? `0 0 12px ${colors.danger}` : 'none',
        }}>
          {timeStr}
        </span>
      </div>

      {/* Connection + Stamina */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '8px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: `${colors.base}CC`,
          padding: '6px 12px',
          borderRadius: '8px',
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: connected ? colors.success : colors.danger,
            boxShadow: connected ? `0 0 8px ${colors.success}` : 'none',
          }} />
          <span style={{ color: colors.textSecondary, fontSize: '12px' }}>
            {connected ? 'Connected' : 'Reconnecting...'}
          </span>
        </div>

        {/* Stamina bar */}
        <div style={{
          width: '120px',
          height: '6px',
          background: colors.baseLight,
          borderRadius: '3px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${stamina}%`,
            height: '100%',
            background: stamina > 30 ? colors.accent : colors.danger,
            transition: 'width 0.2s ease',
            boxShadow: stamina > 30 ? `0 0 8px ${colors.accent}` : `0 0 8px ${colors.danger}`,
          }} />
        </div>
      </div>
    </div>
  );
}
