---
title: ShareNPlay
emoji: "🎮"
colorFrom: indigo
colorTo: pink
sdk: docker
app_port: 7860
pinned: true
short_description: Share a file. Play a duel. Dare the loser.
---

**ShareNPlay v2.0.0** — cinematic real-time file sharing with 12 multiplayer mini-games.

1. Upload a file -> get a 6-digit code + QR
2. Your friend scans it and joins from any device
3. Duel in real-time (first to 2 points) - the loser performs the winner's dare
4. The file downloads anytime, before or after the match

*a RAJKETHA PROJECT*

- Live app: https://rajketha-sharenplay.hf.space
- Code: https://github.com/Rajketha/ShareNPlay
- Docker: `docker run -p 7860:7860 rajketha/sharenplay:latest`
- Multi-arch image (amd64 + arm64) pulled from Docker Hub
- Files are kept in memory only and auto-expire after 1 hour
