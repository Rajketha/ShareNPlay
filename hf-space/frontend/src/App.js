import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import './index.css';

/* ============================================================
   CONFIG
   ============================================================ */
// Same-origin when served by the container (Docker / Hugging Face Spaces on
// port 7860 or any https host); dev mode (3002/3000) hits the backend on 5000.
const SAME_ORIGIN = !window.location.port || window.location.port === '7860';
const BACKEND_URL = SAME_ORIGIN
  ? window.location.origin
  : window.location.protocol + '//' + window.location.hostname + ':5000';
const APP_URL = window.location.origin;

const GAME_IDS = [
  'rock-paper-scissors', 'tap-war', 'quick-quiz', 'emoji-memory',
  'typing-speed', 'reaction-time', 'math-blitz', 'color-rush',
  'aim-master', 'stickman-fight', 'car-racer', 'bike-racer',
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
  'bike-racer': 'Bike Racer',
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
  'bike-racer': '🏍',
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
  'bike-racer': 'Balance & lean',
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

const QUIZ_QUESTIONS = [
  { question: 'What is 2 + 2?', answer: '4' },
  { question: 'What color is the sky on a clear day?', answer: 'blue' },
  { question: 'How many days are in a week?', answer: '7' },
  { question: 'What is the capital of France?', answer: 'paris' },
  { question: 'Which planet is the largest?', answer: 'jupiter' },
  { question: 'How many legs does a spider have?', answer: '8' },
  { question: 'What is 10 x 3?', answer: '30' },
  { question: 'What do bees make?', answer: 'honey' },
];
const pickQuestion = () => QUIZ_QUESTIONS[Math.floor(Math.random() * QUIZ_QUESTIONS.length)];

const MEMOJI_ALPHABET = ['😀', '😎', '🎮', '🚀', '⭐', '🎯', '🎪', '🎨'];

const COLOR_WORDS = [
  { name: 'RED', hex: '#ef4444' },
  { name: 'BLUE', hex: '#3b82f6' },
  { name: 'GREEN', hex: '#22c55e' },
  { name: 'YELLOW', hex: '#eab308' },
  { name: 'PURPLE', hex: '#a855f7' },
  { name: 'ORANGE', hex: '#f97316' },
];

const RPS_EMOJI = { rock: '🪨', paper: '📄', scissors: '✂️' };

/* ============================================================
   SHARED SMALL COMPONENTS
   ============================================================ */
function GameShell({ emoji, name, tag, children }) {
  return (
    <div className="game-card">
      <div className="game-title-row">
        <span className="icon">{emoji}</span>
        <h3>{name}</h3>
        <span className="tag">{tag}</span>
      </div>
      {children}
    </div>
  );
}

function TimerBar({ seconds, runId }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    setLeft(seconds);
    const started = Date.now();
    const iv = setInterval(() => {
      setLeft(Math.max(0, seconds - (Date.now() - started) / 1000));
    }, 100);
    return () => clearInterval(iv);
  }, [seconds, runId]);
  const pct = seconds > 0 ? Math.max(0, (left / seconds) * 100) : 0;
  return (
    <div style={{ width: '100%', height: 10, borderRadius: 999, background: 'var(--bg-surface-2, rgba(0,0,0,0.08))', overflow: 'hidden', margin: '10px 0' }}>
      <div style={{ width: pct + '%', height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#f43f5e,#fbbf24)', transition: 'width 0.1s linear' }} />
    </div>
  );
}

function WaitingForOpponent({ show }) {
  if (!show) return null;
  return <div style={{ textAlign: 'center', color: 'var(--ink-secondary)', fontSize: '0.9rem', marginTop: 10 }}>⏳ Waiting for opponent…</div>;
}

/* ============================================================
   GAME: TAP WAR — most taps in 5 seconds wins the round
   ============================================================ */
function TapWarGame({ onResult, round }) {
  const [taps, setTaps] = useState(0);
  const [phase, setPhase] = useState('ready');
  const tapsRef = useRef(0);
  const doneRef = useRef(false);
  const submitRef = useRef(null);
  useEffect(() => {
    tapsRef.current = 0; doneRef.current = false;
    setTaps(0); setPhase('ready');
  }, [round]);
  useEffect(() => {
    submitRef.current = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      setPhase('done');
      onResult(tapsRef.current);
    };
  }, [onResult]);
  const tap = () => {
    if (doneRef.current) return;
    if (phase === 'ready') {
      setPhase('running');
      const startedAt = Date.now();
      const iv = setInterval(() => {
        const left = 5 - (Date.now() - startedAt) / 1000;
        if (left <= 0) { clearInterval(iv); if (submitRef.current) submitRef.current(); }
      }, 100);
    }
    tapsRef.current += 1;
    setTaps(tapsRef.current);
  };
  return (
    <GameShell emoji="👆" name="Tap War" tag={'Round ' + round}>
      <p style={{ textAlign: 'center', color: 'var(--ink-secondary)', margin: '6px 0' }}>
        {phase === 'ready' ? 'Tap to start — most taps in 5 seconds wins!' : phase === 'running' ? 'GO GO GO!' : '✅ Sent! Waiting for opponent…'}
      </p>
      <div style={{ fontSize: '3rem', fontWeight: 900, textAlign: 'center' }}>{taps}</div>
      {phase === 'running' && <TimerBar seconds={5} runId={round} />}
      <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 10 }} onClick={tap} disabled={phase === 'done'}>
        {phase === 'done' ? '✅ Sent!' : '👆 TAP!'}
      </button>
    </GameShell>
  );
}

/* ============================================================
   GAME: QUICK QUIZ — type the answer; correct + faster wins
   ============================================================ */
function QuickQuizGame({ onResult, round, question }) {
  const [q, setQ] = useState(pickQuestion);
  const [answer, setAnswer] = useState('');
  const [done, setDone] = useState(false);
  const answerRef = useRef('');
  const doneRef = useRef(false);
  const submitRef = useRef(null);
  useEffect(() => {
    doneRef.current = false;
    setDone(false); setAnswer(''); answerRef.current = '';
    setQ(question ? { question, answer: '' } : pickQuestion());
  }, [round, question]);
  useEffect(() => {
    submitRef.current = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      setDone(true);
      onResult(answerRef.current.trim().toLowerCase());
    };
  }, [onResult]);
  const submit = () => { if (!done && answerRef.current.trim() && submitRef.current) submitRef.current(); };
  return (
    <GameShell emoji="🧠" name="Quick Quiz" tag={'Round ' + round}>
      <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg-surface-2, rgba(0,0,0,0.05))', marginBottom: 12 }}>
        <p style={{ fontWeight: 700, margin: 0 }}>{q.question}</p>
      </div>
      <div className="input-group" style={{ marginBottom: 12 }}>
        <input
          className="input"
          placeholder="Type your answer…"
          value={answer}
          disabled={done}
          onChange={e => { setAnswer(e.target.value); answerRef.current = e.target.value; }}
          onKeyDown={e => e.key === 'Enter' && submit()}
        />
        <button className="btn btn-primary" onClick={submit} disabled={done || !answer.trim()}>Submit</button>
      </div>
      {done && <div style={{ color: 'var(--success)', fontWeight: 800, textAlign: 'center' }}>✅ Answer sent!</div>}
    </GameShell>
  );
}

