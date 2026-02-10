# 🎮 ShareNPlay — Performance Edition

**ShareNPlay** is a high-capacity, real-time multiplayer mini-games and file-sharing web application built using **React, Node.js, Express, and Socket.IO**.

It is designed for seamless connectivity between **desktop and mobile devices**.  
Two users can join using a **6-digit code**, play real-time multiplayer games, and securely share files up to **2GB** using direct links or QR codes.

This project prioritizes **performance, stability, and real-world scalability**.

---

## ✨ Key Highlights

- Safe **2GB+ file sharing**
- Disk-based streaming (no RAM overload)
- Real-time multiplayer games
- Desktop + mobile support
- Auto-cleanup for shared files
- Single-port cloud deployment

---

## 📁 High-Capacity File Sharing

- **2GB File Support**  
  Optimized disk storage engine handles large files without crashing the server.

- **Disk-Based Streaming**  
  Files are written directly to disk instead of RAM, ensuring total system stability.

- **Real-Time Toast Notifications**  
  Instant upload and download feedback using `react-toastify`.

- **Auto File Cleanup**  
  Background task deletes shared files automatically after **1 hour**.

- **Flexible Sharing Options**  
  Share files using a 6-digit code, direct download link, or QR code.

---

## 🎮 Real-Time Multiplayer Mini-Games

Play games while files are transferring.

Available games:
- Rock Paper Scissors
- Tap War
- Quick Quiz
- Emoji Memory
- Typing Speed
- Reaction Time

Game features:
- Real-time sync powered by Socket.IO
- Zero-lag gameplay
- Automatic start when both players join
- Live score tracking
- **Winner Dares** system

---

## 🛠 Performance-Focused Tech Stack

| Feature | Implementation | Benefit |
|------|---------------|--------|
| Storage Engine | multer.diskStorage | Supports 2GB+ files safely |
| Streaming | Disk-based I/O | Zero RAM crashes |
| Real-Time Sync | Socket.IO | Instant gameplay updates |
| Notifications | react-toastify | Clean, non-blocking UI |
| Compression | compression (GZIP) | Faster local network loading |
| Static Serving | express.static | Unified port deployment |

---

## 🧰 Core Technologies

- Frontend: React  
- Backend: Node.js, Express  
- Real-Time: Socket.IO  
- File Handling: Multer  

---

## ✅ Requirements

- Node.js **18 or higher**
- npm (included with Node.js)

Download: https://nodejs.org

---

## 🚀 Run the Project (Single Flow)

### 1️⃣ Clone the repository
```bash
git clone https://github.com/Rajketha/ShareNPlay.git
cd ShareNPlay
```

### 2️⃣ Install dependencies
```bash
npm install
npm run install:all
```

### 3️⃣ Build everything
```bash
npm run build:all
```

### 4️⃣ Start the server
```bash
npm start --prefix backend
```

---

## 🌐 Access

- Desktop: http://localhost:5000  
- Mobile: Open using your system Wi-Fi IP  
  Example: `http://192.168.1.38:5000`

Both devices must be on the same network.

---

## 🔗 API Endpoints

- POST `/upload` – Upload a file  
- GET `/fileinfo/:code` – Get file metadata  
- GET `/download/:code` – Download file  

---

## 📂 Project Structure

```
ShareNPlay/
├── backend/
│   ├── uploads/        # Auto-cleaned shared files
│   └── server files
├── frontend/
│   ├── public/
│   └── src/
├── package.json
├── README.md
└── .gitignore
```

---

## ☁️ Deployment Checklist

- Mount a persistent volume to:
  ```
  /backend/uploads
  ```
  Prevents file loss on restarts.

- Application runs on a **single unified port**, ideal for cloud deployment.

---

## 🛠 Troubleshooting

**Port already in use**
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Common checks**
- Node.js version is 18+
- Port 5000 is free
- Backend logs show no errors

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 🧠 Design Philosophy

Performance first.  
No RAM abuse.  
No fragile demos.

Clone → Install → Run.  
If it doesn’t work this way, the setup is wrong.
