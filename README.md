# ShareNPlay 🎮

ShareNPlay is a **real-time multiplayer mini-games and file-sharing web application** built using **React, Node.js, Express, and Socket.IO**.

Two users can join using a code, play multiplayer games, and securely share files using links or QR codes.

---

## ✨ Features

### 🎮 Multiplayer Mini-Games
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
- Share files via QR code or direct link
- Download files using codes
- Supports all file types
- Mobile-friendly interface

---

## 🧰 Tech Stack
- **Frontend:** React
- **Backend:** Node.js, Express
- **Real-time:** Socket.IO
- **File Handling:** Multer

---

## ✅ Requirements
- **Node.js 18 or newer**
- **npm** (comes with Node.js)

Download from: https://nodejs.org

---

## 🚀 Run the Project (Single Flow)

### 1️⃣ Clone the repository
```bash
git clone https://github.com/Rajketha/ShareNPlay.git
cd ShareNPlay
```

### 2️⃣ Install root dependencies
```bash
npm install
```

### 3️⃣ Install backend and frontend dependencies
```bash
npm run install:all
```

### 4️⃣ Start backend and frontend together
```bash
npm run dev
```

---

### ✅ That’s it

- **Backend:** http://localhost:5000  
- **Frontend:** http://localhost:3002  

Open the frontend URL in your browser.

No second terminal.  
No manual backend/frontend start.  
Works on **Windows, macOS, and Linux**.

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
│   ├── public/     # index.html and static files
│   └── src/        # React source code
├── package.json    # Root controller (single-command setup)
├── README.md
└── .gitignore
```

---

## 🛠 Troubleshooting

### Port already in use
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Common issues
- Ensure Node.js version is **18+**
- Ensure ports **3002** and **5000** are free
- Check terminal output for errors

---

## 🚀 Deployment

### Build frontend
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
