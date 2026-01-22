import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import './index.css';
import confetti from 'canvas-confetti';

const BACKEND_URL = 'http://192.168.1.38:5000';
const FEATURES = [
  { icon: '🔒', text: 'Secure 6-digit code file sharing' },
  { icon: '📱', text: 'QR code for easy sharing' },
  { icon: '🚀', text: 'Real-time transfer with rocket animation' },
  { icon: '🎮', text: '6 fun mini-games while you wait' },
  { icon: '🤝', text: 'Best-of-3 multiplayer game flow' },
  { icon: '😜', text: 'Dare system for the winner' },
  { icon: '🧹', text: 'Auto-cleanup after 1 hour' },
  { icon: '🌙', text: 'Glassmorphism & animated illusion theme - NEW!' },
];

// Add this mapping at the top of the file (after imports)
const gameTypeMap = {
  'rock-paper-scissors': 'rockPaperScissors',
  'tap-war': 'tapWar',
  'quick-quiz': 'quickQuiz',
  'emoji-memory': 'emojiMemory',
  'typing-speed': 'typingSpeed',
  'reaction-time': 'reactionTime'
};

// Suppress noisy WebSocket warning from socket.io upgrade
const originalConsoleError = console.error;
console.error = function (...args) {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('WebSocket is closed before the connection is established')
  ) {
    // Suppress this specific warning
    return;
  }
  originalConsoleError.apply(console, args);
};

const LAN_IP = "192.168.1.38"; // <-- Replace with your actual LAN IP
const FRONTEND_PORT = "3002";  // <-- Replace with your frontend port if different

