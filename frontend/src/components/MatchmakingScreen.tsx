import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MatchmakingProps {
  onMatchFound: (matchId: string) => void;
  onCancel: () => void;
}

export const MatchmakingScreen: React.FC<MatchmakingProps> = ({ onMatchFound, onCancel }) => {
  const [status, setStatus] = useState<'searching' | 'found' | 'connecting'>('searching');
  const [elapsed, setElapsed] = useState(0);
  const [playersFound, setPlayersFound] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(e => e + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Simulate finding players
    const t1 = setTimeout(() => { setPlayersFound(3); }, 2000);
    const t2 = setTimeout(() => { setPlayersFound(5); }, 4000);
    const t3 = setTimeout(() => {
      setPlayersFound(6);
      setStatus('found');
      setTimeout(() => {
        setStatus('connecting');
        setTimeout(() => onMatchFound('match_' + Date.now()), 1500);
      }, 1000);
    }, 5500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0E27] flex flex-col items-center justify-center gap-6">
      <AnimatePresence mode="wait">
        {status === 'searching' && (
          <motion.div
            key="searching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            {/* Radar animation */}
            <div className="relative w-48 h-48 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-[#00F0FF]/20" />
              <div className="absolute inset-4 rounded-full border-2 border-[#00F0FF]/30" />
              <div className="absolute inset-8 rounded-full border-2 border-[#00F0FF]/40" />
              <motion.div
                className="absolute inset-0 rounded-full border-t-2 border-[#00F0FF]"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-rajdhani text-3xl font-bold text-[#00F0FF]">{playersFound}/6</span>
              </div>
            </div>
            <p className="text-white font-rajdhani text-2xl">Searching for players...</p>
            <p className="text-white/40 font-inter text-sm mt-1">{elapsed}s elapsed</p>
          </motion.div>
        )}

        {status === 'found' && (
          <motion.div
            key="found"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <motion.h2
              className="font-rajdhani text-5xl font-bold text-[#FFB800]"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: 2 }}
            >
              MATCH FOUND!
            </motion.h2>
          </motion.div>
        )}

        {status === 'connecting' && (
          <motion.div
            key="connecting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <motion.div
              className="w-16 h-16 border-4 border-[#00F0FF]/20 border-t-[#00F0FF] rounded-full mx-auto mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <p className="text-white font-rajdhani text-2xl">Connecting to arena...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {status === 'searching' && (
        <button
          onClick={onCancel}
          className="px-6 py-2 rounded-lg border-2 border-[#FF006E]/50 text-[#FF006E] font-rajdhani text-lg hover:bg-[#FF006E]/10 transition-colors"
        >
          CANCEL
        </button>
      )}
    </div>
  );
};
