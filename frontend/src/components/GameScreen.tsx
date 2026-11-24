import { useCallback, useRef } from 'react';
import { useCanvasRenderer } from '../hooks/useCanvasRenderer';
import { useKeyboardInput } from '../hooks/useKeyboardInput';
import type { Snapshot, PlayerInput } from '../types';

interface Props {
  snapshot: Snapshot | null;
  sendInput: (input: Omit<PlayerInput, 'seq' | 'timestamp'>) => void;
  connected: boolean;
}

export function GameScreen({ snapshot, sendInput, connected }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sendInputRef = useRef(sendInput);
  sendInputRef.current = sendInput;

  const handleInput = useCallback(
    (input: { moveX: number; moveY: number; action: string }) => {
      sendInputRef.current({
        moveX: input.moveX,
        moveY: input.moveY,
        action: input.action as PlayerInput['action'],
      });
    },
    [],
  );

  useKeyboardInput(handleInput);
  useCanvasRenderer(canvasRef, snapshot);

  const secs = snapshot ? Math.max(0, Math.ceil(snapshot.timeRemaining / 1000)) : 180;
  const hud = {
    home: snapshot?.homeScore ?? 0,
    away: snapshot?.awayScore ?? 0,
    time: `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`,
    phase: snapshot?.phase ?? 'connecting',
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-kix-bg p-6">
      {/* Connection / waiting overlay */}
      {!connected && (
        <div className="mb-4 glass-card px-6 py-2 font-display text-kix-red">CONNECTION LOST</div>
      )}
      {connected && !snapshot && (
        <div className="mb-4 glass-card px-6 py-2 font-display text-kix-cyan">ENTERING ARENA...</div>
      )}
      {snapshot && hud.phase === 'countdown' && (
        <div className="mb-4 glass-card px-6 py-2 font-display text-kix-gold neon-gold">
          GET READY!
        </div>
      )}

      {/* Scoreboard */}
      <div className="flex items-center gap-6 mb-6">
        <div className="glass-card px-6 py-2 flex items-center gap-4">
          <span className="text-kix-text-muted">HOME</span>
          <span className="font-display text-3xl text-kix-cyan neon-cyan">{hud.home}</span>
        </div>
        <div className="glass-card px-8 py-2">
          <span className="font-display text-3xl text-kix-gold neon-gold">{hud.time}</span>
        </div>
        <div className="glass-card px-6 py-2 flex items-center gap-4">
          <span className="font-display text-3xl text-kix-pink neon-pink">{hud.away}</span>
          <span className="text-kix-text-muted">AWAY</span>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
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
    </div>
  );
}
