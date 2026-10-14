// ===== KIXoff Game Loop — 60Hz tick, 20Hz broadcast =====

import type { Server as SocketServer } from 'socket.io';
import type { MatchState, PlayerInput, Snapshot, GameEvent } from './state.js';
import {
  ARENA,
  PLAYER_RADIUS,
  BALL_RADIUS,
  PLAYER_SPEED,
  PLAYER_DASH_SPEED,
  DASH_DURATION_MS,
  DASH_COOLDOWN_MS,
  STUN_DURATION_MS,
  TACKLE_RANGE,
  TACKLE_COOLDOWN_MS,
  PASS_SPEED,
  SHOT_SPEED,
  STAMINA_MAX,
  STAMINA_DASH_COST,
  STAMINA_REGEN,
  MATCH_DURATION_MS,
  COUNTDOWN_MS,
  GOAL_CELEBRATION_MS,
} from './state.js';
import { validateInput, validateMovement } from '../security/anti-cheat.js';
import { logger } from '../utils/logger.js';

const TICK_RATE = parseInt(process.env.TICK_RATE || '60', 10);
const BROADCAST_RATE = parseInt(process.env.BROADCAST_RATE || '20', 10);
const TICK_MS = 1000 / TICK_RATE;
const BROADCAST_MS = 1000 / BROADCAST_RATE;

class GameLoop {
  private matches: Map<string, MatchState> = new Map();
  private playerToMatch: Map<string, string> = new Map();
  private inputBuffers: Map<string, PlayerInput[]> = new Map();
  private dashCooldowns: Map<string, number> = new Map();
  private tackleCooldowns: Map<string, number> = new Map();
  private tickCount: number = 0;
  private lastBroadcast: number = 0;
  private intervalId: NodeJS.Timeout | null = null;
  private io: SocketServer | null = null;

  start(io: SocketServer): void {
    this.io = io;
    this.intervalId = setInterval(() => this.tick(), TICK_MS);
    logger.info(`Game loop started: ${TICK_RATE}Hz tick, ${BROADCAST_RATE}Hz broadcast`);
  }

  stop(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
  }

  createMatch(matchId: string, playerIds: string[]): void {
    const players = new Map<string, any>();
    const teams: Array<'home' | 'away'> = ['home', 'home', 'home', 'away', 'away', 'away'];

    playerIds.forEach((pid, i) => {
      const team = teams[i] || 'away';
      const startPos = team === 'home'
        ? { x: 200 + (i % 3) * 60, y: 250 + (i % 3) * 40 }
        : { x: 600 + (i % 3) * 60, y: 250 + (i % 3) * 40 };

      players.set(pid, {
        id: pid,
        team,
        position: startPos,
        velocity: { x: 0, y: 0 },
        rotation: 0,
        stamina: STAMINA_MAX,
        hasBall: false,
        isStunned: false,
        stunUntil: 0,
        lastInputSeq: 0,
      });
      this.playerToMatch.set(pid, matchId);
      this.inputBuffers.set(pid, []);
    });

    const match: MatchState = {
      id: matchId,
      phase: 'countdown',
      timeRemaining: MATCH_DURATION_MS,
      homeScore: 0,
      awayScore: 0,
      players,
      ball: {
        position: { x: ARENA.width / 2, y: ARENA.height / 2 },
        velocity: { x: 0, y: 0 },
        ownerId: null,
        spin: 0,
      },
      arena: ARENA,
      lastGoalScorer: null,
      lastGoalTeam: null,
      events: [],
    };

    this.matches.set(matchId, match);
    logger.info(`Match ${matchId} created with ${playerIds.length} players`);
  }

  handleInput(playerId: string, input: PlayerInput): void {
    // Sentinel: validate input before processing
    if (!validateInput(input)) {
      logger.warn(`Invalid input from player ${playerId}`);
      return;
    }

    const buffer = this.inputBuffers.get(playerId);
    if (buffer) {
      buffer.push(input);
      // Keep buffer bounded
      if (buffer.length > 30) buffer.shift();
    }
  }

  handleDisconnect(playerId: string): void {
    const matchId = this.playerToMatch.get(playerId);
    if (!matchId) return;

    const match = this.matches.get(matchId);
    if (match) {
      match.players.delete(playerId);
      this.inputBuffers.delete(playerId);
      this.dashCooldowns.delete(playerId);
      this.tackleCooldowns.delete(playerId);

      // If ball owner leaves, drop the ball
      if (match.ball.ownerId === playerId) {
        match.ball.ownerId = null;
      }

      // End match if too few players
      if (match.players.size < 2) {
        match.phase = 'ended';
        this.broadcastSnapshot(match);
        this.matches.delete(matchId);
        logger.info(`Match ${matchId} ended — insufficient players`);
      }
    }
    this.playerToMatch.delete(playerId);
  }

