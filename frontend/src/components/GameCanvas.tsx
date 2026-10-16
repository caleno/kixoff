import { useEffect, useRef } from 'react';
import { colors } from '../types/design';
import type { ServerSnapshot } from '../hooks/useGameSocket';

/**
 * GameCanvas — WebGL/Canvas renderer for the arena
 * Aura (UI) — KIXoff
 *
 * Top-down view of the pitch with players, ball, and HUD overlay.
 */

interface GameCanvasProps {
  snapshot: ServerSnapshot | null;
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
      // Clear
      ctx.fillStyle = colors.base;
      ctx.fillRect(0, 0, FIELD_W, FIELD_H);

      // Draw field
      drawField(ctx);

      if (snapshot) {
        // Draw ball
        const { ball } = snapshot;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = colors.accent;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw players
        for (const player of snapshot.players) {
          const isMe = player.id === playerId;
          const teamColor = player.team === 'home' ? colors.accent : colors.highlight;

          // Glow for current player
          if (isMe) {
            ctx.shadowColor = teamColor;
            ctx.shadowBlur = 20;
          }

          ctx.beginPath();
          ctx.arc(player.x, player.y, PLAYER_R, 0, Math.PI * 2);
          ctx.fillStyle = teamColor;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Name label
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '10px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(player.name, player.x, player.y - PLAYER_R - 6);

          // Stamina bar
          const barW = 30;
          const barH = 3;
          const barX = player.x - barW / 2;
          const barY = player.y + PLAYER_R + 4;
          ctx.fillStyle = colors.baseLight;
          ctx.fillRect(barX, barY, barW, barH);
          ctx.fillStyle = player.stamina > 30 ? colors.success : colors.danger;
          ctx.fillRect(barX, barY, barW * (player.stamina / 100), barH);
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [snapshot, playerId]);

  return (
    <canvas
      ref={canvasRef}
      width={FIELD_W}
      height={FIELD_H}
      style={{
        borderRadius: '12px',
        boxShadow: `0 0 40px ${colors.accent}20`,
        maxWidth: '100%',
        imageRendering: 'crisp-edges',
      }}
    />
  );
}

function drawField(ctx: CanvasRenderingContext2D) {
  // Field background
  ctx.fillStyle = colors.fieldGreen;
  ctx.fillRect(0, 0, FIELD_W, FIELD_H);

  // Center line
  ctx.strokeStyle = colors.fieldLine;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(FIELD_W / 2, 0);
  ctx.lineTo(FIELD_W / 2, FIELD_H);
  ctx.stroke();

  // Center circle
  ctx.beginPath();
  ctx.arc(FIELD_W / 2, FIELD_H / 2, 60, 0, Math.PI * 2);
  ctx.stroke();

  // Goals
  const goalY = (FIELD_H - GOAL_W) / 2;
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, goalY);
  ctx.lineTo(0, goalY + GOAL_W);
  ctx.stroke();

  ctx.strokeStyle = colors.highlight;
  ctx.beginPath();
  ctx.moveTo(FIELD_W, goalY);
  ctx.lineTo(FIELD_W, goalY + GOAL_W);
  ctx.stroke();
}
