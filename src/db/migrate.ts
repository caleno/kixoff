// ===== Database Migrations =====

import { query } from './pool.js';
import { logger } from '../utils/logger.js';

const MIGRATIONS = [
  {
    name: '001_create_players',
    sql: `
      CREATE TABLE IF NOT EXISTS players (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cloduron_id VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(32) NOT NULL,
        rating INTEGER NOT NULL DEFAULT 1500,
        rating_deviation REAL NOT NULL DEFAULT 350,
        rating_volatility REAL NOT NULL DEFAULT 0.06,
        level INTEGER NOT NULL DEFAULT 1,
        xp INTEGER NOT NULL DEFAULT 0,
        kredits INTEGER NOT NULL DEFAULT 0,
        gems INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
  },
  {
    name: '002_create_matches',
    sql: `
      CREATE TABLE IF NOT EXISTS matches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        season_id INTEGER NOT NULL,
        home_score INTEGER NOT NULL DEFAULT 0,
        away_score INTEGER NOT NULL DEFAULT 0,
        winner_team VARCHAR(10),
        duration_ms INTEGER NOT NULL,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ended_at TIMESTAMPTZ
      );
    `,
  },
  {
    name: '003_create_match_players',
    sql: `
      CREATE TABLE IF NOT EXISTS match_players (
        match_id UUID NOT NULL REFERENCES matches(id),
        player_id UUID NOT NULL REFERENCES players(id),
        team VARCHAR(10) NOT NULL,
        goals INTEGER NOT NULL DEFAULT 0,
        assists INTEGER NOT NULL DEFAULT 0,
        saves INTEGER NOT NULL DEFAULT 0,
        tackles INTEGER NOT NULL DEFAULT 0,
        rating_change REAL NOT NULL DEFAULT 0,
        PRIMARY KEY (match_id, player_id)
      );
    `,
  },
  {
    name: '004_create_cosmetics',
    sql: `
      CREATE TABLE IF NOT EXISTS cosmetics (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        category VARCHAR(32) NOT NULL,
        rarity VARCHAR(32) NOT NULL,
        price_kredits INTEGER,
        price_gems INTEGER,
        asset_path VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS player_cosmetics (
        player_id UUID NOT NULL REFERENCES players(id),
        cosmetic_id VARCHAR(64) NOT NULL REFERENCES cosmetics(id),
        acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (player_id, cosmetic_id)
      );
    `,
  },
  {
    name: '005_create_seasons',
    sql: `
      CREATE TABLE IF NOT EXISTS seasons (
        id SERIAL PRIMARY KEY,
        name VARCHAR(64) NOT NULL,
        start_date TIMESTAMPTZ NOT NULL,
        end_date TIMESTAMPTZ NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT false
      );
    `,
  },
];

async function migrate(): Promise<void> {
  logger.info('Running database migrations...');

  for (const migration of MIGRATIONS) {
    try {
      await query(migration.sql);
      logger.info(`Migration ${migration.name} applied`);
    } catch (err) {
      logger.error(`Migration ${migration.name} failed`, err);
      throw err;
    }
  }

  logger.info('All migrations completed successfully');
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error('Migration failed', err);
    process.exit(1);
  });
