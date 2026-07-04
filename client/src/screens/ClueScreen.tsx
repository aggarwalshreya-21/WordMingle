import { useMemo, useState } from 'react';
import { actions } from '../actions';
import { useGame } from '../context/GameContext';
import { ClueBubble } from '../components/ClueBubble';

export function ClueScreen() {
  const { state } = useGame();
  const [draft, setDraft] = useState('');

  const myTurn = state.currentPlayerId === state.playerId;
  const currentName =
    state.players.find((p) => p.playerId === state.currentPlayerId)?.nickname ??
    '…';
  const cluesStarted = state.clues.length > 0;

  const cluesByRound = useMemo(() => {
    const map = new Map<number, typeof state.clues>();
    for (const c of state.clues) {
      const list = map.get(c.round) ?? [];
      list.push(c);
      map.set(c.round, list);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [state.clues]);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    actions.submitClue(text);
    setDraft('');
  };

  return (
    <div className="screen clue-screen">
      <header className="game-header">
        <div className="round-pill">Round {state.round}/3</div>
        <div className="genre-pill">{state.genre}</div>
      </header>

      <div className="word-card">
        <span className="word-label">Your word</span>
        <span className="word-value">{state.word ?? '—'}</span>
        <span className="word-note">
          Describe it in one word — don't say it outright!
        </span>
      </div>

      <div className="turn-indicator">
        {myTurn ? (
          <strong>Your turn — give a clue</strong>
        ) : (
          <span>
            Waiting for <strong>{currentName}</strong>…
          </span>
        )}
      </div>

      <div className="clue-feed">
        {cluesByRound.length === 0 && (
          <p className="empty">Clues will appear here as players go.</p>
        )}
        {cluesByRound.map(([round, clues]) => (
          <div key={round} className="clue-round">
            <div className="clue-round-label">Round {round}</div>
            {clues.map((c, i) => (
              <ClueBubble
                key={`${round}-${i}`}
                clue={c}
                isSelf={c.playerId === state.playerId}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="action-bar">
        {cluesStarted && (
          <button className="btn danger" onClick={() => actions.callVote()}>
            Call a Vote
          </button>
        )}
        {myTurn && (
          <div className="clue-input-row">
            <input
              autoFocus
              maxLength={60}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Your clue…"
            />
            <button className="btn primary" disabled={!draft.trim()} onClick={submit}>
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
