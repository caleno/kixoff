// ===== KIXoff Socket Authentication (Sentinel) =====

import type { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export interface JwtPayload {
  playerId: string;
  username: string;
  iat?: number;
  exp?: number;
}

export async function authenticateSocket(
  socket: Socket,
  next: (err?: Error) => void,
): Promise<void> {
  try {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      return next(new Error('No authentication token provided'));
    }

    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    socket.data.playerId = payload.playerId;
    socket.data.username = payload.username;

    logger.info(`Socket authenticated: ${payload.playerId} (${payload.username})`);
    next();
  } catch (err) {
    logger.warn(`Socket authentication failed: ${(err as Error).message}`);
    next(new Error('Authentication failed'));
  }
}

export function generateToken(payload: { playerId: string; username: string }): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}
