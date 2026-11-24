import { useState, useEffect } from 'react';

interface Props {
  connected: boolean;
  queued: boolean;
  rating: number;
  onCancel: () => void;
}

export function MatchmakingScreen({ connected, queued, rating, onCancel }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const status = !connected
    ? 'Connecting to arena...'
    : queued
      ? elapsed >= 10
        ? 'Widening search — bots will fill soon...'
        : 'Searching for opponents...'
    : 'Match found! Entering arena...';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-kix-bg p-6">
      <button
        className="absolute top-6 left-6 text-kix-text-secondary hover:text-kix-text-primary"
        onClick={onCancel}
      >
        ← Cancel
      </button>

      {/* Radar animation */}
      <div className={`relative w-48 h-48 mb-8 ${!queued ? 'animate-pulse-glow' : ''}`}>
        <div className="absolute inset-0 rounded-full border-2 border-kix-cyan/30 animate-ping" />
        <div className="absolute inset-4 rounded-full border-2 border-kix-cyan/50" />
        <div className="absolute inset-8 rounded-full border-2 border-kix-cyan/70" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-3xl text-kix-cyan neon-cyan">🔍</span>
        </div>
      </div>

      <h2 className="font-display font-bold text-2xl text-kix-text-primary mb-2">{status}</h2>
      <p className="font-body text-kix-text-secondary text-lg">
        {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
      </p>
      <p className="mt-4 text-kix-text-muted text-sm">Rating: {rating} • Region: EU-North</p>
    </div>
  );
}
