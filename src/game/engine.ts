import { GameState, Player, Ball, PlayerInput, Snapshot, MatchPhase } from '../types';

const FIELD_W = 800;
const FIELD_H = 500;
const PLAYER_R = 16;
const BALL_R = 8;
const PLAYER_SPEED = 3.5;
const DASH_SPEED = 7;
const DASH_DURATION = 8;
const DASH_COOLDOWN = 120;
const BALL_FRICTION = 0.96;
const BALL_MAX_SPEED = 12;
const STAMINA_MAX = 100;
const STAMINA_DASH_COST = 35;
const STAMINA_REGEN = 0.3;
const STUN_DURATION = 60;
const TACKLE_RANGE = 35;
const TACKLE_COOLDOWN = 90;
const SHOOT_POWER = 10;
const PASS_POWER = 7;
const MATCH_DURATION_MS = 180000;
const GOAL_CELEBRATION_MS = 3000;
const POSSESSION_THRESHOLD = 20;

export class GameEngine {
  state: GameState;
  private inputs = new Map<string, PlayerInput[]>();
  private dashTimers = new Map<string, { remaining: number; cooldown: number }>();
  private tackleCooldowns = new Map<string, number>();
  private goalTimer = 0;

  constructor(matchId: string, playerIds: string[]) {
    const players: Player[] = [];
    const positions = [
      { team: 'home' as const, x: 200, y: 250 },
      { team: 'home' as const, x: 150, y: 200 },
      { team: 'home' as const, x: 150, y: 300 },
      { team: 'away' as const, x: 600, y: 250 },
      { team: 'away' as const, x: 650, y: 200 },
      { team: 'away' as const, x: 650, y: 300 },
    ];

    playerIds.forEach((id, i) => {
      players.push({
        id,
        team: positions[i].team,
        x: positions[i].x,
        y: positions[i].y,
        vx: 0,
        vy: 0,
        rot: positions[i].team === 'home' ? 0 : Math.PI,
        stamina: STAMINA_MAX,
        hasBall: false,
        stunned: false,
        stunTimer: 0,
        dashRemaining: 0,
        dashCooldown: 0,
        tackleCooldown: 0,
      });
    });

    this.state = {
      matchId,
      tick: 0,
      timeRemaining: MATCH_DURATION_MS,
      phase: 'countdown',
      homeScore: 0,
      awayScore: 0,
      players,
      ball: { x: FIELD_W / 2, y: FIELD_H / 2, vx: 0, vy: 0, ownerId: null },
      lastEvent: null,
      lastGoalScorer: null,
    };
  }

  queueInput(playerId: string, input: PlayerInput): void {
    if (!this.inputs.has(playerId)) this.inputs.set(playerId, []);
    this.inputs.get(playerId)!.push(input);
  }

  tick_step(): void {
    if (this.state.phase === 'ended') return;

    if (this.state.phase === 'goal') {
      this.goalTimer--;
      if (this.goalTimer <= 0) {
        this.resetPositions();
        this.state.phase = 'playing';
      }
      return;
    }

    if (this.state.phase === 'countdown') {
      if (this.state.tick > 180) this.state.phase = 'playing';
      this.state.tick++;
      return;
    }

    this.state.timeRemaining -= 1000 / 60;
    if (this.state.timeRemaining <= 0) {
      this.state.timeRemaining = 0;
      this.state.phase = 'ended';
      return;
    }

    this.state.players.forEach((p) => this.processPlayer(p));
    this.processBall();
    this.checkGoals();
    this.state.tick++;
  }

