import { GameState, TICK_INTERVAL, MAX_VELOCITY, DEFAULT_ARENA } from './state';

// ==================== 60HZ GAME LOOP ====================

export class GameLoop {
  private state: GameState;
  private intervalId: NodeJS.Timeout | null = null;
  private lastTick: number = 0;

  constructor(matchId: string) {
    this.state = {
      matchId,
      players: [],
      ball: {
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        spin: 0,
        ownerId: null,
      },
      score: { home: 0, away: 0 },
      phase: 'countdown',
      timestamp: Date.now(),
    };
  }

  start() {
    console.log(`[KIXoff] Game loop started for match ${this.state.matchId}`);
    this.lastTick = Date.now();
    this.intervalId = setInterval(() => this.tick(), TICK_INTERVAL);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.state.phase = 'ended';
    console.log(`[KIXoff] Game loop stopped for match ${this.state.matchId}`);
  }

  private tick() {
    const now = Date.now();
    const dt = (now - this.lastTick) / 1000; // delta time in seconds
    this.lastTick = now;

    // Update physics
    this.updatePhysics(dt);

    // Check goal collisions
    this.checkGoals();

    // Update timestamp
    this.state.timestamp = now;
  }

  private updatePhysics(dt: number) {
    // Update ball physics
    const ball = this.state.ball;
    ball.position.x += ball.velocity.x * dt;
    ball.position.y += ball.velocity.y * dt;
    ball.position.z += ball.velocity.z * dt;

    // Apply friction
    ball.velocity.x *= DEFAULT_ARENA.friction;
    ball.velocity.y *= DEFAULT_ARENA.friction;
    ball.velocity.z *= DEFAULT_ARENA.friction;

    // Wall collisions (simple bounce)
    const halfWidth = DEFAULT_ARENA.width / 2;
    const halfLength = DEFAULT_ARENA.length / 2;

    if (Math.abs(ball.position.x) > halfWidth) {
      ball.position.x = Math.sign(ball.position.x) * halfWidth;
      ball.velocity.x *= -DEFAULT_ARENA.restitution;
    }
    if (Math.abs(ball.position.y) > halfLength) {
      ball.position.y = Math.sign(ball.position.y) * halfLength;
      ball.velocity.y *= -DEFAULT_ARENA.restitution;
    }

    // Update player physics
    for (const player of this.state.players) {
      player.position.x += player.velocity.x * dt;
      player.position.y += player.velocity.y * dt;
      player.position.z += player.velocity.z * dt;

      // Clamp velocity
      const speed = Math.sqrt(
        player.velocity.x ** 2 + player.velocity.y ** 2 + player.velocity.z ** 2
      );
      if (speed > MAX_VELOCITY) {
        const scale = MAX_VELOCITY / speed;
        player.velocity.x *= scale;
        player.velocity.y *= scale;
        player.velocity.z *= scale;
      }
    }
  }

  private checkGoals() {
    const ball = this.state.ball;
    const halfLength = DEFAULT_ARENA.length / 2;
    const halfGoalWidth = DEFAULT_ARENA.goalWidth / 2;

    // Home goal (negative Y)
    if (ball.position.y < -halfLength && Math.abs(ball.position.x) < halfGoalWidth) {
      this.state.score.away++;
      this.state.phase = 'goal';
      console.log(`[KIXoff] GOAL! Away team scores. ${this.state.score.home}-${this.state.score.away}`);
      this.resetPositions();
    }

    // Away goal (positive Y)
    if (ball.position.y > halfLength && Math.abs(ball.position.x) < halfGoalWidth) {
      this.state.score.home++;
      this.state.phase = 'goal';
      console.log(`[KIXoff] GOAL! Home team scores. ${this.state.score.home}-${this.state.score.away}`);
      this.resetPositions();
    }
  }

  private resetPositions() {
    this.state.ball.position = { x: 0, y: 0, z: 0 };
    this.state.ball.velocity = { x: 0, y: 0, z: 0 };
    this.state.ball.ownerId = null;

    for (const player of this.state.players) {
      player.position = { x: 0, y: 0, z: 0 };
      player.velocity = { x: 0, y: 0, z: 0 };
    }

    setTimeout(() => {
      this.state.phase = 'playing';
    }, 3000); // 3 second countdown after goal
  }

  getState(): GameState {
    return this.state;
  }

  addPlayer(playerId: string) {
    if (this.state.players.length >= 6) return false;
    this.state.players.push({
      id: playerId,
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      boost: 100,
      stamina: 100,
      lastActionTimestamp: 0,
      actionHistory: [],
    });
    return true;
  }

  removePlayer(playerId: string) {
    this.state.players = this.state.players.filter((p) => p.id !== playerId);
  }
}
