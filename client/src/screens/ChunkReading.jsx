import { useState, useRef, useEffect } from 'react';
import { passages } from '../passages';
import { saveUser, awardBadge, checkAndAwardBadges } from '../userStore';

function tokenize(passage) {
  return passage.trim().split(/\s+/);
}

export default function ChunkReading({ user, setUser, setScreen }) {
  const [chunkSize, setChunkSize] = useState(2);
  const [phase, setPhase] = useState('select'); // select | playing | result
  const [words, setWords] = useState([]);
  const [chunkIdx, setChunkIdx] = useState(0);
  const [input, setInput] = useState('');
  const [greyed, setGreyed] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [errors, setErrors] = useState(0);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong'
  const [passageIdx] = useState(() => Math.floor(Math.random() * passages.length));
  const greyTimer = useRef(null);
  const inputRef = useRef(null);

  const currentPassage = passages[passageIdx];

  const getCurrentChunk = (idx, ws, cs) => {
    return ws.slice(idx, idx + cs).join(' ');
  };

  const startGame = () => {
    const ws = tokenize(currentPassage);
    setWords(ws);
    setChunkIdx(0);
    setInput('');
    setGreyed(false);
    setCorrect(0);
    setTotal(0);
    setErrors(0);
    setStartTime(null);
    setFeedback(null);
    setPhase('playing');
    setTimeout(() => inputRef.current?.focus(), 100);

    // Start grey timer
    clearTimeout(greyTimer.current);
    greyTimer.current = setTimeout(() => setGreyed(true), 1000);
  };

  useEffect(() => {
    if (phase === 'playing' && chunkIdx < words.length) {
      clearTimeout(greyTimer.current);
      setGreyed(false);
      greyTimer.current = setTimeout(() => setGreyed(true), 1000);
    }
    return () => clearTimeout(greyTimer.current);
  }, [chunkIdx, phase, words.length]);

  const handleSubmit = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!input.trim()) return;

      if (!startTime) setStartTime(Date.now());

      const expected = getCurrentChunk(chunkIdx, words, chunkSize).toLowerCase().replace(/[^a-z0-9\s]/g, '');
      const given = input.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
      const isCorrect = given === expected;

      setTotal(t => t + 1);
      if (isCorrect) {
        setCorrect(c => c + 1);
        setFeedback('correct');
      } else {
        setErrors(err => err + 1);
        setFeedback('wrong');
      }

      setTimeout(() => {
        setFeedback(null);
        const nextIdx = chunkIdx + chunkSize;
        if (nextIdx >= words.length) {
          finishSession(isCorrect);
        } else {
          setChunkIdx(nextIdx);
          setInput('');
        }
      }, 300);
    }
  };

  const finishSession = (lastCorrect) => {
    const elapsed = startTime ? Date.now() - startTime : 1000;
    const elapsedMin = elapsed / 60000;
    const totalChars = words.slice(0, chunkIdx + chunkSize).join(' ').length;
    const wpm = Math.round((totalChars / 5) / elapsedMin);
    const acc = total > 0 ? Math.round(((correct + (lastCorrect ? 1 : 0)) / (total + 1)) * 100) : 100;

    let updated = { ...user };
    updated.sessionsPlayed = (updated.sessionsPlayed || 0) + 1;
    updated.chunkSessions = (updated.chunkSessions || 0) + 1;
    if (wpm > (updated.bestWpm || 0)) updated.bestWpm = wpm;
    if (acc > (updated.bestAccuracy || 0)) updated.bestAccuracy = acc;
    if (updated.chunkSessions >= 5) updated = awardBadge(updated, 'chunk_5');
    updated = checkAndAwardBadges(updated);
    saveUser(updated);
    setUser(updated);

    setPhase('result');
  };

  const progress = words.length > 0 ? (chunkIdx / words.length) * 100 : 0;
  const currentChunk = words.length > 0 ? getCurrentChunk(chunkIdx, words, chunkSize) : '';

  // Render passage with chunks highlighted
  const renderPassageWithHighlight = () => {
    if (!words.length) return null;
    return (
      <div style={{
        fontFamily: 'Space Mono, monospace',
        fontSize: 15,
        lineHeight: 1.8,
        color: 'rgba(255,255,255,0.5)',
        letterSpacing: '0.02em',
      }}>
        {words.map((word, i) => {
          const isInChunk = i >= chunkIdx && i < chunkIdx + chunkSize;
          const isPast = i < chunkIdx;
          return (
            <span
              key={i}
              style={{
                color: isInChunk
                  ? (greyed ? 'rgba(0,180,216,0.5)' : '#00b4d8')
                  : isPast
                    ? 'rgba(82,214,138,0.6)'
                    : 'rgba(255,255,255,0.35)',
                fontWeight: isInChunk ? 700 : 400,
                background: isInChunk && !greyed ? 'rgba(0,180,216,0.1)' : 'transparent',
                borderRadius: 3,
                padding: isInChunk ? '0 2px' : 0,
                transition: 'color 0.4s, background 0.4s',
              }}
            >
              {word}{' '}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ padding: '40px 32px', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button className="btn btn-secondary" onClick={() => setScreen('home')} style={{ fontSize: 13 }}>
          ← Back
        </button>
        <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 26, fontWeight: 700, color: '#00b4d8' }}>
          Chunk Reading
        </h1>
      </div>

      {phase === 'select' && (
        <div style={{ maxWidth: 540 }}>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
            Words are highlighted in chunks. Memorize them (they fade after 1 second), then type the chunk and press Enter to advance.
          </p>

          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>
              Chunk Size
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {[1, 2, 3].map(n => (
                <button
                  key={n}
                  onClick={() => setChunkSize(n)}
                  style={{
                    flex: 1,
                    padding: '14px 8px',
                    borderRadius: 10,
                    border: `2px solid ${chunkSize === n ? '#00b4d8' : 'rgba(255,255,255,0.1)'}`,
                    background: chunkSize === n ? 'rgba(0,180,216,0.15)' : 'rgba(255,255,255,0.03)',
                    color: chunkSize === n ? '#00b4d8' : 'rgba(255,255,255,0.6)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{n}</div>
                  <div style={{ fontSize: 12 }}>word{n > 1 ? 's' : ''}</div>
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" onClick={startGame} style={{ width: '100%', padding: 14, fontSize: 15 }}>
            Start Session
          </button>

          {user?.chunkSessions > 0 && (
            <p style={{ marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
              Sessions completed: {user.chunkSessions} / 5 for badge
            </p>
          )}
        </div>
      )}

      {phase === 'playing' && (
        <div style={{ maxWidth: 720 }}>
          {/* Progress */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div className="stat-pill">
              <span className="val">{total > 0 ? Math.round((correct / total) * 100) : 100}%</span>
              <span className="label">Accuracy</span>
            </div>
            <div className="stat-pill">
              <span className="val">{correct}</span>
              <span className="label">Correct</span>
            </div>
            <div className="stat-pill">
              <span className="val">{errors}</span>
              <span className="label">Errors</span>
            </div>
          </div>

          {/* Passage display */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: '20px 24px',
            marginBottom: 20,
          }}>
            {renderPassageWithHighlight()}
          </div>

          {/* Current chunk display */}
          <div style={{
            textAlign: 'center',
            marginBottom: 16,
            padding: '16px',
            background: feedback === 'correct'
              ? 'rgba(82,214,138,0.1)'
              : feedback === 'wrong'
                ? 'rgba(255,107,107,0.1)'
                : 'rgba(0,180,216,0.08)',
            border: `2px solid ${feedback === 'correct' ? 'rgba(82,214,138,0.4)' : feedback === 'wrong' ? 'rgba(255,107,107,0.4)' : 'rgba(0,180,216,0.2)'}`,
            borderRadius: 10,
            transition: 'all 0.2s',
          }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
              Current chunk — memorize it, then type below:
            </div>
            <div style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: 22,
              fontWeight: 700,
              color: greyed ? 'rgba(0,180,216,0.4)' : '#00b4d8',
              letterSpacing: '0.05em',
              transition: 'color 0.4s',
            }}>
              {currentChunk}
            </div>
          </div>

          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleSubmit}
            className="input-base"
            placeholder="Type the chunk, then press Enter to submit..."
            style={{ fontFamily: 'Space Mono, monospace', fontSize: 16, marginBottom: 16, textAlign: 'center' }}
            autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
          />

          <button className="btn btn-secondary" onClick={() => setPhase('select')} style={{ fontSize: 13 }}>
            ← Quit
          </button>
        </div>
      )}

      {phase === 'result' && (
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📖</div>
          <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 22, color: '#00b4d8', marginBottom: 8 }}>
            Session Complete!
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, marginBottom: 28 }}>
            You completed the passage in {chunkSize}-word chunks.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 24 }}>
            <div className="stat-pill">
              <span className="val">{total > 0 ? Math.round((correct / total) * 100) : 100}%</span>
              <span className="label">Accuracy</span>
            </div>
            <div className="stat-pill">
              <span className="val">{correct}/{total}</span>
              <span className="label">Chunks</span>
            </div>
            <div className="stat-pill">
              <span className="val">{user?.chunkSessions || 0}</span>
              <span className="label">Total Sessions</span>
            </div>
          </div>

          {user?.chunkSessions >= 5 && user?.badges?.includes('chunk_5') && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(255,209,102,0.1)',
              border: '1px solid rgba(255,209,102,0.3)',
              borderRadius: 10,
              padding: '12px 20px',
              marginBottom: 24,
            }}>
              <span style={{ fontSize: 24 }}>📖</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, color: '#ffd166', fontSize: 14 }}>Chunk Master!</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>5 sessions badge earned</div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => setPhase('select')}>
              Change Settings
            </button>
            <button className="btn btn-primary" onClick={startGame}>
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
