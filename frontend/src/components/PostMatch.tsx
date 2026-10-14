// ==================== POST-MATCH SUMMARY ====================

export function PostMatch({
  score,
  mvp,
  xpGained,
  onRematch,
  onMenu,
}: {
  score: { home: number; away: number };
  mvp: string;
  xpGained: number;
  onRematch: () => void;
  onMenu: () => void;
}) {
  const result = score.home > score.away ? 'VICTORY' : score.home < score.away ? 'DEFEAT' : 'DRAW';
  const resultColor = result === 'VICTORY' ? 'text-kixoff-cyan' : result === 'DEFEAT' ? 'text-kixoff-magenta' : 'text-kixoff-amber';

  return (
    <div className="flex flex-col items-center gap-6">
      <h2 className={`text-6xl font-heading font-bold ${resultColor}`}>{result}</h2>
      <div className="text-3xl font-heading">
        {score.home} - {score.away}
      </div>
      <div className="bg-white/10 rounded-lg p-4 flex flex-col items-center gap-2">
        <span className="text-kixoff-amber font-heading text-xl">🏆 MVP</span>
        <span className="text-2xl font-bold">{mvp}</span>
      </div>
      <div className="text-kixoff-cyan">+{xpGained} XP</div>
      <div className="flex gap-4">
        <button
          onClick={onRematch}
          className="px-8 py-3 bg-kixoff-cyan text-kixoff-navy font-heading font-bold rounded-lg hover:bg-kixoff-cyan/80"
        >
          REMATCH
        </button>
        <button
          onClick={onMenu}
          className="px-8 py-3 bg-white/10 rounded-lg hover:bg-white/20"
        >
          MENU
        </button>
      </div>
    </div>
  );
}
