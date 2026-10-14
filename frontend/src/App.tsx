import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

// ==================== KIXoff MAIN APP ====================

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [view, setView] = useState<'menu' | 'lobby' | 'game' | 'garage'>('menu');

  useEffect(() => {
    const newSocket = io(process.env.VITE_SOCKET_URL || 'http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('connect', () => setConnected(true));
    newSocket.on('disconnect', () => setConnected(false));

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-kixoff-navy text-white">
      {/* HEADER */}
      <header className="flex items-center justify-between p-4 border-b border-white/10">
        <h1 className="text-3xl font-heading font-bold text-kixoff-cyan tracking-wider">
          KIX<span className="text-kixoff-magenta">off</span>
        </h1>
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-sm text-white/60">
            {connected ? 'Online' : 'Offline'}
          </span>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex items-center justify-center p-8" style={{ minHeight: 'calc(100vh - 80px)' }}>
        {view === 'menu' && <MainMenu onPlay={() => setView('lobby')} onGarage={() => setView('garage')} />}
        {view === 'lobby' && <Lobby socket={socket} onBack={() => setView('menu')} />}
        {view === 'garage' && <Garage onBack={() => setView('menu')} />}
      </main>
    </div>
  );
}

// ==================== MAIN MENU ====================

function MainMenu({ onPlay, onGarage }: { onPlay: () => void; onGarage: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-5xl font-heading font-bold text-center">
        Ready to <span className="text-kixoff-cyan">Kick Off</span>?
      </h2>
      <div className="flex flex-col gap-4 w-72">
        <button
          onClick={onPlay}
          className="px-8 py-4 bg-kixoff-cyan text-kixoff-navy font-heading font-bold text-xl rounded-lg hover:bg-kixoff-cyan/80 transition-colors"
        >
          ▶ PLAY
        </button>
        <button
          onClick={onGarage}
          className="px-8 py-4 bg-white/10 text-white font-heading font-bold text-xl rounded-lg hover:bg-white/20 transition-colors"
        >
          🎨 GARAGE
        </button>
      </div>
    </div>
  );
}

// ==================== MATCHMAKING LOBBY ====================

function Lobby({ socket, onBack }: { socket: Socket | null; onBack: () => void }) {
  const [status, setStatus] = useState('Searching for match...');
  const [playersFound, setPlayersFound] = useState(1);

  useEffect(() => {
    // Simulate matchmaking
    const interval = setInterval(() => {
      setPlayersFound((prev) => {
        if (prev >= 6) {
          clearInterval(interval);
          setStatus('Match found! Loading arena...');
          return 6;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-3xl font-heading font-bold text-kixoff-amber">{status}</h2>
      <div className="flex gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center text-2xl ${
              i < playersFound
                ? 'border-kixoff-cyan bg-kixoff-cyan/20'
                : 'border-white/20 bg-white/5'
            }`}
          >
            {i < playersFound ? '🟢' : '⏳'}
          </div>
        ))}
      </div>
      <p className="text-white/60">{playersFound} / 6 players ready</p>
      <button
        onClick={onBack}
        className="px-6 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}

// ==================== GARAGE ====================

function Garage({ onBack }: { onBack: () => void }) {
  const [color, setColor] = useState('#00F0FF');

  const colors = ['#00F0FF', '#FF006E', '#FFB800', '#00FF88', '#FF5500', '#9D00FF'];

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
      <h2 className="text-3xl font-heading font-bold">🎨 Garage</h2>
      <div className="w-40 h-40 rounded-full border-4" style={{ borderColor: color, backgroundColor: color + '33' }} />
      <div className="flex gap-3">
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`w-10 h-10 rounded-full border-2 transition-transform ${
              color === c ? 'scale-125 border-white' : 'border-transparent'
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <button
        onClick={onBack}
        className="px-6 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
      >
        ← Back
      </button>
    </div>
  );
}
