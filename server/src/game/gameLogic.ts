import type { Player } from '../rooms/types.js';

/** Fisher-Yates shuffle returning a new array. */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Build a randomized turn order from currently-connected players. */
export function buildTurnOrder(players: Player[]): string[] {
  const connected = players.filter((p) => p.connected).map((p) => p.playerId);
  return shuffle(connected);
}

/**
 * Tally anonymous votes into a plurality winner.
 * Returns the accused playerId, or null on a tie / no votes.
 */
export function tallyVote(votes: Map<string, string>): string | null {
  const counts = new Map<string, number>();
  for (const accused of votes.values()) {
    counts.set(accused, (counts.get(accused) ?? 0) + 1);
  }
  let winner: string | null = null;
  let max = 0;
  let tie = false;
  for (const [playerId, count] of counts) {
    if (count > max) {
      max = count;
      winner = playerId;
      tie = false;
    } else if (count === max) {
      tie = true;
    }
  }
  return tie ? null : winner;
}

/** Vote counts keyed by accused playerId, for reveal after resolution. */
export function voteCounts(votes: Map<string, string>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const accused of votes.values()) {
    counts[accused] = (counts[accused] ?? 0) + 1;
  }
  return counts;
}
