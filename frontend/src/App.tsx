import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import MainMenu from './components/screens/MainMenu';
import MatchmakingScreen from './components/screens/MatchmakingScreen';
import PostMatchScreen from './components/screens/PostMatchScreen';
import { useGameSocket } from './hooks/useGameSocket';
import { useKeyboardInput } from './hooks/useKeyboardInput';
import ArenaCanvas from './components/game/ArenaCanvas';
import MatchHUD from './components/hud/MatchHUD';
import GoalBanner from './components/hud/GoalBanner';
import { MatchSnapshot, Player, RankTier, getRankFromRating } from './types';

// ═══════════════════════════════════════════════════════════
// KIXoff — Main App Component (Aura/UI)
// Screen flow: Splash → Menu → Matchmaking → Game → PostMatch
// ═══════════════════════════════════════════════════════════

export type ScreenState = 'menu' | 'matchmaking' | 'game' | 'postmatch';

export interface PlayerProfile {
  id: string;
  name: string;
  rating: number;
  rank: RankTier;
  kredits: number;
  gems: number;
  wins: number;
  losses: number;
}

export interface MatchResult {
  win: boolean;
  scoreHome: number;
  scoreAway: number;
  goals: number;
  assists: number;
  saves: number;
  kreditsEarned: number;
  xpEarned: number;
  ratingChange: number;
}

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('menu');
  const [player, setPlayer] = useState<PlayerProfile>({
    id: 'local-player',
    name: 'Player1',
    rating: 1500,
    rank: getRankFromRating(1500),
    kredits: 500,
    gems: 0,
    wins: 0,
    losses: 0,
  });
  const [matchmakingTime, setMatchmakingTime] = useState(0);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [snapshot, setSnapshot] = useState<MatchSnapshot | null>(null);
  const [showGoalBanner, setShowGoalBanner] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  // ── Keyboard input ──
  const input = useKeyboardInput();

  // ── Game socket hook ──
  const { connected, latency, connect, sendInput, queueMatchmaking, cancelMatchmaking } = useGameSocket();

  // ── Connect on mount ──
  useEffect(() => {
    connect(SERVER_URL);
  }, []);

  // ── Send input to server at 30Hz when in game ──
  useEffect(() => {
    if (screen !== 'game') return;
    const interval = setInterval(() => {
      sendInput(input.current);
    }, 1000 / 30);
    return () => clearInterval(interval);
  }, [screen, input, sendInput]);

  // ── Matchmaking timer ──
  useEffect(() => {
    if (screen !== 'matchmaking') return;
    const interval = setInterval(() => {
      setMatchmakingTime((t) => t + 1);
    }, 1000);
    return () => { setMatchmakingTime(0); clearInterval(interval); };
  }, [screen]);

  // ── Listen for match found ──
  useEffect(() => {
    if (!socket) return;
    socket.on('matchFound', (data: { roomId: string; team: 'home' | 'away' }) => {
      setScreen('game');
    });
    socket.on('snapshot', (snap: MatchSnapshot) => {
      setSnapshot(snap);
    });
    socket.on('goal', () => {
      setShowGoalBanner(true);
      setTimeout(() => setShowGoalBanner(false), 2500);
    });
    socket.on('matchEnd', (result: MatchResult) => {
      setMatchResult(result);
      setScreen('postmatch');
      // Update player profile
      setPlayer((p) => ({
        ...p,
        rating: p.rating + result.ratingChange,
        rank: getRankFromRating(p.rating + result.ratingChange),
        kredits: p.kredits + result.kreditsEarned,
        wins: p.wins + (result.win ? 1 : 0),
        losses: p.losses + (result.win ? 0 : 1),
      }));
    });
    return () => {
      socket.off('matchFound');
      socket.off('snapshot');
      socket.off('goal');
      socket.off('matchEnd');
    };
  }, [socket]);

  // ── Handlers ──
  const handlePlay = useCallback(() => {
    setScreen('matchmaking');
    queueMatchmaking({ playerId: player.id, rating: player.rating });
  }, [player, queueMatchmaking]);

  const handleCancelMatchmaking = useCallback(() => {
    cancelMatchmaking();
    setScreen('menu');
  }, [cancelMatchmaking]);

  const handlePlayAgain = useCallback(() => {
    setMatchResult(null);
    setSnapshot(null);
    setScreen('matchmaking');
    queueMatchmaking({ playerId: player.id, rating: player.rating });
  }, [player, queueMatchmaking]);

  const handleBackToMenu = useCallback(() => {
    setMatchResult(null);
    setSnapshot(null);
    setScreen('menu');
  }, []);

  // ── Render ──
  switch (screen) {
    case 'menu':
      return (
        <MainMenu
          player={player}
          onPlay={handlePlay}
          onSettings={() => console.log('settings')}
          onCosmetics={() => console.log('cosmetics')}
        />
      );

    case 'matchmaking':
      return (
        <MatchmakingScreen
          elapsed={matchmakingTime}
          onCancel={handleCancelMatchmaking}
        />
      );

    case 'game':
      return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#0A0E27' }}>
          <ArenaCanvas snapshot={snapshot} />
          <MatchHUD
            scoreHome={snapshot?.scoreHome ?? 0}
            scoreAway={snapshot?.scoreAway ?? 0}
            timer={snapshot?.timer ?? 180}
            fps={60}
            ping={latency}
          />
          {showGoalBanner && <GoalBanner />}
        </div>
      );

    case 'postmatch':
      return (
        <PostMatchScreen
          result={matchResult!}
          onPlayAgain={handlePlayAgain}
          onContinue={handleBackToMenu}
        />
      );

    default:
      return <MainMenu player={player} onPlay={handlePlay} onSettings={() => {}} onCosmetics={() => {}} />;
  }
}
