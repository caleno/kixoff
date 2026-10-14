// ==================== GAME STATE INTERFACES ====================

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface PlayerState {
  id: string;
  position: Vector3;
  velocity: Vector3;
  boost: number;
  stamina: number;
  lastActionTimestamp: number;
  actionHistory: number[];
}

export interface BallState {
  position: Vector3;
  velocity: Vector3;
  spin: number;
  ownerId: string | null;
}

export interface GameState {
  matchId: string;
  players: PlayerState[];
  ball: BallState;
  score: { home: number; away: number };
  phase: 'countdown' | 'playing' | 'goal' | 'overtime' | 'ended';
  timestamp: number;
}

// ==================== GAME CONSTANTS ====================

export const TICK_RATE = 60;
export const CLIENT_UPDATE_RATE = 20;
export const TICK_INTERVAL = 1000 / TICK_RATE;
export const MAX_VELOCITY = 25;
export const VELOCITY_TOLERANCE = 2;
export const MIN_ACTION_INTERVAL = 16; // ms (approx 60Hz)
export const MAX_PLAYERS_PER_ROOM = 6;
export const MATCH_DURATION_MS = 3 * 60 * 1000; // 3 minutes

// ==================== ARENA CONFIG ====================

export interface ArenaConfig {
  width: number;
  length: number;
  goalWidth: number;
  wallHeight: number;
  friction: number;
  restitution: number;
}

export const DEFAULT_ARENA: ArenaConfig = {
  width: 80,
  length: 120,
  goalWidth: 20,
  wallHeight: 15,
  friction: 0.98,
  restitution: 0.85,
};
