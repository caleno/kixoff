// ===== KIXoff Matchmaking Service — Glicko-2 based =====

import { logger } from '../utils/logger.js';

interface QueueEntry {
  playerId: string;
  rating: number;
  rd: number; // rating deviation (Glicko-2)
  joinedAt: number;
  socketId?: string;
}

interface MatchFound {
  matchId: string;
  players: string[];
}

const MAX_PLAYERS = parseInt(process.env.MAX_PLAYERS_PER_MATCH || '6', 10);
const QUEUE_TIMEOUT_MS = parseInt(process.env.MM_QUEUE_TIMEOUT_MS || '30000', 10);
const SKILL_BAND = parseInt(process.env.MM_SKILL_BAND || '200', 10);

class MatchmakingService {
  private queue: Map<string, QueueEntry> = new Map();
  private onMatchFound?: (match: MatchFound) => void;
  private intervalId: NodeJS.Timeout | null = null;

  start(onMatchFound: (match: MatchFound) => void): void {
    this.onMatchFound = onMatchFound;
    this.intervalId = setInterval(() => this.processQueue(), 1000);
    logger.info('Matchmaking service started');
  }

  stop(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
  }

  joinQueue(playerId: string, rating: number, rd: number = 350): void {
    if (this.queue.has(playerId)) {
      logger.warn(`Player ${playerId} already in queue`);
      return;
    }

    this.queue.set(playerId, {
      playerId,
      rating,
      rd,
      joinedAt: Date.now(),
    });

    logger.info(`Player ${playerId} joined queue (rating: ${rating})`);
  }

  leaveQueue(playerId: string): void {
    this.queue.delete(playerId);
  }

  getQueueSize(): number {
    return this.queue.size;
  }

  private processQueue(): void {
    const now = Date.now();
    const entries = Array.from(this.queue.values());

    // Remove timed-out entries
    for (const entry of entries) {
      if (now - entry.joinedAt > QUEUE_TIMEOUT_MS) {
        this.queue.delete(entry.playerId);
        logger.info(`Player ${entry.playerId} timed out from queue`);
      }
    }

    if (this.queue.size < MAX_PLAYERS) return;

    // Group players by skill band
    const sorted = Array.from(this.queue.values()).sort((a, b) => a.rating - b.rating);

    // Sliding window to find MAX_PLAYERS players within skill band
    for (let i = 0; i <= sorted.length - MAX_PLAYERS; i++) {
      const window = sorted.slice(i, i + MAX_PLAYERS);
      const ratingSpread = window[MAX_PLAYERS - 1].rating - window[0].rating;

      if (ratingSpread <= SKILL_BAND) {
        // Found a match!
        const matchId = `match_${now}_${Math.random().toString(36).substring(2, 8)}`;
        const playerIds = window.map((w) => w.playerId);

        // Remove from queue
        for (const w of window) {
          this.queue.delete(w.playerId);
        }

        logger.info(`Match ${matchId} created with players: ${playerIds.join(', ')}`);

        if (this.onMatchFound) {
          this.onMatchFound({ matchId, players: playerIds });
        }

        return;
      }
    }

    // If no perfect match found and queue is getting long, widen the band
    const oldestEntry = sorted[0];
    if (oldestEntry && now - oldestEntry.joinedAt > QUEUE_TIMEOUT_MS * 0.7) {
      // Force match with closest available players
      if (sorted.length >= MAX_PLAYERS) {
        const matchId = `match_${now}_forced`;
        const playerIds = sorted.slice(0, MAX_PLAYERS).map((w) => w.playerId);

        for (let i = 0; i < MAX_PLAYERS; i++) {
          this.queue.delete(sorted[i].playerId);
        }

        logger.info(`Forced match ${matchId} created (widened band)`);

        if (this.onMatchFound) {
          this.onMatchFound({ matchId, players: playerIds });
        }
      }
    }
  }
}

export const matchmakingService = new MatchmakingService();
