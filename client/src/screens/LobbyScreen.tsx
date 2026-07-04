import { actions } from '../actions';
import { useGame } from '../context/GameContext';
import { GENRES, genreEmoji } from '../genres';
import { PlayerList } from '../components/PlayerList';
import { RoomCodeBadge } from '../components/RoomCodeBadge';

const MIN = 3;
const MAX = 8;

export function LobbyScreen() {
  const { state } = useGame();
  const isHost = state.players.find((p) => p.playerId === state.playerId)?.isHost;
  const count = state.players.filter((p) => p.connected).length;
  const canStart = isHost && state.genre != null && count >= MIN && count <= MAX;

  return (
    <div className="screen lobby">
      <header className="lobby-header">
        {state.roomCode && <RoomCodeBadge code={state.roomCode} />}
        <p className="subtle">Share this code so friends can join.</p>
      </header>

      <section>
        <h2>
          Players <span className="count">{count}/{MAX}</span>
        </h2>
        <PlayerList players={state.players} selfId={state.playerId} />
        {count < MIN && (
          <p className="hint">Need at least {MIN} players to start.</p>
        )}
      </section>

      <section>
        <h2>Genre</h2>
        <div className="genre-grid">
          {GENRES.map((g) => {
            const selected = state.genre === g;
            return (
              <button
                key={g}
                className={`genre-card ${selected ? 'selected' : ''}`}
                disabled={!isHost}
                onClick={() => isHost && actions.selectGenre(g)}
              >
                <span className="emoji">{genreEmoji(g)}</span>
                <span className="genre-name">{g}</span>
              </button>
            );
          })}
        </div>
        {!isHost && (
          <p className="hint">
            {state.genre
              ? `Host picked ${state.genre}. Waiting for host to start…`
              : 'Waiting for the host to pick a genre…'}
          </p>
        )}
      </section>

      {isHost ? (
        <button
          className="btn primary sticky-action"
          disabled={!canStart}
          onClick={() => actions.startGame()}
        >
          {state.genre ? 'Start Game' : 'Pick a genre first'}
        </button>
      ) : (
        <button
          className="btn ghost sticky-action"
          onClick={() => {
            actions.leaveRoom();
            location.reload();
          }}
        >
          Leave
        </button>
      )}
    </div>
  );
}
