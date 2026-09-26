// E2E test: REST + full socket game flow. Run from backend/: node test-e2e.js
const http = require('http');
const io = require('socket.io-client');
const BASE = 'http://localhost:5000';
const GAME_ID = 'rock-paper-scissors';

function req(method, urlPath, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + urlPath);
    const data = body && typeof body !== 'string' && !(body instanceof Buffer) ? JSON.stringify(body) : body;
    const r = http.request(url, { method, headers: {
      ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}),
      ...headers } }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => { let j=null; try { j=JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch(e){} resolve({status:res.statusCode, json:j, buf:Buffer.concat(chunks)}); });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

function waitFor(socket, event, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout waiting for ' + event)), timeoutMs);
    socket.once(event, (payload) => { clearTimeout(t); resolve(payload); });
  });
}

async function main() {
  const failures = [];
  const check = (name, ok, extra = '') => {
    console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (extra ? '  ' + extra : ''));
    if (!ok) failures.push(name);
  };

  // REST
  const health = await req('GET', '/api/health');
  check('health', health.status === 200 && health.json && health.json.status === 'ok');

  const games = await req('GET', '/api/games');
  check('12 games listed', Array.isArray(games.json) && games.json.length === 12, games.json ? games.json.length + ' games' : '');

  const boundary = '----sharenplaye2e' + Date.now();
  const fileContent = 'ShareNPlay E2E test file - ' + new Date().toISOString();
  const fileName = 'e2e-test.txt';
  const parts = Buffer.concat([
    Buffer.from('--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="' + fileName + '"\r\nContent-Type: text/plain\r\n\r\n'),
    Buffer.from(fileContent),
    Buffer.from('\r\n--' + boundary + '--\r\n'),
  ]);
  const up = await req('POST', '/upload', parts, { 'Content-Type': 'multipart/form-data; boundary=' + boundary });
  const code = up.json && up.json.code;
  check('upload returns 6-char code', up.status === 200 && typeof code === 'string' && /^[A-Z0-9]{6}$/.test(code), code || '');
  const info = await req('GET', '/fileinfo/' + code);
  check('fileinfo ok', info.status === 200 && info.json && info.json.fileName === fileName, info.json ? info.json.fileName : '');

  // Sockets
  const senderDare = 'sender dare: hug a cactus (gently)';
  const receiverDare = 'receiver dare: speak only in rhymes for an hour';
  const sender = io(BASE, { transports: ['websocket'] });
  const receiver = io(BASE, { transports: ['websocket'] });
  const sUp = waitFor(sender, 'connect'), rUp = waitFor(receiver, 'connect');
  sender.connect(); receiver.connect();
  await sUp; await rUp;

  const created = waitFor(sender, 'gameCreated', 10000);
  sender.emit('joinRoom', { code, playerType: 'sender', dare: senderDare, selectedGame: GAME_ID });
  const createdP = await created;
  check('sender gameCreated', createdP && createdP.roomCode === code && createdP.gameType === GAME_ID, JSON.stringify(createdP));

  const joinedR = waitFor(receiver, 'gameJoined', 10000);
  const gsS = waitFor(sender, 'gameStart', 12000);
  const gsR = waitFor(receiver, 'gameStart', 12000);
  receiver.emit('joinRoom', { code, playerType: 'receiver', dare: receiverDare });
  const joinedP = await joinedR;
  check('receiver gameJoined', joinedP && joinedP.roomCode === code, JSON.stringify(joinedP));
  const [gsSData, gsRData] = await Promise.all([gsS, gsR]);
  check('gameStart both sides', gsSData && gsRData && gsSData.round === 1 && gsSData.maxRounds === 3, 'round=' + (gsSData && gsSData.round));

  // Register nextRound listeners early (server auto-advances ~1s after each result)
  const nr2S = waitFor(sender, 'nextRound', 20000);
  const nr2R = waitFor(receiver, 'nextRound', 20000);
  const nr3S = waitFor(sender, 'nextRound', 20000);
  const nr3R = waitFor(receiver, 'nextRound', 20000);

  // Round 1: p1 rock, p2 paper -> player2
  const rr1S = waitFor(sender, 'roundResult', 12000);
  const rr1R = waitFor(receiver, 'roundResult', 12000);
  sender.emit('gameAction', { action: 'rock' });
  receiver.emit('gameAction', { action: 'paper' });
  const [r1S, r1R] = await Promise.all([rr1S, rr1R]);
  check('round1 result winner=player2', r1S && r1S.result && r1S.result.winner === 'player2' && r1S.result.player1.choice === 'rock' && r1S.result.player2.choice === 'paper', JSON.stringify(r1S && r1S.result));
  check('round1 delivered to both', !!r1R);

  // Round 2 (after nextRound): p1 paper, p2 rock -> player1
  await Promise.all([nr2S, nr2R]);
  const rr2S = waitFor(sender, 'roundResult', 12000);
  const rr2R = waitFor(receiver, 'roundResult', 12000);
  sender.emit('gameAction', { action: 'paper' });
  receiver.emit('gameAction', { action: 'rock' });
  const [r2S] = await Promise.all([rr2S, rr2R]);
  check('round2 result winner=player1', r2S && r2S.result && r2S.result.winner === 'player1' && r2S.result.player1.choice === 'paper', JSON.stringify(r2S && r2S.result));
  check('round2 scores 1-1', r2S && r2S.scores && r2S.scores.player1 === 1 && r2S.scores.player2 === 1, JSON.stringify(r2S && r2S.scores));

  // Round 3 (after nextRound): p1 scissors, p2 paper -> player1 -> 2-1 -> gameEnd
  await Promise.all([nr3S, nr3R]);
  const rr3S = waitFor(sender, 'roundResult', 12000);
  const geS = waitFor(sender, 'gameEnd', 12000);
  const geR = waitFor(receiver, 'gameEnd', 12000);
  sender.emit('gameAction', { action: 'scissors' });
  receiver.emit('gameAction', { action: 'paper' });
  const [r3S, geSData, geRData] = await Promise.all([rr3S, geS, geR]);
  check('round3 winner=player1', r3S && r3S.result && r3S.result.winner === 'player1');
  check('gameEnd both sides, winner=player1', geSData && geRData && geSData.winner === 'player1', JSON.stringify(geSData && geSData.winner));
  check('gameEnd final scores 2-1', geSData && geSData.scores && geSData.scores.player1 === 2 && geSData.scores.player2 === 1, JSON.stringify(geSData && geSData.scores));
  check('gameEnd carries dares', geSData && geSData.dares && geSData.dares.player1 === senderDare && geSData.dares.player2 === receiverDare, JSON.stringify(geSData && geSData.dares).slice(0, 120));

  // Download + dares API
  const dl = await req('GET', '/download/' + code);
  check('download returns original bytes', dl.status === 200 && dl.buf.toString('utf8') === fileContent, dl.status + ' len=' + dl.buf.length);
  const dc = await req('GET', '/dare-categories');
  const cats = Array.isArray(dc.json) ? dc.json : [];
  check('dare-categories non-empty', cats.length > 0, cats.length + ' categories');
  if (cats.length) {
    const rd = await req('GET', '/random-dare/' + cats[0].id);
    check('random-dare works', rd.status === 200 && rd.json && typeof rd.json.dare === 'string', rd.json ? (rd.json.dare || '').slice(0, 60) : '');
  }

  sender.disconnect(); receiver.disconnect();
  console.log('');
  console.log(failures.length ? 'FAILURES: ' + failures.join(', ') : 'ALL CHECKS PASSED');
  process.exit(failures.length ? 1 : 0);
}

main().catch((e) => { console.error('E2E ERROR:', e.message); process.exit(1); });
