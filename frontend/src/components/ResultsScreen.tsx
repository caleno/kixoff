import type { MatchEndResult } from '../hooks/useGameSocket';

interface Props {
  result: MatchEndResult | null;
  onPlayAgain: () => void;
  onExit: () => void;
}

export function ResultsScreen({ result, onPlayAgain, onExit }: Props) {
  const homeScore = result?.homeScore ?? 0;
  const awayScore = result?.awayScore ?? 0;
  // Minimal slice: client always plays the home side.
  const won = homeScore > awayScore;
  const draw = homeScore === awayScore;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-kix-bg p-6">
      <h1
        className={`font-display font-bold text-6xl mb-2 ${
          draw ? 'text-kix-gold' : won ? 'text-kix-green' : 'text-kix-red'
        }`}
      >
        {draw ? 'DRAW' : won ? 'VICTORY!' : 'DEFEAT'}
      </h1>
      <p className="text-kix-text-secondary text-lg mb-8">Match Complete</p>

      <div className="glass-card px-12 py-6 mb-8">
        <div className="flex items-center gap-8">
          <span className="font-display text-5xl text-kix-cyan">{homeScore}</span>
          <span className="text-kix-text-muted text-2xl">—</span>
          <span className="font-display text-5xl text-kix-pink">{awayScore}</span>
        </div>
      </div>

      <p className="text-kix-text-muted text-sm mb-8">
        Per-player stats and rating changes coming soon.
      </p>

      <div className="flex gap-4">
        <button className="btn-neon" onClick={onPlayAgain}>
          PLAY AGAIN
        </button>
        <button
          className="glass-card px-6 py-3 font-display font-semibold text-lg text-kix-text-primary hover:border-kix-cyan/30"
          onClick={onExit}
        >
          MAIN MENU
        </button>
      </div>
    </div>
  );
}
