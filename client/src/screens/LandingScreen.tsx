import { useState } from 'react';
import { actions } from '../actions';
import { useGame } from '../context/GameContext';
import { loadSession, clearSession } from '../session';

export function LandingScreen() {
  const { state } = useGame();
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  // A recent, still-fresh session lets the player hop back into their game
  // after a refresh — shown as an explicit choice, never an auto-jump.
  const [resumable, setResumable] = useState(() => loadSession());

  const canCreate = nickname.trim().length > 0;
  const canJoin = canCreate && roomCode.trim().length >= 4;

  const dismissResume = () => {
    clearSession();
    setResumable(null);
  };

  return (
    <div className="screen landing">
      <div className="brand">
        <h1>WordMingle</h1>
        <p className="tagline">Spot the odd one out.</p>
      </div>

      {!state.connected && (
        <p className="hint">Waking up the server… this can take a moment.</p>
      )}

      {mode === 'menu' && (
        <div className="stack">
          {resumable && (
            <div className="resume-card">
              <span>
                Rejoin your game in room <b>{resumable.roomCode}</b>?
              </span>
              <div className="resume-actions">
                <button
                  className="btn primary"
                  disabled={!state.connected}
                  onClick={() =>
                    actions.rejoin(resumable.roomCode, resumable.playerId)
                  }
                >
                  Rejoin
                </button>
                <button className="btn ghost" onClick={dismissResume}>
                  Dismiss
                </button>
              </div>
            </div>
          )}
          <button className="btn primary" onClick={() => setMode('create')}>
            Create Room
          </button>
          <button className="btn" onClick={() => setMode('join')}>
            Join Room
          </button>
          <HowToPlay />
        </div>
      )}

      {mode === 'create' && (
        <div className="stack card">
          <label className="field">
            <span>Your nickname</span>
            <input
              autoFocus
              maxLength={20}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Alex"
            />
          </label>
          <button
            className="btn primary"
            disabled={!canCreate || !state.connected}
            onClick={() => actions.createRoom(nickname.trim())}
          >
            Create Room
          </button>
          <button className="btn ghost" onClick={() => setMode('menu')}>
            Back
          </button>
        </div>
      )}

      {mode === 'join' && (
        <div className="stack card">
          <label className="field">
            <span>Room code</span>
            <input
              autoFocus
              maxLength={4}
              className="code-input"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ABCD"
            />
          </label>
          <label className="field">
            <span>Your nickname</span>
            <input
              maxLength={20}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Alex"
            />
          </label>
          <button
            className="btn primary"
            disabled={!canJoin || !state.connected}
            onClick={() => actions.joinRoom(roomCode.trim(), nickname.trim())}
          >
            Join Room
          </button>
          <button className="btn ghost" onClick={() => setMode('menu')}>
            Back
          </button>
        </div>
      )}
    </div>
  );
}

function HowToPlay() {
  return (
    <details className="how-to">
      <summary>How to play</summary>
      <ol>
        <li>Everyone gets a secret word from the chosen genre.</li>
        <li>
          One player is the <b>odd one</b> — they get a different, related word.
        </li>
        <li>Each round, give a one-word clue about your word.</li>
        <li>Call a vote anytime to accuse the odd one.</li>
        <li>
          Catch them and the group wins. Survive 3 rounds and the odd one wins!
        </li>
      </ol>
    </details>
  );
}
