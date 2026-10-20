import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { Snapshot, PlayerInput } from '../types';

const SERVER_URL = ((import.meta as any).env?.VITE_SERVER_URL as string | undefined) || 'http://localhost:3000';

export function useGameSocket(matchId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  useEffect(() => {
    if (!matchId) return;
    const socket = io(SERVER_URL);
    socketRef.current = socket;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('snapshot', setSnapshot);
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [matchId]);

  const sendInput = useCallback(
    (input: Omit<PlayerInput, 'seq' | 'timestamp'>) =>
      socketRef.current?.emit('input', {
        ...input,
        seq: Date.now(),
        timestamp: Date.now(),
      }),
    [],
  );

  return { connected, snapshot, sendInput };
}
