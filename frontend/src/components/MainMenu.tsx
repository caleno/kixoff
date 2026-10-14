import { colors, typography } from '../types/design';

/**
 * MainMenu — Landing screen after boot
 * Aura (UI) — KIXoff
 */

interface MainMenuProps {
  onPlay: () => void;
  onGarage: () => void;
  onCareer: () => void;
  onSettings: () => void;
  playerName: string;
  playerRating: number;
  currency: { kredits: number; gems: number };
}

export function MainMenu({ onPlay, onGarage, onCareer, onSettings, playerName, playerRating, currency }: MainMenuProps) {
  return (
    <div style={{
      minHeight: '100vh',
      background: `radial-gradient(ellipse at center, ${colors.baseLight} 0%, ${colors.base} 100%)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '32px',
      fontFamily: typography.body,
      color: colors.textPrimary,
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontFamily: typography.heading,
          fontSize: '72px',
          fontWeight: 700,
          letterSpacing: '4px',
          background: `linear-gradient(90deg, ${colors.accent}, ${colors.highlight})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0,
        }}>
          KIXoff
        </h1>
        <p style={{ color: colors.textSecondary, fontSize: '14px', letterSpacing: '2px', marginTop: '4px' }}>
          NEON ARCADE FOOTBALL
        </p>
      </div>

      {/* Player card */}
      <div style={{
        background: colors.baseLight,
        border: `1px solid ${colors.accent}30`,
        borderRadius: '12px',
        padding: '16px 32px',
        display: 'flex',
        gap: '24px',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 600 }}>{playerName}</div>
          <div style={{ fontSize: '12px', color: colors.textSecondary }}>Rating: {playerRating}</div>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: colors.warning }}>{currency.kredits}</div>
            <div style={{ fontSize: '10px', color: colors.textMuted }}>KREDITS</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: colors.accent }}>{currency.gems}</div>
            <div style={{ fontSize: '10px', color: colors.textMuted }}>GEMS</div>
          </div>
        </div>
      </div>

      {/* Menu buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '280px' }}>
        <MenuButton label="PLAY" onClick={onPlay} primary />
        <MenuButton label="GARAGE" onClick={onGarage} />
        <MenuButton label="CAREER" onClick={onCareer} />
        <MenuButton label="SETTINGS" onClick={onSettings} />
      </div>
    </div>
  );
}

function MenuButton({ label, onClick, primary }: { label: string; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '14px 24px',
        borderRadius: '8px',
        border: 'none',
        fontFamily: typography.heading,
        fontSize: '20px',
        fontWeight: 600,
        letterSpacing: '2px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        background: primary
          ? `linear-gradient(90deg, ${colors.accent}, ${colors.accentDim})`
          : colors.baseLighter,
        color: primary ? colors.base : colors.textPrimary,
        boxShadow: primary ? `0 0 20px ${colors.accent}40` : 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = primary
          ? `0 4px 30px ${colors.accent}60`
          : `0 4px 20px ${colors.base}80`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = primary ? `0 0 20px ${colors.accent}40` : 'none';
      }}
    >
      {label}
    </button>
  );
}
