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
  cors: { origin: '*' },
});

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/healthz', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/player', playerRoutes);

io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  const user = authenticateSocket(token);
  if (!user) return next(new Error('unauthorized'));
  socket.data.user = user;
  next();
});

io.on('connection', (socket) => {
  socket.on('matchmaking:join', () => matchmakingService.join(socket.id));
  socket.on('matchmaking:leave', () => matchmakingService.leave(socket.id));
  socket.on('game:input', (packet) => gameLoop.queueInput(packet.playerId, packet));
});

gameLoop.start(io);

const PORT = parseInt(process.env.PORT || '3000', 10);
server.listen(PORT, () => logger.info(`KIXoff server running on port ${PORT}`));
