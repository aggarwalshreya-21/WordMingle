export type GamePhase = 'landing' | 'lobby' | 'clue' | 'voting' | 'results';

export interface PublicPlayer {
  playerId: string;
  nickname: string;
  connected: boolean;
  isHost: boolean;
}

export interface ClueEntry {
  playerId: string;
  nickname: string;
  clue: string;
  round: number;
}

export interface VoteTally {
  accusedPlayerId: string | null;
  accusedNickname: string | null;
  voteCounts: Record<string, number>;
  wasOddPlayer: boolean;
}

export interface GameResult {
  oddPlayerId: string | null;
  oddPlayerNickname: string | null;
  mainWord: string | null;
  oddWord: string | null;
  winner: 'group' | 'oddPlayer';
  reason: 'caught' | 'roundsExhausted';
}
