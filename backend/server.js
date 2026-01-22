const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3002", "http://192.168.1.38:3002", "http://localhost:3000", "http://192.168.1.38:3000"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Game state storage
const games = new Map();
const players = new Map();

// Game configurations
const GAMES = {
  'rock-paper-scissors': {
    name: 'Rock Paper Scissors',
    rounds: 3,
    options: ['rock', 'paper', 'scissors']
  },
  'tap-war': {
    name: 'Tap War',
    rounds: 3,
    duration: 10000 // 10 seconds
  },
  'quick-quiz': {
    name: 'Quick Quiz',
    rounds: 3,
    questions: [
      { question: "What is 2 + 2?", answer: "4" },
      { question: "What color is the sky?", answer: "blue" },
      { question: "How many days in a week?", answer: "7" },
      { question: "What is the capital of France?", answer: "paris" },
      { question: "What is the largest planet?", answer: "jupiter" }
    ]
  },
  'emoji-memory': {
    name: 'Emoji Memory',
    rounds: 3,
    emojis: ['😀', '😎', '🎮', '🚀', '⭐', '🎯', '🎪', '🎨']
  },
  'typing-speed': {
    name: 'Typing Speed',
    rounds: 3, // Set back to 3 rounds so all games have 3 rounds
    texts: [
      "The quick brown fox jumps over the lazy dog.",
      "All work and no play makes Jack a dull boy.",
      "To be or not to be, that is the question.",
      "A journey of a thousand miles begins with a single step.",
      "Practice makes perfect."
    ]
  },
  'reaction-time': {
    name: 'Reaction Time',
    rounds: 3,
    minDelay: 1000,
    maxDelay: 5000
  }
};

// Helper functions
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getWinner(player1Choice, player2Choice, gameType) {
  if (gameType === 'rock-paper-scissors') {
    if (player1Choice === player2Choice) return 'tie';
    if (
      (player1Choice === 'rock' && player2Choice === 'scissors') ||
      (player1Choice === 'paper' && player2Choice === 'rock') ||
      (player1Choice === 'scissors' && player2Choice === 'paper')
    ) {
      return 'player1';
    }
    return 'player2';
  }
  return null;
}

// Helper to generate a random emoji sequence
function generateEmojiSequence(length = 5) {
  const emojis = GAMES['emoji-memory'].emojis;
  let seq = [];
  for (let i = 0; i < length; i++) {
    seq.push(emojis[Math.floor(Math.random() * emojis.length)]);
  }
  return seq;
}

