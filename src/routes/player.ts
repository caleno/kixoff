// ===== Player Routes — Profile, Stats, Inventory =====

import { Router } from 'express';

const router = Router();

// GET /api/player/:id — Get player profile
router.get('/:id', (req, res) => {
  // TODO: Fetch from PostgreSQL
  res.json({
    id: req.params.id,
    username: 'Player_' + req.params.id.slice(-4),
    rating: 1500,
    level: 1,
    xp: 0,
    kredits: 0,
    gems: 0,
    stats: {
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      goals: 0,
      assists: 0,
      saves: 0,
      tackles: 0,
    },
    cosmetics: {
      skin: 'default',
      trail: 'none',
      goalEffect: 'none',
      emotes: [],
    },
  });
});

// GET /api/player/:id/stats — Get player match stats
router.get('/:id/stats', (req, res) => {
  res.json({
    rating: 1500,
    ratingHistory: [],
    winRate: 0,
    matchesPlayed: 0,
    goalsPerMatch: 0,
    assistsPerMatch: 0,
  });
});

// GET /api/player/:id/inventory — Get cosmetic inventory
router.get('/:id/inventory', (req, res) => {
  res.json({
    owned: ['default'],
    equipped: {
      skin: 'default',
      trail: 'none',
      goalEffect: 'none',
    },
  });
});

// POST /api/player/:id/equip — Equip a cosmetic item
router.post('/:id/equip', (req, res) => {
  const { slot, itemId } = req.body;
  // TODO: Validate ownership and update DB
  res.json({ success: true, equipped: { [slot]: itemId } });
});

export default router;
