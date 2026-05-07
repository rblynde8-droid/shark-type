import { useState, useEffect, useRef, useCallback } from 'react';
import { getRandomPassage } from '../passages';
import { saveUser, awardBadge, checkAndAwardBadges } from '../userStore';

const DIFFICULTIES = [
  { label: 'Beginner', targetWpm: 20, color: '#52d68a' },
  { label: 'Intermediate', targetWpm: 35, color: '#00b4d8' },
  { label: 'Advanced', targetWpm: 55, color: '#ff6b6b' },
];

const LANE_WIDTH = 700;
const FISH_Y = 60;
const SHARK_Y = 28;

export default function SharkChase({ user, setUser, setScreen }) {
  const [phase, setPhase] = useState('select'); // select | playing | result
  const [difficulty, setDifficulty] = useState(1);
  const [passage, setPassage] = useState('');
  const [typed, setTyped] = useState('');
  const [lives, setLives] = useState(3);
  const [startTime, setStartTime] = useState(null);
  const [fishX, setFishX] = useState(140);
  const [sharkX, setSharkX] = useState(0);
  const [resultStats, setResultStats] = useState(null);
  const [deathFlash, setDeathFlash] = useState(false);
  const [noDeath, setNoDeath] = useState(true);

  const rafRef = useRef(null);
  const livesRef = useRef(3);
  const startTimeRef = useRef(null);
  const typedRef = useRef('');
  const passageRef = useRef('');
  const fishXRef = useRef(140);
  const sharkXRef = useRef(0);
  const inputRef = useRef(null);
  const noDeathRef = useRef(true);

  const targetWpm = DIFFICULTIES[difficulty].targetWpm;

  const calcStats = (typedStr, elapsed) => {
    const elapsedMin = elapsed / 60000;
    let correct = 0, errors = 0;
    const pass = passageRef.current;
    for (let i = 0; i < typedStr.length; i++) {
      if (i < pass.length) {
        if (typedStr[i] === pass[i]) correct++;
        else errors++;
      }
    }
    const wpm = elapsedMin > 0 ? Math.round((correct / 5) / elapsedMin) : 0;
    const accuracy = typedStr.length > 0 ? Math.round((correct / typedStr.length) * 100) : 100;
    return { wpm, accuracy, correct };
  };

  const endRound = useCallback((finalTyped, reason) => {
    cancelAnimationFrame(rafRef.current);
    const elapsed = startTimeRef.current ? Date.now() - startTimeRef.current : 1000;
    const stats = calcStats(finalTyped, elapsed);
    setResultStats({
      ...stats,
      lives: livesRef.current,
      reason,
      noDeath: noDeathRef.current,
    });
    setPhase('result');

    // Update user
    let updated = { ...user };
    updated.sessionsPlayed = (updated.sessionsPlayed || 0) + 1;
    updated.chaseSessions = (updated.chaseSessions || 0) + 1;
    if (stats.wpm > (updated.bestWpm || 0)) updated.bestWpm = stats.wpm;
    if (stats.accuracy > (updated.bestAccuracy || 0)) updated.bestAccuracy = stats.accuracy;
    if (noDeathRef.current) {
      updated.chaseNoDeath = (updated.chaseNoDeath || 0) + 1;
      updated = awardBadge(updated, 'chase_no_death');
    }
    updated = checkAndAwardBadges(updated);

    // Post to leaderboard
    fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: updated.username,
        wpm: stats.wpm,
        accuracy: stats.accuracy,
        level: updated.level,
      }),
    }).catch(() => {});

    saveUser(updated);
    setUser(updated);
  }, [user, setUser]);

  const animate = useCallback(() => {
    const now = Date.now();
    const elapsed = startTimeRef.current ? now - startTimeRef.current : 0;
    const elapsedSec = elapsed / 1000;

    // Shark speed: chars per second based on targetWpm
    // targetWpm * 5 = chars/min => chars/sec
    const charsPerSec = (targetWpm * 5) / 60;
    const totalChars = passageRef.current.length;
    const sharkProgress = totalChars > 0 ? Math.min((charsPerSec * elapsedSec) / totalChars, 1) : 0;

    // Fish progress = typed correct chars / total
    let correctChars = 0;
    const pass = passageRef.current;
    const t = typedRef.current;
    for (let i = 0; i < t.length; i++) {
      if (i < pass.length && t[i] === pass[i]) correctChars++;
    }
    const fishProgress = totalChars > 0 ? Math.min(correctChars / totalChars, 1) : 0;

    // Fish starts at 140px (head start), shark starts at 0
    const fishMinX = 140;
    const sharkMinX = 0;
    const maxX = LANE_WIDTH - 60;
    const newFishX = fishMinX + fishProgress * (maxX - fishMinX);
    const newSharkX = sharkMinX + sharkProgress * (maxX - sharkMinX);

    fishXRef.current = newFishX;
    sharkXRef.current = newSharkX;
    setFishX(newFishX);
    setSharkX(newSharkX);

    // Check catch — shark must fully close the gap (within 24px)
    if (newSharkX >= newFishX - 24) {
      const newLives = livesRef.current - 1;
      livesRef.current = newLives;
      noDeathRef.current = false;
      setNoDeath(false);
      setLives(newLives);
      setDeathFlash(true);
      setTimeout(() => setDeathFlash(false), 800);

      if (newLives <= 0) {
        endRound(typedRef.current, 'caught');
        return;
      }

      // Reset positions — fish gets head start again, shark resets
      fishXRef.current = 140;
      sharkXRef.current = 0;
      setFishX(140);
      setSharkX(0);
      startTimeRef.current = Date.now();
    }

    // Check completion
    if (fishProgress >= 1) {
      endRound(typedRef.current, 'completed');
      return;
    }

    rafRef.current = requestAnimationFrame(animate);
  }, [targetWpm, endRound]);

  const startGame = () => {
    const p = getRandomPassage();
    passageRef.current = p;
    setPassage(p);
    setTyped('');
    typedRef.current = '';
    setLives(3);
    livesRef.current = 3;
    setFishX(140);
    setSharkX(0);
    fishXRef.current = 140;
    sharkXRef.current = 0;
    setNoDeath(true);
    noDeathRef.current = true;
    setStartTime(null);
    startTimeRef.current = null;
    setResultStats(null);
    setPhase('playing');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleTyping = (e) => {
    const val = e.target.value;
    if (val.length > passage.length) return;

    if (!startTimeRef.current && val.length > 0) {
      startTimeRef.current = Date.now();
      setStartTime(Date.now());
      rafRef.current = requestAnimationFrame(animate);
    }

    typedRef.current = val;
    setTyped(val);
  };

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const renderPassage = () => {
    return passage.split('').map((char, i) => {
      let cls = 'char-pending';
      if (i < typed.length) {
        cls = typed[i] === char ? 'char-correct' : 'char-wrong';
      } else if (i === typed.length) {
        cls = 'char-current';
      }
      return <span key={i} className={cls}>{char}</span>;
    });
  };

  return (
    <div style={{ padding: '40px 32px', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button className="btn btn-secondary" onClick={() => setScreen('home')} style={{ fontSize: 13 }}>
          ← Back
        </button>
        <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 26, fontWeight: 700, color: '#00b4d8' }}>
          Shark Chase
        </h1>
      </div>

      {/* SELECT PHASE */}
      {phase === 'select' && (
        <div style={{ maxWidth: 560 }}>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, marginBottom: 28 }}>
            Type fast enough to stay ahead of the shark! You have 3 lives. Choose your difficulty:
          </p>

          <div style={{ display: 'flex', gap: 14, marginBottom: 32 }}>
            {DIFFICULTIES.map((d, i) => (
              <button
                key={d.label}
                onClick={() => setDifficulty(i)}
                style={{
                  flex: 1,
                  padding: '16px 12px',
                  borderRadius: 12,
                  border: `2px solid ${difficulty === i ? d.color : 'rgba(255,255,255,0.1)'}`,
                  background: difficulty === i ? `${d.color}18` : 'rgba(255,255,255,0.03)',
                  color: difficulty === i ? d.color : 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 6 }}>
                  {i === 0 ? '🐢' : i === 1 ? '🐟' : '⚡'}
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{d.label}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{d.targetWpm} WPM target</div>
              </button>
            ))}
          </div>

          <button className="btn btn-primary" onClick={startGame} style={{ width: '100%', padding: 14, fontSize: 15 }}>
            🦈 Start Chase!
          </button>
        </div>
      )}

      {/* PLAYING PHASE */}
      {phase === 'playing' && (
        <div style={{ maxWidth: 760 }}>
          {/* Lives */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {[0,1,2].map(i => (
                <span key={i} style={{ fontSize: 24, filter: i < lives ? 'none' : 'grayscale(1) opacity(0.3)' }}>
                  ❤️
                </span>
              ))}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              Target: {targetWpm} WPM — {DIFFICULTIES[difficulty].label}
            </div>
          </div>

          {/* Ocean scene */}
          <div style={{
            background: deathFlash
              ? 'rgba(255,107,107,0.15)'
              : 'linear-gradient(180deg, #062338 0%, #0a3a5c 40%, #0d4a73 100%)',
            border: `2px solid ${deathFlash ? '#ff6b6b' : 'rgba(0,180,216,0.3)'}`,
            borderRadius: 14,
            padding: '20px 24px',
            marginBottom: 20,
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.1s',
            height: 120,
          }}>
            {/* Wave decoration */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 24,
              background: 'rgba(0,100,160,0.3)',
              borderRadius: '0 0 12px 12px',
            }} />

            {/* Progress track */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: 20,
              right: 20,
              height: 2,
              background: 'rgba(255,255,255,0.1)',
              transform: 'translateY(-50%)',
            }} />

            {/* Fish */}
            <div style={{
              position: 'absolute',
              left: fishX,
              top: FISH_Y,
              fontSize: 28,
              transform: 'translateY(-50%)',
              transition: 'left 0.1s linear',
              filter: 'drop-shadow(0 0 6px rgba(82,214,138,0.8))',
            }}>
              🐟
            </div>

            {/* Shark */}
            <div style={{
              position: 'absolute',
              left: sharkX,
              top: SHARK_Y,
              fontSize: 32,
              transform: 'translateY(-50%)',
              transition: 'left 0.15s linear',
              filter: 'drop-shadow(0 0 8px rgba(255,107,107,0.8))',
            }}>
              🦈
            </div>
          </div>

          {/* Typing area */}
          <div
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              padding: '20px 24px',
              fontFamily: 'Space Mono, monospace',
              fontSize: 17,
              lineHeight: 1.9,
              letterSpacing: '0.03em',
              wordBreak: 'break-word',
              cursor: 'text',
              minHeight: 100,
              marginBottom: 12,
            }}
            onClick={() => inputRef.current?.focus()}
          >
            {renderPassage()}
          </div>

          <input
            ref={inputRef}
            value={typed}
            onChange={handleTyping}
            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1 }}
            autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
          />

          {!startTime && (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
              Click the passage and start typing to begin the chase!
            </p>
          )}
        </div>
      )}

      {/* RESULT PHASE */}
      {phase === 'result' && resultStats && (
        <div style={{ maxWidth: 500 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>
              {resultStats.reason === 'completed' ? '🏆' : '💀'}
            </div>
            <h2 style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 22,
              color: resultStats.reason === 'completed' ? '#52d68a' : '#ff6b6b',
              marginBottom: 8,
            }}>
              {resultStats.reason === 'completed' ? 'Escaped!' : 'Devoured!'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14 }}>
              {resultStats.reason === 'completed'
                ? 'You outswam the shark! Great typing!'
                : `You lost all 3 lives. The shark wins this round.`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 24 }}>
            <div className="stat-pill">
              <span className="val">{resultStats.wpm}</span>
              <span className="label">WPM</span>
            </div>
            <div className="stat-pill">
              <span className="val">{resultStats.accuracy}%</span>
              <span className="label">Accuracy</span>
            </div>
            <div className="stat-pill">
              <span className="val">{resultStats.lives}</span>
              <span className="label">Lives Left</span>
            </div>
          </div>

          {resultStats.noDeath && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: 'rgba(255,209,102,0.1)',
              border: '1px solid rgba(255,209,102,0.3)',
              borderRadius: 10,
              padding: '14px 18px',
              marginBottom: 24,
            }}>
              <span style={{ fontSize: 28 }}>🦈</span>
              <div>
                <div style={{ fontWeight: 700, color: '#ffd166', fontSize: 14 }}>Perfect Chase!</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Badge earned for no lives lost</div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" onClick={() => setPhase('select')} style={{ flex: 1 }}>
              Change Difficulty
            </button>
            <button className="btn btn-primary" onClick={startGame} style={{ flex: 1 }}>
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
