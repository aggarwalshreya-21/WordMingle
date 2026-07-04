import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import type {
  ClueEntry,
  GamePhase,
  GameResult,
  PublicPlayer,
  VoteTally,
} from '../types';

export interface GameState {
  phase: GamePhase;
  connected: boolean;
  roomCode: string | null;
  playerId: string | null;
  players: PublicPlayer[];
  genre: string | null;
  word: string | null;
  round: number;
  currentPlayerId: string | null;
  clues: ClueEntry[];
  voteInProgress: boolean;
  voteCalledBy: string | null;
  voteProgress: { voted: number; total: number };
  voteTally: VoteTally | null;
  result: GameResult | null;
  error: string | null;
}

export const initialState: GameState = {
  phase: 'landing',
  connected: false,
  roomCode: null,
  playerId: null,
  players: [],
  genre: null,
  word: null,
  round: 1,
  currentPlayerId: null,
  clues: [],
  voteInProgress: false,
  voteCalledBy: null,
  voteProgress: { voted: 0, total: 0 },
  voteTally: null,
  result: null,
  error: null,
};

export type Action =
  | { type: 'CONNECTED'; connected: boolean }
  | { type: 'ROOM_JOINED'; roomCode: string; playerId: string }
  | { type: 'LOBBY_UPDATE'; players: PublicPlayer[]; genre: string | null }
  | { type: 'WORD_ASSIGNED'; word: string; genre: string | null }
  | { type: 'GAME_STARTED'; round: number }
  | { type: 'CLUE_NEW'; clue: ClueEntry }
  | { type: 'TURN_UPDATE'; currentPlayerId: string | null; round: number }
  | { type: 'ROUND_NEW'; round: number }
  | { type: 'VOTE_STARTED'; calledBy: string; total: number }
  | { type: 'VOTE_PROGRESS'; voted: number; total: number }
  | { type: 'VOTE_TALLY'; tally: VoteTally }
  | { type: 'VOTE_RESUME' }
  | { type: 'GAME_END'; result: GameResult }
  | { type: 'GAME_RESET' }
  | { type: 'SNAPSHOT'; payload: SnapshotPayload }
  | { type: 'ERROR'; message: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' };

export interface SnapshotPayload {
  phase: 'lobby' | 'clue' | 'voting' | 'results';
  genre: string | null;
  players: PublicPlayer[];
  round: number;
  currentPlayerId: string | null;
  clues: ClueEntry[];
  voteInProgress: boolean;
  word: string | null;
  result: {
    oddPlayerId: string | null;
    oddPlayerNickname: string | null;
    mainWord: string | null;
    oddWord: string | null;
  } | null;
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'CONNECTED':
      return { ...state, connected: action.connected };

    case 'ROOM_JOINED':
      return {
        ...state,
        roomCode: action.roomCode,
        playerId: action.playerId,
        phase: state.phase === 'landing' ? 'lobby' : state.phase,
        error: null,
      };

    case 'LOBBY_UPDATE':
      return { ...state, players: action.players, genre: action.genre };

    case 'WORD_ASSIGNED':
      return { ...state, word: action.word, genre: action.genre ?? state.genre };

    case 'GAME_STARTED':
      return {
        ...state,
        phase: 'clue',
        round: action.round,
        clues: [],
        voteTally: null,
        result: null,
      };

    case 'CLUE_NEW':
      return { ...state, clues: [...state.clues, action.clue] };

    case 'TURN_UPDATE':
      return {
        ...state,
        phase: state.phase === 'voting' ? 'clue' : state.phase,
        currentPlayerId: action.currentPlayerId,
        round: action.round,
        voteInProgress: false,
      };

    case 'ROUND_NEW':
      return { ...state, round: action.round };

    case 'VOTE_STARTED':
      return {
        ...state,
        phase: 'voting',
        voteInProgress: true,
        voteCalledBy: action.calledBy,
        voteProgress: { voted: 0, total: action.total },
        voteTally: null,
      };

    case 'VOTE_PROGRESS':
      return {
        ...state,
        voteProgress: { voted: action.voted, total: action.total },
      };

    case 'VOTE_TALLY':
      return { ...state, voteTally: action.tally, voteInProgress: false };

    case 'VOTE_RESUME':
      return { ...state, phase: 'clue', voteInProgress: false };

    case 'GAME_END':
      return { ...state, phase: 'results', result: action.result };

    case 'GAME_RESET':
      return {
        ...state,
        phase: 'lobby',
        word: null,
        round: 1,
        currentPlayerId: null,
        clues: [],
        voteInProgress: false,
        voteCalledBy: null,
        voteTally: null,
        result: null,
      };

    case 'SNAPSHOT': {
      const p = action.payload;
      return {
        ...state,
        phase: p.phase,
        genre: p.genre,
        players: p.players,
        round: p.round,
        currentPlayerId: p.currentPlayerId,
        clues: p.clues,
        voteInProgress: p.voteInProgress,
        word: p.word,
        result: p.result
          ? {
              ...p.result,
              winner: 'group',
              reason: 'caught',
            }
          : state.result,
      };
    }

    case 'ERROR':
      return { ...state, error: action.message };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'RESET':
      return { ...initialState, connected: state.connected };

    default:
      return state;
  }
}

interface GameContextValue {
  state: GameState;
  dispatch: Dispatch<Action>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
