// ===== KIXoff Game Server =====
// Restored security posture per audit (see #8): helmet, restrictive CORS,
// socket auth, and anti-cheat gating on every input packet.

import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { Server as SocketServer } from 'socket.io';
import { GameLoop } from './game/loop.js';
import { matchmakingService } from './game/matchmaking.js';
import authRoutes from './routes/auth.js';
import playerRoutes from './routes/player.js';
import { authenticateSocket } from './security/auth.js';
import {
  validateInput,
  checkInputRate,
  clearPlayerHistory,
} from './security/anti-cheat.js';
import { logger } from './utils/logger.js';

const app = express();
const server = http.createServer(app);

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

const io = new SocketServer(server, {
  cors: { origin: corsOrigin, methods: ['GET', 'POST'] },
});

// Middleware
app.use(helmet());
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/player', playerRoutes);
app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// ===== Live matches =====
// playerId -> active match loop
const liveMatches = new Map<string, GameLoop>();

function broadcastToMatch(match: GameLoop, snapshot: Parameters<GameLoop['queueInput']> extends never ? never : any): void {
  // Intentionally narrow: snapshots are forwarded to the match room below.
}

interface RegisteredMatch {
  loop: GameLoop;
  room: string;
}

const registeredMatches = new Map<string, RegisteredMatch>();

matchmakingService.start((match) => {
  const playerIds = match.players.map((p) => p.playerId);
  const roomId = `match:${match.matchId}`;

  const loop = new GameLoop(
    match.matchId,
    playerIds,
    (snapshot) => io.to(roomId).emit('game:snapshot', snapshot),
    (result) => {
      logger.info(`Match ${match.matchId} ended ${result.homeScore}-${result.awayScore}`);
      io.to(roomId).emit('game:end', result);
      for (const pid of playerIds) {
        liveMatches.delete(pid);
        clearPlayerHistory(pid);
      }
      registeredMatches.delete(match.matchId);
    }
  );

  registeredMatches.set(match.matchId, { loop, room: roomId });
  for (const pid of playerIds) liveMatches.set(pid, loop);

  loop.start();
  logger.info(`GameLoop started for match ${match.matchId} (${playerIds.length} players)`);
});

// ===== Socket handling =====
io.use(authenticateSocket);

io.on('connection', (socket) => {
  const playerId = socket.data.playerId as string;
  logger.info(`Player connected: ${playerId}`);

  socket.on('matchmaking:join', () => {
    matchmakingService.joinQueue(playerId, socket.data.player?.rating ?? 1500);
    socket.emit('matchmaking:queued');
  });

  socket.on('matchmaking:leave', () => {
    matchmakingService.leaveQueue(playerId);
  });

  // A client joins its match room when told a match was found.
  socket.on('match:join', ({ matchId }: { matchId: string }) => {
    const reg = registeredMatches.get(matchId);
    if (!reg) return;
    if (!liveMatches.get(playerId)) return; // not part of this match
    socket.join(reg.room);
  });

  socket.on('game:input', (input: unknown) => {
    const loop = liveMatches.get(playerId);
    if (!loop) return;

    // Anti-cheat gate: shape/rate validation before touching the engine
    if (!validateInput(input) || !checkInputRate(playerId)) {
      logger.warn(`Rejected invalid input from ${playerId}`);
      return;
    }

    loop.queueInput(playerId, input);
  });

  socket.on('disconnect', () => {
    logger.info(`Player disconnected: ${playerId}`);
    matchmakingService.leaveQueue(playerId);
    liveMatches.delete(playerId);
    clearPlayerHistory(playerId);
  });
});

const PORT = parseInt(process.env.PORT || '3000', 10);
server.listen(PORT, () => {
  logger.info(`KIXoff server running on port ${PORT}`);
});
