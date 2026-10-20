import { useEffect, useRef } from 'react';
import { colors } from '../types/design';
import type { Snapshot } from '../types';

/**
 * GameCanvas — WebGL/Canvas renderer for the arena
 * Aura (UI) — KIXoff
 */

interface GameCanvasProps {
  snapshot: Snapshot | null;
  playerId: string;
}

const FIELD_W = 800;
const FIELD_H = 500;
const GOAL_W = 120;
const PLAYER_R = 18;
const BALL_R = 12;

export function GameCanvas({ snapshot, playerId }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      if (!snapshot) {
        drawEmptyState(ctx);
        return;
      }

      const scale = Math.min(canvas.width / FIELD_W, canvas.height / FIELD_H);
      const offsetX = (canvas.width - FIELD_W * scale) / 2;
      const offsetY = (canvas.height - FIELD_H * scale) / 2;

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = colors.ink;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
      drawPitch(ctx);

      snapshot.players.forEach((p) => {
        ctx.beginPath();
        ctx.fillStyle = p.id === playerId ? colors.accent : colors.primary;
        ctx.arc(p.position.x, p.position.y, PLAYER_R, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.beginPath();
      ctx.fillStyle = colors.secondary;
      ctx.arc(snapshot.ball.position.x, snapshot.ball.position.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const frame = () => {
      render();
      animFrameRef.current = window.requestAnimationFrame(frame);
    };

    animFrameRef.current = window.requestAnimationFrame(frame);
    return () => window.cancelAnimationFrame(animFrameRef.current);
  }, [snapshot, playerId]);

  return <canvas ref={canvasRef} width={960} height={600} className="w-full rounded-2xl border border-white/10 bg-black shadow-2xl" />;
}

function drawEmptyState(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, FIELD_W, FIELD_H);
  ctx.fillStyle = colors.ink;
  ctx.fillRect(0, 0, FIELD_W, FIELD_H);
  drawPitch(ctx);
  ctx.fillStyle = colors.textMuted;
  ctx.font = '600 20px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Waiting for match snapshot…', FIELD_W / 2, FIELD_H / 2);
}

function drawPitch(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = colors.line;
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, FIELD_W, FIELD_H);
  ctx.beginPath();
  ctx.moveTo(FIELD_W / 2, 0);
  ctx.lineTo(FIELD_W / 2, FIELD_H);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(FIELD_W / 2, FIELD_H / 2, 60, 0, Math.PI * 2);
  ctx.stroke();
  const goalY = FIELD_H / 2 - GOAL_W / 2;
  ctx.strokeStyle = colors.highlight;
  ctx.beginPath();
  ctx.moveTo(0, goalY);
  ctx.lineTo(0, goalY + GOAL_W);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(FIELD_W, goalY);
  ctx.lineTo(FIELD_W, goalY + GOAL_W);
  ctx.stroke();
}
