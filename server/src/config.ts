export const config = {
  PORT: Number(process.env.PORT) || 3001,
  HOST: '0.0.0.0',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? '*',
  ROOM_CODE_LENGTH: 4,
  ROUND_LIMIT: 3,
  MIN_PLAYERS: 3,
  MAX_PLAYERS: 8,
  // How long a player may stay disconnected before being removed (ms).
  DISCONNECT_GRACE_MS: 90_000,
  // How long a called vote waits for everyone before auto-resolving (ms).
  VOTE_TIMEOUT_MS: 45_000,
  // Rooms idle longer than this are cleaned up (ms).
  ROOM_IDLE_MS: 2 * 60 * 60 * 1000,
  ROOM_CLEANUP_INTERVAL_MS: 5 * 60 * 1000,
};