  private tick(): void {
    const now = Date.now();
    this.tickCount++;

    for (const [matchId, match] of this.matches) {
      this.updateMatch(match, now);
    }

    // Broadcast at 20Hz
    if (now - this.lastBroadcast >= BROADCAST_MS) {
      for (const match of this.matches.values()) {
        this.broadcastSnapshot(match);
      }
      this.lastBroadcast = now;
    }
  }

  private updateMatch(match: MatchState, now: number): void {
    const dt = TICK_MS / 1000; // delta time in seconds

    // Phase transitions
    if (match.phase === 'countdown') {
      const elapsed = MATCH_DURATION_MS - match.timeRemaining;
      if (elapsed >= COUNTDOWN_MS) {
        match.phase = 'playing';
        match.timeRemaining = MATCH_DURATION_MS;
        match.events.push({ type: 'kickoff', timestamp: now });
      } else {
        match.timeRemaining = MATCH_DURATION_MS - elapsed;
      }
      return;
    }

    if (match.phase === 'goal-celebration') {
      const elapsed = MATCH_DURATION_MS - match.timeRemaining;
      if (elapsed >= GOAL_CELEBRATION_MS) {
        match.phase = 'playing';
        this.resetKickoff(match);
      }
      return;
    }

    if (match.phase === 'ended') return;

    // Playing phase
    match.timeRemaining -= TICK_MS;
    if (match.timeRemaining <= 0) {
      match.timeRemaining = 0;
      match.phase = 'ended';
      match.events.push({ type: 'goal', timestamp: now, data: { reason: 'time-up' } });
      return;
    }

    // Process inputs and update players
    for (const [playerId, player] of match.players) {
      if (player.isStunned && now >= player.stunUntil) {
        player.isStunned = false;
      }

      if (player.isStunned) {
        player.velocity.x *= 0.5;
        player.velocity.y *= 0.5;
        continue;
      }

      // Process input buffer
      const buffer = this.inputBuffers.get(playerId);
      if (buffer && buffer.length > 0) {
        const input = buffer.shift()!;
        player.lastInputSeq = input.seq;

        // Sentinel: validate movement speed
        if (!validateMovement(player, input, dt)) {
          logger.warn(`Speed hack detected from ${playerId}`);
          // Clamp to max speed
          const speed = Math.hypot(player.velocity.x, player.velocity.y);
          if (speed > PLAYER_SPEED * 1.2) {
            player.velocity.x = (player.velocity.x / speed) * PLAYER_SPEED;
            player.velocity.y = (player.velocity.y / speed) * PLAYER_SPEED;
          }
        }

        // Movement
        const isDashing = input.action === 'dash';
        const speed = isDashing ? PLAYER_DASH_SPEED : PLAYER_SPEED;

        if (isDashing && player.stamina >= STAMINA_DASH_COST) {
          const lastDash = this.dashCooldowns.get(playerId) || 0;
          if (now - lastDash >= DASH_COOLDOWN_MS) {
            player.stamina -= STAMINA_DASH_COST;
            this.dashCooldowns.set(playerId, now);
            player.velocity.x = input.moveX * speed;
            player.velocity.y = input.moveY * speed;
          } else {
            player.velocity.x = input.moveX * PLAYER_SPEED;
            player.velocity.y = input.moveY * PLAYER_SPEED;
          }
        } else {
          player.velocity.x = input.moveX * speed;
          player.velocity.y = input.moveY * speed;
        }

        // Rotation
        if (input.moveX !== 0 || input.moveY !== 0) {
          player.rotation = Math.atan2(input.moveY, input.moveX);
        }

        // Actions
        if (input.action === 'pass' && player.hasBall) {
          this.executePass(match, playerId, input.actionTarget);
        } else if (input.action === 'shoot' && player.hasBall) {
          this.executeShot(match, playerId, input.actionTarget);
        } else if (input.action === 'tackle') {
          this.executeTackle(match, playerId, now);
        }
      }

      // Apply velocity
      player.position.x += player.velocity.x * dt;
      player.position.y += player.velocity.y * dt;

      // Arena bounds
      player.position.x = Math.max(PLAYER_RADIUS, Math.min(ARENA.width - PLAYER_RADIUS, player.position.x));
      player.position.y = Math.max(PLAYER_RADIUS, Math.min(ARENA.height - PLAYER_RADIUS, player.position.y));

      // Stamina regen
      if (player.stamina < STAMINA_MAX) {
        player.stamina = Math.min(STAMINA_MAX, player.stamina + STAMINA_REGEN * dt);
      }
    }

    // Update ball
    this.updateBall(match, dt);

    // Check goals
    this.checkGoals(match, now);

    // Player-ball collision
    this.checkBallPossession(match);
  }

