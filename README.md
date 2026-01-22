# ShareNPlay 🎮

ShareNPlay is a real-time multiplayer mini-games and file-sharing web application built with **React, Node.js, Express, and Socket.IO**.

Two users can join using a code, play multiplayer games, and share files securely using links or QR codes.

---

## ✅ Requirements

- **Node.js 18+**  
  Download: https://nodejs.org

This is the only requirement.

---

## 🚀 Run the Project (ALL STEPS IN ONE)

Open a terminal and run the following commands **in order**:

```bash
git clone https://github.com/Rajketha/ShareNPlay.git
cd ShareNPlay
npm install
npm run dev
```

That’s it.

- **Backend:** http://localhost:5000  
- **Frontend:** http://localhost:3002  

Open the frontend URL in your browser.

No second terminal.  
No manual backend/frontend start.  
No OS-specific steps.

---

## 🎮 Features

### Multiplayer Mini-Games
- Rock Paper Scissors  
- Tap War  
- Quick Quiz  
- Emoji Memory  
- Typing Speed  
- Reaction Time  

Game features:
- Real-time gameplay with Socket.IO  
- Automatic game start when both players join  
- Score tracking and winner display  
- Sender selects the game  

---

### 📁 File Sharing
- Upload files using custom codes  
- Share via QR code or direct link  
- Download files using codes  
- Supports all file types  
- Mobile-friendly UI  

---

## 🔗 API Endpoints

- `POST /upload` – Upload files  
- `GET /fileinfo/:code` – Get file information  
- `GET /download/:code` – Download file  

---

## 🗂 Project Structure

```
ShareNPlay/
├── backend/        # Express + Socket.IO server
├── frontend/       # React application
├── package.json    # Root controller (single command)
├── README.md
└── .gitignore
```

---

## 🛠 Troubleshooting

If something fails:

- Ensure Node.js version is **18+**
- Make sure ports **3002** and **5000** are free
- Check terminal output for errors

Kill port if needed:
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

---

## 🚀 Deployment

Build frontend:
```bash
cd frontend
npm run build
```

Serve the build:
```bash
npx serve -s build
```

---

## 📄 License

MIT License.

---

**This project is designed so that anyone can run it with ONE command after cloning.  
If it doesn’t run with the steps above, the setup is wrong.**
