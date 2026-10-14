// KIXoff — Shared Types (Aura + Node)

export type Team = 'home' | 'away';
export type MatchPhase = 'waiting' | 'countdown' | 'playing' | 'goal-celebration' | 'ended';
export type MatchResult = 'win' | 'loss' | 'draw';

export interface Player {
  id: string;
  name: string;
  team: Team;
  rating: number;
  rank: string;
}

export interface MatchPlayer extends Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  goals: number;
  assists: number;
  saves: number;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface MatchSnapshot {
  matchId: string;
  tick: number;
  phase: MatchPhase;
  timeRemaining: number;
  score: { home: number; away: number };
  ball: Ball;
  players: MatchPlayer[];
}

export interface MatchResultPayload {
  matchId: string;
  result: MatchResult;
  finalScore: { home: number; away: number };
  stats: {
    goals: number;
    assists: number;
    saves: number;
    rating: number;
  };
  xpGained: number;
  kreditsGained: number;
  ratingChange: number;
}

export interface PlayerProfile {
  id: string;
  name: string;
  rating: number;
  rank: string;
  level: number;
  xp: number;
  xpToNext: number;
  kredits: number;
  gems: number;
  wins: number;
  losses: number;
  draws: number;
  matchesPlayed: number;
}

export interface CosmeticItem {
  id: string;
  name: string;
  category: 'skin' | 'trail' | 'goal_effect' | 'emote' | 'banner';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  priceKredits?: number;
  priceGems?: number;
  equipped: boolean;
}

export const RANKS = [
  'Bronze', 'Silver', 'Gold', 'Platinum',
  'Diamond', 'Master', 'Grandmaster', 'Legend',
] as const;

export function getRankFromRating(rating: number): string {
  if (rating < 1200) return 'Bronze';
  if (rating < 1400) return 'Silver';
  if (rating < 1600) return 'Gold';
  if (rating < 1800) return 'Platinum';
  if (rating < 2000) return 'Diamond';
  if (rating < 2200) return 'Master';
  if (rating < 2400) return 'Grandmaster';
  return 'Legend';
}
