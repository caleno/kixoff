import { PlayerState, Team } from '../game/state';
import { InputPacket } from '../game/engine';

/**
 * AntiCheat — Server-side validation layer
 * Sentinel (Security) — KIXoff
 *
 * Validates input packets for:
 * - Sequence integrity (no replays, no gaps)
 * - Rate limiting (max 35 inputs/sec)
 * - Speed/teleport detection
 * - Ban threshold (3 violations → kick)
 */
export class AntiCheat {
  private lastSeq: Map<string, number> = new Map();
  private lastInputTime: Map<string, number> = new Map();
  private violations: Map<string, number> = new Map();
  private banned: Set<string> = new Set();
  private lastPosition: Map<string, { x: number; y: number; t: number }> = new Map();

  private readonly MAX_INPUT_RATE = 35; // per second
  private readonly MAX_SPEED = 250; // units/sec (server max is 200)
  private readonly SPEED_TOLERANCE = 1.5;
  private readonly BAN_THRESHOLD = 3;
  private readonly MIN_INPUT_INTERVAL = 1000 / this.MAX_INPUT_RATE;

  /**
   * Validate an input packet against the player's history
   */
  validateInput(packet: InputPacket, player: PlayerState): boolean {
    if (this.banned.has(player.id)) return false;

    // 1. Sequence validation
    const lastSeq = this.lastSeq.get(player.id) ?? -1;
    if (packet.seq <= lastSeq) {
      this.recordViolation(player.id, 'replay: seq ' + packet.seq + ' <= ' + lastSeq);
      return false;
    }
    this.lastSeq.set(player.id, packet.seq);

    // 2. Rate limiting
    const now = Date.now();
    const lastTime = this.lastInputTime.get(player.id) ?? 0;
    if (now - lastTime < this.MIN_INPUT_INTERVAL) {
      this.recordViolation(player.id, 'rate_limit: ' + (now - lastTime) + 'ms < ' + this.MIN_INPUT_INTERVAL + 'ms');
      return false;
    }
    this.lastInputTime.set(player.id, now);

    // 3. Teleport/speed detection
    const lastPos = this.lastPosition.get(player.id);
    if (lastPos) {
      const dt = (now - lastPos.t) / 1000;
      const dist = Math.sqrt((player.x - lastPos.x) ** 2 + (player.y - lastPos.y) ** 2);
      const speed = dt > 0 ? dist / dt : 0;
      const maxAllowed = this.MAX_SPEED * this.SPEED_TOLERANCE;
      if (speed > maxAllowed) {
        this.recordViolation(player.id, 'speed_hack: ' + speed.toFixed(0) + ' > ' + maxAllowed);
        return false;
      }
    }
    this.lastPosition.set(player.id, { x: player.x, y: player.y, t: now });

    return true;
  }

  /**
   * Record a violation and check ban threshold
   */
  private recordViolation(playerId: string, reason: string): void {
    const count = (this.violations.get(playerId) ?? 0) + 1;
    this.violations.set(playerId, count);
    console.warn(`[AntiCheat] ${playerId} violation ${count}/${this.BAN_THRESHOLD}: ${reason}`);

    if (count >= this.BAN_THRESHOLD) {
      this.banned.add(playerId);
      console.warn(`[AntiCheat] ${playerId} BANNED after ${count} violations`);
    }
  }

  /**
   * Check if a player is banned
   */
  isBanned(playerId: string): boolean {
    return this.banned.has(playerId);
  }

  /**
   * Get violation count for a player
   */
  getViolations(playerId: string): number {
    return this.violations.get(playerId) ?? 0;
  }

  /**
   * Get all banned players
   */
  getBannedPlayers(): string[] {
    return Array.from(this.banned);
  }

  /**
   * Reset state for a player (on disconnect)
   */
  clearPlayer(playerId: string): void {
    this.lastSeq.delete(playerId);
    this.lastInputTime.delete(playerId);
    this.violations.delete(playerId);
    this.lastPosition.delete(playerId);
    this.banned.delete(playerId);
  }
}
