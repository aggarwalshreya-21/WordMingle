import { actions } from '../actions';
import { useGame } from '../context/GameContext';

export function ResultsScreen() {
  const { state } = useGame();
  const r = state.result;
  const isHost = state.players.find((p) => p.playerId === state.playerId)?.isHost;

  if (!r) return null;

  const groupWon = r.winner === 'group';

  return (
    <div className="screen results">
      <div className={`result-banner ${groupWon ? 'group' : 'odd'}`}>
        <h1>{groupWon ? 'Imposter Caught!' : 'The Imposter Escaped!'}</h1>
        <p>{groupWon ? 'The group wins 🎉' : `${r.oddPlayerNickname} wins 🕵️`}</p>
      </div>

      <div className="reveal">
        <div className="reveal-row">
          <span className="reveal-label">Imposter</span>
          <span className="reveal-value">{r.oddPlayerNickname ?? '—'}</span>
        </div>
        <div className="reveal-row">
          <span className="reveal-label">Group word</span>
          <span className="reveal-value">{r.mainWord ?? '—'}</span>
        </div>
        <div className="reveal-row odd">
          <span className="reveal-label">Imposter's word</span>
          <span className="reveal-value">{r.oddWord ?? '—'}</span>
        </div>
        <p className="reveal-reason">
          {r.reason === 'caught'
            ? 'Caught by a vote.'
            : 'Survived all 3 rounds undetected.'}
        </p>
      </div>

      <div className="stack">
        {isHost ? (
          <button className="btn primary" onClick={() => actions.playAgain()}>
            Play Again
          </button>
        ) : (
          <p className="hint">Waiting for the host to start a new round…</p>
        )}
        <button
          className="btn ghost"
          onClick={() => {
            actions.leaveRoom();
            location.reload();
          }}
        >
          Leave
        </button>
      </div>
    </div>
  );
}