  private processPlayer(p: Player): void {
    if (p.stunned) {
      p.stunTimer--;
      if (p.stunTimer <= 0) p.stunned = false;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.9;
      p.vy *= 0.9;
      this.clampToField(p);
      return;
    }

    const input = this.inputs.get(p.id)?.shift();

    if (p.dashCooldown > 0) p.dashCooldown--;
    if (p.tackleCooldown > 0) p.tackleCooldown--;

    let speed = PLAYER_SPEED;
    if (p.dashRemaining > 0) {
      speed = DASH_SPEED;
      p.dashRemaining--;
    }

    if (input) {
      if (input.moveX !== 0 || input.moveY !== 0) {
        p.vx = input.moveX * speed;
        p.vy = input.moveY * speed;
        p.rot = Math.atan2(input.moveY, input.moveX);
      } else {
        p.vx *= 0.8;
        p.vy *= 0.8;
      }

      if (input.action === 'dash' && p.dashCooldown <= 0 && p.stamina >= STAMINA_DASH_COST) {
        p.dashRemaining = DASH_DURATION;
        p.dashCooldown = DASH_COOLDOWN;
        p.stamina -= STAMINA_DASH_COST;
      }

      if (input.action === 'shoot' && p.hasBall) {
        this.state.ball.vx = Math.cos(p.rot) * SHOOT_POWER;
        this.state.ball.vy = Math.sin(p.rot) * SHOOT_POWER;
        this.state.ball.ownerId = null;
        p.hasBall = false;
        this.state.lastEvent = { type: 'shot', playerId: p.id, timestamp: Date.now() };
      }

      if (input.action === 'pass' && p.hasBall) {
        const teammate = this.findNearestTeammate(p);
        if (teammate) {
          const dx = teammate.x - p.x;
          const dy = teammate.y - p.y;
          const mag = Math.hypot(dx, dy);
          this.state.ball.vx = (dx / mag) * PASS_POWER;
          this.state.ball.vy = (dy / mag) * PASS_POWER;
          this.state.ball.ownerId = null;
          p.hasBall = false;
          this.state.lastEvent = { type: 'pass', playerId: p.id, timestamp: Date.now() };
        }
      }

      if (input.action === 'tackle' && p.tackleCooldown <= 0) {
        p.tackleCooldown = TACKLE_COOLDOWN;
        const target = this.findNearestEnemy(p, TACKLE_RANGE);
        if (target && target.hasBall) {
          target.stunned = true;
          target.stunTimer = STUN_DURATION;
          target.hasBall = false;
          this.state.ball.ownerId = null;
          this.state.ball.vx = (Math.random() - 0.5) * 4;
          this.state.ball.vy = (Math.random() - 0.5) * 4;
          this.state.lastEvent = { type: 'tackle', playerId: p.id, timestamp: Date.now() };
        }
      }
    }

    p.x += p.vx;
    p.y += p.vy;
    this.clampToField(p);

    if (p.stamina < STAMINA_MAX) {
      p.stamina = Math.min(STAMINA_MAX, p.stamina + STAMINA_REGEN);
    }
  }

  private processBall(): void {
    const ball = this.state.ball;

    if (ball.ownerId) {
      const owner = this.state.players.find((p) => p.id === ball.ownerId);
      if (owner && !owner.stunned) {
        ball.x = owner.x + Math.cos(owner.rot) * (PLAYER_R + BALL_R);
        ball.y = owner.y + Math.sin(owner.rot) * (PLAYER_R + BALL_R);
        ball.vx = 0;
        ball.vy = 0;
        return;
      } else {
        ball.ownerId = null;
      }
    }

    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.vx *= BALL_FRICTION;
    ball.vy *= BALL_FRICTION;

    const speed = Math.hypot(ball.vx, ball.vy);
    if (speed > BALL_MAX_SPEED) {
      ball.vx = (ball.vx / speed) * BALL_MAX_SPEED;
      ball.vy = (ball.vy / speed) * BALL_MAX_SPEED;
    }

    if (ball.x < BALL_R) { ball.x = BALL_R; ball.vx *= -0.5; }
    if (ball.x > FIELD_W - BALL_R) { ball.x = FIELD_W - BALL_R; ball.vx *= -0.5; }
    if (ball.y < BALL_R) { ball.y = BALL_R; ball.vy *= -0.5; }
    if (ball.y > FIELD_H - BALL_R) { ball.y = FIELD_H - BALL_R; ball.vy *= -0.5; }

    if (speed < 0.5) {
      for (const p of this.state.players) {
        if (p.stunned) continue;
        const dist = Math.hypot(ball.x - p.x, ball.y - p.y);
        if (dist < PLAYER_R + BALL_R + POSSESSION_THRESHOLD) {
          ball.ownerId = p.id;
          p.hasBall = true;
          this.state.lastEvent = { type: 'possession', playerId: p.id, timestamp: Date.now() };
          break;
        }
      }
    }
  }

