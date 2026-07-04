import { useEffect } from 'react';
import { useGame } from './context/GameContext';
import { useSocketEvents } from './context/useSocketEvents';
import { LandingScreen } from './screens/LandingScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { ClueScreen } from './screens/ClueScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { VotingOverlay } from './screens/VotingOverlay';
import { Toast } from './components/Toast';

export function App() {
  useSocketEvents();
  const { state, dispatch } = useGame();

  // Auto-dismiss transient errors after a few seconds.
  useEffect(() => {
    if (!state.error) return;
    const t = setTimeout(() => dispatch({ type: 'CLEAR_ERROR' }), 4000);
    return () => clearTimeout(t);
  }, [state.error, dispatch]);

  return (
    <div className="app">
      {!state.connected && state.phase !== 'landing' && (
        <div className="banner">Reconnecting…</div>
      )}

      {state.phase === 'landing' && <LandingScreen />}
      {state.phase === 'lobby' && <LobbyScreen />}
      {(state.phase === 'clue' || state.phase === 'voting') && <ClueScreen />}
      {state.phase === 'results' && <ResultsScreen />}

      {state.phase === 'voting' && <VotingOverlay />}

      {state.error && <Toast message={state.error} />}
    </div>
  );
}
