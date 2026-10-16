import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Snapshot, PlayerInput } from '../types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

export function useGameSocket(matchId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputSeq = useRef(0);

  useEffect(() => {
    if (!matchId) return;

    const socket = io(SERVER_URL, {
      transports: ['websocket'],
      auth: { token: localStorage.getItem('cloduron_token') },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_match', { matchId });
    });

    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (err: Error) => setError(err.message));

    socket.on('snapshot', (snap: Snapshot) => setSnapshot(snap));
    socket.on('match_ended', () =>
      setSnapshot((prev) => (prev ? { ...prev, phase: 'ended' } : null))
    );
    socket.on('error', (msg: string) => setError(msg));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [matchId]);

  const sendInput = useCallback(
    (input: Omit<PlayerInput, 'seq' | 'timestamp'>) => {
      const socket = socketRef.current;
      if (!socket || !socket.connected) return;
      const fullInput: PlayerInput = {
        ...input,
        seq: inputSeq.current++,
        timestamp: Date.now(),
      };
      socket.emit('player_input', fullInput);
    },
    []
  );

  return { connected, snapshot, error, sendInput };
}
