// ==================== SHARED GAME TYPES (FRONTEND) ====================

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

export type GamePhase = GameState['phase'];
