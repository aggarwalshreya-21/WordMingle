export type GamePhase = 'lobby' | 'clue' | 'voting' | 'results';

export interface Player {
  /** Volatile socket id — changes on every reconnect. */
  socketId: string | null;
  /** Stable id persisted client-side (localStorage) — survives reconnects. */
  playerId: string;
  nickname: string;
  connected: boolean;
  isHost: boolean;
  /** Set only after word assignment; never broadcast to other players. */
  word?: string;
  /** Timestamp used to order host-migration and grace removal. */
  joinedAt: number;
}

export interface WordPair {
  main: string;
  odd: string;
}

export interface ClueEntry {
  playerId: string;
  nickname: string;
  clue: string;
  round: number;
}

export type Winner = 'group' | 'oddPlayer';
export type EndReason = 'caught' | 'roundsExhausted';

/** Public view of a player (never leaks word / odd status). */
export interface PublicPlayer {
  playerId: string;
  nickname: string;
  connected: boolean;
  isHost: boolean;
}