// Helper to get a random typing text
function getRandomTypingText() {
  const texts = GAMES['typing-speed'].texts;
  return texts[Math.floor(Math.random() * texts.length)];
}

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Add error handling for socket events
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
  
  socket.on('disconnect', (reason) => {
    console.log('User disconnected:', socket.id, 'Reason:', reason);
    // Clean up player data
    const player = players.get(socket.id);
    if (player) {
      const game = games.get(player.roomCode);
      if (game) {
        game.players = game.players.filter(id => id !== socket.id);
        if (game.players.length === 0) {
          games.delete(player.roomCode);
          console.log(`Game ${player.roomCode} deleted - no players left`);
        }
      }
      players.delete(socket.id);
    }
  });

  socket.on('createGame', (data) => {
    const roomCode = generateRoomCode();
    const gameType = data.gameType || 'rock-paper-scissors';
    
    games.set(roomCode, {
      id: roomCode,
      type: gameType,
      players: [socket.id],
      scores: { [socket.id]: 0 },
      currentRound: 0,
      maxRounds: GAMES[gameType].rounds,
      status: 'waiting',
      gameData: {},
      dares: { player1: '', player2: '' } // <-- set sender's dare
    });
    
    players.set(socket.id, { roomCode, role: 'sender' });
    socket.join(roomCode);
    
    socket.emit('gameCreated', { roomCode, gameType });
    console.log(`Game created: ${roomCode} (${gameType})`);
  });

  // Handle file code as room code for existing games
  socket.on('joinRoom', (data) => {
    try {
      const { code, playerType, dare, selectedGame } = data;
      console.log('JoinRoom event received:', { code, playerType, dare, selectedGame });
      
      // Check if this is a file code that should create a game
      if (playerType === 'sender') {
        // Create game with file code as room code
        let gameType = selectedGame || 'rock-paper-scissors';
        
        // Convert frontend game names to backend format
        const gameNameMap = {
          'rockPaperScissors': 'rock-paper-scissors',
          'tapWar': 'tap-war',
          'quickQuiz': 'quick-quiz',
          'emojiMemory': 'emoji-memory',
          'typingSpeed': 'typing-speed',
          'reactionTime': 'reaction-time'
        };
        
        if (gameNameMap[selectedGame]) {
          gameType = gameNameMap[selectedGame];
        }
        
        // Validate game type exists
        if (!GAMES[gameType]) {
          console.error(`Invalid game type: ${gameType}, falling back to rock-paper-scissors`);
          gameType = 'rock-paper-scissors';
        }
        
        games.set(code, {
          id: code,
          type: gameType,
          players: [socket.id],
          scores: { [socket.id]: 0 },
          currentRound: 0,
          maxRounds: GAMES[gameType].rounds,
          status: 'waiting',
          gameData: {},
          dares: { player1: dare || '', player2: '' } // <-- set sender's dare
        });
        
        players.set(socket.id, { roomCode: code, role: 'sender' });
        socket.join(code);
        
        socket.emit('gameCreated', { roomCode: code, gameType });
        console.log(`Game created with file code: ${code} (${gameType})`);
      } else if (playerType === 'receiver') {
        // Join existing game with file code
        const game = games.get(code);
        console.log('Receiver joined with dare:', dare);
        if (game) {
          game.dares = game.dares || { player1: '', player2: '' };
          game.dares.player2 = dare || '';
          console.log('Stored receiver dare:', game.dares.player2);
        }
        
        if (!game) {
          socket.emit('error', { message: 'Game not found. Make sure the sender has joined first.' });
          return;
        }
        
        if (game.players.length >= 2) {
          socket.emit('error', { message: 'Game is full' });
          return;
        }
        
        game.players.push(socket.id);
        game.scores[socket.id] = 0;
        players.set(socket.id, { roomCode: code, role: 'receiver' });
        socket.join(code);
        
        socket.emit('gameJoined', { roomCode: code, gameType: game.type });
        
        // Start game if both players joined
        if (game.players.length === 2) {
          game.status = 'playing';
          game.currentRound = 1;
          // Ensure dares are set for both players
          if (!game.dares) game.dares = {};
          if (!game.dares.player1) game.dares.player1 = game.dares.sender || game.dares.player1 || '';
          if (!game.dares.player2) game.dares.player2 = game.dares.receiver || game.dares.player2 || '';
          if (game.type === 'emoji-memory') {
            const sequence = generateEmojiSequence();
            game.currentSequence = sequence;
            io.to(code).emit('gameStart', {
              gameType: game.type,
              round: game.currentRound,
              maxRounds: game.maxRounds,
              playerMap: {
                player1: game.players[0],
                player2: game.players[1]
              },
              gameData: { sequence }
            });
            console.log(`Game started: ${code}`);
          } else if (game.type === 'quick-quiz') {
            io.to(code).emit('gameStart', {
              gameType: game.type,
              round: game.currentRound,
              maxRounds: game.maxRounds,
              playerMap: {
                player1: game.players[0],
                player2: game.players[1]
              },
              gameData: {
                question: GAMES['quick-quiz'].questions[0].question
              }
            });
            console.log(`Game started: ${code}`);
          } else if (game.type === 'typing-speed') {
            const text = getRandomTypingText();
            game.currentText = text;
            io.to(code).emit('gameStart', {
              gameType: game.type,
              round: game.currentRound,
              maxRounds: game.maxRounds,
              playerMap: {
                player1: game.players[0],
                player2: game.players[1]
              },
              gameData: { text }
            });
            console.log(`Game started: ${code}`);
          } else {
            io.to(code).emit('gameStart', {
              gameType: game.type,
              round: game.currentRound,
              maxRounds: game.maxRounds,
              playerMap: {
                player1: game.players[0],
                player2: game.players[1]
              }
            });
            console.log(`Game started: ${code}`);
          }
        }
      }
    } catch (error) {
      console.error('Error in joinRoom:', error);
      socket.emit('error', { message: 'Server error occurred. Please try again.' });
    }
  });

  socket.on('joinGame', (data) => {
    const { roomCode } = data;
    const game = games.get(roomCode);
    
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }
    
    if (game.players.length >= 2) {
      socket.emit('error', { message: 'Game is full' });
      return;
    }
    
    game.players.push(socket.id);
    game.scores[socket.id] = 0;
    players.set(socket.id, { roomCode, role: 'receiver' });
    socket.join(roomCode);
    
    socket.emit('gameJoined', { roomCode, gameType: game.type });
    
    // Start game if both players joined
    if (game.players.length === 2) {
      game.status = 'playing';
      game.currentRound = 1;
      
      io.to(roomCode).emit('gameStart', {
        gameType: game.type,
        round: game.currentRound,
        maxRounds: game.maxRounds,
        playerMap: {
          player1: game.players[0],
          player2: game.players[1]
        }
      });
      
      console.log(`Game started: ${roomCode}`);
    }
  });

  socket.on('gameAction', (data) => {
    const player = players.get(socket.id);
    if (!player) return;
    
    const game = games.get(player.roomCode);
    if (!game || game.status !== 'playing') return;
    
    const { action, value } = data;
    
    if (!game.gameData[socket.id]) {
      game.gameData[socket.id] = {};
    }
    
    game.gameData[socket.id][game.currentRound] = { action, value };
    
    // Check if both players have made their moves
    const player1 = game.players[0];
    const player2 = game.players[1];
    
    if (game.gameData[player1]?.[game.currentRound] && 
        game.gameData[player2]?.[game.currentRound]) {
      
      // Process round result
      let roundResult;
      
      switch (game.type) {
        case 'rock-paper-scissors':
          const p1Choice = game.gameData[player1][game.currentRound].action;
          const p2Choice = game.gameData[player2][game.currentRound].action;
          const winner = getWinner(p1Choice, p2Choice, game.type);
          
          if (winner === 'player1') {
            game.scores[player1]++;
          } else if (winner === 'player2') {
            game.scores[player2]++;
          }
          
          roundResult = {
            player1: { choice: p1Choice, score: game.scores[player1] },
            player2: { choice: p2Choice, score: game.scores[player2] },
            winner: winner
          };
          break;
          
        case 'tap-war':
          const p1Taps = game.gameData[player1][game.currentRound].value;
          const p2Taps = game.gameData[player2][game.currentRound].value;
          
          if (p1Taps > p2Taps) {
            game.scores[player1]++;
          } else if (p2Taps > p1Taps) {
            game.scores[player2]++;
          }
          
          roundResult = {
            player1: { taps: p1Taps, score: game.scores[player1] },
            player2: { taps: p2Taps, score: game.scores[player2] },
            winner: p1Taps > p2Taps ? 'player1' : p2Taps > p1Taps ? 'player2' : 'tie'
          };
          break;
          
        case 'quick-quiz':
          const p1Answer = game.gameData[player1][game.currentRound].value;
          const p2Answer = game.gameData[player2][game.currentRound].value;
          const p1Time = game.gameData[player1][game.currentRound].time;
          const p2Time = game.gameData[player2][game.currentRound].time;
          
          const question = GAMES[game.type].questions[game.currentRound - 1];
          const correctAnswer = question.answer.toLowerCase();
          
          let quizWinner = 'tie';
          if (p1Answer.toLowerCase() === correctAnswer && p2Answer.toLowerCase() !== correctAnswer) {
            game.scores[player1]++;
            quizWinner = 'player1';
          } else if (p2Answer.toLowerCase() === correctAnswer && p1Answer.toLowerCase() !== correctAnswer) {
            game.scores[player2]++;
            quizWinner = 'player2';
          } else if (p1Answer.toLowerCase() === correctAnswer && p2Answer.toLowerCase() === correctAnswer) {
            if (p1Time < p2Time) {
              game.scores[player1]++;
              quizWinner = 'player1';
            } else if (p2Time < p1Time) {
              game.scores[player2]++;
              quizWinner = 'player2';
            }
          }
          
          roundResult = {
            player1: { answer: p1Answer, time: p1Time, score: game.scores[player1] },
            player2: { answer: p2Answer, time: p2Time, score: game.scores[player2] },
            correctAnswer: correctAnswer,
            winner: quizWinner
          };
          break;
          
        case 'emoji-memory':
          const p1Score = game.gameData[player1][game.currentRound].value;
          const p2Score = game.gameData[player2][game.currentRound].value;
          
          if (p1Score > p2Score) {
            game.scores[player1]++;
          } else if (p2Score > p1Score) {
            game.scores[player2]++;
          }
          
          roundResult = {
            player1: { score: p1Score, totalScore: game.scores[player1] },
            player2: { score: p2Score, totalScore: game.scores[player2] },
            winner: p1Score > p2Score ? 'player1' : p2Score > p1Score ? 'player2' : 'tie'
          };
          break;
          
        case 'typing-speed':
          const p1WPM = game.gameData[player1][game.currentRound].value;
          const p2WPM = game.gameData[player2][game.currentRound].value;
          
          if (p1WPM > p2WPM) {
            game.scores[player1]++;
          } else if (p2WPM > p1WPM) {
            game.scores[player2]++;
          }
          
          roundResult = {
            player1: { wpm: p1WPM, totalScore: game.scores[player1] },
            player2: { wpm: p2WPM, totalScore: game.scores[player2] },
            winner: p1WPM > p2WPM ? 'player1' : p2WPM > p1WPM ? 'player2' : 'tie'
          };
          break;
          
        case 'reaction-time':
          const p1ReactionTime = game.gameData[player1][game.currentRound].value;
          const p2ReactionTime = game.gameData[player2][game.currentRound].value;
          
          if (p1ReactionTime < p2ReactionTime) {
            game.scores[player1]++;
          } else if (p2ReactionTime < p1ReactionTime) {
            game.scores[player2]++;
          }
          
          roundResult = {
            player1: { time: p1ReactionTime, totalScore: game.scores[player1] },
            player2: { time: p2ReactionTime, totalScore: game.scores[player2] },
            winner: p1ReactionTime < p2ReactionTime ? 'player1' : p2ReactionTime < p1ReactionTime ? 'player2' : 'tie'
          };
          break;
      }
      
      // Defensive check before emitting roundResult
      if (!roundResult || !game.scores || !game.currentRound || !player1 || !player2) {
        console.error('Attempted to emit invalid roundResult:', {
          roundResult,
          scores: game.scores,
          round: game.currentRound,
          player1,
          player2,
          gameType: game.type
        });
        return;
      }
      const roundResultPayload = {
        result: roundResult,
        scores: {
          player1: game.scores[player1],
          player2: game.scores[player2]
        },
        round: game.currentRound,
        playerMap: {
          player1,
          player2
        }
      };
      console.log('Emitting roundResult:', JSON.stringify(roundResultPayload));
      io.to(player.roomCode).emit('roundResult', roundResultPayload);
      
      // Check if a player has reached 2 points, or if max rounds reached
      if (
        game.scores[player1] >= 2 ||
        game.scores[player2] >= 2 ||
        game.currentRound >= game.maxRounds
      ) {
        const finalScores = {
          player1: { score: game.scores[player1] },
          player2: { score: game.scores[player2] },
          winner: game.scores[player1] > game.scores[player2] ? 'player1' :
                 game.scores[player2] > game.scores[player1] ? 'player2' : 'tie'
        };
        io.to(player.roomCode).emit('gameEnd', {
          winner: finalScores.winner,
          finalScores,
          scores: {
            player1: game.scores[player1],
            player2: game.scores[player2]
          },
          dares: game.dares || { player1: '', player2: '' }
        });
        games.delete(player.roomCode);
        console.log(`Game ended: ${player.roomCode}`);
      } else {
        // Start next round (no maxRounds check)
        game.currentRound++;
        setTimeout(() => { 
          let gameData;
          if (game.type === 'quick-quiz') {
            gameData = { question: GAMES['quick-quiz'].questions[game.currentRound - 1].question };
          } else if (game.type === 'emoji-memory') {
            const sequence = generateEmojiSequence();
            game.currentSequence = sequence;
            gameData = { sequence };
          } else if (game.type === 'typing-speed') {
            const text = getRandomTypingText();
            game.currentText = text;
            gameData = { text };
          }
          io.to(player.roomCode).emit('nextRound', {
            round: game.currentRound,
            maxRounds: game.maxRounds, // for UI only
            gameData
          }); 
        }, 2000);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    const player = players.get(socket.id);
    if (player) {
      const game = games.get(player.roomCode);
      if (game) {
        io.to(player.roomCode).emit('playerDisconnected');
        games.delete(player.roomCode);
      }
      players.delete(socket.id);
    }
  });
});

