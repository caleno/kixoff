import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Snapshot, PlayerInput } from '../types';

export function useGameSocket(serverUrl: string, token: string) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = io(serverUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
   .socket.on('disconnect', () => setConnected(false));
    socket.on('error', (err: string) => setError(err));
    socket.on('snapshot', (snap: Snapshot) => setSnapshot(snap));
    socket.on('match-ended', () => {
      // Trigger results screen
    });

    return () => { socket.disconnect(); };
  }, [serverUrl, token]);

  const sendInput = useCallback((input: PlayerInput) => {
    socketRef.current?.emit('input', input);
  }, []);

  const joinQueue = useCallback((mode: 'casual' | 'ranked') => {
    socketRef.current?.emit('join-queue', { mode });
  }, []);

  const leaveQueue = useCallback(() => {
    socketRef.current?.emit('leave-queue');
  }, []);

  return { connected, snapshot, error, sendInput, joinQueue, leaveQueue };
}
