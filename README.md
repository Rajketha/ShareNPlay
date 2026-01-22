ShareNPlay 🎮

ShareNPlay is a real-time multiplayer mini-games platform with file sharing, built using React, Node.js, Express, and Socket.IO.

It allows two users to play quick multiplayer games while securely sharing files using codes or QR links.

✨ Features
🎮 Multiplayer Games

Rock Paper Scissors

Tap War

Quick Quiz

Emoji Memory

Typing Speed

Reaction Time

Features include:

Real-time gameplay using Socket.IO

Automatic game start when both players join

Score tracking and winner display

Sender selects the game

📁 File Sharing

Upload files using custom codes

Share files via QR code or direct link

Download files using codes

Supports all file types

Mobile-friendly interface

🧰 Tech Stack

Frontend: React

Backend: Node.js, Express

Real-time: Socket.IO

File Handling: Multer

QR Codes: QR generation library

✅ Requirements

Before running the project, make sure you have:

Node.js 18 or newer

npm (comes with Node.js)

Download from: https://nodejs.org

🚀 How to Run Locally
1. Clone the repository
git clone https://github.com/Rajketha/ShareNPlay.git
cd ShareNPlay

2. Start the Backend

Open Terminal 1:

cd backend
npm install
npm start


Backend runs on:

http://localhost:5000

3. Start the Frontend

Open Terminal 2:

cd frontend
npm install
npm start


Frontend runs on:

http://localhost:3002


Open this URL in your browser.

🎮 How to Play
Mini-Games

Open the app in the browser

Choose Sender or Receiver

Sender selects the game

Receiver joins using the code

Game starts automatically

First player to reach 2 points wins

File Sharing

Upload a file and generate a code

Share the code or QR link

Receiver enters the code

Download the file directly

🔗 API Endpoints

POST /upload – Upload files

GET /fileinfo/:code – Get file info

GET /download/:code – Download file

GET /dare-categories – Dare categories

GET /random-dare/:category – Random dare

📱 Mobile Access (Same Wi-Fi)

Find your system IP:

ipconfig


Open on mobile:

Frontend: http://YOUR_IP:3002

Backend: http://YOUR_IP:5000

Ensure both devices are on the same network.

🗂 Project Structure
ShareNPlay/
├── backend/        # Express + Socket.IO server
├── frontend/       # React application
├── README.md
├── .gitignore
└── package.json

🛠 Troubleshooting
Port already in use
netstat -ano | findstr :5000
taskkill /PID <PID> /F

Common issues

Ensure backend is running before frontend

Check browser console for errors

Verify Socket.IO connection

Make sure ports 3002 and 5000 are free

🚀 Deployment
Build frontend
cd frontend
npm run build


Serve using any static server:

npx serve -s build

📄 License

This project is licensed under the MIT License.

🤝 Contributing

Fork the repository

Create a new branch

Make your changes

Test thoroughly

Submit a pull request
