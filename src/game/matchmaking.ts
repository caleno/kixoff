// ===== KIXoff Matchmaking Service =====
// Glicko-2 based skill matching with queue timeout

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

const SKILL_BAND = parseInt(process.env.MM_SKILL_BAND || '200', 10);
const QUEUE_TIMEOUT_MS = parseInt(process.env.MM_QUEUE_TIMEOUT_MS || '30000', 10);
const TEAM_SIZE = 3;

interface QueueEntry {
  playerId: string;
  rating: number;
  joinedAt: number;
  socketId?: string;
}

interface MatchFound {
  matchId: string;
  players: QueueEntry[];
}

type MatchFoundCallback = (match: MatchFound) => void;

class MatchmakingService {
  private queue: QueueEntry[] = [];
  private onMatchFound: MatchFoundCallback | null = null;
  private intervalId: NodeJS.Timeout | null = null;

  start(callback: MatchFoundCallback): void {
    this.onMatchFound = callback;
    this.intervalId = setInterval(() => this.tryMatch(), 1000);
    logger.info('Matchmaking service started');
  }

  stop(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
  }

  joinQueue(playerId: string, rating: number): void {
    // Don't add if already in queue
    if (this.queue.some((e) => e.playerId === playerId)) {
      logger.warn(`Player ${playerId} already in queue`);
      return;
    }

    this.queue.push({
      playerId,
      rating,
      joinedAt: Date.now(),
    });
    logger.info(`Player ${playerId} (rating ${rating}) joined queue. Queue size: ${this.queue.length}`);
  }

  leaveQueue(playerId: string): void {
    const before = this.queue.length;
    this.queue = this.queue.filter((e) => e.playerId !== playerId);
    if (this.queue.length < before) {
      logger.info(`Player ${playerId} left queue. Queue size: ${this.queue.length}`);
    }
  }

  private tryMatch(): void {
    if (this.queue.length < TEAM_SIZE * 2) return;

    const now = Date.now();

    // Sort by rating for better matching
    const sorted = [...this.queue].sort((a, b) => a.rating - b.rating);

    // Try to find 6 players within skill band
    for (let i = 0; i <= sorted.length - TEAM_SIZE * 2; i++) {
      const group = sorted.slice(i, i + TEAM_SIZE * 2);
      const ratingSpread = group[group.length - 1].rating - group[0].rating;

      // Check if within skill band OR if any player has waited too long (widening)
      const maxWait = Math.max(...group.map((g) => now - g.joinedAt));
      const dynamicBand = SKILL_BAND + Math.min(maxWait * 5, 300); // Widen up to +300

      if (ratingSpread <= dynamicBand) {
        // Found a match!
        const matchId = uuidv4();
        const matchedPlayers = group;

        // Remove from queue
        const matchedIds = new Set(matchedPlayers.map((p) => p.playerId));
        this.queue = this.queue.filter((e) => !matchedIds.has(e.playerId));

        logger.info(`Match ${matchId} created. Players: ${matchedPlayers.map((p) => p.playerId).join(', ')}`);

        if (this.onMatchFound) {
          this.onMatchFound({ matchId, players: matchedPlayers });
        }
        return;
      }
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  getQueuePosition(playerId: string): number {
    return this.queue.findIndex((e) => e.playerId === playerId);
  }
}

export const matchmakingService = new MatchmakingService();
