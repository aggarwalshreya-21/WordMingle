import { randomUUID } from 'node:crypto';
import type { Server, Socket } from 'socket.io';
import { config } from '../config.js';
import { roomManager } from '../rooms/RoomManager.js';
import type { Room } from '../rooms/Room.js';
import type { Player } from '../rooms/types.js';
import { isValidGenre } from '../game/wordBank.js';
import { tallyVote, voteCounts } from '../game/gameLogic.js';
import {
  emitGameEnd,
  emitLobbyUpdate,
  emitTurnUpdate,
} from './broadcast.js';

// Pending removal timers for briefly-disconnected players.
const graceTimers = new Map<string, NodeJS.Timeout>();
// Auto-resolve timers for in-progress votes, keyed by room code.
const voteTimers = new Map<string, NodeJS.Timeout>();

function graceKey(code: string, playerId: string) {
  return `${code}:${playerId}`;
}

function clearVoteTimer(code: string) {
  const t = voteTimers.get(code);
  if (t) {
    clearTimeout(t);
    voteTimers.delete(code);
  }
}

export function registerSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    // -------- create room --------
    socket.on('room:create', ({ nickname }: { nickname: string }) => {
      const name = sanitizeName(nickname);
      if (!name) return socket.emit('room:error', { message: 'Enter a nickname.' });

      const room = roomManager.createRoom();
      const player = makePlayer(socket.id, name);
      room.addPlayer(player);
      socket.join(room.code);
      socket.data.roomCode = room.code;
      socket.data.playerId = player.playerId;

      socket.emit('room:created', {
        roomCode: room.code,
        playerId: player.playerId,
      });
      emitLobbyUpdate(io, room);
    });

    // -------- join room --------
    socket.on(
      'room:join',
      ({ roomCode, nickname }: { roomCode: string; nickname: string }) => {
        const name = sanitizeName(nickname);
        if (!name) return socket.emit('room:error', { message: 'Enter a nickname.' });

        const room = roomManager.getRoom(roomCode);
        if (!room) return socket.emit('room:error', { message: 'Room not found.' });
        if (room.phase !== 'lobby')
          return socket.emit('room:error', { message: 'Game already in progress.' });
        if (room.players.length >= config.MAX_PLAYERS)
          return socket.emit('room:error', { message: 'Room is full.' });
        if (
          room.players.some(
            (p) => p.nickname.toLowerCase() === name.toLowerCase(),
          )
        )
          return socket.emit('room:error', { message: 'Nickname already taken.' });

        const player = makePlayer(socket.id, name);
        room.addPlayer(player);
        socket.join(room.code);
        socket.data.roomCode = room.code;
        socket.data.playerId = player.playerId;

        socket.emit('room:joined', {
          roomCode: room.code,
          playerId: player.playerId,
        });
        emitLobbyUpdate(io, room);
      },
    );

    // -------- rejoin (reconnect) --------
    socket.on(
      'room:rejoin',
      ({ roomCode, playerId }: { roomCode: string; playerId: string }) => {
        const room = roomManager.getRoom(roomCode);
        const player = room?.getPlayer(playerId);
        if (!room || !player) {
          return socket.emit('room:error', {
            message: 'Your game has ended.',
            fatal: true,
          });
        }

        // Cancel any pending removal.
        const key = graceKey(room.code, playerId);
        const timer = graceTimers.get(key);
        if (timer) {
          clearTimeout(timer);
          graceTimers.delete(key);
        }

        player.socketId = socket.id;
        player.connected = true;
        socket.join(room.code);
        socket.data.roomCode = room.code;
        socket.data.playerId = playerId;

        socket.emit('room:joined', { roomCode: room.code, playerId });
        // Re-send full private state so the client can restore its screen.
        sendStateSnapshot(socket, room, player);
        io.to(room.code).emit('player:reconnected', { playerId });
        emitLobbyUpdate(io, room);
      },
    );

    // -------- select genre (host) --------
    socket.on('lobby:selectGenre', ({ genre }: { genre: string }) => {
      const { room, player } = context(socket);
      if (!room || !player) return;
      if (!room.isHost(player.playerId) || room.phase !== 'lobby') return;
      if (!isValidGenre(genre)) return;
      room.genre = genre;
      room.touch();
      emitLobbyUpdate(io, room);
    });

    // -------- start game (host) --------
    socket.on('lobby:startGame', () => {
      const { room, player } = context(socket);
      if (!room || !player) return;
      if (!room.isHost(player.playerId)) return;
      if (!room.canStart())
        return socket.emit('room:error', {
          message: `Need ${config.MIN_PLAYERS}-${config.MAX_PLAYERS} players and a genre.`,
        });

      const words = room.startGame();
      // Deliver each word privately to its owner's socket only.
      for (const p of room.connectedPlayers()) {
        if (p.socketId) {
          io.to(p.socketId).emit('game:wordAssigned', {
            word: words.get(p.playerId),
            genre: room.genre,
          });
        }
      }
      io.to(room.code).emit('game:started', {
        genre: room.genre,
        round: room.round,
        turnOrder: room.turnOrder,
      });
      emitTurnUpdate(io, room);
    });

    // -------- submit clue --------
    socket.on('clue:submit', ({ clue }: { clue: string }) => {
      const { room, player } = context(socket);
      if (!room || !player) return;
      if (room.phase !== 'clue') return;
      if (room.currentTurnPlayerId() !== player.playerId) return; // not your turn
      const text = sanitizeClue(clue);
      if (!text) return;

      room.submitClue(player.playerId, text);
      io.to(room.code).emit('clue:new', {
        playerId: player.playerId,
        nickname: player.nickname,
        clue: text,
        round: room.round,
      });
      progressAfterClue(io, room);
    });

    // -------- call a vote --------
    socket.on('vote:call', () => {
      const { room, player } = context(socket);
      if (!room || !player) return;
      if (room.phase !== 'clue' || !room.cluesStarted()) return;

      room.startVote();
      io.to(room.code).emit('vote:started', { calledBy: player.nickname });

      clearVoteTimer(room.code);
      voteTimers.set(
        room.code,
        setTimeout(() => resolveVote(io, room), config.VOTE_TIMEOUT_MS),
      );
    });

    // -------- cast a vote --------
    socket.on('vote:cast', ({ accusedPlayerId }: { accusedPlayerId: string }) => {
      const { room, player } = context(socket);
      if (!room || !player) return;
      if (!room.voteInProgress || room.phase !== 'voting') return;
      if (!room.getPlayer(accusedPlayerId)) return;

      room.castVote(player.playerId, accusedPlayerId);
      io.to(room.code).emit('vote:progress', {
        voted: room.votes?.size ?? 0,
        total: room.connectedPlayers().length,
      });
      if (room.everyoneVoted()) resolveVote(io, room);
    });

    // -------- play again (host) --------
    socket.on('game:playAgain', () => {
      const { room, player } = context(socket);
      if (!room || !player) return;
      if (!room.isHost(player.playerId) || room.phase !== 'results') return;
      clearVoteTimer(room.code);
      room.resetToLobby();
      io.to(room.code).emit('game:reset');
      emitLobbyUpdate(io, room);
    });

    // -------- explicit leave --------
    socket.on('room:leave', () => {
      const { room, player } = context(socket);
      if (!room || !player) return;
      socket.leave(room.code);
      handleDeparture(io, room, player.playerId);
      socket.data.roomCode = undefined;
      socket.data.playerId = undefined;
    });

    // -------- disconnect --------
    socket.on('disconnect', () => {
      const { room, player } = context(socket);
      if (!room || !player) return;
      player.connected = false;
      player.socketId = null;
      io.to(room.code).emit('player:disconnected', { playerId: player.playerId });
      emitLobbyUpdate(io, room);

      // In lobby, a disconnect during grace still holds the slot; once the
      // grace period passes the player is removed entirely.
      const key = graceKey(room.code, player.playerId);
      const timer = setTimeout(() => {
        graceTimers.delete(key);
        const stillThere = room.getPlayer(player.playerId);
        if (stillThere && !stillThere.connected) {
          handleDeparture(io, room, player.playerId);
        }
      }, config.DISCONNECT_GRACE_MS);
      graceTimers.set(key, timer);

      // If it was the disconnected player's turn mid-game, keep things moving.
      if (
        room.phase === 'clue' &&
        room.currentTurnPlayerId() === player.playerId
      ) {
        room.skipTurn();
        io.to(room.code).emit('clue:new', {
          playerId: player.playerId,
          nickname: player.nickname,
          clue: '(skipped — disconnected)',
          round: room.round,
        });
        progressAfterClue(io, room);
      }
    });
  });
}

