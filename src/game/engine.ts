import { GameState, PlayerState, BallState, Team } from '../game/state';
import { AntiCheat } from '../security/anti-cheat';

/**
 * GameEngine — Server-authoritative physics & game logic
 * Node (Backend) — KIXoff
 * 
 * Tick rate: 60Hz (16.67ms per tick)
 * Broadcast rate: 20Hz (50ms per snapshot)
 */

const TICK_RATE = 60;
const TICK_MS = 1000 / TICK_RATE;
const BROADCAST_RATE = 20;
const BROADCAST_MS = 1000 / BROADCAST_RATE;
const MATCH_DURATION_MS = 180_000; // 3 minutes
const FIELD_WIDTH = 800;
const FIELD_HEIGHT = 500;
const GOAL_WIDTH = 120;
const PLAYER_RADIUS = 18;
const BALL_RADIUS = 12;
const PLAYER_SPEED = 250; // px/sec
const BALL_FRICTION = 0.98;
const KICK_FORCE = 400;

export interface InputPacket {
  playerId: string;
  seq: number;
  dx: number; // -1, 0, 1
  dy: number; // -1, 0, 1
  kick: boolean;
  timestamp: number;
}

export interface SnapshotPacket {
  tick: number;
  timestamp: number;
  ball: BallState;
  players: PlayerState[];
  score: { home: number; away: number };
  timeRemaining: number;
  state: GameState['phase'];
}

export class GameEngine {
  private state: GameState;
  private inputs: Map<string, InputPacket[]> = new Map();
  private tick: number = 0;
  private lastBroadcast: number = 0;
  private antiCheat: AntiCheat;
  private onGoal: ((team: Team) => void) | null = null;
  private onMatchEnd: ((finalScore: { home: number; away: number }) => void) | null = null;
  private intervalHandle: NodeJS.Timeout | null = null;

  constructor(matchId: string) {
    this.state = this.createInitialState(matchId);
    this.antiCheat = new AntiCheat();
  }

  // ─── Lifecycle ───

