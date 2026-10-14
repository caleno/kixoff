import { GameState, PlayerState, BallState, Team } from './state';
import { AntiCheat } from '../security/anti-cheat-v2';

/**
 * InputPacket — sent by client each frame
 */
export interface InputPacket {
  seq: number;
  dx: number;
  dy: number;
  action: string;
  timestamp: number;
}

/**
 * MatchSnapshot — broadcast to clients at 20Hz
 */
export interface MatchSnapshot {
  tick: number;
  timestamp: number;
  ball: BallState;
  players: PlayerState[];
  scoreHome: number;
  scoreAway: number;
  phase: string;
  timeRemaining: number;
}

/**
 * GameEngine — Server-authoritative game loop
 * Node (Backend) — KIXoff
 *
 * 60Hz tick: physics, collision, goal detection
 * 20Hz snapshot: broadcast compact state to clients
 */
export class GameEngine {
  private state: GameState;
  private roomId: string;
  private tickCount: number = 0;
  private inputQueue: Map<string, InputPacket[]> = new Map();
  private antiCheat: AntiCheat;
  private matchDurationMs: number = 180000; // 3 minutes
  private matchStartTime: number = 0;
  private phase: string = 'WAITING';

  // Arena dimensions (top-down pitch)
  private readonly ARENA_WIDTH = 800;
  private readonly ARENA_HEIGHT = 500;
  private readonly GOAL_WIDTH = 140;
  private readonly PLAYER_RADIUS = 16;
  private readonly BALL_RADIUS = 10;
  private readonly MAX_PLAYER_SPEED = 280; // px/s
  private readonly MAX_BALL_SPEED = 520; // px/s
  private readonly FRICTION = 0.92;
  private readonly KICK_FORCE = 380;

  constructor(roomId: string) {
    this.roomId = roomId;
    this.antiCheat = new AntiCheat();
    this.state = {
      players: [],
      ball: {
        x: this.ARENA_WIDTH / 2,
        y: this.ARENA_HEIGHT / 2,
        vx: 0,
        vy: 0,
        z: 0,
      },
      scoreHome: 0,
      scoreAway: 0,
      timeRemaining: this.matchDurationMs,
      phase: 'WAITING',
    };
  }

  /**
   * Add a player to the match
   */
  addPlayer(playerId: string, team: Team, name: string): void {
    const player: PlayerState = {
      id: playerId,
      name,
      team,
      x: team === 'HOME' ? 200 : 600,
      y: this.ARENA_HEIGHT / 2 + (Math.random() - 0.5) * 100,
      vx: 0,
      vy: 0,
      hasBall: false,
      stamina: 100,
      isStunned: false,
      stunTimer: 0,
    };
    this.state.players.push(player);
    this.inputQueue.set(playerId, []);

    // Start match when 6 players joined
    if (this.state.players.length === 6 && this.phase === 'WAITING') {
      this.phase = 'PLAYING';
      this.state.phase = 'PLAYING';
      this.matchStartTime = Date.now();
    }
  }

  /**
   * Remove a player from the match
   */
  removePlayer(playerId: string): void {
    this.state.players = this.state.players.filter(p => p.id !== playerId);
    this.inputQueue.delete(playerId);
  }

  /**
   * Queue input from a player (validated by AntiCheat before calling this)
   */
  processInput(playerId: string, input: InputPacket): void {
    const queue = this.inputQueue.get(playerId);
    if (queue) {
      queue.push(input);
    }
  }

