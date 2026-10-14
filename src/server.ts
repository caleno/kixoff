import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { GameState } from './game/state';
import { validatePlayerAction } from './security/anti-cheat';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3000;

// ==================== API ROUTES ====================

// Basic health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'kixoff-server' });
});

// ==================== GAME ROOMS ====================

const activeRooms = new Map<string, GameState>();

// ==================== WEBSOCKET HANDLING ====================

io.on('connection', (socket) => {
  console.log(`[KIXoff] Player connected: ${socket.id}`);

  // Join a match room
  socket.on('join_match', (matchId: string) => {
    socket.join(matchId);
    console.log(`[KIXoff] Player ${socket.id} joined match ${matchId}`);
    
    if (!activeRooms.has(matchId)) {
      activeRooms.set(matchId, {
        matchId,
        players: [],
        ball: { position: { x: 0, y: 0, z: 0 }, velocity: { x: 0, y: 0, z: 0 }, spin: 0, ownerId: null },
        score: { home: 0, away: 0 },
        phase: 'countdown',
        timestamp: Date.now(),
      });
    }
    
    socket.emit('match_joined', activeRooms.get(matchId));
  });

  // Handle player input
  socket.on('player_action', (data: { matchId: string; action: any }) => {
    const room = activeRooms.get(data.matchId);
    if (!room) return;

    // Sentinel: Validate action server-side
    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;

    const validation = validatePlayerAction(data.action, player, room);
    if (validation === 'REJECT') {
      socket.emit('action_rejected', { reason: 'Invalid action' });
      return;
    }
    if (validation === 'FLAG') {
      console.warn(`[KIXoff] Suspicious activity from ${socket.id}`);
      // Flag for review - Sentinel handles logging
    }

    // Process valid action (game loop handles physics)
  });

  socket.on('disconnect', () => {
    console.log(`[KIXoff] Player disconnected: ${socket.id}`);
    // Remove player from any active rooms
    activeRooms.forEach((state, matchId) => {
      state.players = state.players.filter((p) => p.id !== socket.id);
      if (state.players.length === 0) {
        activeRooms.delete(matchId);
      }
    });
  });
});

// ==================== START SERVER ====================

server.listen(PORT, () => {
  console.log(`🚀 KIXoff server running on port ${PORT}`);
});
