import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import express from 'express';
import { Server } from 'socket.io';
import { config } from './config.js';
import { registerSocketHandlers } from './sockets/index.js';
import { roomManager } from './rooms/RoomManager.js';
import { GENRES } from './game/wordBank.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: config.CLIENT_ORIGIN },
  // Tolerate brief mobile/tab-background stalls before declaring a socket
  // dead — prevents players being marked "disconnected" over short hiccups.
  pingInterval: 25_000,
  pingTimeout: 60_000,
});

// Lightweight health + genre list endpoints (handy for the client + hosts).
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/genres', (_req, res) => res.json({ genres: GENRES }));

// In production the compiled server serves the built React client. dist layout:
// server/dist/index.js  ->  ../../client/dist
const clientDist = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));
// SPA fallback: any non-API route returns index.html.
app.get(/^(?!\/api|\/socket\.io).*/, (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

registerSocketHandlers(io);
roomManager.startCleanupLoop();

httpServer.listen(config.PORT, config.HOST, () => {
  console.log(`WordMingle server listening on http://${config.HOST}:${config.PORT}`);
});