function App() {
  const [view, setView] = useState('home');
  const [file, setFile] = useState(null);
  const [code, setCode] = useState('');
  const [dare, setDare] = useState('');
  const [fileInfo, setFileInfo] = useState(null);
  const [socket, setSocket] = useState(null);
  const [playerType, setPlayerType] = useState('');
  const [dares, setDares] = useState({});
  const [round, setRound] = useState(1);
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [gameResult, setGameResult] = useState(null);
  const [gameWinner, setGameWinner] = useState(null);
  const [action, setAction] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');
  const [receiverFileInfo, setReceiverFileInfo] = useState(null);
  const [receiverCode, setReceiverCode] = useState('');
  const [receiverDare, setReceiverDare] = useState('');
  const [receiverError, setReceiverError] = useState('');
  const [gameData, setGameData] = useState(null);
  // Add state for dare categories and selected category for sender and receiver
  const [dareCategories, setDareCategories] = useState([]);
  const [selectedDareCategory, setSelectedDareCategory] = useState('');
  const [receiverDareCategory, setReceiverDareCategory] = useState('');
  const [selectedGame, setSelectedGame] = useState('');
  // Add state for waiting debug info
  const [waitingHint, setWaitingHint] = useState('');
  // Add mobile detection
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileInstructions, setShowMobileInstructions] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  // In your App component, add a state for the current game
  const [currentGame, setCurrentGame] = useState('');
  // Add state for playerMap
  const [playerMap, setPlayerMap] = useState({});
  const [playerRole, setPlayerRole] = useState(null); // 'player1' or 'player2'

  // Add this effect after all useState declarations and before socket event handlers
  useEffect(() => {
    if (
      socket &&
      playerMap &&
      socket.id &&
      playerMap.player1 &&
      playerMap.player2
    ) {
      if (socket.id === playerMap.player1 && playerRole !== 'player1') setPlayerRole('player1');
      else if (socket.id === playerMap.player2 && playerRole !== 'player2') setPlayerRole('player2');
    }
  }, [socket, playerMap, playerRole]);

  // Fetch dare categories on mount
  useEffect(() => {
    axios.get(`${BACKEND_URL}/dare-categories`).then(res => {
      setDareCategories(res.data);
    });
  }, []);

  // Handle URL parameters for direct receiver access
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('code');
    const viewParam = urlParams.get('view');
    
    if (codeParam && viewParam === 'receiver') {
      setReceiverCode(codeParam);
      setView('receiver');
      // Automatically fetch file info for the code
      if (codeParam.length === 6) {
        axios.get(`${BACKEND_URL}/fileinfo/${codeParam}`)
          .then(res => {
            setReceiverFileInfo(res.data);
            setReceiverError('');
            // Show success message for QR code access
            setTimeout(() => {
              alert('🎉 Welcome! File found and ready to download. Enter your dare to join the game!');
            }, 500);
          })
          .catch(error => {
            console.error('Error fetching file info:', error);
            setReceiverError('No file found for this code. Please check the code and try again.');
          });
      }
    }
  }, []);

  useEffect(() => {
    console.log('🔌 Attempting to connect to backend:', BACKEND_URL);
    
    const s = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      timeout: 30000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: 10
    });
    setSocket(s);
    
    // Connection events with enhanced debugging
    s.on('connect', () => {
      console.log('✅ Connected to backend from:', navigator.userAgent);
      console.log('📱 Is mobile:', /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
      console.log('🔗 Socket ID:', s.id);
      console.log('🌐 Transport:', s.io.engine.transport.name);
      setConnectionStatus('connected');
      setError('');
    });
    
    s.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        description: error.description,
        context: error.context,
        type: error.type
      });
      setConnectionStatus('error');
      setError(`Connection failed: ${error.message}`);
    });
    
    s.on('disconnect', (reason) => {
      console.log('❌ Disconnected from backend:', reason);
      setConnectionStatus('disconnected');
    });
    
    s.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected after', attemptNumber, 'attempts');
      setConnectionStatus('connected');
      setError('');
    });
    
    s.on('reconnect_error', (error) => {
      console.error('🔄 Reconnection error:', error);
    });
    
    s.on('reconnect_failed', () => {
      console.error('🔄 Reconnection failed after all attempts');
      setConnectionStatus('error');
      setError('Failed to reconnect to server');
    });
    
    s.on('playerJoined', ({ playerType, dare }) => {
      console.log('Player joined:', playerType, dare);
    });
    
    s.on('gameCreated', ({ roomCode, gameType }) => {
      console.log('Game created:', { roomCode, gameType });
    });
    
    s.on('gameJoined', ({ roomCode, gameType }) => {
      console.log('Game joined:', { roomCode, gameType });
    });
    
    s.on('error', (error) => {
      console.error('Socket error:', error);
      setError(error.message || 'Game error occurred');
    });
    
    s.on('gameStart', ({ gameType, round, maxRounds, playerMap, gameData, dares }) => {
      const mappedGame = gameTypeMap[gameType] || gameType;
      setCurrentGame(mappedGame);
      setDares(dares || {});
      setRound(round || 1);
      setView('game');
      setScores({ player1: 0, player2: 0 });
      setAction('');
      setGameResult(null);
      setGameWinner(null);
      setGameData(gameData);
      // Update fileInfo with game suggestion
      setFileInfo(prev => prev ? { ...prev, gameSuggestion: { game: mappedGame } } : { gameSuggestion: { game: mappedGame } });
      console.log('Game started:', mappedGame, gameData); // Debug log
    });
    s.on('roundResult', ({ result, scores, round, playerMap }) => {
      if (!result || !scores || !round) {
        console.error('Invalid roundResult payload:', { result, scores, round, playerMap });
        setGameResult(null);
        return;
      }
      setGameResult(result);
      setScores(scores);
      setRound(round);
      setPlayerMap(playerMap);
    });
    s.on('gameEnd', ({ winner, finalScores, scores, dares }) => {
      console.log('Game end received:', { winner, finalScores, scores, dares });
      setGameWinner({ winner, finalScores, scores, dares });
      setView('end');
    });
    s.on('nextRound', ({ round, gameData }) => {
      setRound(round);
      setGameData(gameData);
      setAction(''); // Clear the input for new round
      setGameResult(null);
      console.log(`Starting round ${round} with new game data`);
    });
    return () => s.disconnect();
  }, []);

  useEffect(() => {
    if (view === 'waiting') {
      setWaitingHint('');
      const timer = setTimeout(() => {
        setWaitingHint('Still waiting? Make sure both players joined with the same code and entered a dare.');
      }, 7000);
      
      // Add mobile-specific hints
      const mobileTimer = setTimeout(() => {
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          setWaitingHint('📱 Mobile user detected! Make sure the desktop user has also joined the game with the same code.');
        }
      }, 3000);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(mobileTimer);
      };
    }
  }, [view]);

  // Place confetti useEffect here, before any return or conditional
  useEffect(() => {
    // Only trigger confetti when game ends and player wins
    if (view === 'end' && gameWinner && gameWinner.winner === playerType && gameWinner.winner !== 'tie') {
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
    }
  }, [view, gameWinner, playerType]);

  const handleUpload = async () => {
    setIsUploading(true);
    const form = new FormData();
    form.append('file', file);
    const res = await axios.post(`${BACKEND_URL}/upload`, form);
    setCode(res.data.code);
    setFileInfo({ fileName: res.data.fileName, mimetype: res.data.mimetype });
    setView('sender');
    setIsUploading(false);
  };

  const handleJoinAsSender = () => {
    console.log('Joining as sender:', { code, dare, selectedGame });
    socket.emit('joinRoom', { code, playerType: 'sender', dare, selectedGame });
    setPlayerType('sender');
    setView('waiting');
  };

  const handleJoinAsReceiver = async (receiverCode, receiverDare) => {
    try {
      console.log('Joining as receiver:', { receiverCode, receiverDare });
      const res = await axios.get(`${BACKEND_URL}/fileinfo/${receiverCode}`);
      setFileInfo(res.data);
      socket.emit('joinRoom', { code: receiverCode, playerType: 'receiver', dare: receiverDare });
      setPlayerType('receiver'); // <-- ensure this is always called
      setView('waiting');
    } catch (error) {
      console.error('Error joining as receiver:', error);
      setError('The sender has not started the game yet. Please wait for the sender to join first.');
    }
  };

  const handleAction = (move) => {
    setAction(move);
    socket.emit('gameAction', { action: move, value: move });
  };

  const downloadFile = async () => {
    setIsDownloading(true);
    const res = await axios.get(`${BACKEND_URL}/download/${code}`, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: fileInfo.mimetype });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileInfo.fileName;
    a.click();
    setIsDownloading(false);
  };

  // New: fetch file info for receiver
  const handleReceiverCodeChange = async (e) => {
    const val = e.target.value;
    setReceiverCode(val);
    setReceiverFileInfo(null);
    setReceiverError('');
    if (val.length === 6) {
      try {
        const res = await axios.get(`${BACKEND_URL}/fileinfo/${val}`);
        setReceiverFileInfo(res.data);
        setReceiverError(''); // Clear any previous errors
      } catch (error) {
        console.error('Error fetching file info:', error);
        setReceiverError('No file found for this code. Please check the code and try again.');
      }
    }
  };

  // Helper to get local IP for QR code
  const getLocalIp = () => {
    // Replace this with your actual local IP or fetch dynamically if needed
    return '192.168.1.38'; // <-- change this to your computer's IP if needed
  };

  // Enhanced QR code generation with mobile instructions
  const generateQRCode = () => {
    if (!code) return null;
    const port = window.location.port || '3000';
    const ip = getLocalIp();
    const baseUrl = `http://${ip}:${port}`;
    const mobileAppUrl = `${baseUrl}/mobile-app.html?code=${code}&view=receiver`;
    const receiverUrl = `${baseUrl}/receiver?code=${code}`;
    
    return (
      <div className="qr-section">
        <h3>📱 Mobile App QR Code</h3>
        <div className="qr-container">
          <QRCodeSVG value={mobileAppUrl} size={200} />
        </div>
        <div className="mobile-instructions">
          <p><strong>📱 Scan to install mobile app!</strong></p>
          <p>• Opens mobile app download page</p>
          <p>• Install as PWA for app-like experience</p>
          <p>• All games and features included</p>
        </div>
        <button 
          className="copy-btn"
          onClick={() => {
            navigator.clipboard.writeText(mobileAppUrl);
            alert('Mobile app link copied to clipboard!');
          }}
        >
          📋 Copy Mobile App Link
        </button>
        
        {isMobile && (
          <div className="mobile-tip">
            <p>💡 <strong>You're on mobile!</strong> Share this QR code with a friend to play together.</p>
          </div>
        )}
      </div>
    );
  };

  // HOMEPAGE: beautiful glass, illusion bg, features 2-column, centered
  if (view === 'home') return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center'}}>
      <div className="glass home-glass">
        <h1 className="home-title">ShareNPlay</h1>
        <p className="home-subtitle">Secure file sharing with fun mini-games</p>
        <div className="home-btn-group">
          <button 
            onClick={() => setView('sender')}
            className="home-btn send-btn"
          >
            📤 Send File
          </button>
          <button 
            onClick={() => setView('receiver')}
            className="home-btn receive-btn"
          >
            📥 Receive File
          </button>
        </div>
        <div className="home-info">
          <p>Share files securely with a 6-digit code</p>
          <p>Play mini-games while waiting • Winner gets a dare!</p>
          <p className="home-mobile-note">
            <b>Works on mobile and desktop!</b><br/>
            You can <b>send</b> or <b>receive</b> files from any device.
          </p>
        </div>
        <div className="home-features">
          <ul className="features-list">
            {FEATURES.map((f,i) => (
              <li key={i}>
                <span className="animated-icon">{f.icon}</span> <span>{f.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {error && <div style={{color:'#e74c3c'}}>{error}</div>}
    </div>
  );
  if (view === 'sender') return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center'}}>
      <div className="glass" style={{maxWidth:'500px',width:'100%',padding:'2em'}}>
        <h2 style={{textAlign:'center',marginBottom:'1.5em',color:'#333'}}>📤 Send File</h2>
        
        {!code ? (
          <div style={{textAlign:'center'}}>
            <div style={{marginBottom:'1.5em'}}>
              <input 
                type="file" 
                onChange={e => setFile(e.target.files[0])}
                style={{
                  display: 'none'
                }}
                id="fileInput"
              />
              <label 
                htmlFor="fileInput"
                style={{
                  display: 'inline-block',
                  padding: '1em 2em',
                  backgroundColor: '#f8f9fa',
                  border: '2px dashed #dee2e6',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1.1em',
                  color: '#6c757d'
                }}
              >
                {file ? `📎 ${file.name}` : '📁 Choose File'}
              </label>
            </div>
            
            <button 
              onClick={handleUpload} 
              disabled={!file || isUploading}
              style={{
                padding: '0.8em 2em',
                fontSize: '1.1em',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: !file || isUploading ? 'not-allowed' : 'pointer',
                opacity: !file || isUploading ? 0.6 : 1
              }}
            >
              {isUploading ? '⏳ Generating Code...' : '🚀 Send & Generate Code'}
            </button>
          </div>
        ) : (
          <div style={{textAlign:'center'}}>
            <div style={{marginBottom:'2em'}}>
              <h3 style={{color:'#28a745',marginBottom:'0.5em'}}>✅ File Uploaded!</h3>
              <div className="code-display" style={{fontSize:'2em',fontWeight:'bold',color:'#007bff',marginBottom:'0.5em'}}>{code}</div>
              <p style={{color:'#6c757d',marginBottom:'1em'}}>Share this code with the receiver</p>
              <div className="qr-container">
                <QRCodeSVG 
                  value={`http://${LAN_IP}:${FRONTEND_PORT}${window.location.pathname}?code=${code}&view=receiver`} 
                  size={120} 
                  style={{margin:'0 auto'}} 
                />
              </div>
              <p style={{color:'#28a745',fontSize:'0.9em',marginTop:'0.5em',fontStyle:'italic'}}>
                📱 Scan this QR code to open receiver page directly!
              </p>
              <button 
                onClick={() => {
                  const directLink = `http://${LAN_IP}:${FRONTEND_PORT}${window.location.pathname}?code=${code}&view=receiver`;
                  navigator.clipboard.writeText(directLink);
                  alert('Direct link copied to clipboard!');
                }}
                style={{
                  padding: '0.5em 1em',
                  fontSize: '0.9em',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '0.5em'
                }}
              >
                📋 Copy Direct Link
              </button>
              
              {/* Mobile App Download Section */}
              <div style={{
                marginTop: '2em',
                padding: '1.5em',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}>
                <h4 style={{textAlign: 'center', marginBottom: '1em', color: '#333'}}>📱 Mobile App Access</h4>
                <div style={{display: 'flex', flexDirection: 'column', gap: '1em'}}>
                  <div style={{textAlign: 'center'}}>
                    <p style={{fontSize: '0.9em', color: '#666', marginBottom: '0.5em'}}>
                      <strong>🎮 Play in Browser:</strong> Scan QR code above - no download needed!
                    </p>
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <button 
                      onClick={() => {
                        if ('serviceWorker' in navigator) {
                          navigator.serviceWorker.register('/service-worker.js');
                          alert('PWA installation available! Look for "Add to Home Screen" in your browser menu.');
                        } else {
                          alert('PWA not supported in this browser. Use the QR code to play in browser!');
                        }
                      }}
                      style={{
                        padding: '0.5em 1em',
                        fontSize: '0.9em',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginRight: '0.5em'
                      }}
                    >
                      📱 Install PWA
                    </button>
                    <a 
                      href="https://github.com/Rajketha/ShareNPlay/archive/refs/heads/main.zip"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '0.5em 1em',
                        fontSize: '0.9em',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        display: 'inline-block'
                      }}
                    >
                      💻 Download Desktop
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{marginBottom:'1.5em'}}>
              <select 
                value={selectedDareCategory} 
                onChange={e => setSelectedDareCategory(e.target.value)}
                style={{
                  padding: '0.5em',
                  fontSize: '1em',
                  borderRadius: '4px',
                  border: '1px solid #ced4da',
                  marginRight: '0.5em',
                  minWidth: '150px'
                }}
              >
                <option value="">🎯 Select Dare Category</option>
                {dareCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
              <button 
                disabled={!selectedDareCategory} 
                onClick={async()=>{
                  const res = await axios.get(`${BACKEND_URL}/random-dare/${selectedDareCategory}`);
                  setDare(res.data.dare);
                }}
                style={{
                  padding: '0.5em 1em',
                  fontSize: '1em',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: !selectedDareCategory ? 'not-allowed' : 'pointer',
                  opacity: !selectedDareCategory ? 0.6 : 1
                }}
              >
                🎲 Get Dare
              </button>
            </div>
            
            <input 
              placeholder="💬 Your dare (or get one randomly)" 
              value={dare} 
              onChange={e => setDare(e.target.value)}
              style={{
                width: '100%',
                padding: '0.8em',
                fontSize: '1em',
                borderRadius: '4px',
                border: '1px solid #ced4da',
                marginBottom: '1.5em',
                boxSizing: 'border-box'
              }}
            />
            
            <div style={{marginBottom:'1.5em'}}>
              <select 
                value={selectedGame} 
                onChange={e => setSelectedGame(e.target.value)}
                style={{
                  padding: '0.5em',
                  fontSize: '1em',
                  borderRadius: '4px',
                  border: '1px solid #ced4da',
                  minWidth: '200px'
                }}
              >
                <option value="">🎮 Auto-select game</option>
                <option value="rockPaperScissors">✂️ Rock Paper Scissors</option>
                <option value="tapWar">👆 Tap War</option>
                <option value="quickQuiz">🧠 Quick Quiz</option>
                <option value="emojiMemory">😊 Emoji Memory</option>
                <option value="typingSpeed">⌨️ Typing Speed</option>
                <option value="reactionTime">⚡ Reaction Time</option>
              </select>
            </div>
            
            <button 
              onClick={handleJoinAsSender} 
              disabled={!dare}
              style={{
                padding: '0.8em 2em',
                fontSize: '1.1em',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: !dare ? 'not-allowed' : 'pointer',
                opacity: !dare ? 0.6 : 1,
                marginBottom: '1em'
              }}
            >
              🎮 Join Game
            </button>
          </div>
        )}
        
        <button 
          onClick={()=>{setView('home');setFile(null);setCode('');setDare('');}}
          style={{
            padding: '0.5em 1em',
            fontSize: '0.9em',
            backgroundColor: 'transparent',
            color: '#6c757d',
            border: '1px solid #6c757d',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
  if (view === 'receiver') return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center'}}>
      <div className="glass" style={{maxWidth:'500px',width:'100%',padding:'2em'}}>
        <h2 style={{textAlign:'center',marginBottom:'1.5em',color:'#333'}}>📥 Receive File</h2>
        
        <div style={{textAlign:'center'}}>
          <div style={{marginBottom:'2em'}}>
            <input 
              placeholder="🔢 Enter 6-digit code" 
              value={receiverCode} 
              onChange={handleReceiverCodeChange} 
              maxLength={6}
              style={{
                width: '100%',
                padding: '1em',
                fontSize: '1.2em',
                textAlign: 'center',
                borderRadius: '8px',
                border: '2px solid #dee2e6',
                boxSizing: 'border-box',
                letterSpacing: '0.2em',
                fontWeight: 'bold'
              }}
            />
          </div>
          
          {receiverFileInfo && (
            <div style={{
              marginBottom:'2em',
              padding: '1em',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <h3 style={{color:'#28a745',marginBottom:'0.5em'}}>📎 File Found!</h3>
              <p style={{fontSize:'1.1em',color:'#333',marginBottom:'1em'}}>
                <strong>{receiverFileInfo.fileName}</strong>
              </p>
              <button 
                onClick={async()=>{
                  const res = await axios.get(`${BACKEND_URL}/download/${receiverCode}`, { responseType: 'blob' });
                  const blob = new Blob([res.data], { type: receiverFileInfo.mimetype });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = receiverFileInfo.fileName;
                  a.click();
                }}
                style={{
                  padding: '0.8em 2em',
                  fontSize: '1.1em',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                💾 Download File
              </button>
            </div>
          )}
          
          {receiverFileInfo && (
            <>
              <div style={{marginBottom:'1.5em'}}>
                <select 
                  value={receiverDareCategory} 
                  onChange={e => setReceiverDareCategory(e.target.value)}
                  style={{
                    padding: '0.5em',
                    fontSize: '1em',
                    borderRadius: '4px',
                    border: '1px solid #ced4da',
                    marginRight: '0.5em',
                    minWidth: '150px'
                  }}
                >
                  <option value="">🎯 Select Dare Category</option>
                  {dareCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                <button 
                  disabled={!receiverDareCategory} 
                  onClick={async()=>{
                    const res = await axios.get(`${BACKEND_URL}/random-dare/${receiverDareCategory}`);
                    setReceiverDare(res.data.dare);
                  }}
                  style={{
                    padding: '0.5em 1em',
                    fontSize: '1em',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: !receiverDareCategory ? 'not-allowed' : 'pointer',
                    opacity: !receiverDareCategory ? 0.6 : 1
                  }}
                >
                  🎲 Get Dare
                </button>
              </div>
              
              <input 
                placeholder="💬 Your dare (or get one randomly)" 
                value={receiverDare} 
                onChange={e => setReceiverDare(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.8em',
                  fontSize: '1em',
                  borderRadius: '4px',
                  border: '1px solid #ced4da',
                  marginBottom: '1.5em',
                  boxSizing: 'border-box'
                }}
              />
              
              <button 
                onClick={async()=>{
                  setCode(receiverCode);
                  setDare(receiverDare);
                  await handleJoinAsReceiver(receiverCode, receiverDare);
                }} 
                disabled={!receiverCode || !receiverDare} 
                style={{
                  padding: '0.8em 2em',
                  fontSize: '1.1em',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: !receiverCode || !receiverDare ? 'not-allowed' : 'pointer',
                  opacity: !receiverCode || !receiverDare ? 0.6 : 1,
                  marginBottom: '1em'
                }}
              >
                🎮 Join Game
              </button>
            </>
          )}
          
          {receiverError && (
            <div style={{
              color:'#dc3545',
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '4px',
              padding: '0.8em',
              marginBottom: '1em'
            }}>
              ⚠️ {receiverError}
            </div>
          )}
        </div>
        
        <button 
          onClick={()=>{setView('home');setReceiverCode('');setReceiverDare('');setReceiverFileInfo(null);}}
          style={{
            padding: '0.5em 1em',
            fontSize: '0.9em',
            backgroundColor: 'transparent',
            color: '#6c757d',
            border: '1px solid #6c757d',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
  if (view === 'waiting') return (
    <div className="waiting-screen" style={{padding:40, textAlign:'center'}}>
      <h2>Waiting for other player to join...</h2>
      
      {/* Connection Status */}
      <div style={{
        margin: '1em 0',
        padding: '0.5em',
        borderRadius: '8px',
        backgroundColor: connectionStatus === 'connected' ? '#d4edda' : 
                         connectionStatus === 'error' ? '#f8d7da' : '#fff3cd',
        color: connectionStatus === 'connected' ? '#155724' : 
               connectionStatus === 'error' ? '#721c24' : '#856404',
        border: `1px solid ${connectionStatus === 'connected' ? '#c3e6cb' : 
                           connectionStatus === 'error' ? '#f5c6cb' : '#ffeaa7'}`
      }}>
        <strong>Connection Status:</strong> {
          connectionStatus === 'connected' ? '✅ Connected' :
          connectionStatus === 'error' ? '❌ Connection Error' :
          connectionStatus === 'disconnected' ? '❌ Disconnected' :
          '⏳ Connecting...'
        }
      </div>
      
      <div className="score-display">
        <div><b>Player Type:</b> {playerType}</div>
        <div><b>Code:</b> {code}</div>
      </div>
      <div style={{margin:'1em 0', padding:'1em', backgroundColor:'#f8f9fa', borderRadius:'8px'}}>
        <b>Your Dare:</b> {dare}
      </div>
      {waitingHint && <div style={{color:'#e67e22',marginTop:16, padding:'1em', backgroundColor:'#fff3cd', borderRadius:'8px'}}>{waitingHint}</div>}
      <div style={{marginTop:24, color:'#888', fontSize:'0.98em'}}>
        <ul style={{paddingLeft:20}}>
          <li>Both sender and receiver must join with the same code.</li>
          <li>Both must select or enter a dare and click Join.</li>
          <li>If stuck, reload and try again in a new tab/window.</li>
          <li>Make sure both devices are on the same WiFi network.</li>
        </ul>
      </div>
      
      {/* Mobile-specific instructions */}
      {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (
        <div style={{
          marginTop: '1em',
          padding: '1em',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          border: '1px solid #bbdefb'
        }}>
          <h4 style={{color: '#1976d2', marginBottom: '0.5em'}}>📱 Mobile User Tips:</h4>
          <ul style={{textAlign: 'left', paddingLeft: '1.5em', color: '#1976d2'}}>
            <li>Make sure the desktop user has also joined with code: <strong>{code}</strong></li>
            <li>Both users must enter a dare and click "Join Game"</li>
            <li>If waiting too long, ask the desktop user to refresh their page</li>
          </ul>
        </div>
      )}
      
      {/* Debug Information */}
      {/* <div style={{
      marginTop: '1em',
      padding: '1em',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #dee2e6',
      fontSize: '0.9em'
    }}>
      <h4 style={{color: '#6c757d', marginBottom: '0.5em'}}>🔧 Debug Info:</h4>
      <p><strong>Player Type:</strong> {playerType}</p>
      <p><strong>Room Code:</strong> {code}</p>
      <p><strong>Connection Status:</strong> {connectionStatus}</p>
      <p><strong>Socket ID:</strong> {socket?.id || 'Not connected'}</p>
      <p><strong>Transport:</strong> {socket?.io?.engine?.transport?.name || 'Unknown'}</p>
    </div> */}
    </div>
  );
  if (view === 'game') return (
    <div style={{padding:40}}>
      <h2>Round {round}</h2>
      <div>Dares: Sender: {dares.sender} | Receiver: {dares.receiver}</div>
              <div>Scores: Player 1 {scores.player1} - Player 2 {scores.player2}</div>
      
      {/* Game-specific UI */}
      <div style={{marginTop: '2em'}}>
        
        {currentGame === 'rockPaperScissors' && (
          <div>
            <h3>Rock Paper Scissors - Round {round}</h3>
            {gameResult && (
              <div style={{margin:'1em 0',padding:'1em',background:'#f8f9fa',borderRadius:'8px',border:'1px solid #dee2e6'}}>
                <p><strong>Your choice:</strong> {playerType === 'sender' ? gameResult.player1?.choice : gameResult.player2?.choice}</p>
                <p><strong>Opponent's choice:</strong> {playerType === 'sender' ? gameResult.player2?.choice : gameResult.player1?.choice}</p>
                <p><strong>Winner:</strong> {
  !playerRole
    ? '...'
    : gameResult.winner === 'tie'
      ? 'Tie'
      : (gameResult.winner === playerRole ? 'You' : 'Opponent')
}</p>
                <p><strong>Your score:</strong> {playerType === 'sender' ? scores.player1 : scores.player2}</p>
                <p><strong>Opponent's score:</strong> {playerType === 'sender' ? scores.player2 : scores.player1}</p>
              </div>
            )}
            <div className="game-controls">
              <button 
                onClick={() => handleAction('rock')} 
                disabled={!!action}
                style={{fontSize:'2em',padding:'1em',minWidth:'80px',minHeight:'80px',margin:'0.5em'}}
              >
                🪨
              </button>
              <button 
                onClick={() => handleAction('paper')} 
                disabled={!!action}
                style={{fontSize:'2em',padding:'1em',minWidth:'80px',minHeight:'80px',margin:'0.5em'}}
              >
                📄
              </button>
              <button 
                onClick={() => handleAction('scissors')} 
                disabled={!!action}
                style={{fontSize:'2em',padding:'1em',minWidth:'80px',minHeight:'80px',margin:'0.5em'}}
              >
                ✂️
              </button>
            </div>
          </div>
        )}
        
        {currentGame === 'tapWar' && (
          <TapWarGame onResult={handleAction} round={round} socket={socket} code={code} />
        )}
        
        {currentGame === 'quickQuiz' && (
          <div>
            <h3>Quick Quiz - Round {round}</h3>
            {gameData && (
              <div style={{marginBottom: '1em', padding: '1em', backgroundColor: '#f9f9f9', borderRadius: '8px'}}>
                <p style={{fontSize: '1.2em', fontWeight: 'bold'}}>Question:</p>
                <p style={{fontSize: '1.1em'}}>{gameData.question}</p>
              </div>
            )}
            <div className="input-group" style={{marginBottom: '1em'}}>
              <input 
                placeholder="Type your answer..." 
                value={action} 
                onChange={(e) => setAction(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAction(action)}
                style={{padding: '0.8em', fontSize: '1em', width: '100%', marginBottom: '0.5em', boxSizing: 'border-box'}}
              />
              <button 
                onClick={() => handleAction(action)} 
                disabled={!action}
                style={{padding: '0.8em 1.5em', fontSize: '1em', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', width: '100%'}}
              >
                Submit Answer
              </button>
            </div>
            <div style={{fontSize: '0.9em', color: '#666', textAlign: 'center'}}>
              Tip: Answer quickly and accurately!
            </div>
          </div>
        )}
        
        {currentGame === 'emojiMemory' && (
          <EmojiMemoryGame sequence={gameData?.sequence || []} onResult={handleAction} />
        )}
        
        {currentGame === 'typingSpeed' && (
          <TypingSpeedGame text={gameData?.text || ''} onResult={handleAction} />
        )}
        
        {currentGame === 'reactionTime' && (
          <ReactionTimeGame onResult={handleAction} round={round} />
        )}
        
        {/* Fallback for unknown game types */}
        {currentGame === '' && (
          <div>
            <h3>Default Game - Rock Paper Scissors</h3>
            <div className="game-controls">
              <button 
                onClick={() => handleAction('rock')} 
                disabled={!!action}
                style={{fontSize:'2em',padding:'1em',minWidth:'80px',minHeight:'80px',margin:'0.5em'}}
              >
                🪨
              </button>
              <button 
                onClick={() => handleAction('paper')} 
                disabled={!!action}
                style={{fontSize:'2em',padding:'1em',minWidth:'80px',minHeight:'80px',margin:'0.5em'}}
              >
                📄
              </button>
              <button 
                onClick={() => handleAction('scissors')} 
                disabled={!!action}
                style={{fontSize:'2em',padding:'1em',minWidth:'80px',minHeight:'80px',margin:'0.5em'}}
              >
                ✂️
              </button>
            </div>
          </div>
        )}
      </div>
      
      {gameResult && playerRole && (
        <div className={`game-result ${gameResult.winner === playerRole ? 'win' : gameResult.winner === 'tie' ? '' : 'lose'}`} style={{marginTop: '2em', padding: '1em', backgroundColor: '#f0f8ff', borderRadius: '8px', textAlign:'center'}}>
          <h4>Round Result:</h4>
          <p style={{fontSize:'1.2em', fontWeight:'bold'}}>
            Winner: {gameResult.winner === 'tie' ? 'Tie' : (gameResult.winner === playerRole ? 'You' : 'Opponent')}
          </p>
          <p>Reason: {gameResult.reason}</p>
          <div className="score-display">
            <div><b>Player 1:</b> {scores.player1}</div>
            <div><b>Player 2:</b> {scores.player2}</div>
          </div>
          {gameResult.winner === playerRole && gameResult.winner !== 'tie' && <span style={{fontSize:'3em'}}>🏆</span>}
          {gameResult.winner !== playerRole && gameResult.winner !== 'tie' && <span style={{fontSize:'3em'}}>😢</span>}
          {gameResult.winner === 'tie' && <span style={{fontSize:'3em'}}>🤝</span>}
        </div>
      )}
    </div>
  );
  if (view === 'end') {
    console.log('END SCREEN DEBUG:', {
      playerType,
      playerRole,
      winner: gameWinner?.winner,
      dares: gameWinner?.dares
    });
    // Fallback: if playerRole is not set but playerType is, set playerRole
    if (!playerRole && playerType) {
      if (playerType === 'sender') setPlayerRole('player1');
      else if (playerType === 'receiver') setPlayerRole('player2');
      // Show loading while setting
      return (
        <div style={{padding:40, textAlign:'center'}}>
          <h2>Game Over!</h2>
          <div>Loading winner and dare...</div>
        </div>
      );
    }
    const dareText = gameWinner.dares && (playerRole === 'player1' ? gameWinner.dares.player2 : gameWinner.dares.player1);
    if (view === 'end' && playerType === 'receiver') {
      // Remove the alert for receiver debug info
    }
    return (
      <div style={{padding:40, textAlign:'center'}}>
        <h2>Game Over!</h2>
        <div style={{fontSize:'2em', margin:'1em'}}>
          {gameWinner.winner === 'tie' && <span>🤝 <b>It&apos;s a Tie!</b></span>}
          {gameWinner.winner === playerRole && gameWinner.winner !== 'tie' && <span>🏆 <b>You Win!</b></span>}
          {gameWinner.winner !== playerRole && gameWinner.winner !== 'tie' && <span>😢 <b>You Lose</b></span>}
        </div>
        <div style={{fontSize:'1.2em', margin:'1em 0'}}>
          Final Scores:<br/>
          <b>Player 1:</b> {gameWinner.finalScores ? gameWinner.finalScores.player1?.score : (gameWinner.scores ? gameWinner.scores.player1 : 0)} &nbsp; | &nbsp; <b>Player 2:</b> {gameWinner.finalScores ? gameWinner.finalScores.player2?.score : (gameWinner.scores ? gameWinner.scores.player2 : 0)}
        </div>
        {gameWinner.winner !== 'tie' && gameWinner.winner !== playerRole && (
          <div>
            Dare: {gameWinner.dares && gameWinner.dares[playerRole]
              ? gameWinner.dares[playerRole]
              : <span style={{color:'#888'}}>No dare available</span>}
          </div>
        )}
        {playerType === 'receiver' && (
          <>
            <button onClick={downloadFile} disabled={isDownloading}>Download File</button>
            <button
              style={{marginLeft: 12, marginTop: 8}}
              onClick={() => window.location.reload()}
            >
              Go to Home
            </button>
          </>
        )}
        <button onClick={() => window.location.reload()}>Restart</button>
      </div>
    );
  }
  return null;
}

export default App; 

function TapWarGame({ onResult, round, socket, code }) {
  const [taps, setTaps] = useState(0);
  const [timer, setTimer] = useState(5);
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  
  useEffect(() => {
    setTaps(0);
    setTimer(5);
    setRunning(false);
    setStartTime(null);
  }, [round]);
  
  useEffect(() => {
    let raf;
    function tick() {
      if (!running || !startTime) return;
      const elapsed = (Date.now() - startTime) / 1000;
      const left = Math.max(0, 5 - elapsed);
      setTimer(left);
      if (left > 0) {
        raf = requestAnimationFrame(tick);
      } else {
        setRunning(false);
        onResult(taps);
      }
    }
    if (running) {
      raf = requestAnimationFrame(tick);
    }
    return () => raf && cancelAnimationFrame(raf);
  }, [running, startTime, taps, onResult]);
  
  function handleTap() {
    if (!running) {
      setRunning(true);
      setTaps(1);
      setStartTime(Date.now());
      setTimer(5);
    } else {
      setTaps(t => t + 1);
    }
  }
  
  return (
    <div>
      <h3>Tap War - Tap as fast as you can!</h3>
      <div className="timer">Time left: {timer.toFixed(1)}s</div>
      <div style={{fontSize:'1.5em',margin:'0.5em 0',textAlign:'center'}}>Taps: {taps}</div>
      <div className="tap-area">
        <button 
          onClick={handleTap} 
          disabled={timer === 0} 
          style={{
            fontSize:'3em',
            padding:'2em',
            margin:'1em 0',
            minWidth:'200px',
            minHeight:'200px',
            borderRadius:'50%',
            backgroundColor: running ? '#dc3545' : '#28a745',
            border:'none',
            color:'white',
            cursor:'pointer'
          }}
        >
          {running ? 'TAP!' : 'START'}
        </button>
      </div>
    </div>
  );
}

function EmojiMemoryGame({ sequence, onResult }) {
  const emojiSet = ['😀', '😎', '🎮', '🚀', '⭐', '🎯', '🎪', '🎨'];
  const [input, setInput] = useState([]);
  const [show, setShow] = useState(true);
  useEffect(() => {
    setShow(true);
    setInput([]);
    const t = setTimeout(() => setShow(false), 2000 + sequence.length * 500);
    return () => clearTimeout(t);
  }, [sequence]);
  function handleEmojiClick(e) {
    if (show) return;
    const val = e.target.textContent;
    setInput(arr => {
      const next = [...arr, val];
      if (next.length === sequence.length) {
        let correct = 0;
        for (let i = 0; i < sequence.length; i++) if (sequence[i] === next[i]) correct++;
        onResult(correct);
      }
      return next;
    });
  }
  return (
    <div>
      <h3>Emoji Memory</h3>
      {show ? (
        <div style={{fontSize:'2em', textAlign:'center', padding:'1em'}}>{sequence.join(' ')}</div>
      ) : (
        <div>
          <div style={{textAlign:'center', marginBottom:'1em'}}>Repeat the sequence:</div>
          <div className="emoji-grid" style={{fontSize:'2em'}}>
            {emojiSet.map(e => (
              <button 
                key={e} 
                style={{
                  cursor:'pointer',
                  margin:'0.2em',
                  border:'2px solid #007bff',
                  padding:'0.5em',
                  borderRadius:'8px',
                  backgroundColor:'white',
                  fontSize:'1.5em',
                  minHeight:'60px',
                  minWidth:'60px'
                }} 
                onClick={handleEmojiClick}
              >
                {e}
              </button>
            ))}
          </div>
          <div>Your input: {input.join(' ')}</div>
        </div>
      )}
    </div>
  );
}

function TypingSpeedGame({ text, onResult }) {
  const [input, setInput] = useState('');
  const [start, setStart] = useState(null);
  const [done, setDone] = useState(false);
  
  // Reset state when text changes (new round)
  useEffect(() => {
    setInput('');
    setStart(null);
    setDone(false);
  }, [text]);
  
  function handleChange(e) {
    if (!start) setStart(Date.now());
    setInput(e.target.value);
    if (e.target.value === text) {
      setDone(true);
      const time = (Date.now() - start) / 1000;
      const wpm = Math.round((text.split(' ').length / time) * 60);
      onResult(wpm);
    }
  }
  return (
    <div>
      <h3>Typing Speed</h3>
      <div style={{marginBottom:'1em',fontStyle:'italic',color:'#666',textAlign:'center',padding:'1em',backgroundColor:'#f9f9f9',borderRadius:'8px'}}>{text}</div>
      <div className="typing-area">
        <textarea 
          value={input} 
          onChange={handleChange} 
          disabled={done} 
          rows={4} 
          style={{
            width:'100%',
            padding:'1em',
            fontSize:'1.1em',
            borderRadius:'8px',
            border:'2px solid #007bff',
            resize:'none',
            boxSizing:'border-box'
          }}
          placeholder="Start typing here..."
        />
      </div>
      {done && (
        <div style={{
          color: '#28a745', 
          fontWeight: 'bold',
          textAlign:'center',
          padding:'0.5em',
          backgroundColor:'#28a745',
          color:'white',
          borderRadius:'8px',
          marginTop:'1em'
        }}>
          ✅ Done! WPM sent.
        </div>
      )}
    </div>
  );
}

function ReactionTimeGame({ onResult, round }) {
  const [waiting, setWaiting] = useState(true);
  const [ready, setReady] = useState(false);
  const [start, setStart] = useState(null);
  const [done, setDone] = useState(false);
  
  // Reset state for new rounds and start timer
  useEffect(() => {
    setWaiting(true);
    setReady(false);
    setStart(null);
    setDone(false);
    
    // Start the timer for the new round
    const t = setTimeout(() => { 
      setReady(true); 
      setStart(Date.now()); 
    }, 1000 + Math.random() * 2000);
    
    return () => clearTimeout(t);
  }, [round]);
  
  function handleClick() {
    if (!ready || done) return;
    setDone(true);
    onResult(Date.now() - start);
  }
  return (
    <div>
      <h3>Reaction Time</h3>
      <div className="reaction-area" style={{
        margin:'1em 0',
        height:120,
        background:ready?'#4CAF50':'#f44336',
        color:'#fff',
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        fontSize:'2em',
        borderRadius:12,
        fontWeight:'bold'
      }}>
        {ready ? 'CLICK!' : 'Wait for green...' }
      </div>
      <div style={{textAlign:'center'}}>
        <button 
          onClick={handleClick} 
          disabled={!ready || done} 
          style={{
            fontSize:'2em',
            padding:'1.5em 3em',
            minWidth:'200px',
            minHeight:'80px',
            borderRadius:'12px',
            backgroundColor: ready ? '#28a745' : '#6c757d',
            border:'none',
            color:'white',
            cursor: ready ? 'pointer' : 'not-allowed'
          }}
        >
          {done ? 'Done!' : 'Click Me!'}
        </button>
      </div>
    </div>
  );
} 