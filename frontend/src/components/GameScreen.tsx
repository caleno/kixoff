import { useEffect, useRef, useState } from 'react';
import type { Screen, Snapshot, PlayerInput } from '../types';

interface Props {
  navigate: (screen: Screen) => void;
}

const FIELD_W = 800;
const FIELD_H = 500;
const PLAYER_R = 16;
const BALL_R = 8;

export function GameScreen({ navigate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [hudData, setHudData] = useState({ home: 0, away: 0, time: 180 });
  const inputSeq = useRef(0);
  const keys = useRef<Record<string, boolean>>({});

  // Mock snapshot loop (replace with Socket.io)
  useEffect(() => {
    const mockSnapshot: Snapshot = {
      matchId: 'mock',
      tick: 0,
      timeRemaining: 180000,
      phase: 'playing',
      homeScore: 0,
      awayScore: 0,
      players: [
        { id: 'p1', team: 'home', x: 200, y: 250, rot: 0, stamina: 100, hasBall: true, stunned: false },
        { id: 'p2', team: 'home', x: 150, y: 200, rot: 0, stamina: 100, hasBall: false, stunned: false },
        { id: 'p3', team: 'home', x: 150, y: 300, rot: 0, stamina: 100, hasBall: false, stunned: false },
        { id: 'p4', team: 'away', x: 600, y: 250, rot: Math.PI, stamina: 100, hasBall: false, stunned: false },
        { id: 'p5', team: 'away', x: 650, y: 200, rot: Math.PI, stamina: 100, hasBall: false, stunned: false },
        { id: 'p6', team: 'away', x: 650, y: 300, rot: Math.PI, stamina: 100, hasBall: false, stunned: false },
      ],
      ball: { x: 200, y: 250, vx: 0, vy: 0, ownerId: 'p1' },
      lastEvent: null,
    };
    setSnapshot(mockSnapshot);

    const interval = setInterval(() => {
      setSnapshot((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tick: prev.tick + 1,
          timeRemaining: Math.max(0, prev.timeRemaining - 50),
        };
      });
      setHudData((prev) => ({
        home: 0,
        away: 0,
        time: Math.ceil((snapshot?.timeRemaining || 180000) / 1000),
      }));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Keyboard input
  useEffect(() => {
    const down = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; };
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !snapshot) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#0A0E27';
    ctx.fillRect(0, 0, FIELD_W, FIELD_H);

    // Field lines
    ctx.strokeStyle = '#00F0FF30';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, FIELD_W - 40, FIELD_H - 40);
    ctx.beginPath();
    ctx.moveTo(FIELD_W / 2, 20);
    ctx.lineTo(FIELD_W / 2, FIELD_H - 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(FIELD_W / 2, FIELD_H / 2, 60, 0, Math.PI * 2);
    ctx.stroke();

    // Goals
    ctx.fillStyle = '#00F0FF20';
    ctx.fillRect(0, FIELD_H / 2 - 50, 20, 100);
    ctx.fillStyle = '#FF006E20';
    ctx.fillRect(FIELD_W - 20, FIELD_H / 2 - 50, 20, 100);

    // Players
    snapshot.players.forEach((p) => {
      const color = p.team === 'home' ? '#00F0FF' : '#FF006E';
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(p.x, p.y, PLAYER_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Direction indicator
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + Math.cos(p.rot) * 20, p.y + Math.sin(p.rot) * 20);
      ctx.stroke();
    });

    // Ball
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(snapshot.ball.x, snapshot.ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [snapshot]);

  const formatTime = (ms: number) => {
    const s = Math.ceil(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-kix-bg p-4">
      {/* HUD */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-4">
        <div className="glass-card px-6 py-2 flex items-center gap-4">
          <span className="font-display text-3xl text-kix-cyan neon-cyan">{snapshot?.homeScore ?? 0}</span>
          <span className="text-kix-text-muted">HOME</span>
        </div>
        <div className="glass-card px-8 py-2">
          <span className="font-display text-3xl text-kix-gold neon-gold">
            {formatTime(snapshot?.timeRemaining ?? 180000)}
          </span>
        </div>
        <div className="glass-card px-6 py-2 flex items-center gap-4">
          <span className="text-kix-text-muted">AWAY</span>
          <span className="font-display text-3xl text-kix-pink neon-pink">{snapshot?.awayScore ?? 0}</span>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={FIELD_W}
        height={FIELD_H}
        className="rounded-2xl border border-kix-cyan/20 shadow-[0_0_60px_#00F0FF20]"
      />

      {/* Controls hint */}
      <div className="mt-4 flex gap-6 text-kix-text-secondary text-sm font-body">
        <span>WASD — Move</span>
        <span>Space — Shoot</span>
        <span>Shift — Pass</span>
        <span>E — Tackle</span>
      </div>

      <button className="mt-4 text-kix-text-muted hover:text-kix-red" onClick={() => navigate('results')}>
        End Match (Debug)
      </button>
    </div>
  );
}
