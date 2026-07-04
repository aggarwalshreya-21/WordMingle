import { socket } from './socket';
import { clearSession } from './session';

// Thin wrappers around client -> server emits. Components call these;
// the server is the single source of truth and replies via events.
export const actions = {
  createRoom: (nickname: string) => socket.emit('room:create', { nickname }),
  joinRoom: (roomCode: string, nickname: string) =>
    socket.emit('room:join', { roomCode: roomCode.toUpperCase(), nickname }),
  selectGenre: (genre: string) => socket.emit('lobby:selectGenre', { genre }),
  startGame: () => socket.emit('lobby:startGame'),
  submitClue: (clue: string) => socket.emit('clue:submit', { clue }),
  callVote: () => socket.emit('vote:call'),
  castVote: (accusedPlayerId: string) =>
    socket.emit('vote:cast', { accusedPlayerId }),
  playAgain: () => socket.emit('game:playAgain'),
  leaveRoom: () => {
    socket.emit('room:leave');
    clearSession();
  },
};
