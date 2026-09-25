import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import './index.css';
import confetti from 'canvas-confetti';

/* ============================================================
   CONFIG
   ============================================================ */
const FRONTEND_PORT = window.location.port || '3000';
const BACKEND_URL = 'http://localhost:5000';

const GAME_IDS = [
  'rock-paper-scissors', 'tap-war', 'quick-quiz', 'emoji-memory',
  'typing-speed', 'reaction-time', 'math-blitz', 'color-rush',
  'aim-master', 'stickman-fight', 'car-racer', 'bike-racer'
];

const GAME_NAMES = {
  'rock-paper-scissors': 'Rock Paper Scissors',
  'tap-war': 'Tap War',
  'quick-quiz': 'Quick Quiz',
  'emoji-memory': 'Emoji Memory',
  'typing-speed': 'Typing Speed',
  'reaction-time': 'Reaction Time',
  'math-blitz': 'Math Blitz',
  'color-rush': 'Color Rush',
  'aim-master': 'Aim Master',
  'stickman-fight': 'Stickman Fight',
  'car-racer': 'Car Racer',
  'bike-racer': 'Bike Racer'
};

const GAME_EMOJI = {
  'rock-paper-scissors': '✊',
  'tap-war': '👆',
  'quick-quiz': '🧠',
  'emoji-memory': '🧩',
  'typing-speed': '⌨️',
  'reaction-time': '⚡',
  'math-blitz': '🔢',
  'color-rush': '🎨',
  'aim-master': '🎯',
  'stickman-fight': '🧍',
  'car-racer': '🏎',
  'bike-racer': '🏍'
};

const GAME_TAGS = {
  'rock-paper-scissors': 'Classic duel',
  'tap-war': '5s frenzy',
  'quick-quiz': 'Trivia race',
  'emoji-memory': 'Brain teaser',
  'typing-speed': 'WPM duel',
  'reaction-time': 'Fastest wins',
  'math-blitz': 'Beat the clock',
  'color-rush': 'Mind twist',
  'aim-master': 'Precision clicks',
  'stickman-fight': 'Punch or kick',
  'car-racer': 'Dodge the traffic',
  'bike-racer': 'Balance & lean'
};

const FEATURES = [
  { icon: '🔒', text: 'Secure 6-digit code file sharing' },
  { icon: '📱', text: 'QR code for easy sharing' },
  { icon: '🚀', text: 'Real-time transfer' },
  { icon: '🎮', text: '12 mini-games while you wait' },
  { icon: '🤝', text: 'Best-of-3 multiplayer game flow' },
  { icon: '😜', text: 'Dare system for the winner' },
  { icon: '🌙', text: 'Glassmorphism & animated theme' },
];