/* ============================================================
   GAME: EMOJI MEMORY — memorize the sequence, rebuild it.
   Score = number of positions recalled correctly.
   ============================================================ */
function EmojiMemoryGame({ sequence, onResult, round }) {
  const [seq, setSeq] = useState([]);
  const [showing, setShowing] = useState(true);
  const [picked, setPicked] = useState([]);
  const [done, setDone] = useState(false);
  const pickedRef = useRef([]);
  const doneRef = useRef(false);
  const submitRef = useRef(null);
  useEffect(() => {
    doneRef.current = false;
    const emojis = (sequence && sequence.length >= 3) ? sequence
      : Array.from({ length: 5 }, () => MEMOJI_ALPHABET[Math.floor(Math.random() * MEMOJI_ALPHABET.length)]);
    setSeq(emojis);
    setShowing(true);
    setPicked([]); pickedRef.current = [];
    setDone(false);
    const t = setTimeout(() => setShowing(false), 3500);
    return () => clearTimeout(t);
  }, [round, sequence]);
  useEffect(() => {
    submitRef.current = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      setDone(true);
      const correct = seq.reduce((acc, emoji, idx) => acc + (pickedRef.current[idx] === emoji ? 1 : 0), 0);
      onResult(correct);
    };
  }, [onResult, seq]);
  const pick = (emoji) => {
    if (doneRef.current || showing) return;
    const next = [...pickedRef.current, emoji].slice(0, seq.length);
    pickedRef.current = next;
    setPicked(next);
    if (next.length >= seq.length && submitRef.current) submitRef.current();
  };
  const score = seq.reduce((acc, emoji, idx) => acc + (picked[idx] === emoji ? 1 : 0), 0);
  return (
    <GameShell emoji="🧩" name="Emoji Memory" tag={'Round ' + round}>
      {showing ? (
        <div style={{ textAlign: 'center', padding: '18px 0' }}>
          <p style={{ color: 'var(--ink-secondary)' }}>Memorize this sequence…</p>
          <div style={{ fontSize: '2.2rem', letterSpacing: 8 }}>{seq.join(' ')}</div>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--ink-secondary)', margin: '6px 0' }}>Now rebuild it in order ({picked.length}/{seq.length})</p>
          <div style={{ fontSize: '1.6rem', minHeight: 40, letterSpacing: 6, marginBottom: 10 }}>
            {picked.join(' ') || '· · · · ·'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {MEMOJI_ALPHABET.map(e => (
              <button key={e} className="btn btn-secondary" style={{ fontSize: '1.4rem', padding: '6px 12px' }} onClick={() => pick(e)} disabled={done}>{e}</button>
            ))}
          </div>
        </div>
      )}
      {done
        ? <div style={{ color: 'var(--success)', fontWeight: 800, textAlign: 'center', marginTop: 10 }}>✅ Sent! You got {score}/{seq.length}</div>
        : (!showing && <button className="btn btn-secondary" style={{ width: '100%', marginTop: 10 }} onClick={() => submitRef.current && submitRef.current()}>Submit as is</button>)}
    </GameShell>
  );
}

/* ============================================================
   GAME: TYPING SPEED — type the text exactly; WPM wins
   ============================================================ */
function TypingSpeedGame({ text, onResult, round }) {
  const target = text || 'The quick brown fox jumps over the lazy dog.';
  const [input, setInput] = useState('');
  const [done, setDone] = useState(false);
  const startedRef = useRef(null);
  const inputRef = useRef('');
  const doneRef = useRef(false);
  const submitRef = useRef(null);
  useEffect(() => {
    doneRef.current = false;
    setInput(''); inputRef.current = ''; startedRef.current = null; setDone(false);
  }, [round, target]);
  useEffect(() => {
    submitRef.current = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      setDone(true);
      const secs = startedRef.current ? Math.max(1, (Date.now() - startedRef.current) / 1000) : 30;
      const words = inputRef.current.trim().split(/\s+/).filter(Boolean).length;
      onResult(Math.round((words / secs) * 60));
    };
  }, [onResult]);
  const onChange = (e) => {
    if (doneRef.current) return;
    if (startedRef.current === null) startedRef.current = Date.now();
    const v = e.target.value;
    setInput(v); inputRef.current = v;
    if (v === target && submitRef.current) submitRef.current();
  };
  return (
    <GameShell emoji="⌨️" name="Typing Speed" tag={'Round ' + round}>
      <div style={{ padding: 10, borderRadius: 10, background: 'var(--bg-surface-2, rgba(0,0,0,0.05))', fontStyle: 'italic', color: 'var(--ink-secondary)', whiteSpace: 'pre-wrap', marginBottom: 10 }}>{target}</div>
      <textarea
        className="input"
        placeholder="Start typing…"
        value={input}
        onChange={onChange}
        disabled={done}
        rows={3}
        style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '1rem', width: '100%' }}
      />
      {done && <div style={{ color: 'var(--success)', fontWeight: 800, textAlign: 'center', marginTop: 8 }}>✅ Done! WPM sent.</div>}
    </GameShell>
  );
}

/* ============================================================
   GAME: REACTION TIME — click the instant it turns green.
   Early click = 3000ms penalty. Lower ms wins.
   ============================================================ */
