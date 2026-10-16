import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { gameLoop } from './game/loop.js';
import { authenticateSocket } from './security/auth.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.use((socket, next) => {
  authenticateSocket(socket.handshake.auth?.token as string | undefined);
  next();
});

io.on('connection', (socket) => {
  socket.emit('state', gameLoop.getState());
});

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/', (_req, res) => res.json({ status: 'kixoff online' }));

const port = Number(process.env.PORT || 3000);
server.listen(port, () => console.log(`KIXoff listening on ${port}`));
