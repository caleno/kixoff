import {
  PlayerState,
  GameState,
  MAX_VELOCITY,
  VELOCITY_TOLERANCE,
  MIN_ACTION_INTERVAL,
} from '../game/state';

// ==================== ANTI-CHEAT VALIDATION ====================

export type ValidationResult = 'ACCEPT' | 'REJECT' | 'FLAG';

/**
 * Validates a player action server-side to prevent cheating.
 * All gameplay is server-authoritative — the client is render-only.
 */
export function validatePlayerAction(
  action: any,
  playerState: PlayerState,
  gameState: GameState
): ValidationResult {
  // 1. Speed hack check — max velocity enforced
  if (action.velocity) {
    const speed = Math.sqrt(
      action.velocity.x ** 2 +
      action.velocity.y ** 2 +
      action.velocity.z ** 2
    );
    if (speed > MAX_VELOCITY + VELOCITY_TOLERANCE) {
      console.warn(`[Sentinel] Speed hack detected from ${playerState.id}: speed=${speed}`);
      return 'REJECT';
    }
  }

  // 2. Teleport check — position delta within movement budget
  if (action.position) {
    const dx = action.position.x - playerState.position.x;
    const dy = action.position.y - playerState.position.y;
    const dz = action.position.z - playerState.position.z;
    const distance = Math.sqrt(dx ** 2 + dy ** 2 + dz ** 2);
    const maxDist = MAX_VELOCITY * (1000 / 60) * 1.5; // 1.5x tick budget

    if (distance > maxDist) {
      console.warn(`[Sentinel] Teleport detected from ${playerState.id}: distance=${distance}`);
      return 'FLAG';
    }
  }

  // 3. Rate limiting — action frequency cap
  const now = Date.now();
  if (now - playerState.lastActionTimestamp < MIN_ACTION_INTERVAL) {
    return 'REJECT';
  }

  // 4. Input replay detection — statistical anomaly detection
  if (detectBotPattern(playerState.actionHistory)) {
    console.warn(`[Sentinel] Bot pattern detected from ${playerState.id}`);
    return 'FLAG';
  }

  // Update player action history (keep last 100 actions)
  playerState.actionHistory.push(now);
  if (playerState.actionHistory.length > 100) {
    playerState.actionHistory.shift();
  }
  playerState.lastActionTimestamp = now;

  return 'ACCEPT';
}

/**
 * Detects automated bot patterns by analyzing action timing intervals.
 * Humans have natural variance; bots tend to be unnaturally consistent.
 */
function detectBotPattern(actionHistory: number[]): boolean {
  if (actionHistory.length < 20) return false;

  // Calculate intervals between actions
  const intervals: number[] = [];
  for (let i = 1; i < actionHistory.length; i++) {
    intervals.push(actionHistory[i] - actionHistory[i - 1]);
  }

  // Calculate standard deviation of intervals
  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance =
    intervals.reduce((sum, val) => sum + (val - mean) ** 2, 0) / intervals.length;
  const stdDev = Math.sqrt(variance);

  // If standard deviation is suspiciously low (< 2ms), likely a bot
  // Humans typically have 10-30ms variance in reaction time
  if (stdDev < 2) {
    return true;
  }

  return false;
}

// ==================== RATE LIMITING ====================

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  check(key: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const validTimestamps = timestamps.filter((t) => now - t < this.windowMs);

    if (validTimestamps.length >= this.maxRequests) {
      return false; // Rate limited
    }

    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    return true;
  }

  clear(key: string) {
    this.requests.delete(key);
  }
}
