import type { GameState, Player, PlayerInput, Snapshot } from '../types';

const FIELD_W = 800;
const FIELD_H = 500;
const PLAYER_R = 16;

export class GameEngine {
  state: GameState;
  private inputs = new Map<string, PlayerInput[]>();

  constructor(matchId: string, playerIds: string[]) {
    const players: Player[] = playerIds.map((id, index) => ({
      id,
      team: index < 3 ? 'home' : 'away',
      x: index < 3 ? 160 : 640,
      y: 180 + (index % 3) * 70,
      vx: 0,
      vy: 0,
      rot: 0,
      stamina: 100,
      hasBall: false,
      stunned: false,
    }));

    this.state = {
      matchId,
      phase: 'running',
      tick: 0,
      players,
      ball: { x: FIELD_W / 2, y: FIELD_H / 2, vx: 0, vy: 0, ownerId: null },
      homeScore: 0,
      awayScore: 0,
      lastEvent: null,
    };
  }

  queueInput(playerId: string, input: PlayerInput): void {
    const queue = this.inputs.get(playerId) ?? [];
    queue.push(input);
    this.inputs.set(playerId, queue);
  }

  tick_step(): void {
    this.state.tick += 1;
    for (const player of this.state.players) {
      const input = this.inputs.get(player.id)?.shift();
      if (!input) continue;
      player.x = Math.max(PLAYER_R, Math.min(FIELD_W - PLAYER_R, player.x + (input.dx ?? 0)));
      player.y = Math.max(PLAYER_R, Math.min(FIELD_H - PLAYER_R, player.y + (input.dy ?? 0)));
    }
  }

  getSnapshot(): Snapshot {
    return {
      tick: this.state.tick,
      timestamp: Date.now(),
      phase: this.state.phase,
      score: { home: this.state.homeScore, away: this.state.awayScore },
      ball: { ...this.state.ball },
      players: this.state.players.map((player) => ({ ...player })),
      lastEvent: this.state.lastEvent,
    };
  }
}