// File storage (in-memory for demo)
const files = new Map();
const fileCodes = new Map();

// Dare categories
const dareCategories = [
  { id: 'funny', name: 'Funny Dares' },
  { id: 'challenging', name: 'Challenging Dares' },
  { id: 'creative', name: 'Creative Dares' },
  { id: 'social', name: 'Social Dares' }
];

const dares = {
  funny: [
    'Do your best impression of a chicken for 30 seconds',
    'Sing your favorite song in a funny voice',
    'Tell a joke that makes everyone laugh',
    'Dance like nobody is watching for 1 minute',
    'Make up a story about a talking potato'
  ],
  challenging: [
    'Do 20 push-ups',
    'Hold your breath for as long as possible',
    'Stand on one leg for 2 minutes',
    'Touch your toes 10 times',
    'Do 10 jumping jacks'
  ],
  creative: [
    'Draw a picture of your dream house',
    'Write a haiku about pizza',
    'Create a new dance move',
    'Invent a new superhero',
    'Design a new flavor of ice cream'
  ],
  social: [
    'Call a friend and tell them a funny story',
    'Give someone a genuine compliment',
    'Share your favorite memory',
    'Tell everyone your biggest fear',
    'Share your biggest dream'
  ]
};

// API Routes
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const fileName = req.file.originalname;
    const mimetype = req.file.mimetype;
    const data = req.file.buffer;
    
    files.set(code, {
      fileName,
      mimetype,
      data,
      uploadedAt: new Date()
    });
    
    fileCodes.set(code, true);
    
    console.log(`File uploaded: ${fileName} with code: ${code}`);
    res.json({ code, fileName, mimetype });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.get('/fileinfo/:code', (req, res) => {
  const { code } = req.params;
  const file = files.get(code);
  
  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  res.json({
    fileName: file.fileName,
    mimetype: file.mimetype,
    uploadedAt: file.uploadedAt
  });
});