// ---------- shared helpers ----------

function makePlayer(socketId: string, nickname: string): Player {
  return {
    socketId,
    playerId: randomUUID(),
    nickname,
    connected: true,
    isHost: false,
    joinedAt: Date.now(),
  };
}

function context(socket: Socket): { room?: Room; player?: Player } {
  const code = socket.data.roomCode as string | undefined;
  const playerId = socket.data.playerId as string | undefined;
  if (!code || !playerId) return {};
  const room = roomManager.getRoom(code);
  const player = room?.getPlayer(playerId);
  return { room, player };
}

function sanitizeName(name: unknown): string | null {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim().slice(0, 20);
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeClue(clue: unknown): string | null {
  if (typeof clue !== 'string') return null;
  const trimmed = clue.trim().slice(0, 60);
  return trimmed.length > 0 ? trimmed : null;
}

/** Re-send the current game state privately to a reconnecting player. */
function sendStateSnapshot(socket: Socket, room: Room, player: Player) {
  socket.emit('state:snapshot', {
    phase: room.phase,
    genre: room.genre,
    players: room.publicPlayers(),
    round: room.round,
    currentPlayerId: room.currentTurnPlayerId(),
    clues: room.clues,
    voteInProgress: room.voteInProgress,
    // The player's own word only — never anyone else's.
    word: player.word ?? null,
    // If the game already ended, include the reveal.
    result:
      room.phase === 'results'
        ? {
            oddPlayerId: room.oddPlayerId,
            oddPlayerNickname: room.oddPlayerId
              ? room.getPlayer(room.oddPlayerId)?.nickname ?? null
              : null,
            mainWord: room.wordPair?.main ?? null,
            oddWord: room.wordPair?.odd ?? null,
          }
        : null,
  });
}

/** After a clue is submitted (or skipped), advance round / end game. */
function progressAfterClue(io: Server, room: Room) {
  // Auto-skip any disconnected players whose turn is now up.
  while (!room.roundComplete()) {
    const nextId = room.currentTurnPlayerId();
    const next = nextId ? room.getPlayer(nextId) : null;
    if (next && next.connected) break;
    room.skipTurn();
    io.to(room.code).emit('clue:new', {
      playerId: nextId,
      nickname: next?.nickname ?? '???',
      clue: '(skipped — disconnected)',
      round: room.round,
    });
  }

  if (!room.roundComplete()) {
    emitTurnUpdate(io, room);
    return;
  }
  if (room.isFinalRound()) {
    // Survived all rounds without being caught.
    room.endGame();
    emitGameEnd(io, room, 'oddPlayer', 'roundsExhausted');
    return;
  }
  room.advanceRound();
  io.to(room.code).emit('round:new', {
    round: room.round,
    turnOrder: room.turnOrder,
  });
  emitTurnUpdate(io, room);
}

/** Tally the current vote and either end the game or resume discussion. */
function resolveVote(io: Server, room: Room) {
  if (!room.voteInProgress || !room.votes) return;
  clearVoteTimer(room.code);

  const counts = voteCounts(room.votes);
  const accusedId = tallyVote(room.votes);
  const wasOddPlayer = accusedId != null && accusedId === room.oddPlayerId;
  const accused = accusedId ? room.getPlayer(accusedId) : null;

  io.to(room.code).emit('vote:tally', {
    accusedPlayerId: accusedId,
    accusedNickname: accused?.nickname ?? null,
    voteCounts: counts,
    wasOddPlayer,
  });

  if (wasOddPlayer) {
    room.endGame();
    emitGameEnd(io, room, 'group', 'caught');
  } else {
    // Wrong accusation (or tie): no penalty — resume where we left off.
    room.endVote();
    emitTurnUpdate(io, room);
  }
}

/** Remove a player and handle empty-room cleanup + host migration. */
function handleDeparture(io: Server, room: Room, playerId: string) {
  const inClue = room.phase === 'clue';

  // Keep the turn order consistent before dropping the player.
  if (inClue) room.removeFromTurnOrder(playerId);
  room.removePlayer(playerId);

  if (room.players.length === 0) {
    clearVoteTimer(room.code);
    roomManager.deleteRoom(room.code);
    return;
  }

  emitLobbyUpdate(io, room);

  // Advancing re-broadcasts the turn and skips any now-disconnected players.
  if (inClue) progressAfterClue(io, room);

  // A vote in progress may now be complete with one fewer voter.
  if (room.phase === 'voting' && room.everyoneVoted()) {
    resolveVote(io, room);
  }
}
