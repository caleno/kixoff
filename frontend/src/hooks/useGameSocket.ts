import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

export interface ServerSnapshot {
  tick: number;
  timestamp: number;
  ball: { x: number; y: number; vx: number; vy: number };
  players: Array<{
    id: string;
    x: number;
    y: number;
    team: 'home' | 'away';
    name: string;
  }>;
  score: { home: number; away: number };
  timeRemaining: number;
  phase: string;
}

export function useGameSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SERVER_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected to game server');
    });

    socket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendInput = useCallback((input: {
    dx: number;
    dy: number;
    kick: boolean;
  }) => {
    socketRef.current?.emit('player:input', {
      ...input,
      timestamp: Date.now(),
    });
  }, []);

  const onSnapshot = useCallback((cb: (snapshot: ServerSnapshot) => void) => {
    if (!socketRef.current) return;
    socketRef.current.on('game:snapshot', cb);
  }, []);

  const onGoal = useCallback((cb: (team: 'home' | 'away') => void) => {
    if (!socketRef.current) return;
    socketRef.current.on('game:goal', cb);
  }, []);

  const onMatchEnd = useCallback((cb: (result: { score: { home: number; away: number } }) => void) => {
    if (!socketRef.current) return;
    socketRef.current.on('game:end', cb);
  }, []);

  const joinQueue = useCallback(() => {
    socketRef.current?.emit('matchmaking:join');
  }, []);

  const leaveQueue = useCallback(() => {
    socketRef.current?.emit('matchmaking:leave');
  }, []);

  return { sendInput, onSnapshot, onGoal, onMatchEnd, joinQueue, leaveQueue, socket: socketRef };
}
