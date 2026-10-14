import { PlayerState, Team } from './state';
import { InputPacket } from './engine';

/**
 * AntiCheat — Server-side validation layer
 * Sentinel (Security) — KIXoff
 *
 * Validates all client inputs before they reach the game engine.
 * Detects: speed hacks, teleport, rate abuse, impossible inputs.
 */

const MAX_INPUT_RATE_MS = 30; // Minimum 30ms between inputs (~33Hz max)
const MAX_SPEED = 300; // px/sec — must match engine PLAYER_SPEED + tolerance
const MAX_TELEPORT_DIST = 50; // Max acceptable position delta per tick
const MAX_SEQ_JUMP = 5; // Max acceptable sequence number jump

interface ValidationResult {
  valid: boolean;
  reason?: string;
}

interface PlayerViolation {
  playerId: string;
  type: string;
  count: number;
  lastViolation: number;
}

export class AntiCheat {
  private violations: Map<string, PlayerViolation> = new Map();
  private lastInputTime: Map<string, number> = new Map();
  private lastSeq: Map<string, number> = new Map();
  private banThreshold: number = 5;

  /**
   * Validate an incoming input packet
   */
  validateInput(input: InputPacket, player: PlayerState | null): ValidationResult {
    const now = Date.now();

    // 1. Rate limiting — prevent input flooding
    const lastTime = this.lastInputTime.get(input.playerId);
    if (lastTime && now - lastTime < MAX_INPUT_RATE_MS) {
      this.recordViolation(input.playerId, 'rate_limit');
      return { valid: false, reason: 'Input rate exceeded' };
    }
    this.lastInputTime.set(input.playerId, now);

    // 2. Sequence validation — detect packet manipulation
    const lastSeq = this.lastSeq.get(input.playerId);
    if (lastSeq !== undefined) {
      const seqDelta = input.seq - lastSeq;
      if (seqDelta > MAX_SEQ_JUMP) {
        this.recordViolation(input.playerId, 'seq_jump');
        return { valid: false, reason: `Sequence jump: ${seqDelta}` };
      }
      if (seqDelta < 0) {
        // Out-of-order packet, allow but don't update seq
        return { valid: true };
      }
    }
    this.lastSeq.set(input.playerId, input.seq);

    // 3. Input bounds validation
    if (Math.abs(input.dx) > 1 || Math.abs(input.dy) > 1) {
      this.recordViolation(input.playerId, 'invalid_input');
      return { valid: false, reason: 'Input values out of bounds' };
    }

    // 4. Speed validation — if we have player state, check movement
    if (player) {
      const inputMagnitude = Math.sqrt(input.dx ** 2 + input.dy ** 2);
      if (inputMagnitude > 1.0) {
        this.recordViolation(input.playerId, 'speed_hack');
        return { valid: false, reason: 'Normalized input magnitude > 1' };
      }
    }

    // 5. Timestamp validation — reject future-dated inputs
    if (input.timestamp > now + 1000) {
      this.recordViolation(input.playerId, 'future_timestamp');
      return { valid: false, reason: 'Timestamp in future' };
    }

    return { valid: true };
  }

  /**
   * Validate a player's position update (for teleport detection)
   */
  validatePosition(playerId: string, prevX: number, prevY: number, newX: number, newY: number): ValidationResult {
    const dx = newX - prevX;
    const dy = newY - prevY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > MAX_TELEPORT_DIST) {
      this.recordViolation(playerId, 'teleport');
      return { valid: false, reason: `Position jump: ${dist.toFixed(2)}px` };
    }

    return { valid: true };
  }

  /**
   * Check if a player should be banned based on violations
   */  shouldBan(playerId: string): boolean {
    const violation = this.violations.get(playerId);
    if (!violation) return false;
    return violation.count >= this.banThreshold;
  }

  /**
   * Get violation summary for a player
   */  getViolations(playerId: string): PlayerViolation | undefined {
    return this.violations.get(playerId);
  }

  /**
   * Reset violations for a player (e.g. on new match)
   */  resetPlayer(playerId: string): void {
    this.violations.delete(playerId);
    this.lastInputTime.delete(playerId);
    this.lastSeq.delete(playerId);
  }

  /**
   * Get all players with active violations (for monitoring)
   */  getFlaggedPlayers(): PlayerViolation[] {
    return Array.from(this.violations.values()).filter(v => v.count > 0);
  }

  private recordViolation(playerId: string, type: string): void {
    const existing = this.violations.get(playerId);
    if (existing) {
      existing.count++;
      existing.lastViolation = Date.now();
      existing.type = type;
    } else {
      this.violations.set(playerId, {
        playerId,
        type,
        count: 1,
        lastViolation: Date.now(),
      });
    }

    if (existing && existing.count >= this.banThreshold) {
      console.warn(`[AntiCheat] Player ${playerId} reached ban threshold (${existing.count} violations)`);
    }
  }
}
