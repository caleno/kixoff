// ═══════════════════════════════════════════════════════════
// KIXoff AntiCheat Tests — Sentinel (Security)
// Jest unit tests for speed hack, teleport, rate limit, ban
// ═══════════════════════════════════════════════════════════

import { AntiCheat } from '../security/anti-cheat-v2';
import { PlayerState, Team } from '../game/state';
import { InputPacket } from '../game/engine';

describe('AntiCheat', () => {
  let antiCheat: AntiCheat;

  beforeEach(() => {
    antiCheat = new AntiCheat();
  });

  function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
    return {
      id: 'test-player',
      name: 'TestPlayer',
      team: 'home' as Team,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      rating: 1500,
      ...overrides,
    };
  }

  function makeInput(overrides: Partial<InputPacket> = {}): InputPacket {
    return {
      seq: 1,
      dx: 0,
      dy: 0,
      kick: false,
      timestamp: Date.now(),
      ...overrides,
    };
  }

  describe('sequence validation', () => {
    it('should accept inputs with increasing sequence numbers', () => {
      const player = makePlayer();
      
      const r1 = antiCheat.validateInput('test-player', makeInput({ seq: 1 }), player);
      const r2 = antiCheat.validateInput('test-player', makeInput({ seq: 2 }), player);
      const r3 = antiCheat.validateInput('test-player', makeInput({ seq: 3 }), player);
      
      expect(r1.valid).toBe(true);
      expect(r2.valid).toBe(true);
      expect(r3.valid).toBe(true);
    });

    it('should reject inputs with duplicate sequence numbers', () => {
      const player = makePlayer();
      
      antiCheat.validateInput('test-player', makeInput({ seq: 1 }), player);
      const result = antiCheat.validateInput('test-player', makeInput({ seq: 1 }), player);
      
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('seq');
    });

    it('should reject inputs with out-of-order sequence numbers', () => {
      const player = makePlayer();
      
      antiCheat.validateInput('test-player', makeInput({ seq: 5 }), player);
      const result = antiCheat.validateInput('test-player', makeInput({ seq: 3 }), player);
      
      expect(result.valid).toBe(false);
    });
  });

  describe('speed hack detection', () => {
    it('should reject inputs with dx/dy magnitude > 1', () => {
      const player = makePlayer();
      
      const result = antiCheat.validateInput(
        'test-player',
        makeInput({ dx: 2, dy: 0 }),
        player
      );
      
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('speed');
    });

    it('should reject inputs with diagonal movement exceeding max', () => {
      const player = makePlayer();
      
      const result = antiCheat.validateInput(
        'test-player',
        makeInput({ dx: 0.8, dy: 0.8 }), // magnitude ~1.13 > 1
        player
      );
      
      expect(result.valid).toBe(false);
    });

    it('should accept inputs with normalized diagonal', () => {
      const player = makePlayer();
      
      const result = antiCheat.validateInput(
        'test-player',
        makeInput({ dx: 0.707, dy: 0.707 }), // magnitude ~1.0
        player
      );
      
      expect(result.valid).toBe(true);
    });
  });

  describe('rate limiting', () => {
    it('should flag too many inputs per second', () => {
      const player = makePlayer();
      const now = Date.now();
      
      // Send 200 inputs in rapid succession (way over 60Hz limit)
      let lastResult: { valid: boolean; reason?: string } = { valid: true };
      for (let i = 0; i < 200; i++) {
        lastResult = antiCheat.validateInput(
          'test-player',
          makeInput({ seq: i + 1, timestamp: now + i }),
          player
        );
      }
      
      // At least one should have been flagged
n      expect(lastResult.valid).toBe(false);
    });

    it('should accept inputs at 60Hz rate', () => {
      const player = makePlayer();
      const now = Date.now();
      
      // Send 60 inputs at 60Hz (one per ~16.67ms)
      for (let i = 0; i < 60; i++) {
        const result = antiCheat.validateInput(
          'test-player',
          makeInput({ seq: i + 1, timestamp: now + i * 17 }),
          player
        );
        expect(result.valid).toBe(true);
      }
    });
  });

  describe('teleport detection', () => {
    it('should flag player moving faster than max velocity allows', () => {
      const player = makePlayer({ x: 0, y: 0 });
      
      // First input at position 0,0 — accepted
      antiCheat.validateInput('test-player', makeInput({ seq: 1 }), player);
      
      // Simulate a tick where player moves normally
      const movedPlayer = makePlayer({ x: 5, y: 0 });
      
      // Now player suddenly teleports far away
      const teleportedPlayer = makePlayer({ x: 500, y: 500 });
      const result = antiCheat.validateInput(
        'test-player',
        makeInput({ seq: 2, dx: 1, dy: 0 }),
        teleportedPlayer
      );
      
      // Should detect teleport (distance too great for single tick)
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('teleport');
    });

    it('should accept normal movement distances', () => {
      const player = makePlayer({ x: 0, y: 0 });
      
      antiCheat.validateInput('test-player', makeInput({ seq: 1 }), player);
      
      // Normal movement (~5 units per tick at max speed)
      const movedPlayer = makePlayer({ x: 5, y: 3 });
      const result = antiCheat.validateInput(
        'test-player',
        makeInput({ seq: 2, dx: 1, dy: 0.5 }),
        movedPlayer
      );
      
      expect(result.valid).toBe(true);
    });
  });

  describe('ban system', () => {
    it('should track violations per player', () => {
      const player = makePlayer();
      
      // Generate violations
      for (let i = 0; i < 5; i++) {
        antiCheat.validateInput(
          'test-player',
          makeInput({ seq: i + 1, dx: 5, dy: 5 }),
          player
        );
      }
      
      const violations = antiCheat.getViolationCount('test-player');
      expect(violations).toBeGreaterThan(0);
    });

    it('should ban player after exceeding violation threshold', () => {
      const player = makePlayer();
      
      // Generate many violations
      for (let i = 0; i < 50; i++) {
        antiCheat.validateInput(
          'test-player',
          makeInput({ seq: i + 1, dx: 10, dy: 10 }),
          player
        );
      }
      
      expect(antiCheat.isBanned('test-player')).toBe(true);
    });

    it('should not ban player for minor infractions', () => {
      const player = makePlayer();
      
      // Single minor violation
      antiCheat.validateInput(
        'test-player',
        makeInput({ seq: 1, dx: 1.1, dy: 0 }),
        player
      );
      
      expect(antiCheat.isBanned('test-player')).toBe(false);
    });

    it('should clear violations after ban expires', () => {
      const player = makePlayer();
      
      // Ban the player
      for (let i = 0; i < 50; i++) {
        antiCheat.validateInput(
          'test-player',
          makeInput({ seq: i + 1, dx: 10, dy: 10 }),
          player
        );
      }
      expect(antiCheat.isBanned('test-player')).toBe(true);
      
      // Simulate ban expiry
      antiCheat.unban('test-player');
      expect(antiCheat.isBanned('test-player')).toBe(false);
    });
  });

  describe('kick input validation', () => {
    it('should rate-limit kick inputs', () => {
      const player = makePlayer();
      const now = Date.now();
      
      // Rapid kicks
      let lastResult: { valid: boolean; reason?: string } = { valid: true };
      for (let i = 0; i < 20; i++) {
        lastResult = antiCheat.validateInput(
          'test-player',
          makeInput({ seq: i + 1, kick: true, timestamp: now + i }),
          player
        );
      }
      
      // Kick spam should be flagged
      expect(lastResult.valid).toBe(false);
    });

    it('should accept kicks at reasonable intervals', () => {
      const player = makePlayer();
      const now = Date.now();
      
      // Kick every 500ms (reasonable)
      for (let i = 0; i < 5; i++) {
        const result = antiCheat.validateInput(
          'test-player',
          makeInput({ seq: i + 1, kick: true, timestamp: now + i * 500 }),
          player
        );
        expect(result.valid).toBe(true);
      }
    });
  });
});
