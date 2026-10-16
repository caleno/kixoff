// ===== Sentinel: Anti-Cheat Validation Module =====
// Server-authoritative input validation

import type { PlayerInput } from '../game/state.js';

const MAX_INPUT_RATE = 60; // max inputs per second
const MAX_MOVE_MAGNITUDE = 1.0;
const MAX_TIMESTAMP_DRIFT_MS = 500;

const inputHistory: Map<string, number[]> = new Map();

export function validateInput(input: PlayerInput): boolean {
  // Check required fields
  if (typeof input.seq !== 'number' || input.seq < 0) return false;
  if (typeof input.moveX !== 'number' || typeof input.moveY !== 'number') return false;
  if (typeof input.timestamp !== 'number') return false;

  // Clamp movement vector magnitude
  const mag = Math.sqrt(input.moveX ** 2 + input.moveY ** 2);
  if (mag > MAX_MOVE_MAGNITUDE + 0.01) {
    return false;
  }

  // Validate action enum
  const validActions = ['none', 'pass', 'shoot', 'tackle', 'dash'];
  if (!validActions.includes(input.action)) {
    return false;
  }

  // Check timestamp isn't too far from server time
  const now = Date.now();
  if (Math.abs(now - input.timestamp) > MAX_TIMESTAMP_DRIFT_MS) {
    return false;
  }

  return true;
}

export function validateMovement(
  oldPos: { x: number; y: number },
  newPos: { x: number; y: number },
  deltaTime: number,
  maxSpeed: number
): boolean {
  const dx = newPos.x - oldPos.x;
  const dy = newPos.y - oldPos.y;
  const distance = Math.sqrt(dx ** 2 + dy ** 2);
  const maxDistance = maxSpeed * deltaTime * 1.1; // 10% tolerance

  return distance <= maxDistance;
}

export function checkInputRate(playerId: string): boolean {
  const now = Date.now();
  const history = inputHistory.get(playerId) || [];

  // Remove entries older than 1 second
  const recent = history.filter((t) => now - t < 1000);

  if (recent.length >= MAX_INPUT_RATE) {
    return false; // Rate limit exceeded
  }

  recent.push(now);
  inputHistory.set(playerId, recent);
  return true;
}

export function detectSpeedHack(
  positions: Array<{ x: number; y: number; t: number }>,
  maxSpeed: number
): boolean {
  for (let i = 1; i < positions.length; i++) {
    const dx = positions[i].x - positions[i - 1].x;
    const dy = positions[i].y - positions[i - 1].y;
    const dt = (positions[i].t - positions[i - 1].t) / 1000;
    if (dt <= 0) continue;
    const speed = Math.sqrt(dx ** 2 + dy ** 2) / dt;
    if (speed > maxSpeed * 1.15) {
      return true;
    }
  }
  return false;
}

export function clearPlayerHistory(playerId: string): void {
  inputHistory.delete(playerId);
}
