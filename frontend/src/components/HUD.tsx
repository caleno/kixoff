import { GameState } from '../types/game';

// ==================== IN-GAME HUD ====================

export function HUD({ state }: { state: GameState }) {
  const matchTime = 180; // 3 minutes in seconds

  return (
    <div className="absolute top-0 left-0 right-0 p-4 pointer-events-none">
      {/* SCORE BAR */}
      <div className="flex items-center justify-center gap-8">
        <div className="text-4xl font-heading font-bold text-kixoff-cyan">
          {state.score.home}
        </div>
        <div className="px-6 py-1 bg-black/50 rounded-lg">
          <span className="text-2xl font-heading font-bold text-kixoff-amber">
            {Math.floor(matchTime / 60)}:{String(matchTime % 60).padStart(2, '0')}
          </span>
        </div>
        <div className="text-4xl font-heading font-bold text-kixoff-magenta">
          {state.score.away}
        </div>
      </div>

      {/* PHASE OVERLAY */}
      {state.phase !== 'playing' && (
        <div className="flex items-center justify-center mt-8">
          <span className="text-5xl font-heading font-bold text-kixoff-amber uppercase tracking-widest">
            {state.phase}
          </span>
        </div>
      )}
    </div>
  );
}
