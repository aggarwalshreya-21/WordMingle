const KEY = 'wordmingle:session';

export interface Session {
  roomCode: string;
  playerId: string;
}

export function saveSession(s: Session) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore storage failures (private mode, etc.) */
  }
}

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
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
