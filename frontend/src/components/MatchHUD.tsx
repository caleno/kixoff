import React from 'react';

interface HUDProps {
  scoreHome: number;
  scoreAway: number;
  timeRemaining: number;
  playerStats: {
    name: string;
    team: 'home' | 'away';
    goals: number;
    assists: number;
  }[];
}

export const MatchHUD: React.FC<HUDProps> = ({ scoreHome, scoreAway, timeRemaining, playerStats }) => {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60).toString().padStart(2, '0');
  const isOvertime = timeRemaining < 30;

  return (
    <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
      {/* Score Bar */}
      <div className="flex items-center justify-center gap-8 py-3 bg-gradient-to-b from-[#0A0E27]/90 to-transparent">
        {/* Home Score */}
        <div className="flex items-center gap-3">
          <span className="text-cyan-400 font-rajdhani text-2xl font-bold tracking-wider">HOME</span>
          <span className="text-white font-rajdhani text-5xl font-bold tabular-nums">{scoreHome}</span>
        </div>

        {/* Timer */}
        <div className={`px-6 py-1 rounded-lg ${isOvertime ? 'bg-[#FF006E]/20 border border-[#FF006E]' : 'bg-white/5 border border-white/10'}`}>
          <span className={`font-rajdhani text-3xl font-bold tabular-nums ${isOvertime ? 'text-[#FF006E] animate-pulse' : 'text-[#FFB800]'}`}>
            {minutes}:{seconds}
          </span>
        </div>

        {/* Away Score */}
        <div className="flex items-center gap-3">
          <span className="text-white font-rajdhani text-5xl font-bold tabular-nums">{scoreAway}</span>
          <span className="text-[#FF006E] font-rajdhani text-2xl font-bold tracking-wider">AWAY</span>
        </div>
      </div>

      {/* Player Stats (bottom) */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between">
        {/* Home team stats */}
        <div className="space-y-1">
          {playerStats.filter(p => p.team === 'home').map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="text-cyan-400 font-inter">{p.name}</span>
              <span className="text-white/60">G:{p.goals} A:{p.assists}</span>
            </div>
          ))}
        </div>
        {/* Away team stats */}
        <div className="space-y-1 text-right">
          {playerStats.filter(p => p.team === 'away').map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-sm justify-end">
              <span className="text-white/60">G:{p.goals} A:{p.assists}</span>
              <span className="text-[#FF006E] font-inter">{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
