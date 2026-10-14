import { GameState, PlayerState, BallState, Team } from '../game/state';
import { AntiCheat } from './anti-cheat-v2';
import { InputPacket } from './engine';

/**
 * GameEngine — Server-authoritative game loop
 * Node (Backend) — KIXoff
 *
 * 60Hz tick rate for physics simulation
 * 20Hz snapshot broadcast to clients
 * Handles: player movement, ball physics, collision, goals, match phases
 */

export interface Snapshot {
  tick: number;
  ball: { x: number; y: number; vx: number; vy: number };
  players: Array<{
    id: string;
    name: string;
    team: Team;
    x: number;
    y: number;
    vx: number;
    vy: number;
  }>;
  score: { home: number; away: number };
  timeRemaining: number;
  phase: string;
  lastEvent?: string;
}

export interface InputPacket {
  seq: number;
  dx: number;
  dy: number;
  kick: boolean;
  timestamp: number;
}

const ARENA = {
  minX: -400,
  maxX: 400,
  minY: -250,
  maxY: 250,
  goalWidth: 120,
  goalDepth: 20,
};

const PLAYER_SPEED = 200; // units/sec
const BALL_FRICTION = 0.98;
const KICK_FORCE = 400;
const TICK_RATE = 60;
const TICK_DT = 1 / TICK_RATE;
const MATCH_DURATION = 180; // 3 minutes
const COUNTDOWN_DURATION = 3; // seconds
const MAX_INPUT_QUEUE = 10;

export class GameEngine {
  public roomId: string;
  private state: GameState;
  private antiCheat: AntiCheat;
  private inputQueue: Map<string, InputPacket[]> = new Map();
  private tickCount = 0;
  private lastGoalTick = -100;

