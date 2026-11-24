import { useCallback, useEffect, useRef, useState } from 'react';
import { MatchmakingScreen } from './MatchmakingScreen';
import { GameScreen } from './GameScreen';
import { ResultsScreen } from './ResultsScreen';
import { useGameSocket, type MatchEndResult } from '../hooks/useGameSocket';
import type { PlayerProfile } from '../types';

interface Props {
  player: PlayerProfile;
  onExit: () => void;
}

/**
 * Owns the live match session: queue -> game -> results.
 * The socket lifecycle is scoped to this component, so leaving to the
 * main menu cleanly disconnects from the server.
 */
export function MatchFlow({ player, onExit }: Props) {
  const [stage, setStage] = useState<'matchmaking' | 'game' | 'results'>('matchmaking');
  const [result, setResult] = useState<MatchEndResult | null>(null);

  const { connected, queued, snapshot, findMatch, cancelMatch, sendInput } = useGameSocket({
    onMatchFound: () => setStage('game'),
    onMatchEnded: (r) => {
      setResult(r);
      setStage('results');
    },
  });

  const rating = player.rating;
  const startRef = useRef(false);

  // Auto-queue on entry (emits are buffered until the socket connects)
  useEffect(() => {
    if (startRef.current) return;
    startRef.current = true;
    findMatch(rating);
  }, [findMatch, rating]);

  const exitToMenu = useCallback(() => {
    cancelMatch();
    onExit();
  }, [cancelMatch, onExit]);

  const playAgain = useCallback(() => {
    setResult(null);
    setStage('matchmaking');
    findMatch(rating);
  }, [findMatch, rating]);

  switch (stage) {
    case 'matchmaking':
      return (
        <MatchmakingScreen
          connected={connected}
          queued={queued}
          rating={player.rating}
          onCancel={exitToMenu}
        />
      );
    case 'game':
      return <GameScreen snapshot={snapshot} sendInput={sendInput} connected={connected} />;
    case 'results':
      return <ResultsScreen result={result} onPlayAgain={playAgain} onExit={onExit} />;
  }
}