app.get('/download/:code', (req, res) => {
  const { code } = req.params;
  const file = files.get(code);
  
  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  res.setHeader('Content-Type', file.mimetype);
  res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
  res.send(file.data);
});

app.get('/dare-categories', (req, res) => {
  res.json(dareCategories);
});

app.get('/random-dare/:category', (req, res) => {
  const { category } = req.params;
  const categoryDares = dares[category];
  
  if (!categoryDares) {
    return res.status(404).json({ error: 'Category not found' });
  }
  
  const randomDare = categoryDares[Math.floor(Math.random() * categoryDares.length)];
  res.json({ dare: randomDare });
});

app.get('/api/games', (req, res) => {
  res.json(Object.keys(GAMES).map(key => ({
    id: key,
    name: GAMES[key].name
  })));
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'ShareNPlay Backend API',
    endpoints: [
      'POST /upload - Upload file',
      'GET /fileinfo/:code - Get file info',
      'GET /download/:code - Download file',
      'GET /dare-categories - Get dare categories',
      'GET /random-dare/:category - Get random dare',
      'GET /api/games - Get available games',
      'GET /api/health - Health check'
    ]
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`ShareNPlay Backend running on port ${PORT}`);
  console.log(`Access from mobile: http://192.168.1.38:${PORT}`);
}); 