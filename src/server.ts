import express, { Request, Response } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import { GameEngine } from './game/engine';
import { AntiCheat } from './security/anti-cheat-v2';
import { GameState, Team } from './game/state';
import { MatchmakingQueue } from './game/matchmaking';
import authRoutes from './routes/auth';
import playerRoutes from './routes/player';

dotenv.config();

// ═══════════════════════════════════════════════════════════
// KIXoff Game Server — Node (Backend)
// Server-authoritative 60Hz tick, 20Hz snapshot broadcast
// ═══════════════════════════════════════════════════════════

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN || '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/player', playerRoutes);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
});

// ═══════════════════════════════════════════════════════════
// Matchmaking
// ═══════════════════════════════════════════════════════════

const matchmaking = new MatchmakingQueue();

// ═══════════════════════════════════════════════════════════
// Active Game Rooms
// ═══════════════════════════════════════════════════════════

interface GameRoom {
  id: string;
  engine: GameEngine;
  antiCheat: AntiCheat;
  players: Map<string, { socket: Socket; team: Team; name: string }>;
  tickInterval: NodeJS.Timeout | null;
  snapshotInterval: NodeJS.Timeout | null;
}

const rooms: Map<string, GameRoom> = new Map();
let roomCounter = 0;

function createRoom(playerSlots: { socket: Socket; playerId: string; name: string; rating: number }[]): string {
  const roomId = `room-${++roomCounter}`;
  const engine = new GameEngine(roomId);
  const antiCheat = new AntiCheat();
  const players = new Map<string, { socket: Socket; team: Team; name: string }>();

  // Assign teams: first 3 = HOME, last 3 = AWAY
  playerSlots.forEach((slot, i) => {
    const team: Team = i < 3 ? 'HOME' : 'AWAY';
    engine.addPlayer(slot.playerId, team, slot.name);
    players.set(slot.playerId, { socket: slot.socket, team, name: slot.name });
  });

  const room: GameRoom = { id: roomId, engine, antiCheat, players, tickInterval: null, snapshotInterval: null };
  rooms.set(roomId, room);

  // Notify all players
  players.forEach(({ socket }) => {
    socket.emit('match:found', { roomId, players: Array.from(players.entries()).map(([id, p]) => ({ id, name: p.name, team: p.team })) });
    socket.join(roomId);
  });

  // Start 60Hz tick loop
  const TICK_RATE = 60;
  const TICK_MS = 1000 / TICK_RATE;
  room.tickInterval = setInterval(() => {
    engine.tick(TICK_MS / 1000);
  }, TICK_MS);

  // Start 20Hz snapshot broadcast
  const SNAPSHOT_RATE = 20;
  const SNAPSHOT_MS = 1000 / SNAPSHOT_RATE;
  room.snapshotInterval = setInterval(() => {
    const snapshot = engine.getSnapshot();
    io.to(roomId).emit('game:snapshot', snapshot);
  }, SNAPSHOT_MS);

  // Match end handler (3 minutes = 180000ms)
  setTimeout(() => {
    endMatch(roomId);
  }, 180000);

  console.log(`[KIXoff] Room ${roomId} created with ${players.size} players`);
  return roomId;
}

function endMatch(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  const result = engine_getResult(room.engine);
  io.to(roomId).emit('match:end', result);

  if (room.tickInterval) clearInterval(room.tickInterval);
  if (room.snapshotInterval) clearInterval(room.snapshotInterval);

  rooms.delete(roomId);
  console.log(`[KIXoff] Room ${roomId} ended. Score: ${result.scoreHome}-${result.scoreAway}`);
}

function engine_getResult(engine: GameEngine) {
  const state = engine.getState();
  return {
    scoreHome: state.scoreHome,
    scoreAway: state.scoreAway,
    winner: state.scoreHome > state.scoreAway ? 'HOME' : state.scoreHome < state.scoreAway ? 'AWAY' : 'DRAW',
    duration: 180000,
  };
}

function removePlayerFromRoom(roomId: string, playerId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.engine.removePlayer(playerId);
  room.players.delete(playerId);

  if (room.players.size === 0) {
    if (room.tickInterval) clearInterval(room.tickInterval);
    if (room.snapshotInterval) clearInterval(room.snapshotInterval);
    rooms.delete(roomId);
    console.log(`[KIXoff] Room ${roomId} emptied and cleaned up`);
  }
}

// ═══════════════════════════════════════════════════════════
// Socket.io Connection Handler
// ═══════════════════════════════════════════════════════════

io.on('connection', (socket: Socket) => {
  console.log(`[KIXoff] Player connected: ${socket.id}`);

  let currentPlayerId: string | null = null;
  let currentRoomId: string | null = null;

  // Authenticate
n  socket.on('auth', (data: { playerId: string; token: string }) => {
    // TODO: Verify token via Cloduron SSO
    currentPlayerId = data.playerId;
    socket.emit('auth:ok', { playerId: data.playerId });
  });

  // Matchmaking
  socket.on('matchmaking:queue', (data: { playerId: string; rating: number; name: string }) => {
    if (!currentPlayerId) return;
    matchmaking.addPlayer({ playerId: data.playerId, rating: data.rating, name: data.name, socket });
    socket.emit('matchmaking:status', { status: 'queued', position: matchmaking.queueLength() });

    // Check if we have enough players (6 for 3v3)
    if (matchmaking.queueLength() >= 6) {
      const matched = matchmaking.matchPlayers(6);
      if (matched) {
        const roomId = createRoom(matched.map(p => ({ socket: p.socket, playerId: p.playerId, name: p.name, rating: p.rating })));
        matched.forEach(p => {
          p.socket.emit('matchmaking:found', { roomId });
        });
      }
    }
  });

  socket.on('matchmaking:cancel', () => {
    if (currentPlayerId) {
      matchmaking.removePlayer(currentPlayerId);
      socket.emit('matchmaking:status', { status: 'cancelled' });
    }
  });

  // Game input
  socket.on('game:input', (data: { seq: number; dx: number; dy: number; action: string; timestamp: number }) => {
    if (!currentPlayerId || !currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    // Anti-cheat validation
    const violation = room.antiCheat.validateInput(currentPlayerId, data);
    if (violation) {
      if (violation === 'BANNED') {
        socket.emit('kick', { reason: 'Anti-cheat violation: ' + violation });
        socket.disconnect();
        removePlayerFromRoom(currentRoomId, currentPlayerId);
        return;
      }
      // Log but don't kick for minor violations
      console.warn(`[AntiCheat] ${currentPlayerId}: ${violation}`);
      return;
    }

    // Feed validated input to engine
    room.engine.processInput(currentPlayerId, data);
  });

  // Match end → post-match screen handled by client
  socket.on('match:leave', () => {
    if (currentPlayerId && currentRoomId) {
      removePlayerFromRoom(currentRoomId, currentPlayerId);
      currentRoomId = null;
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`[KIXoff] Player disconnected: ${socket.id}`);
    if (currentPlayerId) {
      matchmaking.removePlayer(currentPlayerId);
      if (currentRoomId) {
        removePlayerFromRoom(currentRoomId, currentPlayerId);
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════
// Start Server
// ═══════════════════════════════════════════════════════════

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`╔══════════════════════════════════════════╗`);
  console.log(`║  KIXoff Game Server v0.1.0               ║`);
  console.log(`║  Listening on port ${PORT}                  ║`);
  console.log(`║  Tick: 60Hz | Snapshot: 20Hz             ║`);
  console.log(`╚══════════════════════════════════════════╝`);
});

export { app, io, server };
