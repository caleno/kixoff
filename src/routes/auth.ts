// ===== Auth Routes — Cloduron SSO + JWT =====

import { Router } from 'express';
import { generateToken, generateRefreshToken } from '../security/auth.js';
import { logger } from '../utils/logger.js';

const router = Router();

// POST /api/auth/cloduron — Exchange Cloduron SSO code for KIXoff JWT
router.post('/cloduron', async (req, res) => {
  const { ssoCode } = req.body;

  if (!ssoCode) {
    return res.status(400).json({ error: 'Missing ssoCode' });
  }

  try {
    // TODO: Exchange ssoCode with Cloduron SSO server
    // For now, mock the exchange
    const playerData = {
      playerId: 'mock-player-id',
      username: 'Player_' + Math.floor(Math.random() * 9999),
      rating: 1500,
    };

    const token = generateToken(playerData);
    const refreshToken = generateRefreshToken(playerData);

    logger.info(`Player ${playerData.playerId} authenticated via Cloduron SSO`);

    res.json({ token, refreshToken, player: playerData });
  } catch (err) {
    logger.error('SSO exchange failed', err);
    res.status(401).json({ error: 'SSO authentication failed' });
  }
});

// POST /api/auth/refresh — Refresh JWT token
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Missing refreshToken' });
  }

  try {
    // TODO: Verify refresh token
    // For now, return mock
    const playerData = {
      playerId: 'mock-player-id',
      username: 'Player_1234',
      rating: 1500,
    };

    const newToken = generateToken(playerData);
    res.json({ token: newToken });
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

export default router;
