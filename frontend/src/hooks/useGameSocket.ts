import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

/**
 * useGameSocket — Real-time connection hook
 * Aura (UI) — KIXoff
 *
 * Manages Socket.io connection, sends inputs, receives snapshots
 */

interface ServerSnapshot {
  tick: number;
  timestamp: number;
  ball: { x: number; y: number; vx: number; vy: number };
  players: Array<{
    id: string;
    team: 'home' | 'away';
    name: string;
    x: number;
    y: number;
    hasBall: boolean;
    stamina: number;
  }>;
  score: { home: number; away: number };
  timeRemaining: number;
  state: string;
}

interface UseGameSocketOptions {
  serverUrl: string;
  token: string;
  matchId: string;
}

export function useGameSocket({ serverUrl, token, matchId }: UseGameSocketOptions) {
  const [connected, setConnected] = useState(false);
  const [snapshot, setSnapshot] = useState<ServerSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const seqRef = useRef(0);

  // Connect
  useEffect(() => {
    const socket = io(serverUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setError(null);
      socket.emit('join_match', { matchId, token });
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('connect_error', (err: Error) => {
      setError(err.message);
      setConnected(false);
    });

    socket.on('snapshot', (data: ServerSnapshot) => {
      setSnapshot(data);
    });

    socket.on('goal', (data: { team: string; score: { home: number; away: number } }) => {
      // Trigger UI celebration
      window.dispatchEvent(new CustomEvent('kixoff:goal', { detail: data }));
    });

    socket.on('match_end', (data: { score: { home: number; away: number } }) => {
      window.dispatchEvent(new CustomEvent('kixoff:match_end', { detail: data }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [serverUrl, token, matchId]);

  // Send input
  const sendInput = useCallback((dx: number, dy: number, kick: boolean) => {
    if (!socketRef.current?.connected) return;

    socketRef.current.emit('player_input', {
      seq: seqRef.current++,
      dx,
      dy,
      kick,
      timestamp: Date.now(),
    });
  }, []);

  return { connected, snapshot, error, sendInput };
}
