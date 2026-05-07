import { useState, useEffect, useRef, useCallback } from 'react';
import { getRandomPassage } from '../passages';
import { saveUser, awardBadge, checkAndAwardBadges } from '../userStore';

const DIFFICULTIES = [
  { label: 'Beginner', targetWpm: 20, color: '#52d68a' },
  { label: 'Intermediate', targetWpm: 35, color: '#00b4d8' },
  { label: 'Advanced', targetWpm: 55, color: '#ff6b6b' },
];

const LANE_W = 660;
const SHARK_W = 94;
const FISH_W = 54;
const SHARK_H = 52;
const FISH_H = 40;
const FISH_START_X = 190;
const SHARK_MAX_X = LANE_W - SHARK_W;
const FISH_MAX_X = LANE_W - FISH_W;
const OCEAN_H = 174;
const OCEAN_CY = OCEAN_H / 2; // ~87

function SharkSVG() {
  return (
    <svg width={SHARK_W} height={SHARK_H} viewBox="0 0 94 52" style={{ overflow: 'visible', display: 'block' }}>
      {/* Tail — wags */}
      <g className="shark-tail" style={{ transformOrigin: '14px 26px' }}>
        <path d="M 14 26 L 0 9 L 9 26 L 0 44 L 14 30 Z" fill="#1b4a62"/>
      </g>
      {/* Body */}
      <path d="M 12 26 C 22 15 46 11 66 17 C 80 21 90 27 88 33 C 86 38 73 44 53 44 C 34 44 18 38 12 30 Z" fill="#2b6a85"/>
      {/* Belly */}
      <path d="M 24 38 C 42 46 64 45 76 40 C 84 37 87 32 85 35 C 80 44 55 50 33 48 C 26 46 21 41 24 38 Z" fill="#b5dced"/>
      {/* Dorsal fin */}
      <path d="M 46 15 L 55 1 L 64 14 Z" fill="#1b4a62"/>
      {/* Pectoral fin */}
      <path d="M 38 39 L 25 52 L 56 44 Z" fill="#1b4a62"/>
      {/* Head */}
      <ellipse cx="83" cy="30" rx="12" ry="11" fill="#2b6a85"/>
      {/* Lower jaw */}
      <path d="M 75 36 Q 86 44 94 38 L 94 32 Q 86 38 75 32 Z" fill="#b5dced"/>
      {/* Teeth */}
      <polygon points="77,35 79.5,42 82,35" fill="white"/>
      <polygon points="83,34 85.5,41 88,34" fill="white"/>
      {/* Eye */}
      <circle cx="78" cy="25" r="4.5" fill="#07111e"/>
      <circle cx="79.5" cy="23.5" r="1.8" fill="rgba(255,255,255,0.85)"/>
      {/* Pupil glint */}
      <circle cx="80.5" cy="22.5" r="0.8" fill="rgba(255,255,255,0.5)"/>
      {/* Gill slits */}
      <path d="M 64 20 Q 62 27 64 36" stroke="#1b4a62" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M 68 19 Q 66 27 68 37" stroke="#1b4a62" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function FishSVG() {
  return (
    <svg width={FISH_W} height={FISH_H} viewBox="0 0 54 40" style={{ overflow: 'visible', display: 'block' }}>
      {/* Tail — wags */}
      <g className="fish-tail" style={{ transformOrigin: '11px 20px' }}>
        <path d="M 11 20 L 0 7 L 6 20 L 0 33 L 11 22 Z" fill="#cc5800"/>
      </g>
      {/* Body */}
      <ellipse cx="33" cy="20" rx="23" ry="14" fill="#ff9c1a"/>
      {/* Belly */}
      <ellipse cx="34" cy="26" rx="16" ry="7.5" fill="#ffd06a"/>
      {/* Dorsal fin */}
      <path d="M 26 7 L 33 0 L 40 6 Z" fill="#cc5800"/>
      {/* Eye */}
      <circle cx="47" cy="17" r="5" fill="#07111e"/>
      <circle cx="48.5" cy="15.5" r="2" fill="rgba(255,255,255,0.9)"/>
      <circle cx="49.5" cy="14.5" r="0.8" fill="rgba(255,255,255,0.6)"/>
      {/* Mouth */}
      <ellipse cx="53" cy="22" rx="1.5" ry="2" fill="#aa4400"/>
      {/* Scale hints */}
      <path d="M 25 14 Q 29 18 25 23" stroke="#cc5800" strokeWidth="1" fill="none" opacity="0.5"/>
      <path d="M 31 12 Q 35 16 31 21" stroke="#cc5800" strokeWidth="1" fill="none" opacity="0.5"/>
    </svg>
  );
}

export default function SharkChase({ user, setUser, setScreen }) {
  const [phase, setPhase] = useState('select');
  const [difficulty, setDifficulty] = useState(1);
  const [passage, setPassage] = useState('');
  const [typed, setTyped] = useState('');
  const [lives, setLives] = useState(3);
  const [startTime, setStartTime] = useState(null);
  const [fishX, setFishX] = useState(FISH_START_X);
  const [sharkX, setSharkX] = useState(0);
  const [resultStats, setResultStats] = useState(null);
  const [deathFlash, setDeathFlash] = useState(false);
  const [noDeath, setNoDeath] = useState(true);

  const rafRef = useRef(null);
  const livesRef = useRef(3);
  const startTimeRef = useRef(null);
  const typedRef = useRef('');
  const passageRef = useRef('');
  const fishXRef = useRef(FISH_START_X);
  const sharkXRef = useRef(0);
  const inputRef = useRef(null);
  const noDeathRef = useRef(true);
  const endedRef = useRef(false);

  const targetWpm = DIFFICULTIES[difficulty].targetWpm;

  const calcStats = (typedStr, elapsed) => {
    const elapsedMin = Math.max(elapsed, 100) / 60000;
    let correct = 0, errors = 0;
    const pass = passageRef.current;
    for (let i = 0; i < typedStr.length; i++) {
      if (i < pass.length) {
        if (typedStr[i] === pass[i]) correct++;
        else errors++;
      }
    }
    const wpm = Math.round((correct / 5) / elapsedMin);
    const accuracy = typedStr.length > 0 ? Math.round((correct / typedStr.length) * 100) : 100;
    return { wpm, accuracy, correct };
  };

  const endRound = useCallback((finalTyped, reason) => {
    if (endedRef.current) return;
    endedRef.current = true;
    cancelAnimationFrame(rafRef.current);
    const elapsed = startTimeRef.current ? Date.now() - startTimeRef.current : 1000;
    const stats = calcStats(finalTyped, elapsed);
    setResultStats({ ...stats, lives: livesRef.current, reason, noDeath: noDeathRef.current });
    setPhase('result');

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

    const charsPerSec = (targetWpm * 5) / 60;
    const totalChars = passageRef.current.length;
    const sharkProgress = totalChars > 0 ? Math.min((charsPerSec * elapsedSec) / totalChars, 1) : 0;

    let correctChars = 0;
    const pass = passageRef.current;
    const t = typedRef.current;
    for (let i = 0; i < t.length; i++) {
      if (i < pass.length && t[i] === pass[i]) correctChars++;
    }
    const fishProgress = totalChars > 0 ? Math.min(correctChars / totalChars, 1) : 0;

    const newFishX = FISH_START_X + fishProgress * (FISH_MAX_X - FISH_START_X);
    const newSharkX = sharkProgress * SHARK_MAX_X;

    fishXRef.current = newFishX;
    sharkXRef.current = newSharkX;
    setFishX(newFishX);
    setSharkX(newSharkX);

    // Completion check first — fish reaches right edge
    if (fishProgress >= 1) {
      endRound(typedRef.current, 'completed');
      return;
    }

    // Shark catches fish — shark nose overlaps fish tail
    if (newSharkX + SHARK_W >= newFishX - 8) {
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

      fishXRef.current = FISH_START_X;
      sharkXRef.current = 0;
      setFishX(FISH_START_X);
      setSharkX(0);
      startTimeRef.current = Date.now();
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
    setFishX(FISH_START_X);
    setSharkX(0);
    fishXRef.current = FISH_START_X;
    sharkXRef.current = 0;
    setNoDeath(true);
    noDeathRef.current = true;
    endedRef.current = false;
    setStartTime(null);
    startTimeRef.current = null;
    setResultStats(null);
    setPhase('playing');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleTyping = (e) => {
    const val = e.target.value;
    if (val.length > passageRef.current.length) return;

    if (!startTimeRef.current && val.length > 0) {
      startTimeRef.current = Date.now();
      setStartTime(Date.now());
      rafRef.current = requestAnimationFrame(animate);
    }

    typedRef.current = val;
    setTyped(val);

    // End immediately when the full passage is typed
    if (val.length >= passageRef.current.length) {
      cancelAnimationFrame(rafRef.current);
      endRound(val, 'completed');
    }
  };

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const renderPassage = () =>
    passage.split('').map((char, i) => {
      let cls = 'char-pending';
      if (i < typed.length) cls = typed[i] === char ? 'char-correct' : 'char-wrong';
      else if (i === typed.length) cls = 'char-current';
      return <span key={i} className={cls}>{char}</span>;
    });

  // how close is the shark? 0 = far, 1 = right behind
  const dangerLevel = Math.max(0, Math.min(1, (sharkX + SHARK_W - (fishX - 80)) / 80));

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
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(255,209,102,0.07)',
            border: '1px solid rgba(255,209,102,0.25)',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 22,
          }}>
            <span style={{ fontSize: 20 }}>🏆</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ffd166', marginBottom: 2 }}>Ranked Mode</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                Your best WPM score is saved to the global leaderboard after each run.
              </div>
            </div>
          </div>
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
        <div style={{ maxWidth: 720 }}>
          {/* Lives + target */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{ fontSize: 22, filter: i < lives ? 'none' : 'grayscale(1) opacity(0.3)' }}>
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
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 16,
            height: OCEAN_H,
            marginBottom: 18,
            border: `2px solid ${deathFlash ? 'rgba(255,80,80,0.7)' : 'rgba(0,150,200,0.25)'}`,
            background: deathFlash
              ? 'linear-gradient(180deg, #1a0308 0%, #2e0610 50%, #1a0308 100%)'
              : 'linear-gradient(180deg, #03111f 0%, #051e38 25%, #072c52 60%, #09356a 100%)',
            transition: 'background 0.15s, border-color 0.15s',
          }}>
            {/* Animated light rays */}
            {[0.08, 0.25, 0.46, 0.66, 0.84].map((pos, i) => (
              <div key={i} style={{
                position: 'absolute',
                top: 0,
                left: `${pos * 100}%`,
                width: 55 + i * 18,
                height: '100%',
                background: 'linear-gradient(180deg, rgba(80,190,255,0.07) 0%, transparent 75%)',
                transform: `skewX(${-18 + i * 8}deg)`,
                animation: `lightRay ${2.2 + i * 0.6}s ease-in-out ${i * 0.5}s infinite`,
                pointerEvents: 'none',
              }}/>
            ))}

            {/* Ocean floor */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 16,
              background: 'linear-gradient(0deg, rgba(10,40,20,0.5) 0%, transparent 100%)',
            }}/>

            {/* Surface shimmer */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 10,
              background: 'linear-gradient(180deg, rgba(120,220,255,0.07) 0%, transparent 100%)',
            }}/>

            {/* Finish line */}
            <div style={{
              position: 'absolute',
              right: 22,
              top: 14,
              bottom: 14,
              width: 2,
              borderRight: '2px dashed rgba(82,214,138,0.35)',
            }}>
              <div style={{
                position: 'absolute',
                top: -16,
                right: 4,
                fontSize: 10,
                color: 'rgba(82,214,138,0.5)',
                whiteSpace: 'nowrap',
                fontFamily: 'Space Mono, monospace',
              }}>FINISH</div>
            </div>

            {/* Bubbles trailing the fish */}
            {startTime && [0, 1, 2].map(i => (
              <div key={i} style={{
                position: 'absolute',
                left: fishX - 14 - i * 11,
                top: OCEAN_CY - FISH_H / 2 + 10 + i * 9,
                width: 6 - i * 1.5,
                height: 6 - i * 1.5,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.25)',
                animation: `chaseBubble ${1 + i * 0.35}s ease-out ${i * 0.22}s infinite`,
                pointerEvents: 'none',
              }}/>
            ))}

            {/* Shark danger glow (gets brighter as it closes in) */}
            {dangerLevel > 0.3 && (
              <div style={{
                position: 'absolute',
                left: sharkX - 10,
                top: OCEAN_CY - SHARK_H / 2 - 10,
                width: SHARK_W + 20,
                height: SHARK_H + 20,
                borderRadius: '50%',
                background: `radial-gradient(ellipse, rgba(255,60,60,${dangerLevel * 0.18}) 0%, transparent 70%)`,
                pointerEvents: 'none',
                transition: 'opacity 0.1s',
              }}/>
            )}

            {/* Fish */}
            <div style={{
              position: 'absolute',
              left: fishX,
              top: OCEAN_CY - FISH_H / 2,
              transition: 'left 0.1s linear',
            }}>
              <div className="fish-swim" style={{ filter: 'drop-shadow(0 2px 10px rgba(255,156,26,0.65))' }}>
                <FishSVG />
              </div>
            </div>

            {/* Shark */}
            <div style={{
              position: 'absolute',
              left: sharkX,
              top: OCEAN_CY - SHARK_H / 2 + 4,
              transition: 'left 0.15s linear',
            }}>
              <div className="shark-swim" style={{ filter: `drop-shadow(0 3px 14px rgba(255,80,80,${0.4 + dangerLevel * 0.4}))` }}>
                <SharkSVG />
              </div>
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
                : 'You lost all 3 lives. The shark wins this round.'}
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
