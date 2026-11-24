import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { Snapshot, PlayerInput, Team } from '../types';

const SERVER_URL =
  ((import.meta as any).env?.VITE_SERVER_URL as string | undefined) || 'http://localhost:3000';

export interface MatchEndResult {
  homeScore: number;
  awayScore: number;
}

/**
 * Owns the single server connection for a match session.
 * Lifecycle: findMatch() -> 'match_found' -> 'snapshot' stream -> sendInput()
 *            -> 'match_ended'. cancelMatch() tears the connection down.
 */
export function useGameSocket(callbacks: {
  onMatchFound?: (matchId: string) => void;
  onMatchEnded?: (result: MatchEndResult) => void;
}) {
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  const socketRef = useRef<Socket | null>(null);
  const matchIdRef = useRef<string | null>(null);
  const playerIdRef = useRef<string>('');
  const seqRef = useRef(0);

  const [connected, setConnected] = useState(false);
  const [queued, setQueued] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  const attach = useCallback(
    (socket: Socket) => {
      socket.on('connect', () => {
        setConnected(true);
      });
      socket.on('disconnect', () => {
        setConnected(false);
        setQueued(false);
        matchIdRef.current = null;
      });
      socket.on('connect_error', () => {
        setConnected(false);
        setQueued(false);
      });
      socket.on('match_found', (payload: { matchId: string }) => {
        if (!payload?.matchId) return;
        matchIdRef.current = payload.matchId;
        setQueued(false);
        setSnapshot(null);
        cbRef.current.onMatchFound?.(payload.matchId);
      });
      socket.on('snapshot', (snap: any) => {
        if (!snap || typeof snap.tick !== 'number') return;
        const events = Array.isArray(snap.events) ? snap.events : [];
        setSnapshot({
          ...(snap as Snapshot),
          players: (snap.players ?? []).map((p: any) => ({
            id: p.id,
            team: p.team as Team,
            x: p.x,
            y: p.y,
            rot: p.rot,
            stamina: p.stamina,
            hasBall: !!p.hasBall,
            stunned: !!p.stunned,
          })),
          lastEvent: events.length > 0 ? events[events.length - 1] : null,
        });
      });
      socket.on('match_ended', (payload: MatchEndResult) => {
        if (!payload || typeof payload.homeScore !== 'number') return;
        cbRef.current.onMatchEnded?.(payload);
      });
    },
    [],
  );

  const ensureSocket = useCallback((): Socket | null => {
    const existing = socketRef.current;
    if (existing && existing.connected) return existing;
    if (existing) {
      existing.removeAllListeners();
      existing.disconnect();
    }
    const socket = io(SERVER_URL);
    attach(socket);
    socketRef.current = socket;
    return socket;
  }, [attach]);

  useEffect(
    () => () => {
      const s = socketRef.current;
      if (s) {
        s.removeAllListeners();
        s.disconnect();
      }
      socketRef.current = null;
    },
    [],
  );

  /** Join the matchmaking queue. Emits are buffered until the socket connects. */
  const findMatch = useCallback(
    (rating: number) => {
      const socket = ensureSocket();
      if (!socket) return;
      if (!playerIdRef.current) {
        playerIdRef.current =
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      }
      setSnapshot(null);
      socket.emit('join_queue', { playerId: playerIdRef.current, rating });
      setQueued(true);
    },
    [ensureSocket],
  );

  /** Abandon queue / match: sever the connection (server cleans up on disconnect). */
  const cancelMatch = useCallback(() => {
    const s = socketRef.current;
    if (s) {
      s.removeAllListeners();
      s.disconnect();
    }
    socketRef.current = null;
    matchIdRef.current = null;
    setConnected(false);
    setQueued(false);
    setSnapshot(null);
  }, []);

  const sendInput = useCallback(
    (input: Omit<PlayerInput, 'seq' | 'timestamp'>) => {
      const socket = socketRef.current;
      const matchId = matchIdRef.current;
      const playerId = playerIdRef.current;
      if (!socket || !matchId || !playerId) return;
      seqRef.current += 1;
      socket.emit('input', {
        matchId,
        playerId,
        input: {
          ...input,
          seq: seqRef.current,
          timestamp: Date.now(),
        },
      });
    },
    [],
  );

  return { connected, queued, snapshot, findMatch, cancelMatch, sendInput };
}
