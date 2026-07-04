import type { PublicPlayer } from '../types';

interface Props {
  players: PublicPlayer[];
  selfId: string | null;
  currentPlayerId?: string | null;
}

export function PlayerList({ players, selfId, currentPlayerId }: Props) {
  return (
    <ul className="player-list">
      {players.map((p) => (
        <li
          key={p.playerId}
          className={[
            'player-chip',
            p.connected ? '' : 'disconnected',
            p.playerId === currentPlayerId ? 'active-turn' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <span className="dot" />
          <span className="name">
            {p.nickname}
            {p.playerId === selfId && ' (you)'}
          </span>
          {p.isHost && <span className="badge">host</span>}
          {!p.connected && <span className="badge muted">away</span>}
        </li>
      ))}
    </ul>
  );
}
