import { Router, Request, Response } from 'express';

const router = Router();

// ==================== PLAYER API ROUTES ====================

// GET /api/player/profile
router.get('/profile', (req: Request, res: Response) => {
  // TODO: Fetch from PostgreSQL
  res.json({
    playerId: 'demo-player',
    username: 'KIXoffPlayer',
    level: 1,
    xp: 0,
    rank: 'Bronze III',
    rating: 1500,
    cosmetics: {
      skin: 'default',
      color: '#00F0FF',
      trail: 'none',
    },
  });
});

// GET /api/season/progress
router.get('/season/progress', (req: Request, res: Response) => {
  // TODO: Fetch from PostgreSQL
  res.json({
    seasonId: 1,
    tier: 1,
    xpInTier: 0,
    xpForNextTier: 1000,
    premiumPass: false,
  });
});

// PUT /api/garage/equip
router.put('/garage/equip', (req: Request, res: Response) => {
  const { slot, itemId } = req.body;
  // TODO: Validate and persist to PostgreSQL
  res.json({
    success: true,
    equipped: { slot, itemId },
  });
});

export default router;
