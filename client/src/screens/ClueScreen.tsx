import { useEffect, useMemo, useState } from 'react';
import { actions } from '../actions';
import { useGame } from '../context/GameContext';
import { ClueBubble } from '../components/ClueBubble';
import { ChatPanel } from '../components/ChatPanel';

export function ClueScreen() {
  const { state } = useGame();
  const [draft, setDraft] = useState('');
  const [tab, setTab] = useState<'clues' | 'chat'>('clues');
  const [seenChat, setSeenChat] = useState(0);

  const myTurn = state.currentPlayerId === state.playerId;
  const currentName =
    state.players.find((p) => p.playerId === state.currentPlayerId)?.nickname ??
    '…';
  const cluesStarted = state.clues.length > 0;
  const unread = tab === 'chat' ? 0 : state.chat.length - seenChat;

  // Mark chat as read whenever it's the active tab.
  useEffect(() => {
    if (tab === 'chat') setSeenChat(state.chat.length);
  }, [tab, state.chat.length]);

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

      <div className={`word-card ${state.isOdd ? 'imposter' : ''}`}>
        {state.isOdd ? (
          <>
            <span className="word-label imposter-label">🕵️ You're the imposter</span>
            <span className="word-value">{state.word ?? '—'}</span>
            <span className="word-note">
              Everyone else shares a different word. Bluff, blend in, and don't
              get caught!
            </span>
          </>
        ) : (
          <>
            <span className="word-label">Your word</span>
            <span className="word-value">{state.word ?? '—'}</span>
            <span className="word-note">
              Describe it in one word — don't say it outright!
            </span>
          </>
        )}
      </div>

      <div className="turn-indicator">
        {myTurn ? (
          <div className="clue-input-row">
            <input
              autoFocus
              maxLength={60}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Your one-word clue…"
            />
            <button className="btn primary" disabled={!draft.trim()} onClick={submit}>
              Send
            </button>
          </div>
        ) : (
          <span>
            Waiting for <strong>{currentName}</strong> to give a clue…
          </span>
        )}
      </div>

      {cluesStarted && (
        <button className="btn danger call-vote" onClick={() => actions.callVote()}>
          Call a Vote
        </button>
      )}

      <div className="tabs">
        <button
          className={`tab ${tab === 'clues' ? 'active' : ''}`}
          onClick={() => setTab('clues')}
        >
          Clues
        </button>
        <button
          className={`tab ${tab === 'chat' ? 'active' : ''}`}
          onClick={() => setTab('chat')}
        >
          Chat{unread > 0 && <span className="unread">{unread}</span>}
        </button>
      </div>

      {tab === 'clues' ? (
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
      ) : (
        <ChatPanel />
      )}
    </div>
  );
}