function ReactionTimeGame({ onResult, round }) {
  const [phase, setPhase] = useState('waiting');
  const [ms, setMs] = useState(null);
  const shownAtRef = useRef(0);
  const msRef = useRef(9999);
  const doneRef = useRef(false);
  const submitRef = useRef(null);
  useEffect(() => {
    doneRef.current = false;
    setPhase('waiting'); setMs(null); msRef.current = 9999;
    const t = setTimeout(() => {
      shownAtRef.current = Date.now();
      setPhase('green');
    }, 1500 + Math.random() * 3500);
    return () => clearTimeout(t);
  }, [round]);
  useEffect(() => {
    submitRef.current = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      setPhase('done');
      onResult(msRef.current);
    };
  }, [onResult]);
  const click = () => {
    if (doneRef.current) return;
    if (phase === 'waiting' || phase === 'early') {
      setPhase('early');
      msRef.current = 3000;
      if (submitRef.current) submitRef.current();
    } else if (phase === 'green') {
      const d = Date.now() - shownAtRef.current;
      msRef.current = d;
      setMs(d);
      if (submitRef.current) submitRef.current();
    }
  };
  const bg = phase === 'green' ? '#22c55e' : phase === 'early' ? '#f43f5e' : 'var(--bg-surface-2, rgba(0,0,0,0.06))';
  const fg = phase === 'green' ? '#fff' : phase === 'early' ? '#fff' : 'var(--ink-secondary, #888)';
  return (
    <GameShell emoji="⚡" name="Reaction Time" tag={'Round ' + round}>
      <div
        onClick={click}
        style={{ height: 170, borderRadius: 14, background: bg, color: fg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', textAlign: 'center', transition: 'background 0.15s', cursor: 'pointer' }}
      >
        {phase === 'waiting' && <span>Wait for GREEN…<br /><span style={{ fontSize: '0.85rem', fontWeight: 400 }}>clicking early = penalty</span></span>}
        {phase === 'green' && <span style={{ fontSize: '2rem' }}>CLICK NOW!</span>}
        {phase === 'early' && <span>😮 Too early! 3s penalty</span>}
        {phase === 'done' && <span>✅ Sent: {ms === 3000 ? 'penalty' : ms + ' ms'}</span>}
      </div>
    </GameShell>
  );
}

/* ============================================================
   GAME: MATH BLITZ — solve as many problems as you can in 10s
   ============================================================ */
function MathBlitzGame({ onResult, round }) {
  const [problem, setProblem] = useState(null);
  const [answer, setAnswer] = useState('');
  const [hits, setHits] = useState(0);
  const [phase, setPhase] = useState('ready');
  const hitsRef = useRef(0);
  const doneRef = useRef(false);
  const submitRef = useRef(null);
  const makeProblem = () => {
    const a = 2 + Math.floor(Math.random() * 12);
    const b = 2 + Math.floor(Math.random() * 12);
    const ops = ['+', '-', 'x'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    const result = op === '+' ? a + b : op === '-' ? a - b : a * b;
    return { text: a + ' ' + op + ' ' + b, result };
  };
  useEffect(() => {
    doneRef.current = false;
    hitsRef.current = 0;
    setHits(0); setAnswer(''); setProblem(null); setPhase('ready');
  }, [round]);
  useEffect(() => {
    submitRef.current = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      setPhase('done');
      onResult(hitsRef.current);
    };
  }, [onResult]);
  const start = () => {
    if (phase !== 'ready') return;
    setPhase('running');
    setProblem(makeProblem());
    const startedAt = Date.now();
    const iv = setInterval(() => {
      const left = 10 - (Date.now() - startedAt) / 1000;
      if (left <= 0) { clearInterval(iv); if (submitRef.current) submitRef.current(); }
    }, 100);
  };
  const submitAnswer = () => {
    if (doneRef.current || phase !== 'running' || !problem) return;
    if (Number(answer) === problem.result) {
      hitsRef.current += 1;
      setHits(hitsRef.current);
    }
    setAnswer('');
    setProblem(makeProblem());
  };
  return (
    <GameShell emoji="🔢" name="Math Blitz" tag={'Round ' + round}>
      <p style={{ textAlign: 'center', color: 'var(--ink-secondary)', margin: '6px 0' }}>
        {phase === 'ready' ? 'Solve as many as you can in 10 seconds!' : phase === 'running' ? 'Solve!' : '✅ Sent!'}
      </p>
      {phase === 'running' && <TimerBar seconds={10} runId={round} />}
      {phase === 'running' && problem && (
        <div style={{ textAlign: 'center', margin: '8px 0' }}>
          <div style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 8 }}>{problem.text} = ?</div>
          <div className="input-group" style={{ maxWidth: 260, margin: '0 auto' }}>
            <input
              className="input"
              inputMode="numeric"
              value={answer}
              autoFocus
              onChange={e => setAnswer(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitAnswer()}
            />
            <button className="btn btn-primary" onClick={submitAnswer}>OK</button>
          </div>
          <div style={{ marginTop: 8, fontWeight: 800 }}>Correct: {hits}</div>
        </div>
      )}
      {phase === 'ready' && (
        <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={start}>▶ Start</button>
      )}
    </GameShell>
  );
}

/* ============================================================
   GAME: COLOR RUSH — click when the INK matches the WORD.
   Score = correct hits, faster = better tie-break.
   ============================================================ */
function ColorRushGame({ onResult, round }) {
  const [roundData, setRoundData] = useState(null);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [phase, setPhase] = useState('ready');
  const statsRef = useRef({ hits: 0, misses: 0 });
  const doneRef = useRef(false);
  const submitRef = useRef(null);
  const makeRound = () => {
    const match = Math.random() < 0.5;
    const word = COLOR_WORDS[Math.floor(Math.random() * COLOR_WORDS.length)];
    let ink = word;
    if (!match) {
      do { ink = COLOR_WORDS[Math.floor(Math.random() * COLOR_WORDS.length)]; } while (ink.name === word.name);
    }
    return { word, ink, match };
  };
  useEffect(() => {
    doneRef.current = false;
    statsRef.current = { hits: 0, misses: 0 };
    setHits(0); setMisses(0); setRoundData(null); setPhase('ready');
  }, [round]);
  useEffect(() => {
    submitRef.current = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      setPhase('done');
      onResult(statsRef.current.hits);
    };
  }, [onResult]);
  const start = () => {
    if (phase !== 'ready') return;
    setPhase('running');
    setRoundData(makeRound());
    const startedAt = Date.now();
    const iv = setInterval(() => {
      const left = 10 - (Date.now() - startedAt) / 1000;
      if (left <= 0) { clearInterval(iv); if (submitRef.current) submitRef.current(); }
    }, 100);
  };
  const answer = (saidYes) => {
    if (doneRef.current || phase !== 'running' || !roundData) return;
    if (saidYes === roundData.match) {
      statsRef.current.hits += 1;
      setHits(statsRef.current.hits);
    } else {
      statsRef.current.misses += 1;
      setMisses(statsRef.current.misses);
    }
    setRoundData(makeRound());
  };
  return (
    <GameShell emoji="🎨" name="Color Rush" tag={'Round ' + round}>
      <p style={{ textAlign: 'center', color: 'var(--ink-secondary)', margin: '6px 0' }}>
        Does the COLOR match the WORD? Yes = ✓, No = ✗
      </p>
      {phase === 'running' && <TimerBar seconds={10} runId={round} />}
      {phase === 'running' && roundData && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', fontWeight: 900, margin: '10px 0', color: roundData.ink.hex, fontFamily: 'var(--font-head, sans-serif)' }}>
            {roundData.word.name}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-success btn-lg" onClick={() => answer(true)}>✓ Match</button>
            <button className="btn btn-danger btn-lg" onClick={() => answer(false)}>✗ No match</button>
          </div>
          <div style={{ marginTop: 10, fontWeight: 800 }}>✅ {hits} · ❌ {misses}</div>
        </div>
      )}
      {phase === 'ready' && (
        <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={start}>▶ Start</button>
      )}
    </GameShell>
  );
}

/* ============================================================
   GAME: AIM MASTER — targets appear, tap them fast.
   Score = targets hit in 10s.
   ============================================================ */
