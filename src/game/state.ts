// ===== KIXoff Game State Types =====

export type Team = 'home' | 'away';

export interface Vec2 {
  x: number;
  y: number;
}

export interface PlayerState {
  id: string;
  team: Team;
  position: Vec2;
  velocity: Vec2;
  rotation: number;
  stamina: number;
  hasBall: boolean;
  isStunned: boolean;
  stunUntil: number;
  lastInputSeq: number;
}

export interface BallState {
  position: Vec2;
  velocity: Vec2;
  ownerId: string | null;
  spin: number;
}

export interface MatchState {
  id: string;
  phase: 'countdown' | 'playing' | 'goal-celebration' | 'halftime' | 'ended';
  timeRemaining: number;
  homeScore: number;
  awayScore: number;
  players: Map<string, PlayerState>;
  ball: BallState;
  arena: ArenaConfig;
  lastGoalScorer: string | null;
  lastGoalTeam: Team | null;
  events: GameEvent[];
}

export interface ArenaConfig {
  width: number;
  height: number;
  goalWidth: number;
  goalDepth: number;
  wallBounce: number;
  friction: number;
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

export interface Snapshot {
  matchId: string;
  tick: number;
  timeRemaining: number;
  phase: MatchState['phase'];
  homeScore: number;
  awayScore: number;
  players: Array<{
    id: string;
    team: Team;
    x: number;
    y: number;
    rot: number;
    stamina: number;
    hasBall: boolean;
    stunned: boolean;
  }>;
  ball: { x: number; y: number; vx: number; vy: number; ownerId: string | null };
  lastEvent: GameEvent | null;
}

// ===== Arena Constants =====
export const ARENA: ArenaConfig = {
  width: 800,
  height: 500,
  goalWidth: 120,
  goalDepth: 30,
  wallBounce: 0.7,
  friction: 0.92,
};

export const PLAYER_RADIUS = 14;
export const BALL_RADIUS = 8;
export const PLAYER_SPEED = 180; // pixels per second
export const PLAYER_DASH_SPEED = 320;
export const DASH_DURATION_MS = 200;
export const DASH_COOLDOWN_MS = 2000;
export const STUN_DURATION_MS = 1000;
export const TACKLE_RANGE = 28;
export const TACKLE_COOLDOWN_MS = 1500;
export const PASS_SPEED = 400;
export const SHOT_SPEED = 550;
export const STAMINA_MAX = 100;
export const STAMINA_DASH_COST = 25;
export const STAMINA_REGEN = 15; // per second
export const MATCH_DURATION_MS = 180000; // 3 minutes
export const COUNTDOWN_MS = 3000;
export const GOAL_CELEBRATION_MS = 2500;
