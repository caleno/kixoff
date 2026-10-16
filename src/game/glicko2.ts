// ===== Glicko-2 Rating System =====
// Implementation of Professor Mark Glickman's Glicko-2 rating system
// http://www.glicko.net/glicko/glicko2.pdf

const TAU = 0.5; // System constant, constrains volatility change
const SCALE = 173.7178;
const EPSILON = 0.000001;

interface GlickoPlayer {
  rating: number;
  rd: number; // Rating deviation
  vol: number; // Volatility
}

interface GlickoMatch {
  opponent: GlickoPlayer;
  score: number; // 1 = win, 0 = loss, 0.5 = draw
}

function g(rd: number): number {
  return 1 / Math.sqrt(1 + 3 * (rd ** 2) / (Math.PI ** 2));
}

function E(rating: number, opponentRating: number, opponentRd: number): number {
  return 1 / (1 + Math.exp(-g(opponentRd) * (rating - opponentRating)));
}

export function calculateNewRating(
  player: GlickoPlayer,
  matches: GlickoMatch[]
): GlickoPlayer {
  if (matches.length === 0) {
    // Apply only volatility decay
    const newRd = Math.sqrt(player.rd ** 2 + player.vol ** 2);
    return { rating: player.rating, rd: newRd, vol: player.vol };
  }

  // Step 1: Convert to Glicko-2 scale
  const mu = (player.rating - 1500) / SCALE;
  const phi = player.rd / SCALE;
  const sigma = player.vol;

  // Step 2: Compute v (estimated variance)
  let vSum = 0;
  let deltaSum = 0;

  for (const match of matches) {
    const muJ = (match.opponent.rating - 1500) / SCALE;
    const phiJ = match.opponent.rd / SCALE;
    const gPhiJ = g(phiJ);
    const E_mu = 1 / (1 + Math.exp(-gPhiJ * (mu - muJ)));

    vSum += (gPhiJ ** 2) * E_mu * (1 - E_mu);
    deltaSum += gPhiJ * (match.score - E_mu);
  }

  const v = 1 / vSum;
  const delta = v * deltaSum;

  // Step 3: Update volatility using iterative algorithm
  let a = Math.log(sigma ** 2);
  let x0 = a;
  let x1: number;

  const f = (x: number): number => {
    const ex = Math.exp(x);
    const d2 = phi ** 2 + v + ex;
    return (x - a) / (TAU ** 2) - (ex * (delta ** 2 - phi ** 2 - v)) / (2 * d2 ** 2);
  };

  // Iterative solution
  if (delta ** 2 > phi ** 2 + v) {
    x0 = Math.log(delta ** 2 - phi ** 2 - v);
  } else {
    let lower = a;
    let upper = 0;
    while (f(lower) < 0) lower -= 0.1;
    while (f(upper) > 0) upper += 0.1;
    x0 = (lower + upper) / 2;
  }

  for (let i = 0; i < 100; i++) {
    const fx0 = f(x0);
    if (Math.abs(fx0) < EPSILON) break;
    const fPrimeX0 = (f(x0 + EPSILON) - f(x0 - EPSILON)) / (2 * EPSILON);
    x1 = x0 - fx0 / fPrimeX0;
    if (Math.abs(x1 - x0) < EPSILON) break;
    x0 = x1;
  }

  const newSigmaPrime = Math.exp(x0 / 2);

  // Step 4: Update rating deviation
  const phiStar = Math.sqrt(phi ** 2 + newSigmaPrime ** 2);
  const newPhi = 1 / Math.sqrt(1 / (phiStar ** 2) + 1 / v);

  // Step 5: Update rating
  const newMu = mu + newPhi ** 2 * deltaSum;

  // Step 6: Convert back to original scale
  const newRating = SCALE * newMu + 1500;
  const newRd = SCALE * newPhi;

  return {
    rating: Math.round(newRating),
    rd: Math.round(newRd * 100) / 100,
    vol: Math.round(newSigmaPrime * 10000) / 10000,
  };
}