  /**
   * Main tick — called at 60Hz
   * @param dt Delta time in seconds
   */
  tick(dt: number): void {
    if (this.phase !== 'PLAYING') return;

    this.tickCount++;

    // Update match timer
    const elapsed = Date.now() - this.matchStartTime;
    this.state.timeRemaining = Math.max(0, this.matchDurationMs - elapsed);

    if (this.state.timeRemaining <= 0) {
      this.phase = 'ENDED';
      this.state.phase = 'ENDED';
      return;
    }

    // Process queued inputs
    for (const [playerId, queue] of this.inputQueue) {
      const player = this.state.players.find(p => p.id === playerId);
      if (!player) continue;

      const input = queue.shift();
      if (input) {
        // Apply movement
        if (!player.isStunned) {
          player.vx = input.dx * this.MAX_PLAYER_SPEED;
          player.vy = input.dy * this.MAX_PLAYER_SPEED;
        }

        // Handle actions (kick, sprint, slide)
        if (input.action === 'kick') {
          this.handleKick(player);
        } else if (input.action === 'sprint') {
          player.stamina = Math.max(0, player.stamina - 2);
        } else if (input.action === 'slide') {
          this.handleSlide(player);
        }
      }

      // Regenerate stamina when not sprinting
      if (player.stamina < 100) {
        player.stamina = Math.min(100, player.stamina + 0.5);
      }
    }

    // Physics: update positions
    for (const player of this.state.players) {
      player.x += player.vx * dt;
      player.y += player.vy * dt;

      // Apply friction
      player.vx *= this.FRICTION;
      player.vy *= this.FRICTION;

      // Arena boundaries
      player.x = Math.max(this.PLAYER_RADIUS, Math.min(this.ARENA_WIDTH - this.PLAYER_RADIUS, player.x));
      player.y = Math.max(this.PLAYER_RADIUS, Math.min(this.ARENA_HEIGHT - this.PLAYER_RADIUS, player.y));

      // Stun timer
      if (player.isStunned) {
        player.stunTimer -= dt * 1000;
        if (player.stunTimer <= 0) {
          player.isStunned = false;
          player.stunTimer = 0;
        }
      }
    }

    // Ball physics
    const ball = this.state.ball;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    ball.vx *= this.FRICTION;
    ball.vy *= this.FRICTION;

    // Ball boundaries (with goal openings on left/right)
    const goalTop = (this.ARENA_HEIGHT - this.GOAL_WIDTH) / 2;
    const goalBottom = goalTop + this.GOAL_WIDTH;

    // Left wall (HOME goal)
    if (ball.x < this.BALL_RADIUS) {
      if (ball.y > goalTop && ball.y < goalBottom) {
        // GOAL for AWAY
        this.state.scoreAway++;
        this.resetPositions();
        return;
      } else {
        ball.x = this.BALL_RADIUS;
        ball.vx = -ball.vx * 0.7;
      }
    }

    // Right wall (AWAY goal)
    if (ball.x > this.ARENA_WIDTH - this.BALL_RADIUS) {
      if (ball.y > goalTop && ball.y < goalBottom) {
        // GOAL for HOME
        this.state.scoreHome++;
        this.resetPositions();
        return;
      } else {
        ball.x = this.ARENA_WIDTH - this.BALL_RADIUS;
        ball.vx = -ball.vx * 0.7;
      }
    }

    // Top/bottom walls
    if (ball.y < this.BALL_RADIUS) {
      ball.y = this.BALL_RADIUS;
      ball.vy = -ball.vy * 0.7;
    }
    if (ball.y > this.ARENA_HEIGHT - this.BALL_RADIUS) {
      ball.y = this.ARENA_HEIGHT - this.BALL_RADIUS;
      ball.vy = -ball.vy * 0.7;
    }

    // Player-ball collision
    for (const player of this.state.players) {
      const dx = ball.x - player.x;
      const dy = ball.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = this.PLAYER_RADIUS + this.BALL_RADIUS;

      if (dist < minDist) {
        // Push ball away from player
        const angle = Math.atan2(dy, dx);
        const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
        ball.vx = Math.cos(angle) * Math.max(speed * 1.5, 150);
        ball.vy = Math.sin(angle) * Math.max(speed * 1.5, 150);

        // Cap ball speed
        const ballSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        if (ballSpeed > this.MAX_BALL_SPEED) {
          ball.vx = (ball.vx / ballSpeed) * this.MAX_BALL_SPEED;
          ball.vy = (ball.vy / ballSpeed) * this.MAX_BALL_SPEED;
        }

        // Mark possession
        this.state.players.forEach(p => p.hasBall = false);
        player.hasBall = true;
      }
    }

    // Player-player collision (simple push apart)
    for (let i = 0; i < this.state.players.length; i++) {
      for (let j = i + 1; j < this.state.players.length; j++) {
        const a = this.state.players[i];
        const b = this.state.players[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = this.PLAYER_RADIUS * 2;

        if (dist < minDist && dist > 0) {
          const push = (minDist - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;
        }
      }
    }
  }

  /**
   * Handle kick action
   */
  private handleKick(player: PlayerState): void {
    const ball = this.state.ball;
    const dx = ball.x - player.x;
    const dy = ball.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.PLAYER_RADIUS + this.BALL_RADIUS + 8) {
      const angle = Math.atan2(dy, dx);
      ball.vx = Math.cos(angle) * this.KICK_FORCE;
      ball.vy = Math.sin(angle) * this.KICK_FORCE;
      player.hasBall = false;
    }
  }

  /**
   * Handle slide action (stuns nearby opponents)
   */
  private handleSlide(player: PlayerState): void {
    for (const other of this.state.players) {
      if (other.team === player.team) continue;
      const dx = other.x - player.x;
      const dy = other.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.PLAYER_RADIUS * 3) {
        other.isStunned = true;
        other.stunTimer = 800; // 800ms stun
        other.vx = dx * 2;
        other.vy = dy * 2;
      }
    }
    player.stamina = Math.max(0, player.stamina - 15);
  }

  /**
   * Reset positions after goal
   */
  private resetPositions(): void {
    this.state.ball = {
      x: this.ARENA_WIDTH / 2,
      y: this.ARENA_HEIGHT / 2,
      vx: 0,
      vy: 0,
      z: 0,
    };

    for (const player of this.state.players) {
      player.x = player.team === 'HOME' ? 200 : 600;
      player.y = this.ARENA_HEIGHT / 2 + (Math.random() - 0.5) * 100;
      player.vx = 0;
      player.vy = 0;
      player.hasBall = false;
      player.isStunned = false;
      player.stunTimer = 0;
    }
  }

  /**
   * Get current snapshot for broadcasting
   */
  getSnapshot(): MatchSnapshot {
    return {
      tick: this.tickCount,
      timestamp: Date.now(),
      ball: { ...this.state.ball },
      players: this.state.players.map(p => ({ ...p })),
      scoreHome: this.state.scoreHome,
      scoreAway: this.state.scoreAway,
      phase: this.phase,
      timeRemaining: this.state.timeRemaining,
    };
  }

  /**
   * Get full game state
   */
  getState(): GameState {
    return this.state;
  }

  /**
   * Get room ID
   */
  getRoomId(): string {
    return this.roomId;
  }
}
