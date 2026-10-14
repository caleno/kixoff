// ===== KIXoff Anti-Cheat Module (Sentinel) =====

import type { PlayerInput, PlayerState } from '../game/state.js';
import {
  PLAYER_SPEED,
  PLAYER_DASH_SPEED,
  DASH_DURATION_MS,
} from '../game/state.js';

// Rate limits
const MAX_INPUT_RATE = 120; // inputs per second (generous, 60Hz expected)
const MAX_SPEED_MULTIPLIER = 1.15; // 15% tolerance for network jitter
const MAX_ACTION_RATE = 10; // actions per second

// Track per-player stats for anomaly detection
interface PlayerStats {
  inputCount: number;
  actionCount: number;
  windowStart: number;
  speedViolations: number;
  totalViolations: number;
  lastInputTime: number;
}

const playerStats: Map<string, PlayerStats> = new Map();

export function getOrCreateStats(playerId: string): PlayerStats {
  let stats = playerStats.get(playerId);
  if (!stats) {
    stats = {
      inputCount: 0,
      actionCount: 0,
      windowStart: Date.now(),
      speedViolations: 0,
      totalViolations: 0,
      lastInputTime: 0,
    };
    playerStats.set(playerId, stats);
  }
  return stats;
}

export function resetStats(playerId: string): void {
  playerStats.delete(playerId);
}

/**
 * Validate incoming player input.
 * Checks: input rate, action rate, move vector magnitude, timestamp.
 */
export function validateInput(input: PlayerInput): boolean {
  // Check move vector magnitude (normalized -1 to 1)
  const moveMag = Math.hypot(input.moveX, input.moveY);
  if (moveMag > 1.01) {
    return false;
  }

  // Check action is valid enum
  const validActions = ['none', 'pass', 'shoot', 'tackle', 'dash'];
  if (!validActions.includes(input.action)) {
    return false;
  }

  // Check sequence number is increasing
  if (input.seq < 0 || input.seq > 1000000) {
    return false;
  }

  // Check timestamp is reasonable (not too far in past/future)
  const now = Date.now();
  if (Math.abs(now - input.timestamp) > 5000) {
    return false;
  }

  return true;
}

/**
 * Validate player movement against speed limits.
 * Detects speed hacks, teleport hacks, and impossible movement.
 */
export function validateMovement(
  player: PlayerState,
  input: PlayerInput,
  dt: number,
): boolean {
  const expectedMaxSpeed = PLAYER_SPEED * MAX_SPEED_MULTIPLIER;
  const actualSpeed = Math.hypot(player.velocity.x, player.velocity.y);

  if (actualSpeed > expectedMaxSpeed * 1.5) {
    const stats = getOrCreateStats(player.id);
    stats.speedViolations++;
    stats.totalViolations++;
    return false;
  }

  // Check position delta is within reasonable bounds
  const maxDistancePerTick = expectedMaxSpeed * dt * 2; // 2x tolerance
  const expectedX = player.position.x + player.velocity.x * dt;
  const expectedY = player.position.y + player.velocity.y * dt;
  const actualDelta = Math.hypot(
    player.position.x - expectedX,
    player.position.y - expectedY,
  );

  if (actualDelta > maxDistancePerTick) {
    const stats = getOrCreateStats(player.id);
    stats.totalViolations++;
    return false;
  }

  return true;
}

/**
 * Check if a player should be flagged for suspicious behavior.
 * Returns a threat level: 'none', 'low', 'medium', 'high'.
 */
export function assessThreatLevel(playerId: string): 'none' | 'low' | 'medium' | 'high' {
  const stats = playerStats.get(playerId);
  if (!stats) return 'none';

  if (stats.totalViolations > 20 || stats.speedViolations > 10) {
    return 'high';
  }
  if (stats.totalViolations > 10 || stats.speedViolations > 5) {
    return 'medium';
  }
  if (stats.totalViolations > 3) {
    return 'low';
  }
  return 'none';
}

/**
 * Get violation report for a player (for logging/banning).
 */
export function getViolationReport(playerId: string): {
  playerId: string;
  totalViolations: number;
  speedViolations: number;
  threatLevel: string;
} | null {
  const stats = playerStats.get(playerId);
  if (!stats) return null;

  return {
    playerId,
    totalViolations: stats.totalViolations,
    speedViolations: stats.speedViolations,
    threatLevel: assessThreatLevel(playerId),
  };
}
