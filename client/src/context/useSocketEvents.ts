import { useEffect } from 'react';
import { socket } from '../socket';
import { useGame } from './GameContext';
import {
  loadSession,
  saveSession,
  clearSession,
} from '../session';
import type { ClueEntry, GameResult, PublicPlayer, VoteTally } from '../types';

/**
 * Wires every server -> client socket event to a reducer dispatch.
 * Mounted once at the App root. Also handles reconnect via saved session.
 */
export function useSocketEvents() {
  const { dispatch } = useGame();

  useEffect(() => {
    const onConnect = () => {
      dispatch({ type: 'CONNECTED', connected: true });
      // Attempt to rejoin a room we were previously in.
      const saved = loadSession();
      if (saved) {
        socket.emit('room:rejoin', {
          roomCode: saved.roomCode,
          playerId: saved.playerId,
        });
      }
    };
    const onDisconnect = () => dispatch({ type: 'CONNECTED', connected: false });

    const onRoom = (p: { roomCode: string; playerId: string }) => {
      saveSession(p);
      dispatch({ type: 'ROOM_JOINED', roomCode: p.roomCode, playerId: p.playerId });
    };

    const onError = (p: { message: string; fatal?: boolean }) => {
      if (p.fatal) {
        clearSession();
        dispatch({ type: 'RESET' });
      }
      dispatch({ type: 'ERROR', message: p.message });
    };

    const onLobby = (p: { players: PublicPlayer[]; genre: string | null }) =>
      dispatch({ type: 'LOBBY_UPDATE', players: p.players, genre: p.genre });

    const onWord = (p: { word: string; genre: string | null }) =>
      dispatch({ type: 'WORD_ASSIGNED', word: p.word, genre: p.genre });

    const onStarted = (p: { round: number }) =>
      dispatch({ type: 'GAME_STARTED', round: p.round });

    const onClue = (c: ClueEntry) => dispatch({ type: 'CLUE_NEW', clue: c });

    const onTurn = (p: { currentPlayerId: string | null; round: number }) =>
      dispatch({
        type: 'TURN_UPDATE',
        currentPlayerId: p.currentPlayerId,
        round: p.round,
      });

    const onRound = (p: { round: number }) =>
      dispatch({ type: 'ROUND_NEW', round: p.round });

    const onVoteStarted = (p: { calledBy: string }) =>
      dispatch({ type: 'VOTE_STARTED', calledBy: p.calledBy, total: 0 });

    const onVoteProgress = (p: { voted: number; total: number }) =>
      dispatch({ type: 'VOTE_PROGRESS', voted: p.voted, total: p.total });

    const onVoteTally = (t: VoteTally) =>
      dispatch({ type: 'VOTE_TALLY', tally: t });

    const onGameEnd = (r: GameResult) => dispatch({ type: 'GAME_END', result: r });

    const onReset = () => dispatch({ type: 'GAME_RESET' });

    const onSnapshot = (payload: Parameters<typeof snapshotDispatch>[1]) =>
      snapshotDispatch(dispatch, payload);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room:created', onRoom);
    socket.on('room:joined', onRoom);
    socket.on('room:error', onError);
    socket.on('lobby:update', onLobby);
    socket.on('game:wordAssigned', onWord);
    socket.on('game:started', onStarted);
    socket.on('clue:new', onClue);
    socket.on('turn:update', onTurn);
    socket.on('round:new', onRound);
    socket.on('vote:started', onVoteStarted);
    socket.on('vote:progress', onVoteProgress);
    socket.on('vote:tally', onVoteTally);
    socket.on('game:end', onGameEnd);
    socket.on('game:reset', onReset);
    socket.on('state:snapshot', onSnapshot);

    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room:created', onRoom);
      socket.off('room:joined', onRoom);
      socket.off('room:error', onError);
      socket.off('lobby:update', onLobby);
      socket.off('game:wordAssigned', onWord);
      socket.off('game:started', onStarted);
      socket.off('clue:new', onClue);
      socket.off('turn:update', onTurn);
      socket.off('round:new', onRound);
      socket.off('vote:started', onVoteStarted);
      socket.off('vote:progress', onVoteProgress);
      socket.off('vote:tally', onVoteTally);
      socket.off('game:end', onGameEnd);
      socket.off('game:reset', onReset);
      socket.off('state:snapshot', onSnapshot);
    };
  }, [dispatch]);
}

// Kept as a standalone function so the payload type stays in one place.
function snapshotDispatch(
  dispatch: ReturnType<typeof useGame>['dispatch'],
  payload: {
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
  },
) {
  dispatch({ type: 'SNAPSHOT', payload });
}
