import { useEffect, useRef, useState, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = ((import.meta as any).env?.VITE_SOCKET_URL as string | undefined) ?? 'http://localhost:3000';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    if (socketRef.current) return socketRef.current;
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socketRef.current = socket;
    return socket;
  }, []);

  useEffect(() => () => { socketRef.current?.disconnect(); }, []);

  return { connected, connect, socket: socketRef.current };
}
