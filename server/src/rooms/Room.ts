import { config } from '../config.js';
import { randomWordPair } from '../game/wordBank.js';
import { buildTurnOrder } from '../game/gameLogic.js';
import type {
  ChatMessage,
  ClueEntry,
  GamePhase,
  Player,
  PublicPlayer,
  WordPair,
} from './types.js';

const CHAT_HISTORY_LIMIT = 100;

export class Room {
  code: string;
  players: Player[] = [];
  phase: GamePhase = 'lobby';
  genre: string | null = null;
  wordPair: WordPair | null = null;
  oddPlayerId: string | null = null;
  round = 1;
  turnOrder: string[] = [];
  currentTurnIndex = 0;
  clues: ClueEntry[] = [];
  voteInProgress = false;
  votes: Map<string, string> | null = null;
  chat: ChatMessage[] = [];
  createdAt = Date.now();
  lastActivityAt = Date.now();

  constructor(code: string) {
    this.code = code;
  }

  touch() {
    this.lastActivityAt = Date.now();
  }

  addChat(msg: ChatMessage): void {
    this.chat.push(msg);
    if (this.chat.length > CHAT_HISTORY_LIMIT) {
      this.chat.splice(0, this.chat.length - CHAT_HISTORY_LIMIT);
    }
    this.touch();
  }

  // ---- player management ----

  getPlayer(playerId: string): Player | undefined {
    return this.players.find((p) => p.playerId === playerId);
  }

  getPlayerBySocket(socketId: string): Player | undefined {
    return this.players.find((p) => p.socketId === socketId);
  }

  get host(): Player | undefined {
    return this.players.find((p) => p.isHost);
  }

  isHost(playerId: string): boolean {
    return this.host?.playerId === playerId;
  }

  connectedPlayers(): Player[] {
    return this.players.filter((p) => p.connected);
  }

  addPlayer(player: Player) {
    // First player to join becomes the host.
    if (this.players.length === 0) player.isHost = true;
    this.players.push(player);
    this.touch();
  }

  removePlayer(playerId: string) {
    const wasHost = this.isHost(playerId);
    this.players = this.players.filter((p) => p.playerId !== playerId);
    if (wasHost) this.migrateHost();
    this.touch();
  }

  /** Promote the longest-connected remaining player to host. */
  migrateHost() {
    if (this.host) return;
    const candidates = this.connectedPlayers().sort(
      (a, b) => a.joinedAt - b.joinedAt,
    );
    const next = candidates[0] ?? this.players[0];
    if (next) next.isHost = true;
  }

  publicPlayers(): PublicPlayer[] {
    return this.players.map((p) => ({
      playerId: p.playerId,
      nickname: p.nickname,
      connected: p.connected,
      isHost: p.isHost,
    }));
  }

  // ---- game lifecycle ----

  canStart(): boolean {
    const n = this.connectedPlayers().length;
    return (
      this.phase === 'lobby' &&
      this.genre != null &&
      n >= config.MIN_PLAYERS &&
      n <= config.MAX_PLAYERS
    );
  }

  /**
   * Assign words and pick the odd player. Returns a map of
   * playerId -> word for private per-socket delivery.
   */
  startGame(): Map<string, string> {
    this.wordPair = randomWordPair(this.genre!);
    const players = this.connectedPlayers();
    const oddPlayer = players[Math.floor(Math.random() * players.length)];
    this.oddPlayerId = oddPlayer.playerId;

    const words = new Map<string, string>();
    for (const p of players) {
      p.word =
        p.playerId === this.oddPlayerId
          ? this.wordPair.odd
          : this.wordPair.main;
      words.set(p.playerId, p.word);
    }

    this.phase = 'clue';
    this.round = 1;
    this.turnOrder = buildTurnOrder(players);
    this.currentTurnIndex = 0;
    this.clues = [];
    this.voteInProgress = false;
    this.votes = null;
    this.touch();
    return words;
  }

  currentTurnPlayerId(): string | null {
    return this.turnOrder[this.currentTurnIndex] ?? null;
  }

  /** True once every player has given at least one clue (round 1 complete). */
  cluesStarted(): boolean {
    return this.round > 1 || this.currentTurnIndex > 0;
  }

  /**
   * Record a clue for the current player and advance the turn.
   * Returns the round-advance outcome.
   */
  submitClue(playerId: string, clue: string): void {
    const player = this.getPlayer(playerId)!;
    this.clues.push({
      playerId,
      nickname: player.nickname,
      clue,
      round: this.round,
    });
    this.currentTurnIndex++;
    this.touch();
  }

  /** True when the current round's clues are all in. */
  roundComplete(): boolean {
    return this.currentTurnIndex >= this.turnOrder.length;
  }

  isFinalRound(): boolean {
    return this.round >= config.ROUND_LIMIT;
  }

  /** Move to the next round; reshuffles order from connected players. */
  advanceRound(): void {
    this.round++;
    this.turnOrder = buildTurnOrder(this.connectedPlayers());
    this.currentTurnIndex = 0;
    this.touch();
  }

  /**
   * Remove a player from the active turn order, keeping currentTurnIndex
   * pointing at the same upcoming player. Used when someone leaves mid-round.
   */
  removeFromTurnOrder(playerId: string): void {
    const idx = this.turnOrder.indexOf(playerId);
    if (idx === -1) return;
    this.turnOrder.splice(idx, 1);
    if (idx < this.currentTurnIndex) this.currentTurnIndex--;
  }

  /**
   * Skip the current player's turn (used when the active player is
   * disconnected). Inserts a system placeholder clue.
   */
  skipTurn(): void {
    const playerId = this.currentTurnPlayerId();
    if (!playerId) return;
    const player = this.getPlayer(playerId);
    this.clues.push({
      playerId,
      nickname: player?.nickname ?? '???',
      clue: '(skipped — disconnected)',
      round: this.round,
    });
    this.currentTurnIndex++;
    this.touch();
  }

  // ---- voting ----

  startVote(): void {
    this.phase = 'voting';
    this.voteInProgress = true;
    this.votes = new Map();
    this.touch();
  }

  castVote(voterId: string, accusedId: string): void {
    if (!this.votes) return;
    this.votes.set(voterId, accusedId);
    this.touch();
  }

  everyoneVoted(): boolean {
    if (!this.votes) return false;
    return this.votes.size >= this.connectedPlayers().length;
  }

  endVote(): void {
    this.phase = 'clue';
    this.voteInProgress = false;
    this.votes = null;
    this.touch();
  }

  endGame(): void {
    this.phase = 'results';
    this.voteInProgress = false;
    this.votes = null;
    this.touch();
  }

  /** Reset to lobby keeping players & room code (Play Again). */
  resetToLobby(): void {
    this.phase = 'lobby';
    this.wordPair = null;
    this.oddPlayerId = null;
    this.round = 1;
    this.turnOrder = [];
    this.currentTurnIndex = 0;
    this.clues = [];
    this.voteInProgress = false;
    this.votes = null;
    this.chat = [];
    for (const p of this.players) delete p.word;
    this.touch();
  }
}
