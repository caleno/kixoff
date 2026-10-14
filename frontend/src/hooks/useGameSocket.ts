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
  state: string;
}

export interface InputState {
  dx: number;
  dy: number;
  kick: boolean;
}

export function useGameSocket(matchId: string) {
  const socketRef = useRef<Socket | null>(null);
  const inputSeq = useRef(0);

  useEffect(() => {
    const socket = io(`${SERVER_URL}/match`, {
      query: { matchId },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected to match', matchId);
    });

    socket.on('disconnect', () => {
      console.warn('[Socket] Disconnected from match');
    });

    socket.on('error', (err: string) => {
      console.error('[Socket] Error:', err);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [matchId]);

  const sendInput = useCallback((input: InputState) => {
    if (!socketRef.current?.connected) return;
    inputSeq.current++;
    socketRef.current.emit('input', {
      seq: inputSeq.current,
      dx: input.dx,
      dy: input.dy,
      kick: input.kick,
      timestamp: Date.now(),
    });
  }, []);

  const onSnapshot = useCallback((cb: (snapshot: ServerSnapshot) => void) => {
    if (!socketRef.current) return;
    socketRef.current.on('snapshot', cb);
  }, []);

  const onMatchEnd = useCallback((cb: (result: any) => void) => {
    if (!socketRef.current) return;
    socketRef.current.on('match:end', cb);
  }, []);

  return { sendInput, onSnapshot, onMatchEnd };
}
