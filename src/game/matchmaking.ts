import { MAX_PLAYERS_PER_ROOM } from './state';

// ==================== MATCHMAKING SYSTEM ====================

interface QueuePlayer {
  playerId: string;
  rating: number;
  joinedAt: number;
  socketId: string;
}

export class MatchmakingQueue {
  private queue: QueuePlayer[] = [];
  private readonly RATING_SPREAD = 150;
  private readonly WIDEN_INTERVAL = 15000; // 15 seconds

  join(player: QueuePlayer) {
    this.queue.push(player);
    console.log(`[KIXoff] Player ${player.playerId} (rating: ${player.rating}) joined queue. Queue size: ${this.queue.length}`);
  }

  leave(playerId: string) {
    this.queue = this.queue.filter((p) => p.playerId !== playerId);
  }

  /**
   * Attempt to form matches from the current queue.
   * Returns arrays of 6 players ready to match.
   */  
  tryFormMatches(): QueuePlayer[][] {
    const matches: QueuePlayer[][] = [];
    const now = Date.now();

    while (this.queue.length >= MAX_PLAYERS_PER_ROOM) {
      // Sort by rating for closest matching
      const sorted = [...this.queue].sort((a, b) => a.rating - b.rating);
      
      // Try to find 6 players within acceptable rating spread
      for (let i = 0; i <= sorted.length - MAX_PLAYERS_PER_ROOM; i++) {
        const group = sorted.slice(i, i + MAX_PLAYERS_PER_ROOM);
        const ratingSpread = group[group.length - 1].rating - group[0].rating;
        
        // Calculate acceptable spread based on wait time
        const waitTime = now - group[0].joinedAt;
        const spreadMultiplier = 1 + Math.floor(waitTime / this.WIDEN_INTERVAL) * 0.5;
        const acceptableSpread = this.RATING_SPREAD * spreadMultiplier;

        if (ratingSpread <= acceptableSpread) {
          matches.push(group);
          // Remove matched players from queue
          const matchedIds = new Set(group.map((p) => p.playerId));
          this.queue = this.queue.filter((p) => !matchedIds.has(p.playerId));
          break;
        }
      }
      
      // If no match found, break to avoid infinite loop
      if (matches.length === 0 || this.queue.length < MAX_PLAYERS_PER_ROOM) break;
    }

    return matches;
  }

  getQueueSize(): number {
    return this.queue.length;
  }
}

// ==================== GLICKO-2 RATING ====================

export class Glicko2 {
  private readonly RATING_DECAY = 0.5;
  private readonly VOLATILITY = 0.06;

  calculateNewRating(
    playerRating: number,
    playerRD: number,
    opponentRating: number,
    opponentRD: number,
    score: number // 1 = win, 0 = loss, 0.5 = draw
  ): { rating: number; rd: number } {
    // Simplified Glicko-2 calculation
    const g = (rd: number) => 1 / Math.sqrt(1 + (3 * rd ** 2) / (Math.PI ** 2));
    const E = (rating: number, oppRating: number, oppRD: number) =>
      1 / (1 + Math.exp(-g(oppRD) * (rating - oppRating) / 400));

    const expectedScore = E(playerRating, opponentRating, opponentRD);
    const variance =
      g(opponentRD) ** 2 * expectedScore * (1 - expectedScore);
    const improvement = (score - expectedScore) / variance;

    const newRD = Math.sqrt(
      1 / (1 / (playerRD ** 2) + 1 / variance)
    );
    const newRating = playerRating + newRD ** 2 * improvement;

    return {
      rating: Math.round(newRating),
      rd: Math.round(newRD),
    };
  }
}
