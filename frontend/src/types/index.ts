// ===== KIXoff Shared Types (mirrors backend) =====

export type Team = 'home' | 'away';

export interface Vec2 {
  x: number;
  y: number;
}

export interface PlayerSnapshot {
  id: string;
  team: Team;
  x: number;
  y: number;
  rot: number;
  stamina: number;
  hasBall: boolean;
  stunned: boolean;
}

export interface BallSnapshot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ownerId: string | null;
}

export interface Snapshot {
  matchId: string;
  tick: number;
  timeRemaining: number;
  phase: 'countdown' | 'playing' | 'goal-celebration' | 'halftime' | 'ended';
  homeScore: number;
  awayScore: number;
  players: PlayerSnapshot[];
  ball: BallSnapshot;
  lastEvent: GameEvent | null;
}

export interface GameEvent {
  type: 'goal' | 'steal' | 'stun' | 'pass' | 'shot' | 'save' | 'kickoff';
  timestamp: number;
  playerId?: string;
  team?: Team;
  data?: Record<string, unknown>;
}

export interface PlayerInput {
  seq: number;
  moveX: number;
  moveY: number;
  action: 'none' | 'pass' | 'shoot' | 'tackle' | 'dash';
  actionTarget?: Vec2;
  timestamp: number;
}

export interface PlayerProfile {
  id: string;
  username: string;
  rating: number;
  level: number;
  xp: number;
  kredits: number;
  gems: number;
  stats: PlayerStats;
  cosmetics: CosmeticLoadout;
}

export interface PlayerStats {
  matchesPlayed: number;
  wins: number;
  losses: number;
  goals: number;
  assists: number;
  saves: number;
  tackles: number;
}

export interface CosmeticLoadout {
  skin: string;
  trail: string;
  goalEffect: string;
  emotes: string[];
}

export type Screen =
  | 'splash'
  | 'main-menu'
  | 'casual'
  | 'ranked'
  | 'matchmaking'
  | 'loading'
  | 'game'
  | 'results'
  | 'profile'
  | 'shop'
  | 'settings';
