// KIXoff shared types — used by both frontend and backend

export type Team = 'home' | 'away';

export type MatchPhase = 'waiting' | 'countdown' | 'playing' | 'goal-celebration' | 'ended';

export interface Player {
  id: string;
  name: string;
  team: Team;
  rating: number;
  level: number;
}

export interface MatchResult {
  matchId: string;
  winner: Team | 'draw';
  score: { home: number; away: number };
  duration: number;
  mvp: string;
  players: Player[];
}

export interface RankTier {
  name: string;
  minRating: number;
  maxRating: number;
  color: string;
}

export const RANK_TIERS: RankTier[] = [
  { name: 'Bronze',    minRating: 0,    maxRating: 1150, color: '#CD7F32' },
  { name: 'Silver',    minRating: 1150, maxRating: 1350, color: '#C0C0C0' },
  { name: 'Gold',      minRating: 1350, maxRating: 1550, color: '#FFD700' },
  { name: 'Platinum',  minRating: 1550, maxRating: 1750, color: '#E5E4E2' },
  { name: 'Diamond',   minRating: 1750, maxRating: 2000, color: '#00F0FF' },
  { name: 'Master',    minRating: 2000, maxRating: 2300, color: '#FF006E' },
  { name: 'Legend',    minRating: 2300, maxRating: 9999, color: '#FFB800' },
];

export function getRankFromRating(rating: number): RankTier {
  return RANK_TIERS.find(t => rating >= t.minRating && rating < t.maxRating) || RANK_TIERS[0];
}
