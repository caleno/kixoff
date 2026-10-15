// ===== Sentinel: Socket Authentication =====

import type { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';

export interface AuthPayload {
  playerId: string;
  username: string;
  rating: number;
}

export function authenticateSocket(socket: Socket): Promise<AuthPayload> {
  return new Promise((resolve, reject) => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      logger.warn('Socket connection rejected: no token provided', { socketId: socket.id });
      reject(new Error('No authentication token provided'));
      return;
    }

    const secret = process.env.JWT_SECRET || 'kixoff-dev-secret';

    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        logger.warn('Socket connection rejected: invalid token', { socketId: socket.id, error: err.message });
        reject(new Error('Invalid authentication token'));
        return;
      }

      const payload = decoded as AuthPayload;
      if (!payload.playerId || !payload.username) {
        logger.warn('Socket connection rejected: malformed payload', { socketId: socket.id });
        reject(new Error('Malformed authentication payload'));
        return;
      }

      logger.info('Socket authenticated', { socketId: socket.id, playerId: payload.playerId });
      resolve(payload);
    });
  });
}
