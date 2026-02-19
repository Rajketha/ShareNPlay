# 🎮 ShareNPlay — Performance Edition

**ShareNPlay** is a high-capacity, real-time multiplayer mini-games and file-sharing web application built using **React, Node.js, Express, and Socket.IO**.

🔗 **Live Demo**: [https://huggingface.co/spaces/Rajketha/sharenplay](https://huggingface.co/spaces/Rajketha/sharenplay)

It is designed for seamless connectivity between **desktop and mobile devices**. Two users can join using a **6-digit code**, play real-time multiplayer games, and securely share files up to **2GB** using direct links or QR codes — without crashing the server.

This project prioritizes **performance, stability, and real-world scalability**.

---

## ✨ Key Highlights

- 🐳 **Docker Ready**: One-command setup for local and cloud.
- 🌍 **Cloud Hosted**: Live on Hugging Face Spaces.
- 📦 **2GB+ File Sharing**: Optimized disk-based streaming.
- 🎮 **Multiplayer Sync**: Zero-lag gaming via Socket.IO.
- 📱 **Mobile Optimized**: Seamless inter-device connectivity.
- 🧹 **Auto-cleanup**: Background task for shared files.

---

## 🚀 Quick Start (Docker - Recommended)

The fastest way to run ShareNPlay on any machine.

### 1️⃣ Requirements
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed.

### 2️⃣ Run Locally
```bash
docker compose up --build -d
```
Accessible at: **http://localhost:5000**

### 3️⃣ Direct One-Click (Windows)
Double-click `run-anywhere.bat` in the root folder. It will find your local IP and start the app so you can connect your phone instantly!

---

## ☁️ Deployment (Hugging Face Spaces)

ShareNPlay is optimized for card-free hosting on **Hugging Face Spaces**.

1. Create a [New Space](https://huggingface.co/new-space) on Hugging Face.
2. Select **Docker** as the SDK.
3. Create a `Dockerfile` in the Space with just this line:
   ```dockerfile
   FROM rajketha/sharenplay:latest
   ```
4. Click **Commit**. Your app will be live in minutes!

---

## 🎮 Real-Time Multiplayer Mini-Games

Play games while files are transferring. Available games:
- **Rock Paper Scissors**, **Tap War**, **Quick Quiz**, **Emoji Memory**, **Typing Speed**, **Reaction Time**.

Features:
- 🎯 **Winner Dares**: Winner chooses a dare category for the loser.
- ⚡ **Live Sync**: No refresh needed, fully reactive sync powered by Socket.IO.
- 📊 **Live Scoring**: Instant feedback and score tracking.

---

## 📁 File Sharing Capabilities

- **Multer Streaming**: Files are streamed to disk (no RAM overload), supporting files of **2GB+**.
- **Auto-Cleanup**: Temporary files are deleted automatically after **1 hour**.
- **Secure Links**: Access limited to the 6-digit session code.

---

## 🛠 Manual Installation (For Development)

### 1️⃣ Requirements
- Node.js **18 or higher**

### 2️⃣ Install & Run
```bash
npm install
npm run install:all
npm run build:all
npm start --prefix backend
```

---

## 📂 Project Structure

```
ShareNPlay/
├── backend/            # Express server & Socket.IO
│   └── uploads/        # Persistent shared files
├── frontend/           # React application
├── Dockerfile          # Multi-stage production build
├── docker-compose.yml  # Local stack config
└── run-anywhere.bat    # Windows IP-discovery launcher
```

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 🧠 Design Philosophy

Performance first. No RAM abuse. Deployment simplified.  
If you can't run it in one command, we haven't done our job.
