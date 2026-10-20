import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { GameLoop } from './game/loop.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const gameLoop = new GameLoop(
  'bootstrap-match',
  [],
  (snapshot) => io.emit('snapshot', snapshot),
  () => undefined
);

gameLoop.start();

app.get('/health', (_req, res) => res.json({ ok: true }));
server.listen(process.env.PORT ?? 3000);
