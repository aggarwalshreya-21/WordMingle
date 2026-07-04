import { io, Socket } from 'socket.io-client';

// Same-origin connection. In dev, Vite proxies /socket.io to the backend;
// in production the backend serves the client and handles sockets directly.
export const socket: Socket = io({
  autoConnect: true,
  transports: ['websocket', 'polling'],
});
