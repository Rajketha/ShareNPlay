# ShareNPlay 🎮

ShareNPlay is a **real-time multiplayer mini-games and file-sharing web application** built with **React, Node.js, Express, and Socket.IO**.

Two users can join using a code, play multiplayer games, and share files securely using links or QR codes.

---

## ✅ Requirements

- **Node.js 18 or newer**  
  Download from: https://nodejs.org

This is the only requirement.

---

## 🚀 Run the Project (Recommended Way)

Follow the steps below **exactly**. These steps install dependencies for the root, backend, and frontend, then start everything together.

### Step 1: Clone the repository
```bash
git clone https://github.com/Rajketha/ShareNPlay.git
cd ShareNPlay
```

### Step 2: Install root dependencies
```bash
npm install
```

### Step 3: Install backend and frontend dependencies
```bash
npm run install:all
```

### Step 4: Start the entire application
```bash
npm run dev
```

### ✅ That’s it

- **Backend:** http://localhost:5000  
- **Frontend:** http://localhost:3002  

Open the frontend URL in your browser.

No second terminal.  
No manual backend/frontend start.  
Works on **Windows, macOS, and Linux**.

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
├── package.json    # Root controller (single-command setup)
├── README.md
└── .gitignore
```

---

## 🛠 Troubleshooting

If something doesn’t work:

- Ensure Node.js version is **18+**
- Ensure ports **3002** and **5000** are free
- Check terminal output for errors

Kill a port if needed:
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

---

## 🚀 Deployment

Build the frontend:
```bash
cd frontend
npm run build
```

Serve the build folder:
```bash
npx serve -s build
```

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 🤝 Contributing

1. Fork the repository  
2. Create a new branch  
3. Make your changes  
4. Test thoroughly  
5. Submit a pull request  

---

**This project is designed to run with one clear flow:  
clone → install → run.  
If it doesn’t work with the steps above, the setup is wrong.**
