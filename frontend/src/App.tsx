import { useState, useEffect } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { MainMenu } from './components/MainMenu';
import { MatchFlow } from './components/MatchFlow';
import type { Screen, PlayerProfile } from './types';

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [player, setPlayer] = useState<PlayerProfile | null>(null);

  useEffect(() => {
    // Placeholder profile until accounts/auth land; rating feeds matchmaking.
    const t = setTimeout(() => {
      setPlayer({
        id: 'guest',
        username: 'Guest',
        rating: 1500,
        level: 1,
        xp: 0,
        kredits: 500,
        gems: 0,
        stats: { matchesPlayed: 0, wins: 0, losses: 0, goals: 0, assists: 0, saves: 0, tackles: 0 },
        cosmetics: { skin: 'default', trail: 'none', goalEffect: 'none', emotes: [] },
      });
      setScreen('main-menu');
    }, 2500);
    return () => clearTimeout(t);
  }, []);

  const navigate = (s: Screen) => setScreen(s);

  switch (screen) {
    case 'splash':
      return <SplashScreen />;
    case 'main-menu':
      return player ? <MainMenu player={player} navigate={navigate} /> : <SplashScreen />;
    case 'matchmaking':
      // MatchFlow handles matchmaking -> game -> results and its own socket lifecycle.
      return player ? (
        <MatchFlow player={player} onExit={() => setScreen('main-menu')} />
      ) : (
        <SplashScreen />
      );
    default:
      return <SplashScreen />;
  }
}