function AimMasterGame({ onResult, round }) {
  const [targets, setTargets] = useState([]);
  const [hits, setHits] = useState(0);
  const [phase, setPhase] = useState('ready');
  const hitsRef = useRef(0);
  const doneRef = useRef(false);
  const idRef = useRef(0);
  const submitRef = useRef(null);
  useEffect(() => {
    doneRef.current = false;
    hitsRef.current = 0;
    setHits(0); setTargets([]); setPhase('ready');
  }, [round]);
  useEffect(() => {
    submitRef.current = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      setPhase('done');
      onResult(hitsRef.current);
    };
  }, [onResult]);
  const spawn = () => ({
    id: ++idRef.current,
    x: 12 + Math.random() * 76,
    y: 12 + Math.random() * 76,
    size: 34 + Math.random() * 22,
  });
  const start = () => {
    if (phase !== 'ready') return;
    setPhase('running');
    setTargets([spawn()]);
    const startedAt = Date.now();
    const iv = setInterval(() => {
      const left = 10 - (Date.now() - startedAt) / 1000;
      if (left <= 0) { clearInterval(iv); setTargets([]); if (submitRef.current) submitRef.current(); }
    }, 100);
  };
  const hit = (id) => {
    if (doneRef.current || phase !== 'running') return;
    hitsRef.current += 1;
    setHits(hitsRef.current);
    setTargets([spawn()]);
  };
  return (
    <GameShell emoji="🎯" name="Aim Master" tag={'Round ' + round}>
      <p style={{ textAlign: 'center', color: 'var(--ink-secondary)', margin: '6px 0' }}>
        {phase === 'ready' ? 'Tap the targets as fast as you can for 10 seconds!' : phase === 'running' ? 'Fire!' : '✅ Sent!'}
      </p>
      {phase === 'running' && <TimerBar seconds={10} runId={round} />}
      {phase === 'running' && (
        <div style={{ position: 'relative', height: 260, borderRadius: 14, background: 'var(--bg-surface-2, rgba(0,0,0,0.05))', overflow: 'hidden' }}>
          {targets.map(t => (
            <button
              key={t.id}
              onClick={() => hit(t.id)}
              style={{
                position: 'absolute', left: t.x + '%', top: t.y + '%',
                width: t.size, height: t.size, borderRadius: '50%',
                border: 'none', cursor: 'crosshair',
                background: 'radial-gradient(circle at 35% 35%, #fda4af, #f43f5e 70%)',
                boxShadow: '0 4px 14px rgba(244,63,94,0.45)',
                transform: 'translate(-50%, -50%)',
              }}
              aria-label="target"
            />
          ))}
          <div style={{ position: 'absolute', top: 8, right: 12, fontWeight: 900, fontSize: '1.1rem' }}>{hits} 🎯</div>
        </div>
      )}
      {phase === 'ready' && (
        <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={start}>▶ Start</button>
      )}
    </GameShell>
  );
}

/* ============================================================
   GAME: STICKMAN FIGHT — tap punch/kick for 8s; more hits wins
   ============================================================ */
function StickmanFightGame({ onResult, round }) {
  const [punches, setPunches] = useState(0);
  const [kicks, setKicks] = useState(0);
  const [phase, setPhase] = useState('ready');
  const statsRef = useRef({ p: 0, k: 0 });
  const doneRef = useRef(false);
  const submitRef = useRef(null);
  useEffect(() => {
    doneRef.current = false;
    statsRef.current = { p: 0, k: 0 };
    setPunches(0); setKicks(0); setPhase('ready');
  }, [round]);
  useEffect(() => {
    submitRef.current = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      setPhase('done');
      onResult(statsRef.current.p + statsRef.current.k);
    };
  }, [onResult]);
  const start = () => {
    if (phase !== 'ready') return;
    setPhase('running');
    const startedAt = Date.now();
    const iv = setInterval(() => {
      const left = 8 - (Date.now() - startedAt) / 1000;
      if (left <= 0) { clearInterval(iv); if (submitRef.current) submitRef.current(); }
    }, 100);
  };
  const addPunch = () => { if (phase === 'running') { statsRef.current.p += 1; setPunches(statsRef.current.p); } };
  const addKick = () => { if (phase === 'running') { statsRef.current.k += 1; setKicks(statsRef.current.k); } };
  return (
    <GameShell emoji="🧍" name="Stickman Fight" tag={'Round ' + round}>
      <p style={{ textAlign: 'center', color: 'var(--ink-secondary)', margin: '6px 0' }}>
        {phase === 'ready' ? 'Mash punch & kick for 8 seconds!' : phase === 'running' ? 'FIGHT!' : '✅ Sent!'}
      </p>
      {phase === 'running' && <TimerBar seconds={8} runId={round} />}
      {phase === 'running' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3.2rem', margin: '6px 0' }}>🧍💥🥊</div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-primary btn-lg" onClick={addPunch}>🥊 Punch ({punches})</button>
            <button className="btn btn-danger btn-lg" onClick={addKick}>🦶 Kick ({kicks})</button>
          </div>
          <div style={{ marginTop: 10, fontWeight: 800 }}>Total: {punches + kicks}</div>
        </div>
      )}
      {phase === 'ready' && (
        <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={start}>▶ Start</button>
      )}
    </GameShell>
  );
}

/* ============================================================
   GAME: CAR RACER — dodge traffic: switch lanes, survive.
   Score = meters survived. Crash ends your run.
   ============================================================ */
