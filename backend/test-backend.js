const io = require('socket.io-client');

console.log('Testing backend connection...');

const socket = io('http://192.168.1.38:5000', {
  transports: ['websocket', 'polling'],
  timeout: 5000
});

socket.on('connect', () => {
  console.log('✅ Connected to backend!');
  console.log('Socket ID:', socket.id);
  
  // Test joinRoom event
  console.log('Testing joinRoom event...');
  socket.emit('joinRoom', {
    code: 'TEST123',
    playerType: 'sender',
    dare: 'Test dare',
    selectedGame: 'rockPaperScissors'
  });
});

socket.on('gameCreated', (data) => {
  console.log('✅ Game created successfully:', data);
  socket.disconnect();
});

socket.on('error', (error) => {
  console.error('❌ Error:', error);
  socket.disconnect();
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  process.exit(0);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('❌ Test timeout');
  socket.disconnect();
  process.exit(1);
}, 10000); 