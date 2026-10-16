import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { Server as SocketServer } from 'socket.io';
import { gameLoop } from './game/loop.js';
import { matchmakingService } from './game/matchmaking.js';
import authRoutes from './routes/auth.js';
import playerRoutes from './routes/player.js';
import { authenticateSocket } from './security/auth.js';
import { logger } from './utils/logger.js';

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:5173', methods: ['GET', 'POST'] },
});

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/player', playerRoutes);
app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

io.use(authenticateSocket);

io.on('connection', (socket) => {
  logger.info(`Player connected: ${socket.data.playerId}`);

  socket.on('queue:join', (data) => {
    matchmakingService.joinQueue(socket.data.playerId, data.rating);
  });

  socket.on('queue:leave', () => {
    matchmakingService.leaveQueue(socket.data.playerId);
  });

  socket.on('player:input', (input) => {
    gameLoop.handleInput(socket.data.playerId, input);
  });

  socket.on('disconnect', () => {
    logger.info(`Player disconnected: ${socket.data.playerId}`);
    matchmakingService.leaveQueue(socket.data.playerId);
    gameLoop.handleDisconnect(socket.data.playerId);
  });
});

gameLoop.start(io);

const PORT = parseInt(process.env.PORT || '3000', 10);
server.listen(PORT, () => {
  logger.info(`KIXoff server running on port ${PORT}`);
});