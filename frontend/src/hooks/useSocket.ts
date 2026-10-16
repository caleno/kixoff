import { useState, useEffect, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

interface ServerSnapshot {
  tick: number;
  timestamp: number;
  ball: { x: number; y: number; vx: number; vy: number };
  players: Array<{
    id: string;
    name: string;
    team: 'home' | 'away';
    x: number;
    y: number;
    vx: number;
    vy: number;
    hasBall: boolean;
    kicking: boolean;
  }>;
  score: { home: number; away: number };
  timeRemaining: number;
  state: string;
}

interface MatchmakingUpdate {
  status: 'searching' | 'found' | 'cancelled' | 'error';
  playersFound?: number;
  totalPlayers?: number;
  estimatedWait?: number;
  matchId?: string;
  message?: string;
}

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const [snapshot, setSnapshot] = useState<ServerSnapshot | null>(null);
  const [mmUpdate, setMmUpdate] = useState<MatchmakingUpdate | null>(null);
  const [latency, setLatency] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback((token: string) => {
    if (socketRef.current?.connected) return;
    const socket = io(SERVER_URL, { auth: { token }, transports: ['websocket'] });
    socketRef.current = socket;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('snapshot', (snap: ServerSnapshot) => setSnapshot(snap));
    socket.on('matchmaking:update', (update: MatchmakingUpdate) => setMmUpdate(update));
    socket.on('latency', (ms: number) => setLatency(ms));
  }, []);

  const sendInput = useCallback((input: { moveX: number; moveY: number; kick?: boolean }) => {
    socketRef.current?.emit('player:input', input);
  }, []);

  const queueMatchmaking = useCallback((rating: number) => {
    socketRef.current?.emit('queue:join', { rating });
  }, []);

  const cancelMatchmaking = useCallback(() => {
    socketRef.current?.emit('queue:leave');
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setConnected(false);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (socketRef.current?.connected) socketRef.current.emit('ping', Date.now());
    }, 2000);
    return () => {
      clearInterval(interval);
      disconnect();
    };
  }, [disconnect]);

  return { connected, snapshot, mmUpdate, latency, connect, disconnect, sendInput, queueMatchmaking, cancelMatchmaking };
}
