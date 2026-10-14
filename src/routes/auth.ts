import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

// ==================== CLODURON SSO AUTH ====================

/**
 * Exchange Cloduron SSO token for a KIXoff JWT session token.
 * In production, this would validate the SSO token with Cloduron's auth service.
 */
router.post('/cloduron', (req: Request, res: Response) => {
  const { ssoToken, playerId } = req.body;

  if (!ssoToken || !playerId) {
    return res.status(400).json({ error: 'Missing ssoToken or playerId' });
  }

  // TODO: Validate ssoToken with Cloduron auth service
  // const isValid = await validateCloduronSSO(ssoToken);
  // if (!isValid) return res.status(401).json({ error: 'Invalid SSO token' });

  // Generate short-lived JWT
  const jwtSecret = process.env.JWT_SECRET || 'dev_secret_change_me';
  const token = jwt.sign(
    { playerId, iat: Date.now() },
    jwtSecret,
    { expiresIn: '15m' }
  );

  // Generate refresh token (longer lived)
  const refreshToken = jwt.sign(
    { playerId, type: 'refresh' },
    jwtSecret,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    refreshToken,
    expiresIn: 900, // 15 minutes in seconds
  });
});

/**
 * Refresh an expired JWT using a valid refresh token.
 */
router.post('/refresh', (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Missing refreshToken' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'dev_secret_change_me';
    const decoded = jwt.verify(refreshToken, jwtSecret) as any;

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const newToken = jwt.sign(
      { playerId: decoded.playerId, iat: Date.now() },
      jwtSecret,
      { expiresIn: '15m' }
    );

    res.json({ token: newToken, expiresIn: 900 });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

export default router;
