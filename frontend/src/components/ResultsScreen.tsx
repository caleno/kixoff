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
      <p className="text-kix-text-secondary text-xl mb-8 font-body">Match Complete</p>

      <div className="glass-card px-12 py-6 mb-8">
        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="text-kix-cyan font-display text-5xl">{homeScore}</p>
            <p className="text-kix-text-muted text-sm">HOME</p>
          </div>
          <span className="text-kix-text-muted text-3xl">—</span>
          <div className="text-center">
            <p className="text-kix-pink font-display text-5xl">{awayScore}</p>
            <p className="text-kix-text-muted text-sm">AWAY</p>
          </div>
        </div>
      </div>

      {/* Player stats */}
      <div className="glass-card px-8 py-4 mb-8 w-full max-w-md">
        <h3 className="font-display text-kix-text-primary text-lg mb-3">Your Performance</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div><p className="text-kix-gold font-display text-2xl">2</p><p className="text-kix-text-muted text-xs">GOALS</p></div>
          <div><p className="text-kix-cyan font-display text-2xl">1</p><p className="text-kix-text-muted text-xs">ASSISTS</p></div>
          <div><p className="text-kix-green font-display text-2xl">+24</p><p className="text-kix-text-muted text-xs">RATING</p></div>
        </div>
      </div>

      {/* Rewards */}
      <div className="glass-card px-8 py-4 mb-8 w-full max-w-md">
        <div className="flex justify-between items-center">
          <span className="text-kix-text-secondary">Kredits earned</span>
          <span className="text-kix-gold font-display text-xl">+150</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-kix-text-secondary">XP earned</span>
          <span className="text-kix-cyan font-display text-xl">+300</span>
        </div>
      </div>

      <div className="flex gap-4">
        <button className="btn-neon" onClick={() => navigate('matchmaking')}>
          PLAY AGAIN
        </button>
        <button className="glass-card px-6 py-3 font-display font-semibold text-lg text-kix-text-primary hover:border-kix-cyan/30" onClick={() => navigate('main-menu')}>
          MAIN MENU
        </button>
      </div>
    </div>
  );
}
