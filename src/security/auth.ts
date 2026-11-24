// ===== Auth — Cloduron SSO + JWT =====

import jwt, { type JwtPayload } from 'jsonwebtoken';
import type { NextFunction } from 'express';
import type { Socket } from 'socket.io';

export interface PlayerTokenData {
  playerId: string;
  username: string;
  rating: number;
}

const isProd = process.env.NODE_ENV === 'production';

if (isProd && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

const SECRET = process.env.JWT_SECRET ?? 'dev-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? `${SECRET}-refresh`;
const ACCESS_EXPIRES_IN = '1h';
const REFRESH_EXPIRES_IN = '7d';

/** Sign an access token for a player. */
export function generateToken(player: PlayerTokenData): string {
  return jwt.sign(
    { sub: player.playerId, username: player.username, rating: player.rating },
    SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

/** Sign a refresh token for a player. */
export function generateRefreshToken(player: PlayerTokenData): string {
  return jwt.sign({ sub: player.playerId, type: 'refresh' }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });
}

/** Back-compat alias for signToken-style payloads. */
export function signToken(payload: string): string {
  return generateToken({
    playerId: payload,
    username: 'unknown',
    rating: 1500,
  });
}

/**
 * Verify a token, returning a validated PlayerTokenData.
 * Pins HS256, validates that `sub` exists, and rejects refresh-type
 * tokens masquerading as access tokens.
 */
export function verifyToken(token: string): PlayerTokenData | null {
  try {
    const decoded = jwt.verify(token, SECRET, {
      algorithms: ['HS256'],
    }) as JwtPayload;

    if (
      typeof decoded !== 'object' ||
      typeof decoded.sub !== 'string' ||
      decoded.sub.length === 0 ||
      decoded.type === 'refresh'
    ) {
      return null;
    }

    return {
      playerId: decoded.sub,
      username: typeof decoded.username === 'string' ? decoded.username : 'unknown',
      rating: typeof decoded.rating === 'number' ? decoded.rating : 1500,
    };
  } catch {
    return null;
  }
}

/** Express middleware guarding API routes behind a valid bearer token. */
export function requireAuth(req: import('express').Request, res: import('express').Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

  const player = token ? verifyToken(token) : null;
  if (!player) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  req.player = player;
  next();
}

/** Socket.IO handshake authentication middleware. */
export function authenticateSocket(socket: Socket, next: (err?: Error) => void): void {
  const token = socket.handshake.auth?.token as string | undefined;
  const player = token ? verifyToken(token) : null;

  if (!player) {
    next(new Error('unauthorized'));
    return;
  }

  socket.data.player = player;
  socket.data.playerId = player.playerId;
  next();
}
