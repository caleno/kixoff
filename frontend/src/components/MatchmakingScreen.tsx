import { useState, useEffect } from 'react';
import type { PlayerProfile, Screen } from '../types';

interface Props {
  player: PlayerProfile;
  navigate: (screen: Screen) => void;
}

export function MatchmakingScreen({ player, navigate }: Props) {
  const [status, setStatus] = useState('Searching for opponents...');
  const [elapsed, setElapsed] = useState(0);
  const [found, setFound] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);

    // Simulate match found after 4 seconds
    const found = setTimeout(() => {
      setStatus('Match found! Entering arena...');
      setFound(true);
      setTimeout(() => navigate('game'), 1500);
    }, 4000);

    return () => {
      clearInterval(timer);
      clearTimeout(found);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-kix-bg p-6">
      <button className="absolute top-6 left-6 text-kix-text-secondary hover:text-kix-text-primary" onClick={() => navigate('main-menu')}>
        ← Cancel
      </button>

      {/* Radar animation */}
      <div className={`relative w-48 h-48 mb-8 ${found ? 'animate-pulse-glow' : ''}`}>
        <div className="absolute inset-0 rounded-full border-2 border-kix-cyan/30 animate-ping" />
        <div className="absolute inset-4 rounded-full border-2 border-kix-cyan/50" />
        <div className="absolute inset-8 rounded-full border-2 border-kix-cyan/70" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-3xl text-kix-cyan neon-cyan">{found ? '✓' : '🔍'}</span>
        </div>
      </div>

      <h2 className="font-display font-bold text-2xl text-kix-text-primary mb-2">
        {status}
      </h2>
      <p className="font-body text-kix-text-secondary text-lg">
        {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
      </p>
      <p className="mt-4 text-kix-text-muted text-sm">
        Rating: {player.rating} • Region: EU-North
      </p>
    </div>
  );
}
