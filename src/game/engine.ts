import { GameState, PlayerState, BallState, Team } from '../game/state';
import { AntiCheat } from '../security/anti-cheat-v2';

/**
 * InputPacket — sent by client at ~30Hz
 */
export interface InputPacket {
  seq: number;
  playerId: string;
  dx: number; // -1, 0, 1
  dy: number; // -1, 0, 1
  kick: boolean;
  dash: boolean;
  timestamp: number;
}

/**
 * Snapshot — broadcast to clients at 20Hz
 */
export interface Snapshot {
  tick: number;
  scoreHome: number;
  scoreAway: number;
  timer: number; // seconds remaining
  ball: BallState;
  players: PlayerState[];
  lastEvent: 'goal' | 'kickoff' | 'none';
  timestamp: number;
}

/**
 * GameEngine — Server-authoritative game loop
 * Node (Backend) — KIXoff
 *
 * 60Hz tick rate for physics/collision
 * 20Hz snapshot broadcast (every 3rd tick)
 * Handles: movement, ball physics, collision, goal detection, scoring
 */
export class GameEngine {
  public state: GameState;
  public tick: number = 0;
  private inputQueue: Map<string, InputPacket[]> = new Map();
  private antiCheat: AntiCheat;
  private readonly TICK_RATE = 60; // Hz
  private readonly SNAPSHOT_INTERVAL = 3; // every 3 ticks = 20Hz
  private readonly MATCH_DURATION = 180; // 3 minutes
  private lastGoalTick: number = 0;
  private goalResetTimer: number = 0;

  constructor(roomId: string) {
    this.state = this.createInitialState(roomId);
    this.antiCheat = new AntiCheat();
  }

  // ═══════════════════════════════════════════════════════════
  // State Initialization
  // ═══════════════════════════════════════════════════════════

  private createInitialState(roomId: string): GameState {
    return {
      roomId,
      phase: 'waiting',
      scoreHome: 0,
      scoreAway: 0,
      timer: this.MATCH_DURATION,
      ball: {
        x: 0, y: 0, z: 0,
        vx: 0, vy: 0, vz: 0,
        ownerId: null,
      },
      players: [],
      lastGoalScorer: null,
      lastGoalTeam: null,
      createdAt: Date.now(),
    };
  }

  addPlayer(player: PlayerState): void {
    this.state.players.push(player);
    this.inputQueue.set(player.id, []);
    if (this.state.players.length >= 6) {
      this.state.phase = 'kickoff';
      this.resetPositions();
    }
  }