  private checkGoals(): void {
    const ball = this.state.ball;
    const goalTop = FIELD_H / 2 - 50;
    const goalBottom = FIELD_H / 2 + 50;

    if (ball.x < 10 && ball.y > goalTop && ball.y < goalBottom) {
      this.state.awayScore++;
      this.state.lastGoalScorer = this.state.lastEvent?.playerId || null;
      this.state.phase = 'goal';
      this.goalTimer = GOAL_CELEBRATION_MS / (1000 / 60);
      this.state.lastEvent = { type: 'goal', playerId: this.state.lastGoalScorer || '', timestamp: Date.now() };
    } else if (ball.x > FIELD_W - 10 && ball.y > goalTop && ball.y < goalBottom) {
      this.state.homeScore++;
      this.state.lastGoalScorer = this.state.lastEvent?.playerId || null;
      this.state.phase = 'goal';
      this.goalTimer = GOAL_CELEBRATION_MS / (1000 / 60);
      this.state.lastEvent = { type: 'goal', playerId: this.state.lastGoalScorer || '', timestamp: Date.now() };
    }
  }

  private resetPositions(): void {
    const positions = [
      { x: 200, y: 250 },
      { x: 150, y: 200 },
      { x: 150, y: 300 },
      { x: 600, y: 250 },
      { x: 650, y: 200 },
      { x: 650, y: 300 },
    ];
    this.state.players.forEach((p, i) => {
      p.x = positions[i].x;
      p.y = positions[i].y;
      p.vx = 0;
      p.vy = 0;
      p.hasBall = false;
      p.stunned = false;
      p.stunTimer = 0;
      p.dashRemaining = 0;
      p.stamina = STAMINA_MAX;
    });
    this.state.ball = { x: FIELD_W / 2, y: FIELD_H / 2, vx: 0, vy: 0, ownerId: null };
  }

  private findNearestTeammate(p: Player): Player | null {
    let nearest: Player | null = null;
    let minDist = Infinity;
    for (const t of this.state.players) {
      if (t.id === p.id || t.team !== p.team) continue;
      const dist = Math.hypot(t.x - p.x, t.y - p.y);
      if (dist < minDist) { minDist = dist; nearest = t; }
    }
    return nearest;
  }

  private findNearestEnemy(p: Player, range: number): Player | null {
    let nearest: Player | null = null;
    let minDist = range;
    for (const e of this.state.players) {
      if (e.team === p.team) continue;
      const dist = Math.hypot(e.x - p.x, e.y - p.y);
      if (dist < minDist) { minDist = dist; nearest = e; }
    }
    return nearest;
  }

  private clampToField(p: Player): void {
    p.x = Math.max(PLAYER_R + 5, Math.min(FIELD_W - PLAYER_R - 5, p.x));
    p.y = Math.max(PLAYER_R + 5, Math.min(FIELD_H - PLAYER_R - 5, p.y));
  }

  getSnapshot(): Snapshot {
    return {
      matchId: this.state.matchId,
      tick: this.state.tick,
      timeRemaining: this.state.timeRemaining,
      phase: this.state.phase,
      homeScore: this.state.homeScore,
      awayScore: this.state.awayScore,
      players: this.state.players.map((p) => ({
        id: p.id,
        team: p.team,
        x: Math.round(p.x),
        y: Math.round(p.y),
        rot: p.rot,
        stamina: Math.round(p.stamina),
        hasBall: p.hasBall,
        stunned: p.stunned,
      })),
      ball: {
        x: Math.round(this.state.ball.x),
        y: Math.round(this.state.ball.y),
        vx: this.state.ball.vx,
        vy: this.state.ball.vy,
        ownerId: this.state.ball.ownerId,
      },
      lastEvent: this.state.lastEvent,
    };
  }
}
