# ShareNPlay 🎮

A real-time multiplayer mini-games platform with **file sharing capabilities** built with React and Node.js.

## 🎯 Features

- **Real-time multiplayer gaming** with Socket.IO
- **📁 File Sharing System:**
  - Upload files with custom codes
  - Share files via QR codes
  - Download files using codes
  - File info display
  - Support for all file types
- **🎲 Truth or Dare System:**
  - Random dare generation
  - Multiple dare categories
  - API endpoints for dare challenges
- **6 exciting mini-games:**
  - 🪨 Rock Paper Scissors
  - 👆 Tap War
  - 🧠 Quick Quiz
  - 😊 Emoji Memory
  - ⌨️ Typing Speed
  - ⚡ Reaction Time
- **Automatic game start** when both players join
- **Score tracking** and winner/loser animations
- **Sender game selection** - choose which game to play
- **Minimal, clean UI** for both sender and receiver
- **📱 Mobile responsive design** with touch-friendly controls
- **🔗 QR Code generation** for easy mobile access

## 📁 File Sharing Features

### Upload Files
- **Drag & drop** or click to upload any file type
- **Custom codes** for easy sharing
- **File info display** (name, size, type)
- **QR code generation** with direct download links

### Share Files
- **Generate QR codes** that link directly to download page
- **Copy direct links** for easy sharing
- **Mobile-optimized** download interface
- **File preview** before downloading

### Download Files
- **Enter code** to access files
- **Direct download** with one click
- **File information** display
- **Mobile-friendly** interface

### API Endpoints
- `POST /upload` - Upload files with codes
- `GET /fileinfo/:code` - Get file information
- `GET /download/:code` - Download files
- `GET /dare-categories` - Get available dare categories
- `GET /random-dare/:category` - Get random dare

## 🚀 Quick Start

## Portable Node.js Setup (Windows)

This project includes a **portable Node.js** setup, so you do NOT need to install Node.js or npm on your computer. Everything you need is included in the repository.

---

## Quick Start (Windows)

1. **Download or clone the repository**
   - Download as ZIP and extract, or use:
     ```
     git clone https://github.com/Rajketha/ShareNPlay.git
     ```

2. **Open the project folder**
   - Navigate to the extracted or cloned folder (e.g., `ShareNPlay`).

3. **Run the portable setup script**
   - Double-click `CREATE-PORTABLE-SHORTCUT.bat`.
   - This will:
     - **Kill any running Node.js servers** to avoid conflicts.
     - Install all backend and frontend dependencies using the included portable Node.js and npm.
     - Start both backend and frontend servers in new windows.
     - Pause after each step so you can see progress and errors.

