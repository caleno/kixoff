// ===== KIXoff Server — matchmaking + live matches =====
import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { GameLoop } from './game/loop.js';
import { matchmakingService } from './game/matchmaking.js';
import type { Snapshot, PlayerInput, GameEvent } from './game/state.js';
import { logger } from './utils/logger.js';

// ----- Frontend-friendly flat snapshot shape -----
interface FlatPlayerSnapshot {
  id: string;
  team: string;
  x: number;
  y: number;
  rot: number;
  stamina: number;
  hasBall: boolean;
  stunned: boolean;
}

interface FlatSnapshot {
  matchId: string;
  tick: number;
  timeRemaining: number;
  phase: Snapshot['phase'];
  homeScore: number;
  awayScore: number;
  ball: { x: number; y: number; vx: number; vy: number; ownerId: string | null };
  players: FlatPlayerSnapshot[];
  events: GameEvent[];
}

function toFlatSnapshot(s: Snapshot): FlatSnapshot {
  return {
    matchId: s.matchId,
    tick: s.tick,
    timeRemaining: s.timeRemaining,
    phase: s.phase,
    homeScore: s.score.home,
    awayScore: s.score.away,
    ball: {
      x: s.ball.position.x,
      y: s.ball.position.y,
      vx: s.ball.velocity.x,
      vy: s.ball.velocity.y,
      ownerId: s.ball.ownerId,
    },
    players: s.players.map((p) => ({
      id: p.id,
      team: p.team,
      x: p.position.x,
      y: p.position.y,
      rot: p.rotation,
      stamina: p.stamina,
      hasBall: p.hasBall,
      stunned: p.isStunned,
    })),
    events: s.events,
  };
}

// ----- Wiring -----
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } }); // TODO(#security): restrict origins

interface LiveMatch {
  loop: GameLoop;
  playerIds: string[];
  humanIds: Set<string>;
}

const liveMatches = new Map<string, LiveMatch>(); // matchId -> match
const playerMatch = new Map<string, string>(); // playerId -> matchId
const queuedSockets = new Map<string, { socketId: string; joinedAt: number }>(); // playerId -> socket while queued
const BOT_FILL_AFTER_MS = parseInt(process.env.MM_BOT_FILL_MS || '10000', 10);

function startMatch(matchId: string, playerIds: string[]): LiveMatch {
  const loop = new GameLoop(
    matchId,
    playerIds,
    (snapshot) => {
      io.to(matchId).emit('snapshot', toFlatSnapshot(snapshot));
    },
    ({ homeScore, awayScore }) => {
      io.to(matchId).emit('match_ended', { matchId, homeScore, awayScore });
      logger.info(`Match ${matchId} ended (${homeScore}-${awayScore})`);
      const match = liveMatches.get(matchId);
      if (match) {
        for (const pid of match.playerIds) playerMatch.delete(pid);
        liveMatches.delete(matchId);
      }
    }
  );

  const match: LiveMatch = {
    loop,
    playerIds,
    humanIds: new Set(playerIds.filter((pid) => !pid.startsWith('bot-'))),
  };
  liveMatches.set(matchId, match);
  for (const pid of playerIds) playerMatch.set(pid, matchId);
  loop.start();
  logger.info(`Match ${matchId} started with players: ${playerIds.join(', ')}`);
  return match;
}

// Real 6-player matches from the matchmaking service
matchmakingService.start(({ matchId, players }) => {
  const ids = players.map((p) => p.playerId);
  startMatch(matchId, ids);

  for (const p of players) {
    const queued = queuedSockets.get(p.playerId);
    queuedSockets.delete(p.playerId);
    const socket = queued ? io.sockets.sockets.get(queued.socketId) : undefined;
    if (socket) {
      socket.join(matchId);
      socket.emit('match_found', { matchId, players: ids });
    } else {
      // Human went offline mid-queue: mark for future bot substitution.
      // TODO(bot-substitution): replace offline humans with bots in liveMatches.
      const botId = `bot-${uuidv4().slice(0, 8)}`;
      void botId;
    }
  }
});

// Bot-fill: if a queued human waits too long, pair them with bots
setInterval(() => {
  const now = Date.now();
  for (const [playerId, entry] of queuedSockets) {
    if (now - entry.joinedAt < BOT_FILL_AFTER_MS) continue;
    matchmakingService.leaveQueue(playerId);
    queuedSockets.delete(playerId);
    const botCount = 5;
    const botIds = Array.from({ length: botCount }, () => `bot-${uuidv4().slice(0, 8)}`);
    const matchId = uuidv4();
    const ids = [playerId, ...botIds];
    startMatch(matchId, ids);
    const socket = io.sockets.sockets.get(entry.socketId);
    if (socket) {
      socket.join(matchId);
      socket.emit('match_found', { matchId, players: ids });
    }
    logger.info(`Bot-filled match ${matchId} for lone player ${playerId}`);
  }
}, 2000);

// ----- Socket handling -----
io.on('connection', (socket: Socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join_queue', ({ playerId, rating }: { playerId: string; rating?: number }) => {
    if (!playerId) return;
    if (playerMatch.has(playerId)) return; // already in a live match
    queuedSockets.set(playerId, { socketId: socket.id, joinedAt: Date.now() });
    matchmakingService.joinQueue(playerId, typeof rating === 'number' ? rating : 1500);
    socket.emit('queue_joined', { queueSize: matchmakingService.getQueueSize() });
  });

  socket.on('cancel_queue', ({ playerId }: { playerId: string }) => {
    queuedSockets.delete(playerId);
    matchmakingService.leaveQueue(playerId);
    socket.emit('queue_left');
  });

  socket.on(
    'input',
    ({ matchId, playerId, input }: { matchId: string; playerId: string; input: PlayerInput }) => {
      const match = liveMatches.get(matchId);
      if (!match || !input) return;
      if (playerMatch.get(playerId) !== matchId) return; // not a participant
      match.loop.queueInput(playerId, input);
    }
  );

  socket.on('disconnect', () => {
    // Remove from queue if waiting
    for (const [playerId, entry] of queuedSockets) {
      if (entry.socketId === socket.id) {
        queuedSockets.delete(playerId);
        matchmakingService.leaveQueue(playerId);
      }
    }
    // End matches whose human sockets are all gone
    for (const [matchId, match] of liveMatches) {
      const roomSize = io.sockets.adapter.rooms.get(matchId)?.size ?? 0;
      if (match.humanIds.size > 0 && roomSize === 0) {
        match.loop.stop();
        for (const pid of match.playerIds) playerMatch.delete(pid);
        liveMatches.delete(matchId);
        logger.info(`Match ${matchId} ended: all humans disconnected`);
      }
    }
  });
});

app.get('/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT ?? 3000;
server.listen(PORT, () => {
  logger.info(`KIXoff server listening on port ${PORT}`);
});
