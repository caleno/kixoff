// ===== Sentinel: Socket Authentication =====

import type { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export interface JwtPayload {
  playerId: string;
  username: string;
  rating: number;
}

export function authenticateSocket(socket: Socket, next: (err?: Error) => void): void {
  const token = socket.handshake.auth?.token as string | undefined;

  if (!token) {
    return next(new Error('No authentication token provided'));
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    socket.data.playerId = payload.playerId;
    socket.data.username = payload.username;
    socket.data.rating = payload.rating;
    next();
  } catch (err) {
    logger.warn(`Socket auth failed: ${(err as Error).message}`);
    next(new Error('Invalid or expired token'));
  }
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
}

export function generateRefreshToken(payload: JwtPayload): string {
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET || 'dev-refresh-secret';
  return jwt.sign(payload, refreshSecret, { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' });
}