function CarRacerGame({ onResult, round }) {
  const [lane, setLane] = useState(1);
  const [obstacles, setObstacles] = useState([]);
  const [meters, setMeters] = useState(0);
  const [phase, setPhase] = useState('ready');
  const laneRef = useRef(1);
  const obstaclesRef = useRef([]);
  const metersRef = useRef(0);
  const doneRef = useRef(false);
  const idRef = useRef(0);
  const submitRef = useRef(null);
  useEffect(() => {
    doneRef.current = false;
    laneRef.current = 1; obstaclesRef.current = []; metersRef.current = 0;
    setLane(1); setObstacles([]); setMeters(0); setPhase('ready');
  }, [round]);
  useEffect(() => {
    submitRef.current = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      setPhase('done');
      onResult(Math.round(metersRef.current));
    };
  }, [onResult]);
  const crash = () => { if (submitRef.current) submitRef.current(); };
  const start = () => {
    if (phase !== 'ready') return;
    setPhase('running');
    const spawnIv = setInterval(() => {
      if (doneRef.current) { clearInterval(spawnIv); return; }
      const o = { id: ++idRef.current, lane: Math.floor(Math.random() * 3), y: -8 };
      obstaclesRef.current.push(o);
    }, 650);
    const tickIv = setInterval(() => {
      if (doneRef.current) { clearInterval(tickIv); clearInterval(spawnIv); return; }
      metersRef.current += 1.6;
      setMeters(metersRef.current);
      const next = [];
      for (const o of obstaclesRef.current) {
        const y = o.y + 5;
        if (y > 120) continue;
        if (y > 74 && y < 96 && o.lane === laneRef.current) {
          clearInterval(tickIv); clearInterval(spawnIv);
          crash();
          return;
        }
        next.push({ ...o, y });
      }
      obstaclesRef.current = next;
      setObstacles(next);
    }, 60);
  };
  const move = (dir) => {
    if (phase !== 'running') return;
    const n = Math.max(0, Math.min(2, laneRef.current + dir));
    laneRef.current = n;
    setLane(n);
  };
  const laneX = [22, 50, 78];
  return (
    <GameShell emoji="🏎" name="Car Racer" tag={'Round ' + round}>
      <p style={{ textAlign: 'center', color: 'var(--ink-secondary)', margin: '6px 0' }}>
        {phase === 'ready' ? 'Dodge the traffic — survive as long as you can!' : phase === 'running' ? '💨 ' + Math.round(meters) + ' m' : '💥 Crashed at ' + Math.round(meters) + ' m!'}
      </p>
      {phase !== 'ready' && (
        <div style={{ position: 'relative', height: 300, borderRadius: 14, overflow: 'hidden', background: 'linear-gradient(180deg,#334155,#1e293b)' }}>
          {[22, 50, 78].map(x => (
            <div key={x} style={{ position: 'absolute', left: x + '%', top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.15)', transform: 'translateX(-50%)' }} />
          ))}
          {obstacles.map(o => (
            <div key={o.id} style={{ position: 'absolute', left: laneX[o.lane] + '%', top: o.y + '%', width: 34, height: 52, borderRadius: 8, transform: 'translate(-50%,-50%)', background: 'linear-gradient(180deg,#f59e0b,#d97706)', boxShadow: '0 4px 10px rgba(0,0,0,0.4)' }} />
          ))}
          <div style={{ position: 'absolute', left: laneX[lane] + '%', bottom: '6%', width: 38, height: 58, borderRadius: 9, transform: 'translateX(-50%)', background: 'linear-gradient(180deg,#60a5fa,#2563eb)', boxShadow: '0 6px 16px rgba(37,99,235,0.5)', transition: 'left 0.12s ease' }} />
          {phase === 'running' && (
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 8, display: 'flex', justifyContent: 'center', gap: 14 }}>
              <button className="btn btn-secondary btn-lg" onClick={() => move(-1)}>◀</button>
              <button className="btn btn-secondary btn-lg" onClick={() => move(1)}>▶</button>
            </div>
          )}
        </div>
      )}
      {phase === 'ready' && (
        <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={start}>▶ Start Engine</button>
      )}
    </GameShell>
  );
}

/* ============================================================
   GAME: BIKE RACER — hold to lean back and keep the wheelie
   in the green zone. Score = ms balanced in 10s.
   ============================================================ */
function BikeRacerGame({ onResult, round }) {
  const [angle, setAngle] = useState(50);
  const [balanced, setBalanced] = useState(0);
  const [phase, setPhase] = useState('ready');
  const [holding, setHolding] = useState(false);
  const angleRef = useRef(50);
  const balancedRef = useRef(0);
  const doneRef = useRef(false);
  const submitRef = useRef(null);
  useEffect(() => {
    doneRef.current = false;
    angleRef.current = 50; balancedRef.current = 0;
    setAngle(50); setBalanced(0); setPhase('ready'); setHolding(false);
  }, [round]);
  useEffect(() => {
    submitRef.current = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      setPhase('done');
      onResult(Math.round(balancedRef.current));
    };
  }, [onResult]);
  const start = () => {
    if (phase !== 'ready') return;
    setPhase('running');
    const startedAt = Date.now();
    const iv = setInterval(() => {
      if (doneRef.current) { clearInterval(iv); return; }
      angleRef.current = Math.max(0, Math.min(100, angleRef.current + (holdingRef.current ? 5 : -5)));
      setAngle(angleRef.current);
      if (angleRef.current >= 35 && angleRef.current <= 65) {
        balancedRef.current += 50;
        setBalanced(balancedRef.current);
      }
      const left = 10 - (Date.now() - startedAt) / 1000;
      if (left <= 0) { clearInterval(iv); if (submitRef.current) submitRef.current(); }
    }, 50);
  };
  const holdingRef = useRef(false);
  const hold = (v) => {
    holdingRef.current = v;
    setHolding(v);
  };
  const inZone = angle >= 35 && angle <= 65;
  return (
    <GameShell emoji="🏍" name="Bike Racer" tag={'Round ' + round}>
      <p style={{ textAlign: 'center', color: 'var(--ink-secondary)', margin: '6px 0' }}>
        {phase === 'ready' ? 'Hold LEAN BACK to wheelie — stay in the green zone!' : phase === 'running' ? 'Balance! ' + (balanced / 1000).toFixed(1) + 's in zone' : '✅ Sent: ' + (balanced / 1000).toFixed(1) + 's'}
      </p>
      {phase === 'running' && (
        <div>
          <TimerBar seconds={10} runId={round} />
          <div style={{ position: 'relative', height: 26, borderRadius: 999, background: 'var(--bg-surface-2, rgba(0,0,0,0.08))', margin: '10px 0', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: '35%', width: '30%', top: 0, bottom: 0, background: 'rgba(34,197,94,0.35)' }} />
            <div style={{ position: 'absolute', left: angle + '%', top: -4, bottom: -4, width: 6, borderRadius: 3, background: inZone ? '#22c55e' : '#f43f5e', transform: 'translateX(-50%)', transition: 'left 0.05s linear' }} />
          </div>
          <div style={{ textAlign: 'center', fontSize: '2.6rem', margin: '4px 0' }}>{inZone ? '🏍️💨' : angle > 65 ? '🏍️⬆️' : '🏍️⬇️'}</div>
          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', userSelect: 'none', touchAction: 'none' }}
            onPointerDown={() => hold(true)}
            onPointerUp={() => hold(false)}
            onPointerLeave={() => hold(false)}
          >
            {holding ? '⬆️ Leaning back…' : '⬆️ Hold to LEAN BACK'}
          </button>
        </div>
      )}
      {phase === 'ready' && (
        <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={start}>▶ Start</button>
      )}
    </GameShell>
  );
}

/* ============================================================
   CINEMATIC INTRO OVERLAY
   ============================================================ */
function IntroOverlay({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="intro-overlay">
      <div className="intro-logo">SHARENPLAY</div>
      <div className="intro-tag">Share · Play · Dare</div>
      <div className="intro-ring" />
      <div className="intro-credit">a <b>RAJKETHA PROJECT</b></div>
    </div>
  );
}

/* ============================================================
   BRAND FOOTER
   ============================================================ */
function BrandFooter() {
  return (
    <footer className="brand-footer">
      <div className="inner">
        <div className="mark" />
        <span className="name">Rajketha <b>Project</b></span>
        <span className="divider" />
        <span className="sub">File Sharing · Games</span>
      </div>
    </footer>
  );
}

/* ============================================================
   MAIN APP
   ============================================================ */