4. **Access the app**
   - Open your browser and go to:
     - Frontend: [http://localhost:3002](http://localhost:3002)
     - Backend API: [http://localhost:5000](http://localhost:5000)

---

## Included Frontend Build Output

- The `frontend/build/` directory is included in this repository.
- You can use this folder for static deployment (e.g., GitHub Pages, Netlify, or any static server).
- If you only want to serve the pre-built frontend, simply use the contents of `frontend/build/`.

---

## Gameplay Notes

- **Game End Condition:** The game now ends as soon as any player reaches 2 points, or if the maximum number of rounds is reached. The winner is determined immediately and the game will not continue to further rounds once this condition is met.
- The portable Node.js binary is included in `portable-node/`.
- If you see any errors, check the output in the command windows for details.
- If you want to update dependencies, just re-run the batch file.
- For advanced users: you can also run the backend and frontend manually using the included portable Node.js.

---

## For Developers (Manual Commands)

If you want to run commands manually, use the included portable Node.js:

```
# Install backend dependencies
portable-node\node.exe portable-node\node_modules\npm\bin\npm-cli.js install --prefix backend

# Install frontend dependencies
portable-node\node.exe portable-node\node_modules\npm\bin\npm-cli.js install --prefix frontend

# Start backend
cd backend
..\portable-node\node.exe ..\portable-node\node_modules\npm\bin\npm-cli.js start

# Start frontend
cd ../frontend
..\portable-node\node.exe ..\portable-node\node_modules\npm\bin\npm-cli.js start
```

---

## Troubleshooting

- If you see a warning about file size when cloning or pulling, it's safe to ignore as long as the files are present.
- If you have issues with antivirus or permissions, try running the batch file as Administrator.
- For non-Windows users: You will need to install Node.js manually and use the standard npm commands.

---

## License
See LICENSE file for details.

## 🎮 How to Play

### Mini-Games
1. **Open the app** in your browser at `http://localhost:3002`
2. **Choose your role:**
   - **Sender:** Creates the game and selects which mini-game to play
   - **Receiver:** Joins the game using the provided code
3. **Wait for both players** to join - game starts automatically
4. **Play 3 rounds** of the selected mini-game
5. **See final scores** and winner/loser animations

### File Sharing
1. **Upload Files:**
   - Drag & drop files or click to upload
   - Enter a custom code for sharing
   - Get QR code and direct link for sharing
2. **Share Files:**
   - Share QR code with others
   - Or share the direct download link
   - Mobile users can scan QR code for instant access
3. **Download Files:**
   - Enter the file code on the download page
   - View file information before downloading
   - Click download to get the file

## 🏗️ Project Structure

```
ShareNPlay/
├── backend/                 # Node.js + Express + Socket.IO server
│   ├── server.js           # Main server file
│   ├── package.json        # Backend dependencies
│   └── node_modules/       # Backend dependencies
├── frontend/               # React application
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   └── index.js       # React entry point
│   ├── public/            # Static files
│   ├── package.json       # Frontend dependencies
│   └── node_modules/      # Frontend dependencies
├── README.md              # This file
├── .gitignore            # Git ignore rules
└── start-*.bat/ps1       # Startup scripts
```

## 🎯 Mini-Games

### Rock Paper Scissors
- Classic RPS with real-time results
- Best of 3 rounds

### Tap War
- Race to tap your button the most times
- 10-second timer per round

### Quick Quiz
- Answer trivia questions
- Fastest correct answer wins

### Emoji Memory
- Remember and repeat emoji sequences
- Increasing difficulty each round

### Typing Speed
- Type the given text as fast as possible
- WPM (Words Per Minute) scoring

### Reaction Time
- Click when the color changes
- Fastest reaction time wins

## 🔧 Development

### Backend (Port 5000)
- Express.js server
- Socket.IO for real-time communication
- CORS enabled for all localhost origins
- Game logic and state management

### Frontend (Port 3002)
- React with hooks
- Socket.IO client
- Responsive design
- Game UI components

## 📱 Mobile Access

### Local Network Access
1. **Find your computer's IP address:**
   ```bash
   ipconfig | findstr "IPv4"
   ```
2. **Access from mobile devices:**
   - Frontend: `http://YOUR_IP:3002`
   - Backend: `http://YOUR_IP:5000`
3. **QR codes automatically use your IP address** for mobile access

### Troubleshooting Mobile Access
- **Router Settings:** Disable "Client Isolation" or "AP Isolation"
- **Windows Firewall:** Allow Node.js through firewall
- **Network Discovery:** Enable network discovery in Windows
- **Same Network:** Ensure phone and computer are on same WiFi network

## 🚀 Deployment

### GitHub Pages
1. Push code to GitHub
2. Enable GitHub Pages in repository settings
3. Set source to GitHub Actions
4. The app will auto-deploy on push

### Manual Deployment
```bash
# Build the frontend
cd frontend
npm run build

# Serve the build folder
npx serve -s build -l 3000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Kill processes on ports
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**CORS errors:**
- Ensure backend is running on port 5000
- Check that frontend is connecting to correct backend URL

**Game not starting:**
- Make sure both players have joined
- Check browser console for errors
- Verify Socket.IO connection

## 📞 Support

If you encounter any issues or have questions, please:
1. Check the troubleshooting section
2. Look at the browser console for errors
3. Create an issue on GitHub

---

**Happy Gaming! 🎮✨** 