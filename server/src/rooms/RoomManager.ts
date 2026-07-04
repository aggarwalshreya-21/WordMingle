import { config } from '../config.js';
import { Room } from './Room.js';
import { generateRoomCode } from './roomCodeGenerator.js';

export class RoomManager {
  private rooms = new Map<string, Room>();

  createRoom(): Room {
    const code = generateRoomCode((c) => this.rooms.has(c));
    const room = new Room(code);
    this.rooms.set(code, room);
    return room;
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  deleteRoom(code: string): void {
    this.rooms.delete(code);
  }

  /** Remove idle or empty rooms. Runs on an interval. */
  cleanup(): void {
    const now = Date.now();
    for (const [code, room] of this.rooms) {
      const idle = now - room.lastActivityAt > config.ROOM_IDLE_MS;
      const empty = room.players.length === 0;
      if (idle || empty) this.rooms.delete(code);
    }
  }

  startCleanupLoop(): NodeJS.Timeout {
    return setInterval(() => this.cleanup(), config.ROOM_CLEANUP_INTERVAL_MS);
  }
}

export const roomManager = new RoomManager();