function App() {
  const [view, setView] = useState('home');
  const [file, setFile] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [code, setCode] = useState('');
  const [dare, setDare] = useState('');
  const [dareCategories, setDareCategories] = useState([]);
  const [selectedDareCategory, setSelectedDareCategory] = useState('');
  const [receiverDareCategory, setReceiverDareCategory] = useState('');
  const [selectedGame, setSelectedGame] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const [receiverCode, setReceiverCode] = useState('');
  const [receiverDare, setReceiverDare] = useState('');
  const [receiverFileInfo, setReceiverFileInfo] = useState(null);
  const [receiverError, setReceiverError] = useState('');

  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [playerType, setPlayerType] = useState('');
  const [playerRole, setPlayerRole] = useState(null);
  const [currentGame, setCurrentGame] = useState('');
  const [round, setRound] = useState(1);
  const [maxRounds, setMaxRounds] = useState(3);
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [gameResult, setGameResult] = useState(null);
  const [gameWinner, setGameWinner] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [dares, setDares] = useState({});
  const [action, setAction] = useState('');
  const [waitingHint, setWaitingHint] = useState('');
  const [lanHost, setLanHost] = useState('');
  const [intro, setIntro] = useState(() => !sessionStorage.getItem('snp-intro-seen'));

  const viewRef = useRef('home');
  const playerTypeRef = useRef('');
  useEffect(() => { viewRef.current = view; }, [view]);
  useEffect(() => { playerTypeRef.current = playerType; }, [playerType]);

  /* ---------- dare categories (fetch once) ---------- */
  useEffect(() => {
    axios.get(BACKEND_URL + '/dare-categories')
      .then(res => setDareCategories(Array.isArray(res.data) ? res.data : []))
      .catch(() => setDareCategories([]));
  }, []);

  /* ---------- LAN IP for QR codes ---------- */
  useEffect(() => {
    axios.get(BACKEND_URL + '/api/lan-info')
      .then(res => {
        // Only use a LAN IP when the user browses over LAN themselves
        // (public hosts like Hugging Face report container-internal IPs).
        if (/^(http:\/\/)(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(window.location.href)) {
          const ips = (res.data && res.data.lanIps) || [];
          const candidates = ips.filter(ip => ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.'));
          if (candidates.length) setLanHost(candidates[0]);
        }
      })
      .catch(() => {});
  }, []);

  /* ---------- deep link: QR opens /?code=XXX&view=receiver ---------- */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCode = (params.get('code') || '').toUpperCase();
    if (params.get('view') === 'receiver' && /^[A-Z0-9]{6}$/.test(urlCode)) {
      setReceiverCode(urlCode);
      setView('receiver');
    }
  }, []);

  /* ---------- socket connection + all server events ---------- */
  useEffect(() => {
    const s = io(BACKEND_URL, { transports: ['websocket', 'polling'], reconnection: true, reconnectionAttempts: 5 });
    setSocket(s);
    s.on('connect', () => setConnectionStatus('connected'));
    s.on('connect_error', () => setConnectionStatus('error'));
    s.on('disconnect', () => setConnectionStatus('disconnected'));
    s.on('error', (err) => {
      setError((err && err.message) || 'Game error occurred');
      if (viewRef.current === 'waiting') setView(playerTypeRef.current === 'receiver' ? 'receiver' : 'sender');
    });
    s.on('gameCreated', () => {});
    s.on('gameJoined', () => {});
    s.on('gameStart', ({ gameType, round: r, maxRounds: mr, playerMap, gameData: gd }) => {
      setCurrentGame(gameType);
      setRound(r || 1);
      setMaxRounds(mr || 3);
      setGameData(gd || null);
      setScores({ player1: 0, player2: 0 });
      setAction('');
      setGameResult(null);
      setGameWinner(null);
      setError('');
      setPlayerRole(playerMap && playerMap.player1 === s.id ? 'player1' : 'player2');
      setView('game');
    });
    s.on('roundResult', ({ result, scores: sc, round: r }) => {
      if (!result || !sc) { setGameResult(null); return; }
      setGameResult(result);
      setScores(sc);
      if (r) setRound(r);
    });
    s.on('nextRound', ({ round: r, gameData: gd }) => {
      setRound(r);
      setGameData(gd || null);
      setAction('');
      setGameResult(null);
    });
    s.on('gameEnd', ({ winner, finalScores, dares: dz }) => {
      setGameWinner({ winner, finalScores, dares: dz || {} });
      setView('end');
    });
    return () => s.disconnect();
  }, []);

  /* ---------- waiting hint ---------- */
  useEffect(() => {
    if (view !== 'waiting') return;
    setWaitingHint('');
    const t = setTimeout(() => setWaitingHint('Still waiting? The sender must tap "Join Game" on the PC first.'), 7000);
    return () => clearTimeout(t);
  }, [view]);

  /* ---------- confetti when you win ---------- */
  useEffect(() => {
    if (view === 'end' && gameWinner && gameWinner.winner === playerRole && gameWinner.winner !== 'tie') {
      confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 } });
    }
  }, [view, gameWinner, playerRole]);

  /* ---------- helpers ---------- */
  const fmtSize = (n) => n >= 1024 * 1024 ? (n / (1024 * 1024)).toFixed(2) + ' MB' : (n / 1024).toFixed(1) + ' KB';

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);
    setError('');
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await axios.post(BACKEND_URL + '/upload', form, {
        onUploadProgress: (e) => { if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100)); },
      });
      setFileInfo(res.data);
      setCode(res.data.code);
    } catch (err) {
      setError(err.response && err.response.data && err.response.data.error ? err.response.data.error : 'Upload failed — is the server running?');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleJoinAsSender = () => {
    if (!code || !dare) return;
    setError('');
    socket.emit('joinRoom', { code, playerType: 'sender', dare, selectedGame: selectedGame || 'rock-paper-scissors' });
    setPlayerType('sender');
    setView('waiting');
  };

  const checkFileInfo = async (rc) => {
    const res = await axios.get(BACKEND_URL + '/fileinfo/' + rc);
    setReceiverFileInfo(res.data);
    return res.data;
  };

  const handleJoinAsReceiver = async (rc, rd) => {
    setReceiverError('');
    try {
      await checkFileInfo(rc);
      setCode(rc);
      setDare(rd);
      socket.emit('joinRoom', { code: rc, playerType: 'receiver', dare: rd });
      setPlayerType('receiver');
      setView('waiting');
    } catch (err) {
      setReceiverError('No file found for code ' + rc + '. Check the code — the sender must upload and tap "Join Game" first.');
    }
  };

  const handleAction = (act, value) => {
    if (!socket || act === '' || act === undefined || act === null) return;
    socket.emit('gameAction', { action: act, value: value !== undefined ? value : act });
    setAction(String(act));
  };

  const downloadFile = async (fileCode, name, mimetype) => {
    try {
      const res = await axios.get(BACKEND_URL + '/download/' + fileCode, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: mimetype || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name || 'file';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Download failed. The file may have expired.');
    }
  };

  const getDare = async (category, which) => {
    if (!category) return;
    try {
      const res = await axios.get(BACKEND_URL + '/random-dare/' + category);
      if (which === 'sender') setDare(res.data.dare);
      else setReceiverDare(res.data.dare);
    } catch (err) { /* leave input as-is */ }
  };

  const goHome = () => {
    setView('home');
    setFile(null); setFileInfo(null); setCode(''); setDare('');
    setSelectedDareCategory(''); setReceiverDareCategory(''); setSelectedGame('');
    setReceiverCode(''); setReceiverDare(''); setReceiverFileInfo(null); setReceiverError('');
    setError(''); setPlayerType(''); setPlayerRole(null);
    setCurrentGame(''); setGameResult(null); setGameWinner(null); setGameData(null);
  };

  /* ============================================================
     VIEWS
     ============================================================ */
  const HomeView = () => (
    <div className="home">
      <header className="hero">
        <div className="eyebrow"><span className="dot" /> Realtime Multiplayer Platform</div>
        <h1 className="logo">Share<span>N</span>Play</h1>
        <p className="tagline">Secure file sharing with <b>12 real-time mini-games</b></p>
        <p className="sub">Send any file with a 6-digit code & play a head-to-head mini-game while you wait. The winner gets a dare.</p>
        <div className="hero-cta">
          <button className="btn btn-primary btn-lg" onClick={() => setView('sender')}>
            <span className="icon">📤</span> Send File
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => setView('receiver')}>
            <span className="icon">📥</span> Receive File
          </button>
        </div>
      </header>
      <div className="features-grid">
        {FEATURES.map((f, i) => (
          <div key={i} className="feature-card">
            <div className="icon">{f.icon}</div>
            <div className="text">{f.text}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const SenderView = () => (
    <div className="sender">
      <div className="card">
        <div className="card-header">
          <h3>📤 Send File</h3>
          <button className="close-btn" onClick={goHome}>✕</button>
        </div>
        <div className="card-body">
          {!code ? (
            <div className="sender-form">
              <div className="drop-zone" onClick={() => document.getElementById('fileInput') && document.getElementById('fileInput').click()}>
                <div className="icon-big">📁</div>
                <h4>Drag & drop or click to browse</h4>
                <p>Up to 200 MB · any file type</p>
                <input
                  id="fileInput"
                  type="file"
                  style={{ display: 'none' }}
                  onChange={e => setFile(e.target.files && e.target.files[0])}
                />
              </div>
              {file && (
                <div className="file-chip">
                  <span className="icon">📎</span>
                  <span className="name">{file.name}</span>
                  <span className="size">{fmtSize(file.size)}</span>
                </div>
              )}
              {isUploading && (
                <div className="progress-wrap">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: uploadProgress + '%' }} />
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--ink-tertiary)' }}>
                    {uploadProgress < 100 ? 'Uploading… ' + uploadProgress + '%' : 'Processing…'}
                  </p>
                </div>
              )}
              <button className="btn btn-primary btn-lg join-btn" onClick={handleUpload} disabled={!file || isUploading}>
                {isUploading ? '⏳ Uploading…' : '🚀 Generate Code'}
              </button>
              {error && <p className="error-banner">⚠️ {error}</p>}
            </div>
          ) : (
            <div className="sender-form">
              {fileInfo && (
                <div className="file-info-card">
                  <div className="icon">✅</div>
                  <div className="name">{fileInfo.fileName}</div>
                  <div className="meta">{fmtSize(fileInfo.size || 0)} · {fileInfo.mimetype}</div>
                </div>
              )}
              <div className="code-display">{code}</div>
              <p style={{ color: 'var(--ink-secondary)', fontSize: '0.9rem', margin: 0 }}>Share this code — or the QR — with the receiver</p>
              <div className="qr-wrap">
                <QRCodeSVG value={(lanHost ? 'http://' + lanHost : APP_URL) + '/?code=' + code + '&view=receiver'} size={190} />
              </div>
              <p style={{ color: 'var(--ink-tertiary)', fontSize: '0.78rem', margin: 0, wordBreak: 'break-all', textAlign: 'center' }}>
                {(lanHost ? 'http://' + lanHost : APP_URL) + '/?code=' + code + '&view=receiver'}
              </p>
              <div className="dare-controls">
                <div className="row">
                  <select className="select" value={selectedDareCategory} onChange={e => setSelectedDareCategory(e.target.value)}>
                    <option value="">🎯 Dare category</option>
                    {dareCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button className="btn btn-success" onClick={() => getDare(selectedDareCategory, 'sender')} disabled={!selectedDareCategory}>
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
                    <div key={g} className={'game-pill-wrap ' + (selectedGame === g ? 'active' : '')} onClick={() => setSelectedGame(selectedGame === g ? '' : g)}>
                      <div className="emoji">{GAME_EMOJI[g]}</div>
                      <div className="name">{GAME_NAMES[g]}</div>
                      <div className="tag">{GAME_TAGS[g]}</div>
                    </div>
                  ))}
                </div>
              </div>
              <button className="btn btn-primary btn-lg join-btn" onClick={handleJoinAsSender} disabled={!dare}>
                🎮 Join Game
              </button>
              {!dare && <p style={{ color: 'var(--ink-tertiary)', fontSize: '0.8rem', margin: 0 }}>Write or roll a dare to enable joining</p>}
              {error && <p className="error-banner">⚠️ {error}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const ReceiverView = () => (
    <div className="receiver">
      <div className="card">
        <div className="card-header">
          <h3>📥 Receive File</h3>
          <button className="close-btn" onClick={goHome}>✕</button>
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
              {receiverCode && (
                <button className="copy-btn" onClick={() => navigator.clipboard && navigator.clipboard.writeText(receiverCode)}>📋</button>
              )}
            </div>

            <button
              className="btn btn-secondary"
              style={{ width: '100%' }}
              onClick={() => {
                if (!/^[A-Z0-9]{6}$/.test(receiverCode)) { setReceiverError('Enter the full 6-digit code first.'); return; }
                checkFileInfo(receiverCode).catch(() => setReceiverError('No file found for code ' + receiverCode + '. Check the code.'));
              }}
              disabled={!receiverCode}
            >
              🔍 Check File
            </button>

            {receiverFileInfo && (
              <div className="file-info-card">
                <div className="icon">📎</div>
                <div className="name">{receiverFileInfo.fileName}</div>
                <div className="meta">{fmtSize(receiverFileInfo.size || 0)} · {receiverFileInfo.mimetype}</div>
                <button
                  className="btn btn-success btn-sm"
                  style={{ marginTop: 10, width: '100%' }}
                  onClick={() => downloadFile(receiverCode, receiverFileInfo.fileName, receiverFileInfo.mimetype)}
                >
                  💾 Download now (anytime)
                </button>
              </div>
            )}

            <div className="dare-controls">
              <div className="row">
                <select className="select" value={receiverDareCategory} onChange={e => setReceiverDareCategory(e.target.value)}>
                  <option value="">🎯 Dare category</option>
                  {dareCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button className="btn btn-success" onClick={() => getDare(receiverDareCategory, 'receiver')} disabled={!receiverDareCategory}>
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
                onClick={() => handleJoinAsReceiver(receiverCode, receiverDare)}
                disabled={!receiverCode || receiverCode.length !== 6 || !receiverDare}
              >
                🎮 Join Game
              </button>
              {receiverError && <p className="error-banner">⚠️ {receiverError}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const WaitingView = () => (
    <div className="waiting">
      <div className="logo-big">🎮</div>
      <h2>Joining game…</h2>
      <div className="status-pill">
        <span className="dot" />
        {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'error' ? 'Connection Error' : connectionStatus === 'disconnected' ? 'Disconnected — reconnecting…' : 'Connecting…'}
      </div>
      <div><b>Role:</b> {playerType} · <b>Code:</b> {code}</div>
      <div><b>Your dare:</b> {dare}</div>
      {waitingHint && <div style={{ color: 'var(--amber-600, #d97706)', fontSize: '0.9rem' }}>{waitingHint}</div>}
      {error && <p className="error-banner">⚠️ {error}</p>}
      <button className="btn btn-secondary" style={{ marginTop: 14 }} onClick={goHome}>← Cancel</button>
    </div>
  );

  const myScore = playerRole === 'player2' ? scores.player2 : scores.player1;
  const oppScore = playerRole === 'player2' ? scores.player1 : scores.player2;

  const GameView = () => (
    <div className="game-view">
      <div className="scoreboard">
        <div className={'score-side ' + (playerRole === 'player1' ? 'you' : '')}>
          <div className="label">You</div>
          <div className="value">{myScore}</div>
        </div>
        <div className="score-center">
          <div className="round-badge">Round {round} / {maxRounds}</div>
          <div className="score-vs">VS</div>
        </div>
        <div className={'score-side ' + (playerRole === 'player2' ? 'you' : '')}>
          <div className="label">Opponent</div>
          <div className="value">{oppScore}</div>
        </div>
      </div>

      {playerType === 'receiver' && receiverFileInfo && (
        <div className="file-info-card" style={{ maxWidth: 720, margin: '0 auto 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="icon">📎</div>
          <div style={{ flex: 1 }}>
            <div className="name">{receiverFileInfo.fileName}</div>
            <div className="meta">{fmtSize(receiverFileInfo.size || 0)}</div>
          </div>
          <button className="btn btn-success btn-sm" onClick={() => downloadFile(code, receiverFileInfo.fileName, receiverFileInfo.mimetype)}>
            💾 Download
          </button>
        </div>
      )}

      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {gameResult && playerRole && (
          <div className={'round-result ' + (gameResult.winner === playerRole ? 'win' : gameResult.winner === 'tie' ? 'tie' : 'lose')}>
            {gameResult.winner === 'tie' ? '🤝 Tie!' : gameResult.winner === playerRole ? '🏆 You win this round!' : '😞 Opponent wins this round.'}
            <div style={{ fontSize: '0.85rem', color: 'var(--ink-secondary)', marginTop: 4 }}>
              Scores: You {myScore} — {oppScore} Opponent
            </div>
          </div>
        )}

        {currentGame === 'rock-paper-scissors' && (
          <GameShell emoji="✊" name="Rock Paper Scissors" tag="Best of 3">
            {gameResult && (
              <div style={{ padding: 10, borderRadius: 10, background: 'var(--bg-surface-2, rgba(0,0,0,0.05))', marginBottom: 12, textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>
                  You: {gameResult[playerRole]?.choice ? RPS_EMOJI[gameResult[playerRole].choice] || gameResult[playerRole].choice : '—'} ·
                  Opponent: {gameResult[playerRole === 'player1' ? 'player2' : 'player1']?.choice ? RPS_EMOJI[gameResult[playerRole === 'player1' ? 'player2' : 'player1'].choice] || '—' : '—'}
                </p>
              </div>
            )}
            <div className="game-controls" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              {['rock', 'paper', 'scissors'].map(c => (
                <button key={c} className="btn btn-primary btn-lg" onClick={() => handleAction(c, c)} disabled={!!action}>
                  {RPS_EMOJI[c]} {c}
                </button>
              ))}
            </div>
            {action && <WaitingForOpponent show />}
          </GameShell>
        )}

        {currentGame === 'tap-war' && <TapWarGame onResult={handleAction} round={round} />}
        {currentGame === 'quick-quiz' && <QuickQuizGame onResult={handleAction} round={round} question={gameData && gameData.question} />}
        {currentGame === 'emoji-memory' && <EmojiMemoryGame sequence={gameData && gameData.sequence} onResult={handleAction} round={round} />}
        {currentGame === 'typing-speed' && <TypingSpeedGame text={gameData && gameData.text} onResult={handleAction} round={round} />}
        {currentGame === 'reaction-time' && <ReactionTimeGame onResult={handleAction} round={round} />}
        {currentGame === 'math-blitz' && <MathBlitzGame onResult={handleAction} round={round} />}
        {currentGame === 'color-rush' && <ColorRushGame onResult={handleAction} round={round} />}
        {currentGame === 'aim-master' && <AimMasterGame onResult={handleAction} round={round} />}
        {currentGame === 'stickman-fight' && <StickmanFightGame onResult={handleAction} round={round} />}
        {currentGame === 'car-racer' && <CarRacerGame onResult={handleAction} round={round} />}
        {currentGame === 'bike-racer' && <BikeRacerGame onResult={handleAction} round={round} />}
      </div>
    </div>
  );

  const EndView = () => {
    if (!gameWinner) return null;
    const dareForLoser = gameWinner.dares && gameWinner.dares[gameWinner.winner];
    return (
      <div className="end-view">
        <div className="logo-big">🎉</div>
        <h2>
          {gameWinner.winner === 'tie' ? '🤝 It\'s a tie!' : gameWinner.winner === playerRole ? '🏆 You win!' : '😢 You lose'}
        </h2>
        <p style={{ textAlign: 'center' }}>
          Final scores — You: <b>{myScore}</b> · Opponent: <b>{oppScore}</b>
        </p>
        {gameWinner.winner !== 'tie' && (
          <div className="dare-banner end-banner">
            🎁 <b>Dare:</b> {dareForLoser || 'No dare was set'}
            <div style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', marginTop: 4 }}>
              ({gameWinner.winner === playerRole ? 'The loser performs your dare!' : 'You lost — this dare is yours to perform!'})
            </div>
          </div>
        )}
        {playerType === 'receiver' && receiverFileInfo && (
          <div className="end-actions">
            <button className="btn btn-success btn-lg" onClick={() => downloadFile(code, receiverFileInfo.fileName, receiverFileInfo.mimetype)}>
              💾 Download File
            </button>
          </div>
        )}
        <div className="end-actions">
          <button className="btn btn-secondary btn-lg" onClick={goHome}>🔄 Play again</button>
        </div>
      </div>
    );
  };

  const screen =
    view === 'home' ? <HomeView /> :
    view === 'sender' ? <SenderView /> :
    view === 'receiver' ? <ReceiverView /> :
    view === 'waiting' ? <WaitingView /> :
    view === 'game' ? <GameView /> :
    view === 'end' ? <EndView /> : null;

  return (
    <React.Fragment>
      <div className="bg-stage" />
      {intro && (
        <IntroOverlay onDone={() => { sessionStorage.setItem('snp-intro-seen', '1'); setIntro(false); }} />
      )}
      {screen}
      <BrandFooter />
    </React.Fragment>
  );
}

export default App;
