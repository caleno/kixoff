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
const io = new SocketServer(server, { cors: { origin: '*' } });

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/player', playerRoutes);
app.get('/health', (_req, res) => res.json({ ok: true }));

io.use(authenticateSocket as any);
io.on('connection', (socket) => { matchmakingService.handleSocket(socket, io); });

gameLoop.start(io as any);
const PORT = parseInt(process.env.PORT || '3000', 10);
server.listen(PORT, () => logger.info(`KIXoff server running on port ${PORT}`));