  start(): void {
    if (this.intervalHandle) return;
    this.state.phase = 'playing';
    this.state.startTime = Date.now();
    this.intervalHandle = setInterval(() => this.tickLoop(), TICK_MS);
    console.log(`[Engine] Match ${this.state.matchId} started`);
  }

  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    this.state.phase = 'ended';
    console.log(`[Engine] Match ${this.state.matchId} stopped`);
  }

  // ─── Player Management ───

  addPlayer(playerId: string, team: Team, name: string): void {
    const spawnX = team === 'home' ? 150 : FIELD_WIDTH - 150;
 const spawnY = FIELD_HEIGHT / 2 + (this.state.players.filter(p => p.team === team).length * 40 - 40);

    this.state.players.push({
      id: playerId,
      team,
      name,
      x: spawnX,
      y: spawnY,
      vx: 0,
      vy: 0,
      hasBall: false,
      stamina: 100,
      rating: 1200,
      seq: 0,
    });
    this.inputs.set(playerId, []);
  }

  removePlayer(playerId: string): void {
    this.state.players = this.state.players.filter(p => p.id !== playerId);
    this.inputs.delete(playerId);
  }

  // ─── Input Handling ───

  queueInput(input: InputPacket): void {
    // Sentinel: Validate input before processing
    const validation = this.antiCheat.validateInput(input, this.state.players.find(p => p.id === input.playerId) || null);
    if (!validation.valid) {
      console.warn(`[AntiCheat] Rejected input from ${input.playerId}: ${validation.reason}`);
      return;
    }

    const queue = this.inputs.get(input.playerId);
    if (queue) {
      queue.push(input);
      // Keep queue bounded
      if (queue.length > 10) queue.shift();
    }
  }

  // ─── Main Tick Loop (60Hz) ───

  private tickLoop(): void {
    this.tick++;
    const now = Date.now();

    // Check match time
    const elapsed = now - (this.state.startTime || now);
    this.state.timeRemaining = Math.max(0, MATCH_DURATION_MS - elapsed);

    if (this.state.timeRemaining <= 0) {
      this.handleMatchEnd();
      return;
    }

    // Process inputs
    this.processInputs();

    // Physics: move players
    this.updatePlayers();

    // Physics: move ball
    this.updateBall();

    // Collisions
    this.handleCollisions();

    // Goal detection
    this.checkGoals();

    // Stamina regen
    this.regenerateStamina();
  }

  private processInputs(): void {
    for (const [playerId, queue] of this.inputs) {
      const player = this.state.players.find(p => p.id === playerId);
      if (!player) continue;

      const input = queue.shift();
      if (!input) continue;

      // Normalize diagonal movement
      let dx = input.dx;
      let dy = input.dy;
      const mag = Math.sqrt(dx * dx + dy * dy);
      if (mag > 0) {
        dx /= mag;
        dy /= mag;
      }

      player.vx = dx * PLAYER_SPEED;
      player.vy = dy * PLAYER_SPEED;

      // Kick ball if close enough
      if (input.kick) {
        const ballDx = this.state.ball.x - player.x;
        const ballDy = this.state.ball.y - player.y;
        const ballDist = Math.sqrt(ballDx * ballDx + ballDy * ballDy);

        if (ballDist < PLAYER_RADIUS + BALL_RADIUS + 5) {
          const kickAngle = Math.atan2(ballDy, ballDx);
          this.state.ball.vx = Math.cos(kickAngle) * KICK_FORCE;
          this.state.ball.vy = Math.sin(kickAngle) * KICK_FORCE;
          player.hasBall = false;
        }
      }

      player.seq = input.seq;
    }
  }

  private updatePlayers(): void {
    const dt = TICK_MS / 1000;

    for (const player of this.state.players) {
      // Apply velocity
      player.x += player.vx * dt;
      player.y += player.vy * dt;

      // Clamp to field boundaries
      player.x = Math.max(PLAYER_RADIUS, Math.min(FIELD_WIDTH - PLAYER_RADIUS, player.x));
      player.y = Math.max(PLAYER_RADIUS, Math.min(FIELD_HEIGHT - PLAYER_RADIUS, player.y));

      // Damping when no input
      player.vx *= 0.85;
      player.vy *= 0.85;

      // Stamina drain on movement
      const speed = Math.sqrt(player.vx ** 2 + player.vy ** 2);
      if (speed > 10) {
        player.stamina = Math.max(0, player.stamina - 0.15);
      }
    }
  }

  private updateBall(): void {
    const dt = TICK_MS / 1000;
    const ball = this.state.ball;

    // Apply velocity
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    // Friction
    ball.vx *= BALL_FRICTION;
    ball.vy *= BALL_FRICTION;

    // Stop if very slow
    if (Math.abs(ball.vx) < 0.5) ball.vx = 0;
    if (Math.abs(ball.vy) < 0.5) ball.vy = 0;

    // Wall bounces (top & bottom)
    if (ball.y < BALL_RADIUS) {
      ball.y = BALL_RADIUS;
      ball.vy = -ball.vy * 0.7;
    }
    if (ball.y > FIELD_HEIGHT - BALL_RADIUS) {
      ball.y = FIELD_HEIGHT - BALL_RADIUS;
      ball.vy = -ball.vy * 0.7;
    }

    // Wall bounces (left & right, except goal area)
    const inGoalArea = ball.y > (FIELD_HEIGHT - GOAL_WIDTH) / 2 && ball.y < (FIELD_HEIGHT + GOAL_WIDTH) / 2;

    if (ball.x < BALL_RADIUS && !inGoalArea) {
      ball.x = BALL_RADIUS;
      ball.vx = -ball.vx * 0.7;
    }
    if (ball.x > FIELD_WIDTH - BALL_RADIUS && !inGoalArea) {
      ball.x = FIELD_WIDTH - BALL_RADIUS;
      ball.vx = -ball.vx * 0.7;
    }
  }

  private handleCollisions(): void {
    // Player-ball collision
    for (const player of this.state.players) {
      const dx = this.state.ball.x - player.x;
      const dy = this.state.ball.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = PLAYER_RADIUS + BALL_RADIUS;

      if (dist < minDist && dist > 0) {
        // Push ball away from player
        const angle = Math.atan2(dy, dx);
        this.state.ball.x = player.x + Math.cos(angle) * minDist;
        this.state.ball.y = player.y + Math.sin(angle) * minDist;

        // Transfer some velocity
        const playerSpeed = Math.sqrt(player.vx ** 2 + player.vy ** 2);
        this.state.ball.vx += Math.cos(angle) * playerSpeed * 0.5;
        this.state.ball.vy += Math.sin(angle) * playerSpeed * 0.5;

        // Mark possession
        player.hasBall = true;
        const otherPlayers = this.state.players.filter(p => p.id !== player.id);
        otherPlayers.forEach(p => p.hasBall = false);
      }
    }

    // Player-player collision (simple separation)
    for (let i = 0; i < this.state.players.length; i++) {
      for (let j = i + 1; j < this.state.players.length; j++) {
        const a = this.state.players[i];
        const b = this.state.players[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = PLAYER_RADIUS * 2;

        if (dist < minDist && dist > 0) {
          const overlap = (minDist - dist) / 2;
          const angle = Math.atan2(dy, dx);
          a.x -= Math.cos(angle) * overlap;
          a.y -= Math.sin(angle) * overlap;
          b.x += Math.cos(angle) * overlap;
          b.y += Math.sin(angle) * overlap;
        }
      }
    }
  }

  private checkGoals(): void {
    const ball = this.state.ball;
 const goalTop = (FIELD_HEIGHT - GOAL_WIDTH) / 2;
    const goalBottom = (FIELD_HEIGHT + GOAL_WIDTH) / 2;

    // Home goal (left side) — away scores
    if (ball.x <= BALL_RADIUS && ball.y > goalTop && ball.y < goalBottom) {
      this.state.score.away++;
      this.onGoal?.('away');
      this.resetPositions();
    }

    // Away goal (right side) — home scores
    if (ball.x >= FIELD_WIDTH - BALL_RADIUS && ball.y > goalTop && ball.y < goalBottom) {
      this.state.score.home++;
      this.onGoal?.('home');
      this.resetPositions();
    }
  }

  private resetPositions(): void {
    // Reset ball to center
    this.state.ball.x = FIELD_WIDTH / 2;
    this.state.ball.y = FIELD_HEIGHT / 2;
    this.state.ball.vx = 0;
    this.state.ball.vy = 0;

    // Reset players to spawn positions
    let homeIdx = 0;
    let awayIdx = 0;
    for (const player of this.state.players) {
      if (player.team === 'home') {
        player.x = 150;
        player.y = FIELD_HEIGHT / 2 + (homeIdx * 40 - 40);
        homeIdx++;
      } else {
        player.x = FIELD_WIDTH - 150;
        player.y = FIELD_HEIGHT / 2 + (awayIdx * 40 - 40);
        awayIdx++;
      }
      player.vx = 0;
      player.vy = 0;
      player.hasBall = false;
    }
  }

  private regenerateStamina(): void {
    for (const player of this.state.players) {
      const speed = Math.sqrt(player.vx ** 2 + player.vy ** 2);
      if (speed < 10) {
        player.stamina = Math.min(100, player.stamina + 0.3);
      }
    }
  }

  private handleMatchEnd(): void {
    this.stop();
    this.onMatchEnd?.(this.state.score);
  }

  // ─── Snapshot / Broadcast ───

  shouldBroadcast(): boolean {
    const now = Date.now();
    if (now - this.lastBroadcast >= BROADCAST_MS) {
      this.lastBroadcast = now;
      return true;
    }
    return false;
  }

  getSnapshot(): SnapshotPacket {
    return {
      tick: this.tick,
      timestamp: Date.now(),
      ball: { ...this.state.ball },
      players: this.state.players.map(p => ({ ...p })),
      score: { ...this.state.score },
      timeRemaining: this.state.timeRemaining,
      state: this.state.phase,
    };
  }

  // ─── Callbacks ───

  onGoalScored(cb: (team: Team) => void): void {
    this.onGoal = cb;
  }

  onMatchComplete(cb: (finalScore: { home: number; away: number }) => void): void {
    this.onMatchEnd = cb;
  }

  // ─── Helpers ───

  private createInitialState(matchId: string): GameState {
    return {
      matchId,
      phase: 'waiting',
      players: [],
      ball: {
        x: FIELD_WIDTH / 2,
        y: FIELD_HEIGHT / 2,
        vx: 0,
        vy: 0,
        lastTouch: null,
      },
      score: { home: 0, away: 0 },
      timeRemaining: MATCH_DURATION_MS,
      startTime: null,
    };
  }

  getGameState(): GameState {
    return this.state;
  }

  getFieldDimensions() {
    return { width: FIELD_WIDTH, height: FIELD_HEIGHT, goalWidth: GOAL_WIDTH };
  }
}
