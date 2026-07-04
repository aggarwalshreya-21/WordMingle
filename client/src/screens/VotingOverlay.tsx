import { useState } from 'react';
import { actions } from '../actions';
import { useGame } from '../context/GameContext';

export function VotingOverlay() {
  const { state } = useGame();
  const [voted, setVoted] = useState<string | null>(null);

  const candidates = state.players.filter(
    (p) => p.connected && p.playerId !== state.playerId,
  );

  const cast = (id: string) => {
    setVoted(id);
    actions.castVote(id);
  };

  const tally = state.voteTally;

  return (
    <div className="overlay">
      <div className="overlay-card">
        {!tally ? (
          <>
            <h2>Who is the imposter?</h2>
            {state.voteCalledBy && (
              <p className="subtle">{state.voteCalledBy} called a vote</p>
            )}
            <div className="vote-options">
              {candidates.map((p) => (
                <button
                  key={p.playerId}
                  className={`vote-option ${voted === p.playerId ? 'chosen' : ''}`}
                  disabled={voted != null}
                  onClick={() => cast(p.playerId)}
                >
                  {p.nickname}
                </button>
              ))}
            </div>
            {voted && <p className="hint">Vote locked in. Waiting for others…</p>}
            <p className="vote-progress">
              {state.voteProgress.voted}/{state.voteProgress.total} voted
            </p>
          </>
        ) : (
          <div className="tally">
            {tally.accusedNickname ? (
              <>
                <h2>Group accused {tally.accusedNickname}</h2>
                <p className={tally.wasOddPlayer ? 'good' : 'bad'}>
                  {tally.wasOddPlayer
                    ? 'Correct — they were the imposter!'
                    : 'Wrong! Play continues…'}
                </p>
              </>
            ) : (
              <>
                <h2>It's a tie!</h2>
                <p className="bad">No one caught. Play continues…</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
