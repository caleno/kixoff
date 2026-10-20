import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { gameLoop } from './game/loop.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

gameLoop({ tick_step() {}, getSnapshot: () => ({ tick: 0, timestamp: Date.now(), phase: 'running', score: { home: 0, away: 0 }, ball: { x: 0, y: 0, vx: 0, vy: 0, ownerId: null }, players: [], lastEvent: null }) } as any, (snapshot) => io.emit('snapshot', snapshot));

app.get('/health', (_req, res) => res.json({ ok: true }));
server.listen(process.env.PORT ?? 3000);
