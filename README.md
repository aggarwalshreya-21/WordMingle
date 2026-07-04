# WordMingle 🎭

> **A real-time, cross-device party game where everyone bluffs to catch the odd one out.** Built with Node.js, Socket.io, React & TypeScript.

A cross-device multiplayer **"odd one out"** party game. Everyone gets a secret
word from a chosen genre — except one player, the **odd one**, who gets a
different but related word. Over up to 3 rounds each player gives a one-word
clue about their word. Anyone can **call a vote** at any time to accuse the odd
one. Catch them and the group wins; survive 3 rounds undetected and the odd one
wins.

Players join from any device (phone or laptop) using a 4-letter **room code**.

## Gameplay
1. **Create / Join** — the host creates a room and shares the code; others join.
2. **Lobby** — the host picks a genre (Animals, Movies, Food, Sports, …). Needs
   3–8 players.
3. **Words** — everyone is privately sent a word. One random player is the odd
   one and gets a related but different word. **The odd one is told they're the
   imposter** (but not the real word), so they know to bluff. Nobody else knows
   who is odd.
4. **Clues** — in turn order, each player submits one short clue describing their
   word without saying it. Clues appear live for everyone.
   - A built-in **chat** (with emoji picker) and **push-to-talk voice chat**
     (peer-to-peer WebRTC) let players discuss and accuse in real time.
5. **Vote** — any player can *Call a Vote* once clues have started. Everyone
   votes; a majority accusation resolves it:
   - Accused **is** the odd one → group wins, game over.
   - Wrong (or tie) → no penalty, discussion resumes.
6. **End** — if 3 rounds pass with no correct catch, the odd one wins.
7. **Play Again** keeps the same room and players.

## Tech
- **Backend**: Node.js + Express + Socket.io (in-memory rooms, server-authoritative).
  Also relays WebRTC signaling (SDP/ICE) for voice chat.
- **Frontend**: React + Vite + TypeScript (mobile-first, no router — state-driven).
- **Voice chat**: peer-to-peer WebRTC audio (STUN for NAT traversal); the server
  only brokers the handshake, audio never passes through it.
- **One deployable service**: in production the server serves the built client,
  so there's no CORS/config split.

> **Voice-chat note:** browsers only grant microphone access in a *secure
> context* — i.e. `https://` or `localhost`. On the deployed Render URL (HTTPS)
> voice works. When testing over your LAN by IP (e.g. `http://192.168.x.x`),
> the mic is blocked by the browser; text chat and the rest of the game still
> work there.

## Local development
```bash
npm install          # installs both workspaces
npm run dev          # server on :3001, client on :5173 (proxies sockets)
```
Open http://localhost:5173 in several tabs (use incognito windows for distinct
sessions) to simulate multiple players.

## Production build & run
```bash
npm run build        # builds client then server
npm start            # serves everything on $PORT (default 3001)
```

## Deploy (Render free tier)
`render.yaml` is included as a **Blueprint**, so Render auto-configures the build
command, start command, and Node version — no manual settings needed.

### Step 1 — Push to GitHub
Using **GitHub Desktop**: *File → Add Local Repository* → select this folder →
*Publish repository* (public or private both work with Render).

Or from the command line once you have a repo URL:
```bash
git remote add origin https://github.com/<you>/WordMingle.git
git push -u origin main
```

### Step 2 — Deploy on Render
1. Sign in at [render.com](https://render.com) (**"Sign in with GitHub"** auto-connects your repos).
2. **New +** → **Blueprint** → select the **WordMingle** repo → **Apply**.
3. Render runs `npm install --include=dev && npm run build`, then `npm start`
   (~2–4 min). You get a public URL like `https://wordmingle.onrender.com`.

### Step 3 — Play
Open that URL on any device, any network. One person creates a room; others join
with the 4-letter code.

**Notes / free-tier limits:**
- The server binds `process.env.PORT` and `0.0.0.0` automatically.
- `--include=dev` in the build command forces devDependencies (vite, typescript,
  tsx) to install even with `NODE_ENV=production` — the build needs them.
- The instance **sleeps after ~15 min idle** and cold-starts (~10–30s) on the
  next request — the landing screen shows a "waking up" hint. A restart clears
  all in-memory rooms; that's fine for an ephemeral party game.

## Configurable defaults
These live in `server/src/config.ts` and are easy to change:
- Player count: **3–8** (`MIN_PLAYERS` / `MAX_PLAYERS`)
- Rounds: **3** (`ROUND_LIMIT`)
- Word mechanic: odd player gets a *different related word* (edit pairs in
  `server/src/game/wordBank.ts`)
- Wrong-vote penalty: **none** (resolved in `server/src/sockets/index.ts`)
- Disconnect grace / vote timeout durations

## Project layout
```
server/src/
  index.ts              Express + Socket.io bootstrap, serves client build
  config.ts             tunable constants
  rooms/                Room, RoomManager, room-code generator, types
  game/                 wordBank (genres + pairs), gameLogic (pure helpers)
  sockets/              connection handlers + broadcast helpers
client/src/
  App.tsx               phase-based screen switch
  context/              GameContext (reducer) + useSocketEvents
  screens/              Landing, Lobby, Clue, Voting, Results
  components/           PlayerList, ClueBubble, RoomCodeBadge, Toast
```
