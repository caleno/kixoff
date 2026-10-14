import type { Screen } from '../types';

interface Props {
  navigate: (screen: Screen) => void;
}

export function ResultsScreen({ navigate }: Props) {
  const won = true; // Mock
  const homeScore = 3;
  const awayScore = 1;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-kix-bg p-6">
      <h1 className={`font-display font-bold text-6xl mb-2 ${won ? 'text-kix-green' : 'text-kix-red'}`}>
        {won ? 'VICTORY!' : 'DEFEAT'}
      </h1>
      <p className="text-kix-text-secondary text-lg mb-8">Match Complete</p>

      <div className="glass-card px-12 py-6 mb-8">
        <div className="flex items-center gap-8">
          <span className="font-display text-5xl text-kix-cyan">{homeScore}</span>
          <span className="text-kix-text-muted text-2xl">—</span>
          <span className="font-display text-5xl text-kix-pink">{awayScore}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="glass-card px-8 py-4 mb-8 w-full max-w-md">
        <h3 className="font-display text-kix-text-secondary text-sm mb-3">YOUR PERFORMANCE</h3>
        <div className="grid grid-cols-2 gap-4">
          <Stat label="Goals" value={2} color="kix-gold" />
          <Stat label="Assists" value={1} color="kix-cyan" />
          <Stat label="Saves" value={0} color="kix-green" />
          <Stat label="Tackles" value={3} color="kix-pink" />
        </div>
        <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
          <span className="text-kix-text-secondary">Rating Change</span>
          <span className="font-display text-xl text-kix-green">+24</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-kix-text-secondary">Kredits Earned</span>
          <span className="font-display text-xl text-kix-gold">+150</span>
        </div>
      </div>

      <div className="flex gap-4">
        <button className="btn-neon" onClick={() => navigate('matchmaking')}>PLAY AGAIN</button>
        <button className="glass-card px-6 py-3 font-display font-semibold text-lg text-kix-text-primary hover:border-kix-cyan/30" onClick={() => navigate('main-menu')}>
          MAIN MENU
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <p className={`font-display text-3xl text-${color}`}>{value}</p>
      <p className="text-kix-text-muted text-xs uppercase tracking-wide">{label}</p>
    </div>
  );
}
