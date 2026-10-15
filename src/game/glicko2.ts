// ===== Glicko-2 Rating System =====
// Implementation of Professor Mark Glickman's Glicko-2 rating system
// http://www.glicko.net/glicko/glicko2.pdf

// System constants
const TAU = 0.5; // Constraint on volatility
const RATING_PERIOD = 30; // Games per rating period
const DEFAULT_RATING = 1500;
const DEFAULT_RD = 350;
const DEFAULT_VOL = 0.06;

export interface Glicko2Player {
  rating: number;
  rd: number; // Rating deviation
  vol: number; // Volatility
}

export interface Glicko2Match {
  opponent: Glicko2Player;
  score: number; // 1 = win, 0.5 = draw, 0 = loss
}

// Convert Glicko-2 scale
function g(rd: number): number {
  return 1 / Math.sqrt(1 + (3 * rd * rd) / (Math.PI * Math.PI));
}

function E(player: Glicko2Player, opponent: Glicko2Player): number {
  return 1 / (1 + Math.exp(-g(opponent.rd) * (player.rating - opponent.rating)));
}

// Compute new rating, RD, and volatility
export function updateRating(player: Glicko2Player, matches: Glicko2Match[]): Glicko2Player {
  if (matches.length === 0) {
    // Inactivity: increase RD
    const newRD = Math.sqrt(player.rd * player.rd + player.vol * player.vol);
    return { rating: player.rating, rd: Math.min(newRD, DEFAULT_RD), vol: player.vol };
  }

  // Step 3: Compute quantity v
  let vSum = 0;
  let deltaSum = 0;
  for (const m of matches) {
    const gVal = g(m.opponent.rd);
    const eVal = 1 / (1 + Math.exp(-gVal * (player.rating - m.opponent.rating)));
    vSum += gVal * gVal * eVal * (1 - eVal);
    deltaSum += gVal * (m.score - eVal);
  }
  const v = 1 / vSum;
  const delta = v * deltaSum;

  // Step 4: Compute new volatility
  const a = Math.log(player.vol * player.vol);
  const x0 = a;
  const x1 = Math.log(delta * delta - v + Math.sqrt((delta * delta - v) * (delta * delta - v) + 2 * a * v)) / 2;

  // Iterative procedure for volatility
  let x = x0;
  for (let i = 0; i 100; i++) {
    const expX = Math.exp(x);
    const d2 = delta * delta - v;
    const h0 = -(x - a) / (TAU * TAU) - expX * (d2 - expX) / (2 * (expX + v) * (expX + v));
    const h1 = -1 / (TAU * TAU) - expX * (expX * d2 - v * v) / ((expX + v) * (expX + v) * 2);
    const xNew = x - h0 / h1;
    if (Math.abs(xNew - x) < 0.000001) {
      x = xNew;
      break;
    }
    x = xNew;
  }
  const newVol = Math.exp(x / 2);

  // Step 5: Update rating and RD
  const newRD = Math.sqrt(1 / (1 / (player.rd * player.rd) + 1 / v));
  const newRating = player.rating + newRD * newRD * deltaSum;

  return {
    rating: Math.round(newRating),
    rd: Math.round(newRD),
    vol: newVol,
  };
}

// Create a new player with default values
export function createPlayer(): Glicko2Player {
  return {
    rating: DEFAULT_RATING,
    rd: DEFAULT_RD,
    vol: DEFAULT_VOL,
  };
}

// Get player's rating with confidence interval
export function getRatingWithConfidence(player: Glicko2Player): { lower: number; upper: number } {
  return {
    lower: Math.round(player.rating - 2 * player.rd),
    upper: Math.round(player.rating + 2 * player.rd),
  };
}
