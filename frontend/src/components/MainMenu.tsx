import React from 'react';
import { motion } from 'framer-motion';

interface MainMenuProps {
  onPlay: () => void;
  onGarage: () => void;
  onCareer: () => void;
  onSettings: () => void;
  playerName: string;
  playerRank: string;
  currency: { kredits: number; gems: number };
}

const buttonVariants = {
  idle: { scale: 1, boxShadow: '0 0 20px rgba(0, 240, 255, 0.2)' },
  hover: { scale: 1.05, boxShadow: '0 0 40px rgba(0, 240, 255, 0.5)' },
  tap: { scale: 0.98 },
};

export const MainMenu: React.FC<MainMenuProps> = ({
  onPlay, onGarage, onCareer, onSettings,
  playerName, playerRank, currency
}) => {
  return (
    <div className="min-h-screen bg-[#0A0E27] flex flex-col items-center justify-center gap-8">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center"
      >
        <h1 className="font-rajdhani text-7xl font-bold tracking-wider">
          <span className="text-[#00F0FF]">KIX</span>
          <span className="text-[#FF006E]">off</span>
        </h1>
        <p className="text-white/50 font-inter text-sm tracking-widest mt-1">3v3 ARCADE KICKOFF</p>
      </motion.div>

      {/* Player Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white/5 border border-white/10 rounded-xl px-6 py-3 flex items-center gap-6"
      >
        <div>
          <p className="text-white font-inter font-semibold">{playerName}</p>
          <p className="text-[#FFB800] font-rajdhani text-sm">{playerRank}</p>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-[#00F0FF] font-rajdhani text-xl font-bold">{currency.kredits}</p>
            <p className="text-white/40 text-xs">Kredits</p>
          </div>
          <div className="text-center">
            <p className="text-[#FF006E] font-rajdhani text-xl font-bold">{currency.gems}</p>
            <p className="text-white/40 text-xs">Gems</p>
          </div>
        </div>
      </motion.div>

      {/* Menu Buttons */}
      <div className="flex flex-col gap-4 w-72">
        {[
          { label: 'PLAY', action: onPlay, primary: true },
          { label: 'GARAGE', action: onGarage, primary: false },
          { label: 'CAREER', action: onCareer, primary: false },
          { label: 'SETTINGS', action: onSettings, primary: false },
        ].map((btn, i) => (
          <motion.button
            key={btn.label}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            variants={buttonVariants}
            initial="idle"
            whileHover="hover"
            whileTap="tap"
            onClick={btn.action}
            className={`px-8 py-4 rounded-xl font-rajdhani text-2xl font-bold tracking-wider transition-colors ${
              btn.primary
                ? 'bg-[#00F0FF]/10 border-2 border-[#00F0FF] text-[#00F0FF]'
                : 'bg-white/5 border-2 border-white/10 text-white hover:border-white/30'
            }`}
          >
            {btn.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