  constructor(roomId: string) {
    this.roomId = roomId;
    this.antiCheat = new AntiCheat();
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      players: new Map(),
      ball: { x: 0, y: 0, vx: 0, vy: 0 },
      score: { home: 0, away: 0 },
      timeRemaining: MATCH_DURATION,
      phase: 'countdown',
      countdown: COUNTDOWN_DURATION * TICK_RATE,
      tick: 0,
    };
  }

  // ═══════════════════════════════════════════════════════════
  // Player Management
  // ═══════════════════════════════════════════════════════════

  addPlayer(id: string, team: Team, name: string, rating: number): void {
    const spawnX = team === 'home' ? -200 : 200;
    const playerIndex = Array.from(this.state.players.values()).filter(p => p.team === team).length;
    const spawnY = (playerIndex - 1) * 80;

    this.state.players.set(id, {
      id,
      name,
      team,
      x: spawnX,
      y: spawnY,
      vx: 0,
      vy: 0,
      rating,
    });
    this.inputQueue.set(id, []);
  }

  removePlayer(id: string): void {
    this.state.players.delete(id);
    this.inputQueue.delete(id);
  }

  // ═══════════════════════════════════════════════════════════
  // Input Handling
  // ═══════════════════════════════════════════════════════════

  queueInput(playerId: string, input: InputPacket): void {
    const queue = this.inputQueue.get(playerId);
    if (!queue) return;
    if (queue.length >= MAX_INPUT_QUEUE) return; // drop overflow
    queue.push(input);
  }

  // ═══════════════════════════════════════════════════════════
  // Main Tick — 60Hz
  // ═══════════════════════════════════════════════════════════

  tick(): void {
    this.tickCount++;
    this.state.tick = this.tickCount;

    // Phase transitions
    if (this.state.phase === 'countdown') {
      this.state.countdown--;
      if (this.state.countdown <= 0) {
        this.state.phase = 'playing';
      }
      return;
    }

    if (this.state.phase === 'finished') return;

    if (this.state.phase === 'playing') {
      this.state.timeRemaining -= TICK_DT;
      if (this.state.timeRemaining <= 0) {
        this.state.timeRemaining = 0;
        this.state.phase = 'finished';
        return;
      }
    }

    // Process inputs
    for (const [playerId, queue] of this.inputQueue) {
      const player = this.state.players.get(playerId);
      if (!player) continue;

      const input = queue.shift();
      if (!input) continue;

      // Validate with anti-cheat
      const validation = this.antiCheat.validateInput(playerId, input, player);
      if (!validation.valid) continue;

      // Apply movement
      const speed = PLAYER_SPEED * TICK_DT;
      player.vx = input.dx * speed;
      player.vy = input.dy * speed;
      player.x += player.vx;
      player.y += player.vy;

      // Clamp to arena
      player.x = Math.max(ARENA.minX, Math.min(ARENA.maxX, player.x));
      player.y = Math.max(ARENA.minY, Math.min(ARENA.maxY, player.y));

      // Handle kick
      if (input.kick) {
        const dx = this.state.ball.x - player.x;
        const dy = this.state.ball.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 35) {
          const angle = Math.atan2(dy, dx);
          this.state.ball.vx += Math.cos(angle) * KICK_FORCE * TICK_DT * 5;
          this.state.ball.vy += Math.sin(angle) * KICK_FORCE * TICK_DT * 5;
        }
      }
    }

    // Ball physics
    this.state.ball.x += this.state.ball.vx * TICK_DT;
    this.state.ball.y += this.state.ball.vy * TICK_DT;
    this.state.ball.vx *= BALL_FRICTION;
    this.state.ball.vy *= BALL_FRICTION;

    // Ball bounds (walls)
    if (this.state.ball.x < ARENA.minX) {
      this.state.ball.x = ARENA.minX;
      this.state.ball.vx *= -0.5;
    }
    if (this.state.ball.x > ARENA.maxX) {
      this.state.ball.x = ARENA.maxX;
      this.state.ball.vx *= -0.5;
    }
    if (this.state.ball.y < ARENA.minY) {
      this.state.ball.y = ARENA.minY;
      this.state.ball.vy *= -0.5;
    }
    if (this.state.ball.y > ARENA.maxY) {
      this.state.ball.y = ARENA.maxY;
      this.state.ball.vy *= -0.5;
    }

    // Player-ball collision
    for (const player of this.state.players.values()) {
      const dx = this.state.ball.x - player.x;
      const dy = this.state.ball.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = 20;
      if (dist < minDist && dist > 0) {
        const angle = Math.atan2(dy, dx);
        this.state.ball.x = player.x + Math.cos(angle) * minDist;
        this.state.ball.y = player.y + Math.sin(angle) * minDist;
        this.state.ball.vx += player.vx * 0.5;
        this.state.ball.vy += player.vy * 0.5;
      }
    }

    // Goal detection
    if (this.tickCount - this.lastGoalTick > 60) { // 1s cooldown
      const ball = this.state.ball;
      const inGoalY = Math.abs(ball.y) < ARENA.goalWidth / 2;

      if (ball.x <= ARENA.minX + ARENA.goalDepth && inGoalY) {
        // Ball entered home goal → away scores
        this.state.score.away++;
        this.resetBall();
        this.lastGoalTick = this.tickCount;
      } else if (ball.x >= ARENA.maxX - ARENA.goalDepth && inGoalY) {
        // Ball entered away goal → home scores
        this.state.score.home++;
        this.resetBall();
        this.lastGoalTick = this.tickCount;
      }
    }
  }

  private resetBall(): void {
    this.state.ball.x = 0;
    this.state.ball.y = 0;
    this.state.ball.vx = 0;
    this.state.ball.vy = 0;
  }

  // ═══════════════════════════════════════════════════════════
  // Snapshot & State Access
  // ═══════════════════════════════════════════════════════════

  getState(): GameState {
    return this.state;
  }

  getSnapshot(): Snapshot {
    return {
      tick: this.state.tick,
      ball: { ...this.state.ball },
      players: Array.from(this.state.players.values()).map(p => ({
        id: p.id,
        name: p.name,
        team: p.team,
        x: p.x,
        y: p.y,
        vx: p.vx,
        vy: p.vy,
      })),
      score: { ...this.state.score },
      timeRemaining: this.state.timeRemaining,
      phase: this.state.phase,
    };
  }

  getArenaBounds() {
    return ARENA;
  }
}