  private updateBall(match: MatchState, dt: number): void {
    const ball = match.ball;

    if (ball.ownerId) {
      // Ball follows owner
      const owner = match.players.get(ball.ownerId);
      if (owner) {
        const offsetX = Math.cos(owner.rotation) * (PLAYER_RADIUS + BALL_RADIUS);
        const offsetY = Math.sin(owner.rotation) * (PLAYER_RADIUS + BALL_RADIUS);
        ball.position.x = owner.position.x + offsetX;
        ball.position.y = owner.position.y + offsetY;
        ball.velocity.x = owner.velocity.x;
        ball.velocity.y = owner.velocity.y;
      } else {
        ball.ownerId = null;
      }
    } else {
      // Free ball physics
      ball.position.x += ball.velocity.x * dt;
      ball.position.y += ball.velocity.y * dt;

      // Friction
      ball.velocity.x *= match.arena.friction;
      ball.velocity.y *= match.arena.friction;

      // Wall bouncing
      if (ball.position.x < BALL_RADIUS) {
        ball.position.x = BALL_RADIUS;
        ball.velocity.x = -ball.velocity.x * match.arena.wallBounce;
      } else if (ball.position.x > ARENA.width - BALL_RADIUS) {
        ball.position.x = ARENA.width - BALL_RADIUS;
        ball.velocity.x = -ball.velocity.x * match.arena.wallBounce;
      }

      if (ball.position.y < BALL_RADIUS) {
        ball.position.y = BALL_RADIUS;
        ball.velocity.y = -ball.velocity.y * match.arena.wallBounce;
      } else if (ball.position.y > ARENA.height - BALL_RADIUS) {
        ball.position.y = ARENA.height - BALL_RADIUS;
        ball.velocity.y = -ball.velocity.y * match.arena.wallBounce;
      }
    }
  }

  private checkBallPossession(match: MatchState): void {
    if (match.ball.ownerId) return;

    for (const [playerId, player] of match.players) {
      if (player.isStunned) continue;

      const dx = match.ball.position.x - player.position.x;
      const dy = match.ball.position.y - player.position.y;
      const dist = Math.hypot(dx, dy);

      if (dist < PLAYER_RADIUS + BALL_RADIUS) {
        match.ball.ownerId = playerId;
        player.hasBall = true;
        match.ball.velocity.x = 0;
        match.ball.velocity.y = 0;
        break;
      }
    }
  }

  private executePass(match: MatchState, fromId: string, target: { x: number; y: number } | undefined): void {
    const player = match.players.get(fromId);
    if (!player || !match.ball.ownerId === fromId) return;

    player.hasBall = false;
    match.ball.ownerId = null;

    if (target) {
      const dx = target.x - player.position.x;
      const dy = target.y - player.position.y;
      const dist = Math.hypot(dx, dy);
      match.ball.velocity.x = (dx / dist) * PASS_SPEED;
      match.ball.velocity.y = (dy / dist) * PASS_SPEED;
    }

    match.events.push({ type: 'pass', timestamp: Date.now(), playerId: fromId });
  }

  private executeShot(match: MatchState, fromId: string, target: { x: number; y: number } | undefined): void {
    const player = match.players.get(fromId);
    if (!player) return;

    player.hasBall = false;
    match.ball.ownerId = null;

    if (target) {
      const dx = target.x - player.position.x;
      const dy = target.y - player.position.y;
      const dist = Math.hypot(dx, dy);
      match.ball.velocity.x = (dx / dist) * SHOT_SPEED;
      match.ball.velocity.y = (dy / dist) * SHOT_SPEED;
    } else {
      // Shoot towards enemy goal
      const goalX = player.team === 'home' ? ARENA.width : 0;
      const goalY = ARENA.height / 2;
      const dx = goalX - player.position.x;
      const dy = goalY - player.position.y;
      const dist = Math.hypot(dx, dy);
      match.ball.velocity.x = (dx / dist) * SHOT_SPEED;
      match.ball.velocity.y = (dy / dist) * SHOT_SPEED;
    }

    match.events.push({ type: 'shot', timestamp: Date.now(), playerId: fromId });
  }

