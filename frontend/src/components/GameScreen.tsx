import { useEffect, useRef, useState, useCallback } from 'react';
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
  const snapshotRef = useRef<Snapshot | null>(null);
  const [hud, setHud] = useState({ home: 0, away: 0, time: '3:00', phase: 'playing' });
  const keys = useRef<Record<string, boolean>>({});
  const inputSeq = useRef(0);

  // Mock snapshot
  useEffect(() => {
    const mock: Snapshot = {
      matchId: 'mock', tick: 0, timeRemaining: 180000, phase: 'playing',
      homeScore: 0, awayScore: 0,
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
    snapshotRef.current = mock;
  }, []);

  // Keyboard input
  useEffect(() => {
    const down = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; };
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // Render loop (60fps client-side interpolation)
  useEffect(() => {
    let raf: number;
    const render = () => {
      const canvas = canvasRef.current;
      const snap = snapshotRef.current;
      if (canvas && snap) {
        const ctx = canvas.getContext('2d')!;
        drawField(ctx);
        drawBall(ctx, snap.ball.x, snap.ball.y);
        snap.players.forEach(p => drawPlayer(ctx, p.x, p.y, p.team, p.hasBall, p.stunned));
      }
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, []);

  // HUD update
  useEffect(() => {
    const t = setInterval(() => {
      const snap = snapshotRef.current;
      if (!snap) return;
      const secs = Math.ceil(snap.timeRemaining / 1000);
      setHud({
        home: snap.homeScore,
        away: snap.awayScore,
        time: `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`,
        phase: snap.phase,
      });
    }, 100);
    return () => clearInterval(t);
  }, []);

  const drawField = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#0A0E27';
    ctx.fillRect(0, 0, FIELD_W, FIELD_H);
    ctx.strokeStyle = '#00F0FF30';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, FIELD_W - 40, FIELD_H - 40);
    ctx.beginPath();
    ctx.moveTo(FIELD_W / 2, 20); ctx.lineTo(FIELD_W / 2, FIELD_H - 20); ctx.stroke();
    ctx.beginPath();
    ctx.arc(FIELD_W / 2, FIELD_H / 2, 60, 0, Math.PI * 2); ctx.stroke();
    // Goals
    ctx.fillStyle = '#00F0FF20';
    ctx.fillRect(0, FIELD_H / 2 - 50, 20, 100);
    ctx.fillStyle = '#FF006E20';
    ctx.fillRect(FIELD_W - 20, FIELD_H / 2 - 50, 20, 100);
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, x: number, y: number, team: string, hasBall: boolean, stunned: boolean) => {
    const color = team === 'home' ? '#00F0FF' : '#FF006E';
    ctx.shadowBlur = 15; ctx.shadowColor = color;
    ctx.fillStyle = stunned ? '#FF3333' : color;
    ctx.beginPath(); ctx.arc(x, y, PLAYER_R, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    if (hasBall) {
      ctx.strokeStyle = '#FFB800'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y, PLAYER_R + 4, 0, Math.PI * 2); ctx.stroke();
    }
  };

  const drawBall = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.shadowBlur = 10; ctx.shadowColor = '#FFB800';
    ctx.fillStyle = '#FFB800';
    ctx.beginPath(); ctx.arc(x, y, BALL_R, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-kix-bg p-4">
      {/* HUD */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-4">
        <div className="glass-card px-6 py-2 flex items-center gap-4">
          <span className="font-display text-3xl text-kix-cyan neon-cyan">{hud.home}</span>
          <span className="text-kix-text-muted">HOME</span>
        </div>
        <div className="glass-card px-8 py-2">
          <span className="font-display text-3xl text-kix-gold neon-gold">{hud.time}</span>
        </div>
        <div className="glass-card px-6 py-2 flex items-center gap-4">
          <span className="text-kix-text-muted">AWAY</span>
          <span className="font-display text-3xl text-kix-pink neon-pink">{hud.away}</span>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={FIELD_W}
        height={FIELD_H}
        className="rounded-2xl border-2 border-kix-cyan/20 shadow-[0_0_60px_#00F0FF20]"
      />

      {/* Controls hint */}
      <div className="mt-4 flex gap-6 text-kix-text-secondary text-sm font-body">
        <span>WASD: Move</span>
        <span>Space: Shoot</span>
        <span>Shift: Pass</span>
        <span>E: Tackle</span>
        <span>Q: Dash</span>
      </div>

      <button className="mt-4 text-kix-text-muted hover:text-kix-red text-sm" onClick={() => navigate('results')}>
        End Match (Debug)
      </button>
    </div>
  );
}
