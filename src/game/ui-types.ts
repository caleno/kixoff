// ===== KIXoff UI Types =====
// Shapes consumed by the React frontend (App.tsx and screens).

export interface PlayerStats {
  wins: number;
  losses: number;
  draws: number;
  matchesPlayed: number;
  goals: number;
  assists: number;
  saves: number;
}

export interface Cosmetics {
  skin: string;
  trail: string;
  goalCelebration: string;
}

export interface PlayerProfile {
  id: string;
  username: string;
  rating: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  kredits: number;
  gems: number;
  stats: PlayerStats;
  cosmetics: Cosmetics;
}

export type Screen =
  | 'splash'
  | 'main-menu'
  | 'matchmaking'
  | 'game'
  | 'results';
