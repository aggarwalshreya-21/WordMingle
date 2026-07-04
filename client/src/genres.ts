// Mirror of the server's genre list (server/src/game/wordBank.ts).
// Kept static so the lobby renders instantly without an extra round-trip.
export const GENRES = [
  'Animals',
  'Movies',
  'Food & Drinks',
  'Sports',
  'Countries',
  'Celebrities',
  'Occupations',
  'Everyday Objects',
] as const;

const EMOJI: Record<string, string> = {
  Animals: '🦁',
  Movies: '🎬',
  'Food & Drinks': '🍕',
  Sports: '⚽',
  Countries: '🌍',
  Celebrities: '⭐',
  Occupations: '💼',
  'Everyday Objects': '🧷',
};

export function genreEmoji(genre: string): string {
  return EMOJI[genre] ?? '🎲';
}
