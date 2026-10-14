// ═══════════════════════════════════════════════════════════
// KIXoff GameEngine Tests — Node (Backend)
// Jest unit tests for physics, collision, goal detection, tick
// ═══════════════════════════════════════════════════════════

import { GameEngine } from '../game/engine';
import { GameState, Team } from '../game/state';

describe('GameEngine', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine('test-room');
    // Add 6 players — 3 per team
    for (let i = 0; i < 6; i++) {
      const team: Team = i < 3 ? 'home' : 'away';
      engine.addPlayer(`player-${i}`, team, `Player${i}`, 1500);
    }
  });

  describe('initialization', () => {
    it('should create a game engine with correct room ID', () => {
      expect(engine.roomId).toBe('test-room');
    });

    it('should initialize with 6 players in correct teams', () => {
      const state = engine.getState();
      const homePlayers = Array.from(state.players.values()).filter(p => p.team === 'home');
      const awayPlayers = Array.from(state.players.values()).filter(p => p.team === 'away');
      expect(homePlayers.length).toBe(3);
      expect(awayPlayers.length).toBe(3);
    });

    it('should start in countdown phase', () => {
      const state = engine.getState();
      expect(state.phase).toBe('countdown');
    });

    it('should initialize ball at center', () => {
      const state = engine.getState();
      expect(state.ball.x).toBe(0);
      expect(state.ball.y).toBe(0);
    });
  });

  describe('physics tick', () => {
    it('should advance game time on tick', () => {
      const initialTime = engine.getState().timeRemaining;
      engine.tick();
      const newTime = engine.getState().timeRemaining;
      // Time should decrease (180s match, 1/60th sec per tick)
      expect(newTime).toBeLessThan(initialTime);
    });

    it('should apply player movement based on input', () => {
      const playerId = 'player-0';
      const initialPos = engine.getState().players.get(playerId)!;
      
      // Queue movement input
      engine.queueInput(playerId, {
        seq: 1,
        dx: 1,
        dy: 0,
        kick: false,
        timestamp: Date.now(),
      });
      
      // Run several ticks to see movement
      for (let i = 0; i < 10; i++) {
        engine.tick();
      }
      
      const newPos = engine.getState().players.get(playerId)!;
      expect(newPos.x).toBeGreaterThan(initialPos.x);
    });

    it('should not allow players to move out of bounds', () => {
      const playerId = 'player-0';
      
      // Move player to edge and try to go further
      for (let i = 0; i < 600; i++) {
        engine.queueInput(playerId, {
          seq: i + 1,
          dx: 1,
          dy: 0,
          kick: false,
          timestamp: Date.now(),
        });
        engine.tick();
      }
      
      const pos = engine.getState().players.get(playerId)!;
      const arenaWidth = engine.getArenaBounds();
      expect(Math.abs(pos.x)).toBeLessThanOrEqual(arenaWidth.maxX + 1);
    });
  });

  describe('ball physics', () => {
    it('should apply friction to ball velocity', () => {
      const state = engine.getState();
      // Set ball velocity
      state.ball.vx = 10;
      state.ball.vy = 0;
      
      // Tick several times
      for (let i = 0; i < 30; i++) {
        engine.tick();
      }
      
      const newState = engine.getState();
      // Ball should have slowed down due to friction
      expect(Math.abs(newState.ball.vx)).toBeLessThan(10);
    });

    it('should detect ball-player collision', () => {
      const state = engine.getState();
      const playerId = 'player-0';
      const player = state.players.get(playerId)!;
      
      // Place ball right next to player
      state.ball.x = player.x + 5;
      state.ball.y = player.y;
      state.ball.vx = 0;
      state.ball.vy = 0;
      
      engine.tick();
      
      // Ball should have been pushed by collision
      const newState = engine.getState();
      const newBall = newState.ball;
      const newPlayer = newState.players.get(playerId)!;
      const dist = Math.sqrt((newBall.x - newPlayer.x) ** 2 + (newBall.y - newPlayer.y) ** 2);
      expect(dist).toBeGreaterThanOrEqual(15); // min collision distance
    });
  });

  describe('goal detection', () => {
    it('should detect goal when ball crosses home goal line', () => {
      const state = engine.getState();
      // Place ball at away goal line (positive X = away goal)
      state.ball.x = 395; // near goal line
      state.ball.y = 0;
      state.ball.vx = 10;
      state.ball.vy = 0;
      
      const initialScore = { ...state.score };
      
      // Tick until ball crosses
      for (let i = 0; i < 10; i++) {
        engine.tick();
      }
      
      const newState = engine.getState();
      // Away team should have scored (ball went into home goal)
      // or home scored depending on orientation
n      expect(newState.score.away + newState.score.home).toBeGreaterThan(0);
    });

    it('should reset ball to center after goal', () => {
      const state = engine.getState();
      state.ball.x = 395;
      state.ball.y = 0;
      state.ball.vx = 20;
      state.ball.vy = 0;
      
      for (let i = 0; i < 20; i++) {
        engine.tick();
      }
      
      const newState = engine.getState();
      // After goal, ball resets to center
      expect(newState.ball.x).toBeCloseTo(0, 0);
      expect(newState.ball.y).toBeCloseTo(0, 0);
      expect(newState.ball.vx).toBe(0);
      expect(newState.ball.vy).toBe(0);
    });
  });

  describe('kick mechanic', () => {
    it('should apply kick force to ball when player kicks near ball', () => {
      const playerId = 'player-0';
      const state = engine.getState();
      const player = state.players.get(playerId)!;
      
      // Place ball near player
      state.ball.x = player.x + 20;
      state.ball.y = player.y;
      state.ball.vx = 0;
      state.ball.vy = 0;
      
      // Queue kick input
      engine.queueInput(playerId, {
        seq: 1,
        dx: 1,
        dy: 0,
        kick: true,
        timestamp: Date.now(),
      });
      
      engine.tick();
      
      const newState = engine.getState();
      // Ball should have gained velocity from kick
      expect(Math.abs(newState.ball.vx)).toBeGreaterThan(0);
    });
  });

  describe('match phases', () => {
    it('should transition from countdown to playing', () => {
      const state = engine.getState();
      state.phase = 'countdown';
      state.countdown = 1; // 1 tick left
      
      engine.tick();
      
      expect(engine.getState().phase).toBe('playing');
    });

    it('should transition to finished when time runs out', () => {
      const state = engine.getState();
      state.phase = 'playing';
      state.timeRemaining = 0.01; // almost zero
      
      engine.tick();
      
      expect(engine.getState().phase).toBe('finished');
    });
  });

  describe('snapshot generation', () => {
    it('should generate a serializable snapshot', () => {
      const snapshot = engine.getSnapshot();
      
      expect(snapshot).toHaveProperty('ball');
      expect(snapshot).toHaveProperty('players');
      expect(snapshot).toHaveProperty('score');
      expect(snapshot).toHaveProperty('timeRemaining');
      expect(snapshot).toHaveProperty('phase');
      expect(snapshot).toHaveProperty('tick');
      
      // Should be JSON-serializable
      expect(() => JSON.stringify(snapshot)).not.toThrow();
    });
  });

  describe('player removal', () => {
    it('should remove player from game', () => {
      engine.removePlayer('player-0');
      expect(engine.getState().players.has('player-0')).toBe(false);
    });
  });
});
