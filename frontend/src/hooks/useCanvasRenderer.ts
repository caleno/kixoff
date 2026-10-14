import { useEffect, useRef, useCallback } from 'react';
import type { Snapshot, PlayerSnapshot } from '../types';

const FIELD_W = 800;
const FIELD_H = 500;
const PLAYER_R = 16;
const BALL_R = 8;

export function useCanvasRenderer(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  snapshot: Snapshot | null
) {
  const snapRef = useRef<Snapshot | null>(null);

  useEffect(() => {
    snapRef.current = snapshot;
  }, [snapshot]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const snap = snapRef.current;
    if (!canvas || !snap) return;

    const ctx = canvas.getContext('2d')!;

    // Field
    ctx.fillStyle = '#0A0E27';
    ctx.fillRect(0, 0, FIELD_W, FIELD_H);
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
    ctx.fillStyle = '#00F0FF20';
    ctx.fillRect(0, FIELD_H / 2 - 50, 20, 100);
    ctx.fillStyle = '#FF006E20';
    ctx.fillRect(FIELD_W - 20, FIELD_H / 2 - 50, 20, 100);

    // Ball
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#FFB800';
    ctx.fillStyle = '#FFB800';
    ctx.beginPath();
    ctx.arc(snap.ball.x, snap.ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Players
    snap.players.forEach((p: PlayerSnapshot) => {
      const color = p.team === 'home' ? '#00F0FF' : '#FF006E';
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;
      ctx.fillStyle = p.stunned ? '#FF3333' : color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, PLAYER_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      if (p.hasBall) {
        ctx.strokeStyle = '#FFB800';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, PLAYER_R + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Stamina bar
      const barW = 30;
      ctx.fillStyle = '#333';
      ctx.fillRect(p.x - barW / 2, p.y - PLAYER_R - 8, barW, 3);
      ctx.fillStyle = p.stamina > 30 ? '#00FF88' : '#FF3333';
      ctx.fillRect(p.x - barW / 2, p.y - PLAYER_R - 8, barW * (p.stamina / 100), 3);
    });
  }, [canvasRef]);

  useEffect(() => {
    let raf: number;
    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [draw]);
}
