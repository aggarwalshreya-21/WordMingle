import type { Server } from 'socket.io';
import type { Room } from '../rooms/Room.js';

/** Broadcast the lobby/player list + selected genre to everyone in a room. */
export function emitLobbyUpdate(io: Server, room: Room) {
  io.to(room.code).emit('lobby:update', {
    players: room.publicPlayers(),
    genre: room.genre,
  });
}

/** Broadcast whose turn it is and the current round. */
export function emitTurnUpdate(io: Server, room: Room) {
  io.to(room.code).emit('turn:update', {
    currentPlayerId: room.currentTurnPlayerId(),
    round: room.round,
  });
}

/** Reveal both words and the outcome, then end the game. */
export function emitGameEnd(
  io: Server,
  room: Room,
  winner: 'group' | 'oddPlayer',
  reason: 'caught' | 'roundsExhausted',
) {
  const oddPlayer = room.oddPlayerId ? room.getPlayer(room.oddPlayerId) : null;
  io.to(room.code).emit('game:end', {
    oddPlayerId: room.oddPlayerId,
    oddPlayerNickname: oddPlayer?.nickname ?? null,
    mainWord: room.wordPair?.main ?? null,
    oddWord: room.wordPair?.odd ?? null,
    winner,
    reason,
  });
}
