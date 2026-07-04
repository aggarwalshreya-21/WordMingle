const KEY = 'wordmingle:session';

// Only offer to rejoin a saved room within this window. Beyond it, the
// session is considered stale (the room has likely been cleaned up) and the
// player is sent to the menu instead of silently dropped into an old game.
const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export interface Session {
  roomCode: string;
  playerId: string;
  savedAt: number;
}

export function saveSession(s: { roomCode: string; playerId: string }) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ ...s, savedAt: Date.now() } satisfies Session),
    );
  } catch {
    /* ignore storage failures (private mode, etc.) */
  }
}

/** Return the saved session only if it exists and is still fresh. */
export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (!s.roomCode || !s.playerId) return null;
    if (Date.now() - (s.savedAt ?? 0) > TTL_MS) {
      clearSession();
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