function App() {
  const [view, setView] = useState('home');
  const [file, setFile] = useState(null);
  const [code, setCode] = useState('');
  const [dare, setDare] = useState('');
  const [fileInfo, setFileInfo] = useState(null);
  const [socket, setSocket] = useState(null);
  const [dares, setDares] = useState({});
  const [round, setRound] = useState(1);
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [gameResult, setGameResult] = useState(null);
  const [gameWinner, setGameWinner] = useState(null);
  const [action, setAction] = useState('');
  const [error, setError] = useState('');
  const [receiverFileInfo, setReceiverFileInfo] = useState(null);
  const [receiverCode, setReceiverCode] = useState('');
  const [receiverDare, setReceiverDare] = useState('');
  const [receiverError, setReceiverError] = useState('');
  const [gameData, setGameData] = useState(null);
  const [dareCategories, setDareCategories] = useState([]);
  const [selectedDareCategory, setSelectedDareCategory] = useState('');
  const [selectedGame, setSelectedGame] = useState('');
  const [waitingHint, setWaitingHint] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [currentGame, setCurrentGame] = useState('');
  const [playerType, setPlayerType] = useState('');
  const [playerRole, setPlayerRole] = useState(null);

  /* ------------------------------------------------------------------ */
  /*  socket connection                                                 */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
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
    s.on('connect', () => {
      setConnectionStatus('connected');
      setError('');
    });
    s.on('connect_error', (err) => {
      setConnectionStatus('error');
      setError('Connection failed: ' + err.message);
    });
    s.on('disconnect', () => setConnectionStatus('disconnected'));
    s.on('reconnect', (n) => { setConnectionStatus('connected'); setError(''); });
    s.on('reconnect_error', () => setConnectionStatus('error'));
    s.on('reconnect_failed', () => {
      setConnectionStatus('error');
      setError('Failed to reconnect to server');
    });
    s.on('playerJoined', ({ playerType, dare }) => {});
    s.on('gameCreated', ({ roomCode, gameType }) => {});
    s.on('gameJoined', ({ roomCode, gameType }) => {});
    s.on('error', (err) => setError(err.message || 'Game error occurred'));
    s.on('gameStart', ({ gameType, round, maxRounds, playerMap, gameData, dares }) => {
      setCurrentGame(gameType);
      setDares(dares || {});
      setRound(round || 1);
      setView('game');
      setScores({ player1: 0, player2: 0 });
      setAction('');
      setGameResult(null);
      setGameWinner(null);
      setGameData(gameData);
      setFileInfo(prev => prev ? { ...prev, gameSuggestion: { game: gameType } } : { gameSuggestion: { game: gameType } });
    });
    s.on('roundResult', ({ result, scores, round, playerMap }) => {
      if (!result || !scores || !round) { setGameResult(null); return; }
      setGameResult(result);
      setScores(scores);
      setRound(round);
      setPlayerMap(playerMap);
    });
    s.on('gameEnd', ({ winner, finalScores, scores, dares }) => {
      setGameWinner({ winner, finalScores, scores, dares });
      setView('end');
    });
    s.on('nextRound', ({ round, gameData }) => {
      setRound(round);
      setGameData(gameData);
      setAction('');
      setGameResult(null);
      setGameResult(null);
    });
    return () => s.disconnect();
  }, []);

  useEffect(() => {
    if (view === 'waiting') {
      setWaitingHint('');
      const t = setTimeout(() => {
        setWaitingHint('Still waiting? Make sure both players joined with the same code and entered a dare.');
      }, 7000);
      return () => clearTimeout(t);
    }
  }, [view]);

  useEffect(() => {
    if (view === 'end' && gameWinner && gameWinner.winner === playerType && gameWinner.winner !== 'tie') {
      confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 }, colors: ['#f43f5e', '#fbbf24', '#3b82f6', '#10b981'] });
    }
  }, [view, gameWinner, playerType]);

  /* ------------------------------------------------------------------ */
  /*  file actions                                                    */
  /* ------------------------------------------------------------------ */
  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);
    setError('');
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await axios.post(`${BACKEND_URL}/upload`, form, {
        onUploadProgress: (e) => { if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100)); }
      });
      setCode(res.data.code);
      setFileInfo({ fileName: res.data.fileName, mimetype: res.data.mimetype, size: res.data.size });
      setView('sender');
    } catch (err) {
      setError(err.response?.data?.error || (err.code === 'ERR_NETWORK' ? 'Upload failed — is the server running?' : 'Upload failed. Please try again.'));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleJoinAsSender = () => {
    socket.emit('joinRoom', { code, playerType: 'sender', dare, selectedGame });
    setPlayerType('sender');
    setView('waiting');
  };

  const handleJoinAsReceiver = async (rc, rd) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/fileinfo/${rc}`);
      setFileInfo(res.data);
      socket.emit('joinRoom', { code: rc, playerType: 'receiver', dare: rd });
      setPlayerType('receiver');
      setView('waiting');
    } catch (err) {
      setError('The sender has not started the game yet. Please wait for the sender to join first.');
    }
  };

  /* ------------------------------------------------------------------ */
  /*  home: header + feature list + game picker                        */
  /* ------------------------------------------------------------------ */
  const HomeView = () => (
    <div className="home">
      <div className="home-brand">
        <h1>
          Share<span className="highlight">N</span>Play
        </h1>
        <p>Secure file sharing with <b>12 real-time mini-games</b></p>
      </div>
      <p className="home-intro">
        Send any file with a 6-digit code &amp; play a head-to-head mini-game
        while you wait. The winner gets a dare. Works on every device — desktop,
        phone, tablet — in light or dark mode.
      </p>

      <div className="hero-cta">
        <button className="btn btn-primary btn-lg" onClick={() => setView('sender')}>
          <span className="icon">📤</span> Send File
        </button>
        <button className="btn btn-secondary btn-lg" onClick={() => setView('receiver')}>
          <span className="icon">📥</span> Receive File
        </button>
      </div>

      <div className="features-grid">
        {FEATURES.map((f, i) => (
          <div key={i} className="feature">
            <div className="icon">{f.icon}</div>
            <div className="text">{f.text}</div>
          </div>
        ))}
      </div>

      <div className="game-picker-wrap">
        <div className="game-picker-label">🎮 What game will you play?</div>
        <div className="game-picker">
          {GAME_IDS.map(g => (
            <button
              key={g}
              className={`game-pill ${selectedGame === g ? 'active' : ''}`}
              onClick={() => setSelectedGame(selectedGame === g ? '' : g)}
              type="button"
            >
              <span className="emoji">{GAME_EMOJI[g]}</span>
              {GAME_NAMES[g]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  /* ------------------------------------------------------------------ */
  /*  SENDER VIEW                                                       */
  /* ------------------------------------------------------------------ */
  const SenderView = () => (
    <div className="sender">
      <div className="card">
        <div className="card-header">
          <h3>📤 Send File</h3>
          <button
            className="close-btn"
            onClick={() => { setView('home'); setFile(null); setCode(''); setDare(''); }}
          >
            ✕
          </button>
        </div>
        <div className="card-body">
          {!code ? (
            <div className="sender-form">
              <div className="drop-zone" onClick={() => document.getElementById('fileInput').click()}>
                <div className="icon-big">📁</div>
                <h4>Drag & drop or click to browse</h4>
                <p>Up to 200 MB · any file type</p>
                <input
                  id="fileInput"
                  type="file"
                  style={{ display: 'none' }}
                  onChange={e => setFile(e.target.files[0])}
                />
              </div>

              {file && (
                <div className="file-chip">
                  <span className="icon">📎</span>
                  <span className="name">{file.name}</span>
                  <span className="size">{file.size < 1024 * 1024 ? (file.size / 1024).toFixed(1) + ' KB' : (file.size / (1024 * 1024)).toFixed(2) + ' MB'}</span>
                </div>
              )}

              {isUploading && (
                <div className="progress-wrap">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: uploadProgress + '%' }}
                    />
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--ink-tertiary)' }}>
                    {uploadProgress < 100 ? `Uploading… ${uploadProgress}%` : 'Processing…'}
                  </p>
                </div>
              )}

              <button
                className="btn btn-primary btn-lg join-btn"
                onClick={handleUpload}
                disabled={!file}
              >
                {isUploading ? '⏳ Uploading…' : '🚀 Generate Code'}
              </button>
              {error && <p className="error-banner" style={{ color: 'var(--danger)', fontSize: '0.9rem', margin: 0 }}>⚠️ {error}</p>}
            </div>
          ) : (
            <div className="sender-form">
              <div className="file-info-card">
                <div className="icon">✅</div>
                <div className="name">{fileInfo.fileName}</div>
                <div className="meta">
                  {fileInfo.size ? `${(fileInfo.size / (1024 * 1024)).toFixed(2)} MB` : ''} · {fileInfo.mimetype}
                </div>
              </div>

              <div className="code-display">{code}</div>
              <p style={{ color: 'var(--ink-secondary)', fontSize: '0.9rem' }}>Share this code with the receiver</p>

              <div className="qr-wrap">
                <QRCodeSVG value={`${BACKEND_URL.split('://')[0]}://${window.location.hostname}:${FRONTEND_PORT}/?code=${code}&view=receiver`} size={200} />
              </div>

              <div className="dare-controls">
                <div className="row">
                  <select
                    className="select"
                    value={selectedDareCategory}
                    onChange={e => setSelectedDareCategory(e.target.value)}
                  >
                    <option value="">🎯 Dare category</option>
                    {dareCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button
                    className="btn btn-success"
                    onClick={async () => {
                      if (!selectedDareCategory) return;
                      const res = await axios.get(`${BACKEND_URL}/random-dare/${selectedDareCategory}`);
                      setDare(res.data.dare);
                    }}
                    disabled={!selectedDareCategory}
                  >
                    🎲 Get Dare
                  </button>
                </div>
                <input
                  className="input"
                  placeholder="💬 Your dare (or get one randomly)"
                  value={dare}
                  onChange={e => setDare(e.target.value)}
                />
                <div className="game-picker-grid">
                  {GAME_IDS.map(g => (
                    <div
                      key={g}
                      className={`game-pill-wrap ${selectedGame === g ? 'active' : ''}`}
                      onClick={() => setSelectedGame(selectedGame === g ? '' : g)}
                    >
                      <div className="emoji">{GAME_EMOJI[g]}</div>
                      <div className="name">{GAME_NAMES[g]}</div>
                      <div className="tag">{GAME_TAGS[g]}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                className="btn btn-primary btn-lg join-btn"
                onClick={handleJoinAsSender}
                disabled={!dare}
              >
                🎮 Join Game
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  /* ------------------------------------------------------------------ */
  /*  RECEIVER VIEW                                                     */
  /* ------------------------------------------------------------------ */
  const ReceiverView = () => (
    <div className="receiver">
      <div className="card">
        <div className="card-header">
          <h3>📥 Receive File</h3>
          <button
            className="close-btn"
            onClick={() => { setView('home'); setReceiverCode(''); setReceiverDare(''); setReceiverFileInfo(null); }}
          >
            ✕
          </button>
        </div>
        <div className="card-body">
          <div className="receiver-form">
            <div className="code-input-wrap">
              <input
                className="input"
                placeholder="🔢 Enter the 6-digit code"
                value={receiverCode}
                maxLength={6}
                onChange={e => setReceiverCode(e.target.value.toUpperCase())}
              />
              <button
                className="copy-btn"
                onClick={() => {
                  if (receiverCode) {
                    navigator.clipboard.writeText(receiverCode);
                    alert('Code copied!');
                  }
                }}
                style={{ display: receiverCode ? 'block' : 'none' }}
              >
                📋
              </button>
            </div>

            {receiverFileInfo && (
              <div className="file-info-card">
                <div className="icon">📎</div>
                <div className="name">{receiverFileInfo.fileName}</div>
                <div className="meta">
                  {receiverFileInfo.size ? `${(receiverFileInfo.size / (1024 * 1024)).toFixed(2)} MB` : ''} · {receiverFileInfo.mimetype}
                </div>
                <button
                  className="btn btn-success btn-sm"
                  style={{ marginTop: '10px' }}
                  onClick={async () => {
                    const res = await axios.get(`${BACKEND_URL}/download/${receiverCode}`, { responseType: 'blob' });
                    const blob = new Blob([res.data], { type: receiverFileInfo.mimetype });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = receiverFileInfo.fileName;
                    a.click();
                  }}
                >
                  💾 Download
                </button>
              </div>
            )}

            <div className="dare-controls">
              <div className="row">
                <select
                  className="select"
                  value={receiverDareCategory}
                  onChange={e => setSelectedDareCategory(e.target.value)}
                >
                  <option value="">🎯 Dare category</option>
                  {dareCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button
                  className="btn btn-success btn-sm"
                  onClick={async () => {
                    if (!receiverDareCategory) return;
                    const res = await axios.get(`${BACKEND_URL}/random-dare/${receiverDareCategory}`);
                    setReceiverDare(res.data.dare);
                  }}
                  disabled={!receiverDareCategory}
                >
                  🎲 Get Dare
                </button>
              </div>
              <input
                className="input"
                placeholder="💬 Your dare (or get one randomly)"
                value={receiverDare}
                onChange={e => setReceiverDare(e.target.value)}
              />
              <button
                className="btn btn-primary btn-lg join-btn"
                onClick={async () => {
                  if (!receiverCode || !receiverDare) return;
                  setCode(receiverCode);
                  setDare(receiverDare);
                  await handleJoinAsReceiver(receiverCode, receiverDare);
                }}
                disabled={!receiverCode || !receiverDare}
              >
                🎮 Join Game
              </button>
              {receiverError && <p style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>⚠️ {receiverError}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ------------------------------------------------------------------ */
  /*  WAITING VIEW                                                      */
  /* ------------------------------------------------------------------ */
  const WaitingView = () => (
    <div className="waiting">
      <div className="logo-big">🎮</div>
      <h2>Joining game…</h2>
      <div className="status-pill">
        <span className="dot" />
        {connectionStatus === 'connected' ? 'Connected' :
         connectionStatus === 'error' ? 'Connection Error' :
         connectionStatus === 'disconnected' ? 'Disconnected' : 'Connecting…'}
      </div>
      <div><b>Role:</b> {playerType} · <b>Code:</b> {code}</div>
      <div><b>Your dare:</b> {dare}</div>
      {waitingHint && <div style={{ color: 'var(--amber-600)', fontSize: '0.9rem' }}>{waitingHint}</div>}
      <div style={{ color: 'var(--ink-tertiary)', fontSize: '0.85rem' }}>
        Make sure both players joined with the same code.
      </div>
      {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (
        <div style={{ color: 'var(--brand-600)', fontSize: '0.9rem' }}>
          📱 Mobile detected — make sure the desktop user has joined too.
        </div>
      )}
    </div>
  );

  /* ------------------------------------------------------------------ */
  /*  GAME VIEW                                                         */
  /* ------------------------------------------------------------------ */
  const GameView = () => (
    <div className="game-view">
      <div className="scoreboard">
        <div className={`score-side ${playerRole === 'player1' ? 'you' : ''}`}>
          <div className="label">You</div>
          <div className="value">{playerRole === 'player2' ? scores.player2 : scores.player1}</div>
        </div>
        <div className="score-center">
          <div className="round-badge">Round {round} / 3</div>
          <div className="score-vs">VS</div>
        </div>
        <div className={`score-side ${playerRole === 'player2' ? 'you' : ''}`}>
          <div className="label">Opponent</div>
          <div className="value">{playerRole === 'player2' ? scores.player1 : scores.player2}</div>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        {gameResult && playerRole && (
          <div className={`round-result ${gameResult.winner === playerRole ? 'win' : gameResult.winner === 'tie' ? 'tie' : 'lose'}`}>
            {gameResult.winner === 'tie' ? '🤝 Tie!' :
             gameResult.winner === playerRole ? '🏆 You win this round!' : '😞 Opponent wins this round.'}
            <div style={{ fontSize: '0.85rem', color: 'var(--ink-secondary)', marginTop: 4 }}>
              Scores: P1 {scores.player1} — P2 {scores.player2}
            </div>
          </div>
        )}

        {/* 12-game render blocks ---------------------------------------------------- */}
        {currentGame === 'rock-paper-scissors' && (
          <div className="game-card">
            <div className="game-title-row"><span className="icon">✊</span><h3>Rock Paper Scissors</h3><span className="tag">Best of 3</span></div>
            {gameResult && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--bg-surface-2)', marginBottom: 12 }}>
                <p style={{ fontSize: '0.9rem' }}>
                  You: {playerType === 'sender' ? gameResult.player1?.choice : gameResult.player2?.choice} · Opponent: {playerType === 'sender' ? gameResult.player2?.choice : gameResult.player1?.choice} · Winner: {gameResult.winner === 'tie' ? 'Tie' : (gameResult.winner === playerRole ? 'You' : 'Opponent')}
                </p>
              </div>
            )}
            <div className="game-controls" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {['rock','paper','scissors'].map(c => (
                <button key={c} className="btn btn-primary" onClick={() => {
                  if (action) return;
                  socket.emit('gameAction', { action: c, value: c });
                  setAction(c);
                }} disabled={!!action}>
                  {c === 'rock' ? '🪨' : c === 'paper' ? '📄' : '✂️'}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentGame === 'tap-war' && (
          <TapWarGame onResult={handleAction} round={round} socket={socket} code={code} />
        )}

        {currentGame === 'quick-quiz' && (
          <div className="game-card">
            <div className="game-title-row"><span className="icon">🧠</span><h3>Quick Quiz</h3><span className="tag">Round {round}</span></div>
            {gameData && <div style={{ padding: '12px', borderRadius: 10, background: 'var(--bg-surface-2)' }}><p style={{ fontWeight: 700 }}>{gameData.question}</p></div>}
            <div className="input-group" style={{ marginBottom: 12 }}>
              <input className="input" placeholder="Type your answer…" value={action} onChange={e => setAction(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAction(action)} />
              <button className="btn btn-primary" onClick={() => { if (action) handleAction(action); }} disabled={!action}>Submit</button>
            </div>
          </div>
        )}

        {currentGame === 'emoji-memory' && (
          <EmojiMemoryGame sequence={gameData?.sequence || []} onResult={handleAction} />
        )}

        {currentGame === 'typing-speed' && (
          <TypingSpeedGame text={gameData?.text || ''} onResult={handleAction} />
        )}

        {currentGame === 'reaction-time' && (
          <ReactionTimeGame onResult={handleAction} round={round} />
        )}

        {currentGame === 'math-blitz' && (
          <MathBlitzGame question={gameData?.question || ''} onResult={handleAction} round={round} />
        )}

        {currentGame === 'color-rush' && (
          <ColorRushGame onResult={handleAction} round={round} />
        )}

        {currentGame === 'aim-master' && (
          <AimMasterGame onResult={handleAction} round={round} />
        )}

        {currentGame === 'stickman-fight' && (
          <div className="game-card">
            <div className="game-title-row"><span className="icon">🧍</span><h3>Stickman Fight</h3><span className="tag">Round {round}</span></div>
            <div className="stickman-wrap">
              <div className="stickman-area">
                <canvas className="stickman-canvas" width={160} height={260}></canvas>
                <canvas className="stickman-canvas" width={160} height={260}></canvas>
              </div>
              <div className="stickman-btns">
                <button className="btn-stickman" style={{
                  background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', border: 'none', padding: '12px 18px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem'
                }}>🥊 Punch</button>
                <button className="btn-stickman" style={{
                  background: 'linear-gradient(135deg,#f43f5e,#e11d48)', color: '#fff', border: 'none', padding: '12px 18px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem'
                }}>🦶 Kick</button>
              </div>
              <div className="stickman-results">
                <div className="stat"><div className="num">{pW}</div><div className="lbl">Punches</div></div>
                <div className="stat"><div className="num">{kW}</div><div className="lbl">Kicks</div></div>
              </div>
            </div>
          </div>
        )}

        {currentGame === 'car-racer' && (
          <div className="game-card">
            <div className="game-title-row"><span className="icon">🏎</span><h3>Car Racer</h3><span className="tag">Round {round}</span></div>
            <div className="car-wrapper">
              <div className="car-canvas">
                <canvas width={480} height={340}></canvas>
                <div className="car-hud">
                  <div className="hud-item speed"><div className="lbl">Speed</div><div className="val">{speed.toFixed(1)}</div></div>
                  <div className="hud-item lives"><div className="lbl">Lives</div><div className="val">❤️ {lives}</div></div>
                  <div className="hud-item score"><div className="lbl">Score</div><div className="val">{score}</div></div>
                </div>
              </div>
              <div className="car-overlay hidden">
                <p>🖱 Click / space to boost</p>
              </div>
            </div>
            <div className="car-controls">
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={() => { /* steering */ }}>⬅ ➡</button>
                <button className="btn btn-secondary" onClick={() => { /* boost */ }}>🚀 Boost</button>
              </div>
            </div>
          </div>
        )}

        {currentGame === 'bike-racer' && (
          <div className="game-card">
            <div className="game-title-row"><span className="icon">🏍</span><h3>Bike Racer</h3><span className="tag">Round {round}</span></div>
            <div className="bike-wrapper">
              <div className="bike-canvas">
                <canvas width={480} height={340}></canvas>
                <div className="bike-hud">
                  <div className="hud-item speed"><div className="lbl">Speed</div><div className="val">{speed.toFixed(1)}</div></div>
                  <div className="hud-item lives"><div className="lbl">Lives</div><div className="val">❤️ {lives}</div></div>
                  <div className="hud-item score"><div className="lbl">Score</div><div className="val">{score}</div></div>
                </div>
              </div>
              <div className="bike-overlay hidden">
                <p>⬅ ➡ lean · click boost</p>
              </div>
            </div>
            <div className="bike-controls">
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={() => { /* lean */ }}>⬅ ➡</button>
                <button className="btn btn-secondary" onClick={() => { /* boost */ }}>🚀 Boost</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {gameResult && playerRole && (
        <div className={`game-result ${gameResult.winner === playerRole ? 'win' : gameResult.winner === 'tie' ? 'tie' : 'lose'}`}>
          {gameResult.winner === 'tie' ? '🤝 Tie!' :
           gameResult.winner === playerRole ? '🏆 You win this round!' : '😞 Opponent wins this round.'}
        </div>
      )}
    </div>
  );

  /* ------------------------------------------------------------------ */
  /*  END VIEW                                                          */
  /* ------------------------------------------------------------------ */
  const EndView = () => (
    <div className="end-view">
      <div className="logo-big">🎉</div>
      <h2>{gameWinner.winner === 'tie' ? '🤝 It\'s a tie!' : gameWinner.winner === playerRole ? '🏆 You win!' : '😢 You lose'}</h2>
      <p>Final scores: <b>P1 {gameWinner.finalScores?.player1?.score || 0}</b> — <b>P2 {gameWinner.finalScores?.player2?.score || 0}</b></p>
      {(gameWinner.winner !== 'tie') && (
        <div className="dare-banner end-banner">
          🎁 <b>Dare:</b> {gameWinner.dares?.[playerRole === 'player1' ? 'player2' : 'player1'] || 'No dare available'}
        </div>
      )}
      <div className="end-actions">
        {playerType === 'receiver' && (
          <button className="btn btn-success btn-lg" onClick={() => {}}>
            💾 Download File
          </button>
        )}
        <button className="btn btn-secondary btn-lg" onClick={() => window.location.reload()}>
          🔄 Play again
        </button>
      </div>
    </div>
  );

  if (view === 'home') return <HomeView />;
  if (view === 'sender') return <SenderView />;
  if (view === 'receiver') return <ReceiverView />;
  if (view === 'waiting') return <WaitingView />;
  if (view === 'game') return <GameView />;
  if (view === 'end') return <EndView />;
  return null;
}

/* ============================================================
   SUB-COMPONENTS (small games)
   ============================================================ */
function TapWarGame({ onResult, round, socket, code }) {
  const [taps, setTaps] = useState(0);
  const [timer, setTimer] = useState(5);
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  useEffect(() => { setTaps(0); setTimer(5); setRunning(false); setStartTime(null); }, [round]);
  useEffect(() => {
    let raf;
    function tick() {
      if (!running || !startTime) return;
      const left = Math.max(0, 5 - (Date.now() - startTime) / 1000);
      setTimer(left);
      if (left > 0) raf = requestAnimationFrame(tick);
      else { setRunning(false); onResult(taps); }
    }
    if (running) raf = requestAnimationFrame(tick);
    return () => raf && cancelAnimationFrame(raf);
  }, [running, startTime, taps, onResult]);
  function handleTap() {
    if (!running) { setRunning(true); setTaps(1); setStartTime(Date.now()); setTimer(5); }
    else setTaps(t => t + 1);
  }
  return (
    <div className="game-card">
      <div className="game-title-row"><span className="icon">👆</span><h3>Tap War</h3><span className="tag">Round {round}</span></div>
      <div className="timer-bar" style={{ width: '100%', height: 12, borderRadius: 999, background: 'var(--bg-surface-2)', overflow: 'hidden' }}>
        <div className="tap-progress" style={{ height: '100%', width: `${(5 - timer) / 5 * 100}%`, background: 'var(--brand-500)' }} />
      </div>
      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--ink-primary)' }}>Taps: {taps} · {timer.toFixed(1)}s</div>
      <div className="game-controls">
        <button className="btn btn-primary btn-lg" onClick={handleTap} disabled={timer === 0}>
          {running ? 'TAP!' : 'START'}
        </button>
      </div>
    </div>
  );
}

function EmojiMemoryGame({ sequence, onResult }) {
  const [input, setInput] = useState([]);
  const [shown, setShown] = useState(true);
  useEffect(() => { setInput([]); setShown(true); const t = setTimeout(() => setShown(false), 2200 + sequence.length * 500); return () => clearTimeout(t); }, [sequence]);
  function handleEmojiClick(e) {
    if (shown) return;
    const v = e.target.textContent;
    setInput(arr => { const n = [...arr, v]; if (n.length === sequence.length) { let c = 0; for (let i = 0; i < sequence.length; i++) if (sequence[i] === n[i]) c++; onResult(c); } return n; });
  }
  return (
    <div className="game-card">
      <div className="game-title-row"><span className="icon">🧩</span><h3>Emoji Memory</h3><span className="tag">Recall the sequence</span></div>
      {shown ? (
        <div style={{ fontSize: '1.6rem', textAlign: 'center', padding: '12px', fontWeight: 800 }}>{sequence.join(' ')}</div>
      ) : (
        <div>
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>Repeat the sequence:</div>
          <div className="emoji-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {['😀','😎','🎮','🚀','⭐','🎯','🎪','🎨','🐱','🐶','🌸','⚽'].map(e => (
              <button key={e} className="btn-pill" style={{ fontSize: '1.2rem' }} onClick={handleEmojiClick}>{e}</button>
            ))}
          </div>
          <div style={{ fontWeight: 700, color: 'var(--ink-secondary)', textAlign: 'center' }}>Your input: {input.join(' ')}</div>
        </div>
      )}
    </div>
  );
}

function TypingSpeedGame({ text, onResult }) {
  const [input, setInput] = useState('');
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => { setInput(''); setStarted(false); setDone(false); }, [text]);
  function handleChange(e) {
    if (!started) { setStarted(true); }
    setInput(e.target.value);
    if (e.target.value === text) { setDone(true); const t = (Date.now() - (started ? 0 : 0)) / 1000; const wpm = Math.round((text.split(' ').length / (t || 1)) * 60); onResult(wpm); }
  }
  return (
    <div className="game-card">
      <div className="game-title-row"><span className="icon">⌨️</span><h3>Typing Speed</h3><span className="tag">Round {round}</span></div>
      <div style={{ padding: '10px', borderRadius: 10, background: 'var(--bg-surface-2)', fontStyle: 'italic', color: 'var(--ink-secondary)', whiteSpace: 'pre-wrap' }}>{text}</div>
      <textarea className="input" placeholder="Start typing…" value={input} onChange={handleChange} disabled={done} rows={4} style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem' }} />
      {done && <div style={{ color: 'var(--success)', fontWeight: 800, textAlign: 'center' }}>✅ Done! WPM sent.</div>}
    </div>
  );
}

function ReactionTimeGame({ onResult, round }) {
  const [ready, setReady] = useState(false);
  const [start, setStart] = useState(null);
  const [done, setDone] = useState(false);
  useEffect(() => { setReady(false); setStart(null); setDone(false); const t = setTimeout(() => { setReady(true); setStart(Date.now()); }, 1000 + Math.random() * 2000); return () => clearTimeout(t); }, [round]);
  function handleClick() {
    if (!ready || done) return;
    setDone(true);
    onResult(Date.now() - start);
  }
  return (
    <div className="game-card">
      <div className="game-title-row"><span className="icon">⚡</span><h3>Reaction Time</h3><span className="tag">Quickest wins</span></div>
      <div className="reaction-area" style={{ height: 140, borderRadius: 12, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 800, background: ready ? 'var(--success)' : 'var(--danger)' }}>
        {ready ? 'CLICK!' : 'Wait for it...'}
      </div>
      <button className="btn btn-primary" onClick={handleClick} disabled={!ready || done}>{done ? 'Done!' : 'Click me!'}</button>
    </div>
  );
}

function MathBlitzGame({ question, onResult, round }) {
  const [answer, setAnswer] = useState('');
  const [locked, setLocked] = useState(false);
  useEffect(() => { setAnswer(''); setLocked(false); }, [round, question]);
  function submit() {
    if (locked || answer === '') return;
    setLocked(true);
    onResult(JSON.stringify({ answer: Number(answer) }));
  }
  return (
    <div className="game-card">
      <div className="game-title-row"><span className="icon">🔢</span><h3>Math Blitz</h3><span className="tag">First correct wins</span></div>
      <div className="math-question" style={{ fontWeight: 800, fontSize: '1.1rem' }}>{question} = ?</div>
      {!locked ? (
        <div className="math-input-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <input className="input" type="number" placeholder="?" value={answer} autoFocus onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
          <button className="btn btn-primary btn-sm" onClick={submit} disabled={answer === ''}>Lock In 🔒</button>
        </div>
      ) : <div className="game-result" style={{ fontWeight: 800 }}>🔒 Answer locked! Waiting for opponent…</div>}
    </div>
  );
}

function ColorRushGame({ onResult, round }) {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState(8);
  const [word, setWord] = useState(null);
  const [ink, setInk] = useState(null);
  const [target, setTarget] = useState(null);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const COLORS = [ { name: 'RED', hex: '#e74c3c' }, { name: 'GREEN', hex: '#27ae60' }, { name: 'BLUE', hex: '#2980b9' }, { name: 'YELLOW', hex: '#f1c40f' }, { name: 'PURPLE', hex: '#8e44ad' }, { name: 'ORANGE', hex: '#e67e22' } ];
  const roundDur = 8;
  useEffect(() => { setRunning(false); setDone(false); setTimeLeft(roundDur); setWord(null); setInk(null); setTarget(null); setHits(0); setMisses(0); }, [round]);
  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => { setTimeLeft(t => { const n = +(t - 0.1).toFixed(1); if (n <= 0) { clearInterval(iv); setRunning(false); setDone(true); return 0; } return n; }); });
    return () => clearInterval(iv);
  }, [running]);
  useEffect(() => { if (done) onResult(JSON.stringify({ hits, timeMs: roundDur * 1000 })); }, [done]);
  function newWord() {
    const w = COLORS[Math.floor(Math.random() * COLORS.length)];
    let k = COLORS[Math.floor(Math.random() * COLORS.length)];
    if (Math.random() < 0.6) while (k.name === w.name) k = COLORS[Math.floor(Math.random() * COLORS.length)];
    setWord(w); setInk(k);
    setTarget(Math.random() < 0.5 ? { type: 'word', name: w.name } : { type: 'ink', name: k.name });
  }
  function startGame() { newWord(); setRunning(true); }
  function handlePick(colorName) {
    if (!running || !target) return;
    const isMatch = target.type === 'word' ? colorName === target.name : colorName === target.name;
    if (isMatch) setHits(h => h + 1); else setMisses(m => m + 1);
    newWord();
  }
  return (
    <div className="game-card">
      <div className="game-title-row"><span className="icon">🎨</span><h3>Color Rush</h3><span className="tag">Round {round}</span></div>
      {!running && !done && (
        <div style={{ textAlign: 'center', padding: '16px' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--ink-secondary)' }}>A word appears in a different ink color. Click the <b>matching swatch</b> — for the word or its ink. <b>{roundDur}s</b>, go!</p>
          <button className="btn btn-primary" onClick={startGame}>▶ Start Round</button>
        </div>
      )}
      {running && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: 'var(--ink-tertiary)', marginBottom: 8 }}>
            <span>⏱ {timeLeft.toFixed(1)}s</span>
            <span>✅ {hits} · ❌ {misses}</span>
          </div>
          <div style={{ fontWeight: 800, fontSize: '2rem', marginBottom: 6 }}>{word ? word.name : ''}</div>
          <div className="stroop-grid" style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {COLORS.map(c => <button key={c.name} className="stroop-swatch" style={{ background: c.hex, width: 60, height: 60, borderRadius: 10, fontWeight: 800, cursor: 'pointer' }} onClick={() => handlePick(c.name)}>{c.name}</button>)}
          </div>
        </>
      )}
      {done && <div className="game-result" style={{ fontWeight: 800 }}>🏁 Time! {hits} hits / {misses} misses — waiting for opponent…</div>}
    </div>
  );
}

function AimMasterGame({ onResult, round }) {
  const [hits, setHits] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [dot, setDot] = useState(null);
  const roundDur = 10;
  useEffect(() => { setHits(0); setTimeLeft(roundDur); setRunning(false); setDone(false); setDot(null); }, [round]);
  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => { setTimeLeft(t => { const n = +(t - 0.1).toFixed(1); if (n <= 0) { clearInterval(iv); setRunning(false); setDone(true); return 0; } return n; }); });
    return () => clearInterval(iv);
  }, [running]);
  useEffect(() => { if (done) onResult(JSON.stringify({ hits, timeMs: roundDur * 1000 })); }, [done]);
  function spawnDot(h) { const size = Math.max(14, 46 - h * 2); setDot({ x: 8 + Math.random() * 84, y: 8 + Math.random() * 84, size }); }
  function startGame() { setRunning(true); spawnDot(0); }
  function handleHit() { if (!running) return; const h = hits + 1; setHits(h); spawnDot(h); }
  return (
    <div className="game-card">
      <div className="game-title-row"><span className="icon">🎯</span><h3>Aim Master</h3><span className="tag">Round {round}</span></div>
      {!running && !done && (
        <div style={{ textAlign: 'center', padding: '16px' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--ink-secondary)' }}>Click the targets before time runs out. They get <b>smaller</b> as you score.</p>
          <button className="btn btn-primary" onClick={startGame}>▶ Start Round</button>
        </div>
      )}
      {running && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: 'var(--ink-tertiary)', marginBottom: 8 }}>
            <span>⏱ {timeLeft.toFixed(1)}s</span>
            <span>🎯 {hits}</span>
          </div>
          <div className="aim-area" style={{ height: 260, borderRadius: 12, background: 'var(--bg-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {dot && <button className="aim-dot" style={{ position: 'absolute', left: `${dot.x}%`, top: `${dot.y}%`, width: dot.size, height: dot.size, borderRadius: '50%', background: '#3b82f6', cursor: 'pointer' }} onClick={handleHit} />}
          </div>
        </>
      )}
      {done && <div className="game-result" style={{ fontWeight: 800 }}>🏁 Time! You hit {hits} targets — waiting for opponent…</div>}
    </div>
  );
}

export default App;
