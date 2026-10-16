import React from 'react';
import { motion } from 'framer-motion';

interface PostMatchProps {
  result: 'win' | 'loss' | 'draw';
  scoreHome: number;
  scoreAway: number;
  stats: {
    goals: number;
    assists: number;
    saves: number;
    rating: number;
  };
  xpGained: number;
  kreditsGained: number;
  onContinue: () => void;
}

export const PostMatchScreen: React.FC<PostMatchProps> = ({
  result, scoreHome, scoreAway, stats, xpGained, kreditsGained, onContinue
}) => {
  const resultColor = result === 'win' ? '#00F0FF' : result === 'loss' ? '#FF006E' : '#FFB800';
  const resultText = result === 'win' ? 'VICTORY' : result === 'loss' ? 'DEFEAT' : 'DRAW';

  return (
    <div className="min-h-screen bg-[#0A0E27] flex flex-col items-center justify-center gap-6">
      <motion.h1
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="font-rajdhani text-7xl font-bold"
        style={{ color: resultColor, textShadow: `0 0 40px ${resultColor}80` }}
      >
        {resultText}
      </motion.h1>

      <div className="text-white font-rajdhani text-4xl">
        {scoreHome} <span className="text-white/30">—</span> {scoreAway}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-6 w-80 space-y-3">
        <h3 className="text-white/60 font-inter text-sm tracking-widest text-center">MATCH STATS</h3>
        {[
          { label: 'Goals', value: stats.goals },
          { label: 'Assists', value: stats.assists },
          { label: 'Saves', value: stats.saves },
          { label: 'Rating', value: stats.rating.toFixed(1) },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="flex justify-between items-center"
          >
            <span className="text-white/60 font-inter">{stat.label}</span>
            <span className="text-white font-rajdhani text-xl font-bold">{stat.value}</span>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex gap-6"
      >
        <div className="text-center">
          <p className="text-[#00F0FF] font-rajdhani text-3xl font-bold">+{xpGained}</p>
          <p className="text-white/40 text-xs">XP</p>
        </div>
        <div className="text-center">
          <p className="text-[#FFB800] font-rajdhani text-3xl font-bold">+{kreditsGained}</p>
          <p className="text-white/40 text-xs">Kredits</p>
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        onClick={onContinue}
        className="px-12 py-3 rounded-xl bg-[#00F0FF]/10 border-2 border-[#00F0FF] text-[#00F0FF] font-rajdhani text-xl font-bold hover:bg-[#00F0FF]/20 transition-colors"
      >
        CONTINUE
      </motion.button>
    </div>
  );
};
