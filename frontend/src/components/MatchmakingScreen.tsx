import { colors, typography } from '../types/design';

/**
 * MatchmakingScreen — Queue waiting screen
 * Aura (UI) — KIXoff
 */

interface MatchmakingScreenProps {
  queuePosition: number;
  estimatedWait: number; // seconds
  onCancel: () => void;
}

export function MatchmakingScreen({ queuePosition, estimatedWait, onCancel }: MatchmakingScreenProps) {
  return (
    <div style={{
      minHeight: '100vh',
      background: colors.base,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '32px',
      fontFamily: typography.body,
      color: colors.textPrimary,
    }}>
      {/* Pulsing search indicator */}
      <div style={{
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        border: `3px solid ${colors.accent}30`,
        borderTopColor: colors.accent,
        animation: 'spin 1s linear infinite',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{
          fontFamily: typography.heading,
          fontSize: '32px',
          color: colors.accent,
        }}>
          {queuePosition}
        </span>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: typography.heading, fontSize: '28px', margin: '0 0 8px 0' }}>
          Finding Match...
        </h2>
        <p style={{ color: colors.textSecondary, fontSize: '14px' }}>
          Est. wait: {estimatedWait}s · Position #{queuePosition}
        </p>
      </div>

      <button
        onClick={onCancel}
        style={{
          padding: '10px 32px',
          borderRadius: '8px',
          border: `1px solid ${colors.danger}50`,
          fontFamily: typography.heading,
          fontSize: '16px',
          cursor: 'pointer',
          background: 'transparent',
          color: colors.danger,
        }}
      >
        CANCEL
      </button>
    </div>
  );
}
