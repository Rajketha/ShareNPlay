# ShareNPlay

**Share a file. Play a duel. Dare the loser.**

ShareNPlay is a cinematic, real-time file-sharing and gaming platform. Drop any file,
get a 6-digit code and a QR, and the person who scans it joins you in a live head-to-head
mini-game before (or while) the download lands. The loser performs the winner's dare.

*a RAJKETHA PROJECT*

## How it works

1. **Sender** uploads a file (up to 10 MB), picks a game and a dare.
2. **Receiver** scans the QR (or opens the link / types the code).
3. Both players duel in one of **12 real-time mini-games** — first to 2 points wins.
4. The **loser performs the winner's dare**, and the file downloads anytime.

## Games

Rock Paper Scissors · Tap War · Quick Quiz · Emoji Memory · Typing Speed ·
Reaction Time · Math Blitz · Color Rush · Aim Master · Stickman Fight ·
Car Racer · Bike Racer

## Run locally (Node 18+)

```bash
# backend — http://localhost:5000
cd backend && npm install && npm start

# frontend — http://localhost:3002
cd frontend && npm install && PORT=3002 npm start
```

Open http://localhost:3002, upload a file, and scan the QR with a phone on the same Wi-Fi.
(Windows one-click: `RUN-SHARENPLAY.bat`.)

## Run with Docker

A single container serves the API, WebSockets, and the built web app on one port:

```bash
docker build -t sharenplay:2.0.0 .
docker run -p 7860:7860 -e PORT=7860 sharenplay:2.0.0
# open http://localhost:7860
```

or

```bash
docker compose up
```

Environment variables (all optional): `PORT` (default `7860` in Docker, `5000` locally),
`CORS_ORIGIN` (comma-separated origin allowlist; permissive by default).

## Deploy to Hugging Face Spaces

1. Create a Space → **Docker** SDK → blank template.
2. Upload the repo (the `Dockerfile` at the root is ready; the app listens on `7860`).
3. Public URL appears once the Space builds — share it from any device.

## Features

- 6-digit room codes + auto-refreshing QR codes with your LAN IP
- 12 fully playable real-time duels (sockets), first to 2 points or 3 rounds
- Dare system with Funny / Challenging / Creative / Social categories
- Download before, during, or after the match — the file is never blocked by the game
- Installable PWA (phone home-screen), light/dark cinematic UI, mobile-first layout
- Files auto-purge after 1 hour; nothing stored long-term

## Tech

React (CRA) · Express · Socket.IO · Multer (in-memory, 10 MB) · Docker · PWA

## License

MIT