  removePlayer(playerId: string): void {
    this.state.players = this.state.players.filter((p) => p.id !== playerId);
    this.inputQueue.delete(playerId);
    if (this.state.players.length < 6 && this.state.phase !== 'waiting') {
      this.state.phase = 'waiting';
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Input Handling
  // ═══════════════════════════════════════════════════════════

  queueInput(packet: InputPacket): boolean {
    // Validate via AntiCheat
    const player = this.state.players.find((p) => p.id === packet.playerId);
    if (!player) return false;

    const valid = this.antiCheat.validateInput(packet, player);
    if (!valid) {
      console.warn(`[AntiCheat] Invalid input from ${packet.playerId}, seq=${packet.seq}`);
      return false;
    }

    const queue = this.inputQueue.get(packet.playerId);
    if (queue) {
      queue.push(packet);
      // Keep queue bounded
      if (queue.length > 10) queue.shift();
    }
    return true;
  }

  // ═══════════════════════════════════════════════════════════
  // Main Tick — called at 60Hz
  // ═══════════════════════════════════════════════════════════

  update(): Snapshot | null {
    if (this.state.phase === 'waiting' || this.state.phase === 'ended') {
      return null;
    }

    this.tick++;

    // Handle goal reset
    if (this.goalResetTimer > 0) {
      this.goalResetTimer--;
      if (this.goalResetTimer === 0) {
        this.resetPositions();
        this.state.phase = 'kickoff';
      }
    }

    // Process inputs
    for (const [playerId, queue] of this.inputQueue) {
      const input = queue.shift();
      if (!input) continue;
      this.processPlayerInput(playerId, input);
    }

    // Physics
    this.updatePhysics();

    // Collisions
    this.handleCollisions();

    // Goal detection
    this.checkGoals();

    // Timer
    if (this.state.phase === 'playing') {
      this.state.timer -= 1 / this.TICK_RATE;
      if (this.state.timer <= 0) {
        this.state.timer = 0;
        this.state.phase = 'ended';
      }
    }

    // Transition kickoff → playing
    if (this.state.phase === 'kickoff' && this.tick > this.lastGoalTick + 60) {
      this.state.phase = 'playing';
    }

    // Snapshot every 3 ticks (20Hz)
    if (this.tick % this.SNAPSHOT_INTERVAL === 0) {
      return this.createSnapshot();
    }

    return null;
  }

  // ═══════════════════════════════════════════════════════════
  // Physics
  // ═══════════════════════════════════════════════════════════

  private processPlayerInput(playerId: string, input: InputPacket): void {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return;

    const speed = 200; // units/sec
    const dt = 1 / this.TICK_RATE;

    // Normalize diagonal
    let dx = input.dx;
    let dy = input.dy;
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag > 0) {
      dx /= mag;
      dy /= mag;
    }

    player.vx = dx * speed;
    player.vy = dy * speed;

    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // Clamp to arena bounds
    const ARENA_W = 800;
    const ARENA_H = 500;
    player.x = Math.max(20, Math.min(ARENA_W - 20, player.x));
    player.y = Math.max(20, Math.min(ARENA_H - 20, player.y));

    // Kick
    if (input.kick) {
      const distToBall = Math.sqrt(
        (player.x - this.state.ball.x) ** 2 + (player.y - this.state.ball.y) ** 2
      );
      if (distToBall < 35) {
        const angle = Math.atan2(this.state.ball.y - player.y, this.state.ball.x - player.x);
        const kickForce = 400;
        this.state.ball.vx = Math.cos(angle) * kickForce;
        this.state.ball.vy = Math.sin(angle) * kickForce;
        this.state.ball.ownerId = null;
      }
    }

    // Dash
    if (input.dash && player.dashCooldown <= 0) {
      player.x += dx * 50;
      player.y += dy * 50;
      player.dashCooldown = 120; // 2 seconds at 60Hz
    }
    if (player.dashCooldown > 0) player.dashCooldown--;
  }

  private updatePhysics(): void {
    const dt = 1 / this.TICK_RATE;

    // Ball physics
    const ball = this.state.ball;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    // Friction
    ball.vx *= 0.98;
    ball.vy *= 0.98;

    // Ball bounds (bounce off walls except goal area)
    const ARENA_W = 800;
    const ARENA_H = 500;
    const GOAL_HEIGHT = 160;
    const goalTop = (ARENA_H - GOAL_HEIGHT) / 2;
    const goalBottom = goalTop + GOAL_HEIGHT;

    // Top/bottom walls
    if (ball.y < 10) { ball.y = 10; ball.vy = -ball.vy * 0.7; }
    if (ball.y > ARENA_H - 10) { ball.y = ARENA_H - 10; ball.vy = -ball.vy * 0.7; }

    // Left wall (unless in goal area)
    if (ball.x < 10 && (ball.y < goalTop || ball.y > goalBottom)) {
      ball.x = 10; ball.vx = -ball.vx * 0.7;
    }
    // Right wall (unless in goal area)
    if (ball.x > ARENA_W - 10 && (ball.y < goalTop || ball.y > goalBottom)) {
      ball.x = ARENA_W - 10; ball.vx = -ball.vx * 0.7;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Collisions
  // ═══════════════════════════════════════════════════════════

  private handleCollisions(): void {
    const ball = this.state.ball;

    // Player-ball collision
    for (const player of this.state.players) {
      const dx = ball.x - player.x;
      const dy = ball.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = 25;

      if (dist < minDist && dist > 0) {
        // Push ball away
        const angle = Math.atan2(dy, dx);
        ball.x = player.x + Math.cos(angle) * minDist;
        ball.y = player.y + Math.sin(angle) * minDist;

        // Transfer some velocity
        const playerSpeed = Math.sqrt(player.vx ** 2 + player.vy ** 2);
        if (playerSpeed > 10) {
          ball.vx = Math.cos(angle) * playerSpeed * 1.2;
          ball.vy = Math.sin(angle) * playerSpeed * 1.2;
          ball.ownerId = player.id;
        }
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
        const minDist = 30;
        if (dist < minDist && dist > 0) {
          const overlap = (minDist - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          a.x -= nx * overlap;
          a.y -= ny * overlap;
          b.x += nx * overlap;
          b.y += ny * overlap;
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Goal Detection
  // ═══════════════════════════════════════════════════════════

  private checkGoals(): void {
    if (this.state.phase !== 'playing') return;

    const ball = this.state.ball;
    const ARENA_W = 800;
    const ARENA_H = 500;
    const GOAL_HEIGHT = 160;
    const goalTop = (ARENA_H - GOAL_HEIGHT) / 2;
    const goalBottom = goalTop + GOAL_HEIGHT;

    // Left goal (home scores)
    if (ball.x < 0 && ball.y > goalTop && ball.y < goalBottom) {
      this.state.scoreHome++;
      this.state.lastGoalScorer = ball.ownerId;
      this.state.lastGoalTeam = 'home';
      this.state.phase = 'goal';
      this.lastGoalTick = this.tick;
      this.goalResetTimer = 180; // 3 sec at 60Hz
    }

    // Right goal (away scores)
    if (ball.x > ARENA_W && ball.y > goalTop && ball.y < goalBottom) {
      this.state.scoreAway++;
      this.state.lastGoalScorer = ball.ownerId;
      this.state.lastGoalTeam = 'away';
      this.state.phase = 'goal';
      this.lastGoalTick = this.tick;
      this.goalResetTimer = 180;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // Reset & Snapshot
  // ═══════════════════════════════════════════════════════════

  private resetPositions(): void {
    const ARENA_W = 800;
    const ARENA_H = 500;

    // Center ball
    this.state.ball.x = ARENA_W / 2;
    this.state.ball.y = ARENA_H / 2;
    this.state.ball.vx = 0;
    this.state.ball.vy = 0;
    this.state.ball.ownerId = null;

    // Reset players to formation
    const homePlayers = this.state.players.filter((p) => p.team === 'home');
    const awayPlayers = this.state.players.filter((p) => p.team === 'away');

    const formations: Record<Team, [number, number][]> = {
      home: [[100, 250], [180, 180], [180, 320]],
      away: [[700, 250], [620, 180], [620, 320]],
    };

    homePlayers.forEach((p, i) => {
      if (i < 3) { [p.x, p.y] = formations.home[i]; p.vx = 0; p.vy = 0; }
    });
    awayPlayers.forEach((p, i) => {
      if (i < 3) { [p.x, p.y] = formations.away[i]; p.vx = 0; p.vy = 0; }
    });
  }

  private createSnapshot(): Snapshot {
    return {
      tick: this.tick,
      scoreHome: this.state.scoreHome,
      scoreAway: this.state.scoreAway,
      timer: Math.ceil(this.state.timer),
      ball: { ...this.state.ball },
      players: this.state.players.map((p) => ({ ...p })),
      lastEvent: this.state.phase === 'goal' ? 'goal' : this.state.phase === 'kickoff' ? 'kickoff' : 'none',
      timestamp: Date.now(),
    };
  }

  // ═══════════════════════════════════════════════════════════
  // AntiCheat access
  // ═══════════════════════════════════════════════════════════

  getAntiCheat(): AntiCheat {
    return this.antiCheat;
  }

  getBannedPlayers(): string[] {
    return this.antiCheat.getBannedPlayers();
  }
}
