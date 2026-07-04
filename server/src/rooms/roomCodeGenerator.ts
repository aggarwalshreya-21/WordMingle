import { config } from '../config.js';

// Unambiguous alphabet — no 0/O, 1/I/L to avoid confusion when typing codes.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateRoomCode(exists: (code: string) => boolean): string {
  let code = '';
  do {
    code = '';
    for (let i = 0; i < config.ROOM_CODE_LENGTH; i++) {
      code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    }
  } while (exists(code));
  return code;
}
