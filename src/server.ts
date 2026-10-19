import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { gameLoop } from './game/loop.js';
import { authenticateSocket } from './security/auth.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  if (!authenticateSocket(socket)) {
    socket.disconnect(true);
    return;
  }
  socket.on('input', () => undefined);
});

gameLoop({ step: () => ({ tick: 0, timestamp: Date.now(), state: { tick: 0, players: [], ball: { x: 0, y: 0 }, score: { home: 0, away: 0 } } }) } as any, (snapshot) => io.emit('snapshot', snapshot));

app.get('/health', (_req, res) => res.json({ ok: true }));
server.listen(process.env.PORT ?? 3000);
