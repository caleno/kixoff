import { colors, typography } from '../types/design';

/**
 * PostMatch — Results screen after match ends
 * Aura (UI) — KIXoff
 */

interface PostMatchProps {
  score: { home: number; away: number };
  result: 'win' | 'loss' | 'draw';
  stats: {
    goals: number;
    assists: number;
    saves: number;
    ratingChange: number;
    kreditsEarned: number;
  };
  onContinue: () => void;
}

export function PostMatch({ score, result, stats, onContinue }: PostMatchProps) {
  const resultColor = result === 'win' ? colors.success : result === 'loss' ? colors.danger : colors.warning;
  const resultText = result === 'win' ? 'VICTORY' : result === 'loss' ? 'DEFEAT' : 'DRAW';

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.base,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '24px',
      fontFamily: typography.body,
      color: colors.textPrimary,
    }}>
      {/* Result banner */}
      <h1 style={{
        fontFamily: typography.heading,
        fontSize: '64px',
        fontWeight: 700,
        color: resultColor,
        textShadow: `0 0 30px ${resultColor}60`,
        margin: 0,
      }}>
        {resultText}
      </h1>

      {/* Score */}
      <div style={{
        display: 'flex',
        gap: '32px',
        alignItems: 'center',
        fontSize: '48px',
        fontFamily: typography.heading,
      }}>
        <span style={{ color: colors.accent }}>{score.home}</span>
        <span style={{ color: colors.textMuted, fontSize: '24px' }}>-</span>
        <span style={{ color: colors.highlight }}>{score.away}</span>
      </div>

      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        background: colors.baseLight,
        padding: '24px',
        borderRadius: '12px',
        border: `1px solid ${colors.accent}20`,
      }}>
        <StatBox label="GOALS" value={stats.goals} />
        <StatBox label="ASSISTS" value={stats.assists} />
        <StatBox label="SAVES" value={stats.saves} />
      </div>

      {/* Rewards */}
      <div style={{
        display: 'flex',
        gap: '24px',
      }}>
        <RewardChip label="Rating" value={`${stats.ratingChange >= 0 ? '+' : ''}${stats.ratingChange}`} color={stats.ratingChange >= 0 ? colors.success : colors.danger} />
        <RewardChip label="Kredits" value={`+${stats.kreditsEarned}`} color={colors.warning} />
      </div>

      {/* Continue button */}
      <button
        onClick={onContinue}
        style={{
          padding: '14px 48px',
          borderRadius: '8px',
          border: 'none',
          fontFamily: typography.heading,
          fontSize: '20px',
          fontWeight: 600,
          letterSpacing: '2px',
          cursor: 'pointer',
          background: `linear-gradient(90deg, ${colors.accent}, ${colors.accentDim})`,
          color: colors.base,
          boxShadow: `0 0 20px ${colors.accent}40`,
        }}
      >
        CONTINUE
      </button>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '32px', fontWeight: 700, fontFamily: typography.heading, color: colors.accent }}>{value}</div>
      <div style={{ fontSize: '11px', color: colors.textMuted, letterSpacing: '1px' }}>{label}</div>
    </div>
  );
}

function RewardChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      background: colors.baseLighter,
      padding: '8px 20px',
      borderRadius: '8px',
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
    }}>
      <span style={{ fontSize: '12px', color: colors.textMuted }}>{label}</span>
      <span style={{ fontSize: '18px', fontWeight: 700, color }}>{value}</span>
    </div>
  );
}