  private executeTackle(match: MatchState, tacklerId: string, now: number): void {
    const tackler = match.players.get(tacklerId);
    if (!tackler || tackler.isStunned) return;

    const lastTackle = this.tackleCooldowns.get(tacklerId) || 0;
    if (now - lastTackle < TACKLE_COOLDOWN_MS) return;
    this.tackleCooldowns.set(tacklerId, now);

    // Find nearest enemy player within tackle range
    for (const [otherId, other] of match.players) {
      if (otherId === tacklerId || other.team === tackler.team) continue;

      const dx = other.position.x - tackler.position.x;
      const dy = other.position.y - tackler.position.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= TACKLE_RANGE) {
        // Stun the target
        other.isStunned = true;
        other.stunUntil = now + STUN_DURATION_MS;

        // If they had the ball, steal it
        if (other.hasBall) {
          other.hasBall = false;
          match.ball.ownerId = tacklerId;
          tackler.hasBall = true;
          match.events.push({ type: 'steal', timestamp: now, playerId: tacklerId });
        }

        match.events.push({ type: 'stun', timestamp: now, playerId: otherId });
        break;
      }
    }
  }

  private checkGoals(match: MatchState, now: number): void {
    const ball = match.ball;
    const goalTop = (ARENA.height - ARENA.goalWidth) / 2;
    const goalBottom = goalTop + ARENA.goalWidth;

    // Home scores in away goal (right side)
    if (ball.position.x >= ARENA.width - BALL_RADIUS && ball.position.y > goalTop && ball.position.y < goalBottom) {
      match.homeScore++;
      match.lastGoalScorer = ball.ownerId;
      match.lastGoalTeam = 'home';
      match.phase = 'goal-celebration';
      match.timeRemaining = MATCH_DURATION_MS; // reuse as celebration timer
      match.events.push({ type: 'goal', timestamp: now, team: 'home' });
      logger.info(`Match ${match.id}: HOME scores! ${match.homeScore}-${match.awayScore}`);
      return;
    }

    // Away scores in home goal (left side)
    if (ball.position.x <= BALL_RADIUS && ball.position.y > goalTop && ball.position.y < goalBottom) {
      match.awayScore++;
      match.lastGoalScorer = ball.ownerId;
      match.lastGoalTeam = 'away';
      match.phase = 'goal-celebration';
      match.timeRemaining = MATCH_DURATION_MS;
      match.events.push({ type: 'goal', timestamp: now, team: 'away' });
      logger.info(`Match ${match.id}: AWAY scores! ${match.homeScore}-${match.awayScore}`);
      return;
    }
  }

  private resetKickoff(match: MatchState): void {
    match.ball.position = { x: ARENA.width / 2, y: ARENA.height / 2 };
    match.ball.velocity = { x: 0, y: 0 };
    match.ball.ownerId = null;

    for (const player of match.players.values()) {
      player.hasBall = false;
      player.isStunned = false;
      player.velocity = { x: 0, y: 0 };
      // Reset positions
      const isHome = player.team === 'home';
      player.position = isHome
        ? { x: 200 + Math.random() * 100, y: 150 + Math.random() * 200 }
        : { x: 500 + Math.random() * 100, y: 150 + Math.random() * 200 };
    }
  }

  private broadcastSnapshot(match: MatchState): void {
    if (!this.io) return;

    const snapshot: Snapshot = {
      matchId: match.id,
      tick: this.tickCount,
      timeRemaining: match.timeRemaining,
      phase: match.phase,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      players: Array.from(match.players.values()).map((p) => ({
        id: p.id,
        team: p.team,
        x: p.position.x,
        y: p.position.y,
        rot: p.rotation,
        stamina: p.stamina,
        hasBall: p.hasBall,
        stunned: p.isStunned,
      })),
      ball: {
        x: match.ball.position.x,
        y: match.ball.position.y,
        vx: match.ball.velocity.x,
        vy: match.ball.velocity.y,
        ownerId: match.ball.ownerId,
      },
      lastEvent: match.events[match.events.length - 1] || null,
    };

    this.io.to(`match:${match.id}`).emit('game:snapshot', snapshot);
  }

  getMatchState(matchId: string): MatchState | undefined {
    return this.matches.get(matchId);
  }
}

export const gameLoop = new GameLoop();
