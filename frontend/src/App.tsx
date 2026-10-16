import { useState, useEffect } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { MainMenu } from './components/MainMenu';
import { MatchmakingScreen } from './components/MatchmakingScreen';
import { GameScreen } from './components/GameScreen';
import { ResultsScreen } from './components/ResultsScreen';
import type { Screen, PlayerProfile } from './types';

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [player, setPlayer] = useState<PlayerProfile | null>(null);

  useEffect(() => {
    setTimeout(() => {
      setPlayer({
        id: 'mock-1',
        username: 'Nordlys',
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
  }, []);

  const navigate = (s: Screen) => setScreen(s);

  switch (screen) {
    case 'splash':
      return <SplashScreen />;
    case 'main-menu':
      return <MainMenu player={player!} navigate={navigate} />;
    case 'matchmaking':
      return <MatchmakingScreen player={player!} navigate={navigate} />;
    case 'game':
      return <GameScreen navigate={navigate} />;
    case 'results':
      return <ResultsScreen navigate={navigate} />;
    default:
      return <SplashScreen />;
  }
}
