// ===== KIXoff Game Engine =====
// Minimal, type-correct implementation aligned with game/state.ts.

import type {
  MatchState,
  PlayerInput,
  PlayerState,
  Snapshot,
} from '../types';
import {
  ARENA,
  BALL_RADIUS,
  COUNTDOWN_MS,
  GAME_CONFIG,
  MATCH_DURATION_MS,
  PLAYER_RADIUS,
  PLAYER_SPEED,
  STAMINA_MAX,
  STAMINA_REGEN,
} from './state';

const TICK_RATE = GAME_CONFIG.tickRate;
const TICK_MS = 1000 / TICK_RATE;

export class GameEngine {
  state: MatchState;
  private tick = 0;
  private phaseElapsedMs = 0;
  private inputs = new Map<string, PlayerInput[]>();

  constructor(matchId: string, playerIds: string[]) {
    const players = new Map<string, PlayerState>();

    playerIds.forEach((id, index) => {
      const home = index % 2 === 0;
      players.set(id, {
        id,
        team: home ? 'home' : 'away',
        position: {
          x: home ? ARENA.width * 0.25 : ARENA.width * 0.75,
          y: ARENA.height / 2,
        },
        velocity: { x: 0, y: 0 },
        rotation: 0,
        stamina: STAMINA_MAX,
        hasBall: false,
        isStunned: false,
        stunUntil: 0,
        lastInputSeq: 0,
      });
    });

    this.state = {
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
  }

  queueInput(playerId: string, input: PlayerInput): void {
    const queue = this.inputs.get(playerId) ?? [];
    queue.push(input);
    this.inputs.set(playerId, queue);
  }

  tick_step(): void {
    this.tick += 1;
    this.phaseElapsedMs += TICK_MS;

    if (this.state.phase === 'countdown') {
      if (this.phaseElapsedMs >= COUNTDOWN_MS) {
        this.state.phase = 'playing';
        this.phaseElapsedMs = 0;
        this.state.events.push({
          type: 'kickoff',
          timestamp: Date.now(),
        });
      }
      return;
    }

    if (this.state.phase !== 'playing') {
      return;
    }

    this.state.timeRemaining = Math.max(0, this.state.timeRemaining - TICK_MS);
    if (this.state.timeRemaining === 0) {
      this.state.phase = 'ended';
      return;
    }

    for (const player of this.state.players.values()) {
      if (player.isStunned && Date.now() >= player.stunUntil) {
        player.isStunned = false;
      }
      if (player.isStunned) continue;

      const input = this.inputs.get(player.id)?.shift();
      if (!input) {
        player.stamina = Math.min(STAMINA_MAX, player.stamina + (STAMINA_REGEN * TICK_MS) / 1000);
        continue;
      }

      player.lastInputSeq = input.seq;
      const speed = PLAYER_SPEED * (TICK_MS / 1000);
      player.position.x = Math.max(
        PLAYER_RADIUS + BALL_RADIUS,
        Math.min(ARENA.width - PLAYER_RADIUS - BALL_RADIUS, player.position.x + input.moveX * speed)
      );
      player.position.y = Math.max(
        PLAYER_RADIUS + BALL_RADIUS,
        Math.min(ARENA.height - PLAYER_RADIUS - BALL_RADIUS, player.position.y + input.moveY * speed)
      );
      if (input.moveX !== 0 || input.moveY !== 0) {
        player.rotation = Math.atan2(input.moveY, input.moveX);
      }
    }
  }

  getSnapshot(): Snapshot {
    return {
      matchId: this.state.id,
      tick: this.tick,
      timeRemaining: this.state.timeRemaining,
      phase: this.state.phase,
      score: { home: this.state.homeScore, away: this.state.awayScore },
      ball: {
        position: { ...this.state.ball.position },
        velocity: { ...this.state.ball.velocity },
        ownerId: this.state.ball.ownerId,
        spin: this.state.ball.spin,
      },
      players: Array.from(this.state.players.values()).map((player) => ({
        ...player,
        position: { ...player.position },
        velocity: { ...player.velocity },
      })),
      events: [...this.state.events],
    };
  }
}
