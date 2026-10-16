import { GameEngine } from './engine';
import type { Snapshot } from '../types';

const TICK_RATE = 60;
const BROADCAST_RATE = 20;
const TICK_MS = 1000 / TICK_RATE;
const BROADCAST_EVERY = TICK_RATE / BROADCAST_RATE;

type BroadcastFn = (snapshot: Snapshot) => void;
type MatchEndFn = (result: { homeScore: number; awayScore: number }) => void;

export class GameLoop {
  private engine: GameEngine;
  private intervalId: NodeJS.Timeout | null = null;
  private tickCount = 0;
  private broadcast: BroadcastFn;
  private onEnd: MatchEndFn;

  constructor(
    matchId: string,
    playerIds: string[],
    broadcast: BroadcastFn,
    onEnd: MatchEndFn
  ) {
    this.engine = new GameEngine(matchId, playerIds);
    this.broadcast = broadcast;
    this.onEnd = onEnd;
  }

  start(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      this.engine.tick_step();
      this.tickCount++;

      if (this.tickCount % BROADCAST_EVERY === 0) {
        this.broadcast(this.engine.getSnapshot());
      }

      if (this.engine.state.phase === 'ended') {
        this.stop();
        this.onEnd({
          homeScore: this.engine.state.homeScore,
          awayScore: this.engine.state.awayScore,
        });
      }
    }, TICK_MS);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  queueInput(playerId: string, input: any): void {
    this.engine.queueInput(playerId, input);
  }

  getEngine(): GameEngine {
    return this.engine;
  }
}
