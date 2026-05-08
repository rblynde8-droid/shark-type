import { useState, useRef, useEffect } from 'react';
import KeyboardDiagram from '../components/KeyboardDiagram';
import { saveUser, awardBadge, checkAndAwardBadges, ALL_BADGES } from '../userStore';

function generateDrillWords(keys) {
  const lower = keys.map(k => k.toLowerCase()).filter(k => k.length === 1 && /[a-z;']/.test(k));
  if (lower.length === 0) {
    // numbers/symbols mode
    const valid = keys.filter(k => k.length === 1);
    const words = [];
    for (let i = 0; i < 20; i++) {
      let w = '';
      const len = 2 + Math.floor(Math.random() * 3);
      for (let j = 0; j < len; j++) {
        w += valid[Math.floor(Math.random() * valid.length)];
      }
      words.push(w);
    }
    return words;
  }

  const words = [];
  for (let i = 0; i < 30; i++) {
    let w = '';
    const len = 2 + Math.floor(Math.random() * 4);
    for (let j = 0; j < len; j++) {
      w += lower[Math.floor(Math.random() * lower.length)];
    }
    words.push(w);
  }
  return words;
}

function generateCheckpointPassage(keys) {
  const words = generateDrillWords(keys);
  return words.slice(0, 20).join(' ');
}

export default function LessonDetail({ lesson, user, setUser, onBack }) {
  const [phase, setPhase] = useState('intro'); // intro | drill | checkpoint | pass | fail
  const [drillWords, setDrillWords] = useState(() => generateDrillWords(lesson.keys));
  const [drillIdx, setDrillIdx] = useState(0);
  const [drillInput, setDrillInput] = useState('');
  const [streak, setStreak] = useState(0);
  const [streakRecord, setStreakRecord] = useState(0);
  const [drillFeedback, setDrillFeedback] = useState(null); // 'correct' | 'wrong'

  // Guided key-press intro state
  const guidedKeys = lesson.keys.filter(k => /^[a-zA-Z0-9;',./[\]]$/.test(k)).map(k => k.toLowerCase());
  const [guidedMode, setGuidedMode] = useState(true);
  const [guidedKeyIdx, setGuidedKeyIdx] = useState(0);
  const [guidedRound, setGuidedRound] = useState(0);
  const [guidedFeedback, setGuidedFeedback] = useState(null);

  // Checkpoint state
  const [cpPassage] = useState(() => generateCheckpointPassage(lesson.keys));
  const [cpTyped, setCpTyped] = useState('');
  const [cpStartTime, setCpStartTime] = useState(null);
  const [cpTimeLeft, setCpTimeLeft] = useState(60000);
  const [cpRunning, setCpRunning] = useState(false);
  const [cpStats, setCpStats] = useState(null);
  const timerRef = useRef(null);
  const inputRef = useRef(null);
  const cpInputRef = useRef(null);
  const cpTypedRef = useRef('');

  useEffect(() => {
    if (phase === 'drill' && !guidedMode && inputRef.current) inputRef.current.focus();
  }, [phase, drillIdx, guidedMode]);

  // Guided single-key-press listener
  useEffect(() => {
    if (phase !== 'drill' || !guidedMode || guidedKeys.length === 0) return;
    const handleKey = (e) => {
      if (e.key.length !== 1 || e.metaKey || e.ctrlKey) return;
      const expected = guidedKeys[guidedKeyIdx];
      if (e.key.toLowerCase() === expected) {
        setGuidedFeedback('correct');
        setTimeout(() => {
          setGuidedFeedback(null);
          const nextIdx = guidedKeyIdx + 1;
          if (nextIdx >= guidedKeys.length) {
            const nextRound = guidedRound + 1;
            if (nextRound >= 2) {
              setGuidedMode(false);
            } else {
              setGuidedRound(nextRound);
              setGuidedKeyIdx(0);
            }
          } else {
            setGuidedKeyIdx(nextIdx);
          }
        }, 280);
      } else {
        setGuidedFeedback('wrong');
        setTimeout(() => setGuidedFeedback(null), 400);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [phase, guidedMode, guidedKeyIdx, guidedRound, guidedKeys]);

  useEffect(() => {
    if (phase === 'checkpoint' && cpInputRef.current) cpInputRef.current.focus();
  }, [phase]);

  // Always clear the interval when this component is removed from the DOM
  useEffect(() => () => clearInterval(timerRef.current), []);

  useEffect(() => {
    if (cpRunning && cpStartTime) {
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - cpStartTime;
        const rem = Math.max(0, 60000 - elapsed);
        setCpTimeLeft(rem);
        if (rem <= 0) {
          clearInterval(timerRef.current);
          finishCheckpoint(cpTypedRef.current, 60000);
        }
      }, 100);
      return () => clearInterval(timerRef.current);
    }
  }, [cpRunning, cpStartTime]);

  const calcCpStats = (typed, elapsed) => {
    const elapsedMin = elapsed / 60000;
    let correct = 0, errors = 0;
    for (let i = 0; i < typed.length; i++) {
      if (i < cpPassage.length) {
        if (typed[i] === cpPassage[i]) correct++;
        else errors++;
      }
    }
    const wpm = elapsedMin > 0 ? Math.round((correct / 5) / elapsedMin) : 0;
    const accuracy = typed.length > 0 ? Math.round((correct / typed.length) * 100) : 100;
    return { wpm, accuracy, correct, errors };
  };

  const finishCheckpoint = (typed, elapsed) => {
    clearInterval(timerRef.current);
    setCpRunning(false);
    const stats = calcCpStats(typed, elapsed);
    setCpStats(stats);
    const passed = stats.wpm >= lesson.minWpm && stats.accuracy >= lesson.minAcc;
    if (passed) {
      // Award badge and complete lesson
      let updated = { ...user };
      if (!updated.lessonsCompleted.includes(lesson.id)) {
        updated.lessonsCompleted = [...updated.lessonsCompleted, lesson.id];
      }
      updated = awardBadge(updated, lesson.badge);
      updated = checkAndAwardBadges(updated);
      saveUser(updated);
      setUser(updated);
      setPhase('pass');
    } else {
      setPhase('fail');
    }
  };

  const handleDrillKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = drillInput.trim();
      const expected = drillWords[drillIdx];
      if (val === expected) {
        const ns = streak + 1;
        setStreak(ns);
        if (ns > streakRecord) setStreakRecord(ns);
        setDrillFeedback('correct');
      } else {
        setStreak(0);
        setDrillFeedback('wrong');
      }
      setTimeout(() => {
        setDrillFeedback(null);
        setDrillIdx(i => (i + 1) % drillWords.length);
        setDrillInput('');
      }, 300);
    }
  };

  const handleCpInput = (e) => {
    const val = e.target.value;
    if (!cpStartTime && val.length > 0) {
      setCpStartTime(Date.now());
      setCpRunning(true);
    }
    if (val.length <= cpPassage.length) {
      cpTypedRef.current = val;
      setCpTyped(val);
      if (val.length === cpPassage.length) {
        const elapsed = cpStartTime ? Date.now() - cpStartTime : 60000;
        finishCheckpoint(val, elapsed);
      }
    }
  };

  const renderCpPassage = () => {
    return cpPassage.split('').map((char, i) => {
      let cls = 'char-pending';
      if (i < cpTyped.length) {
        cls = cpTyped[i] === char ? 'char-correct' : 'char-wrong';
      } else if (i === cpTyped.length) {
        cls = 'char-current';
      }
      return <span key={i} className={cls}>{char}</span>;
    });
  };

  return (
    <div style={{ padding: '40px 32px', position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button className="btn btn-secondary" onClick={onBack} style={{ fontSize: 13 }}>
          ← Lessons
        </button>
        <div>
          <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 22, fontWeight: 700, color: '#00b4d8', marginBottom: 2 }}>
            Lesson {lesson.id + 1}: {lesson.title}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>{lesson.subtitle}</p>
        </div>
      </div>

      {/* Keyboard Diagram */}
      <div style={{ marginBottom: 28, overflowX: 'auto' }}>
        <KeyboardDiagram highlightKeys={lesson.keys} />
      </div>

      {/* Tip */}
      <div style={{
        background: 'rgba(0,180,216,0.08)',
        border: '1px solid rgba(0,180,216,0.2)',
        borderRadius: 10,
        padding: '14px 18px',
        marginBottom: 28,
        fontSize: 14,
        color: 'rgba(255,255,255,0.75)',
        lineHeight: 1.6,
      }}>
        <strong style={{ color: '#00b4d8' }}>Tip: </strong>{lesson.tip}
      </div>

      {/* Phase: Intro */}
      {phase === 'intro' && (
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => setPhase('drill')} style={{ fontSize: 14 }}>
            Practice Drill
          </button>
          <button className="btn btn-primary" onClick={() => setPhase('checkpoint')} style={{ fontSize: 14 }}>
            Checkpoint Test →
          </button>
        </div>
      )}

      {/* Phase: Drill */}
      {phase === 'drill' && guidedMode && guidedKeys.length > 0 && (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 16, color: '#00b4d8', marginBottom: 6 }}>
              Step 1: Key Familiarization
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              Round {guidedRound + 1} of 2 &mdash; press each key as it appears
            </p>
          </div>

          {/* Big key prompt */}
          <div style={{
            width: 140,
            height: 140,
            margin: '32px auto',
            borderRadius: 20,
            background: guidedFeedback === 'correct' ? 'rgba(82,214,138,0.15)' : guidedFeedback === 'wrong' ? 'rgba(255,107,107,0.15)' : 'rgba(0,180,216,0.08)',
            border: `3px solid ${guidedFeedback === 'correct' ? '#52d68a' : guidedFeedback === 'wrong' ? '#ff6b6b' : '#00b4d8'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Space Mono, monospace',
            fontSize: 64,
            fontWeight: 700,
            color: guidedFeedback === 'correct' ? '#52d68a' : guidedFeedback === 'wrong' ? '#ff6b6b' : '#00b4d8',
            transition: 'all 0.15s',
            userSelect: 'none',
          }}>
            {guidedKeys[guidedKeyIdx]?.toUpperCase()}
          </div>

          <p style={{ textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 28 }}>
            {guidedFeedback === 'correct' ? '✓ Nice!' : guidedFeedback === 'wrong' ? '✗ Wrong key — try again' : 'Press this key on your keyboard'}
          </p>

          {/* Key progress strip */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
            {guidedKeys.map((k, i) => (
              <div key={i} style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: i < guidedKeyIdx ? 'rgba(82,214,138,0.12)' : i === guidedKeyIdx ? 'rgba(0,180,216,0.15)' : 'rgba(255,255,255,0.04)',
                border: `2px solid ${i < guidedKeyIdx ? '#52d68a' : i === guidedKeyIdx ? '#00b4d8' : 'rgba(255,255,255,0.1)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 15,
                fontFamily: 'Space Mono, monospace',
                fontWeight: 700,
                color: i < guidedKeyIdx ? '#52d68a' : i === guidedKeyIdx ? '#00b4d8' : 'rgba(255,255,255,0.25)',
                transition: 'all 0.15s',
              }}>
                {i < guidedKeyIdx ? '✓' : k.toUpperCase()}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => setPhase('intro')} style={{ fontSize: 13 }}>
              ← Back
            </button>
            <button className="btn btn-secondary" onClick={() => setGuidedMode(false)} style={{ fontSize: 13 }}>
              Skip to Word Drill →
            </button>
          </div>
        </div>
      )}

      {phase === 'drill' && !guidedMode && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 16, color: '#00b4d8' }}>
              Step 2: Word Drill
            </h2>
            <div style={{ display: 'flex', gap: 16 }}>
              <div className="stat-pill">
                <span className="val">{streak}</span>
                <span className="label">Streak</span>
              </div>
              <div className="stat-pill">
                <span className="val">{streakRecord}</span>
                <span className="label">Best</span>
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(0,0,0,0.4)',
            borderRadius: 12,
            padding: '32px',
            textAlign: 'center',
            marginBottom: 20,
            border: `2px solid ${drillFeedback === 'correct' ? '#52d68a' : drillFeedback === 'wrong' ? '#ff6b6b' : 'rgba(255,255,255,0.1)'}`,
            transition: 'border-color 0.2s',
          }}>
            <div style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: 36,
              fontWeight: 700,
              color: '#00b4d8',
              letterSpacing: '0.1em',
              marginBottom: 8,
            }}>
              {drillWords[drillIdx]}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
              {drillIdx + 1} / {drillWords.length}
            </div>
          </div>

          <input
            ref={inputRef}
            value={drillInput}
            onChange={e => setDrillInput(e.target.value)}
            onKeyDown={handleDrillKey}
            className="input-base"
            placeholder="Type the word above, then press Enter..."
            style={{ fontFamily: 'Space Mono, monospace', fontSize: 18, textAlign: 'center', marginBottom: 16 }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" onClick={() => setPhase('intro')} style={{ fontSize: 13 }}>
              ← Back
            </button>
            <button className="btn btn-primary" onClick={() => setPhase('checkpoint')} style={{ fontSize: 13 }}>
              Take Checkpoint →
            </button>
          </div>
        </div>
      )}

      {/* Phase: Checkpoint */}
      {phase === 'checkpoint' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 16, color: '#00b4d8' }}>
              Checkpoint Test
            </h2>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                Goal: {lesson.minWpm} WPM / {lesson.minAcc}% acc
              </span>
              <div style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: 28,
                fontWeight: 700,
                color: cpTimeLeft < 10000 ? '#ff6b6b' : '#00b4d8',
              }}>
                {Math.ceil(cpTimeLeft / 1000)}s
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              padding: '20px 24px',
              fontFamily: 'Space Mono, monospace',
              fontSize: 18,
              lineHeight: 1.9,
              letterSpacing: '0.03em',
              wordBreak: 'break-word',
              cursor: 'text',
              minHeight: 100,
              marginBottom: 16,
            }}
            onClick={() => cpInputRef.current?.focus()}
          >
            {renderCpPassage()}
          </div>

          <input
            ref={cpInputRef}
            value={cpTyped}
            onChange={handleCpInput}
            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1 }}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />

          {!cpStartTime && (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 16 }}>
              Click the passage above and start typing
            </p>
          )}

          <button className="btn btn-secondary" onClick={() => { clearInterval(timerRef.current); setPhase('intro'); }} style={{ fontSize: 13 }}>
            ← Back
          </button>
        </div>
      )}

      {/* Phase: Pass */}
      {phase === 'pass' && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 24, color: '#52d68a', marginBottom: 8 }}>
            Lesson Passed!
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
            You hit {cpStats?.wpm} WPM with {cpStats?.accuracy}% accuracy.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 24 }}>
            <div className="stat-pill">
              <span className="val">{cpStats?.wpm}</span>
              <span className="label">WPM</span>
            </div>
            <div className="stat-pill">
              <span className="val">{cpStats?.accuracy}%</span>
              <span className="label">Accuracy</span>
            </div>
          </div>
          {(() => {
            const badge = ALL_BADGES.find(b => b.id === lesson.badge);
            return badge ? (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                background: 'rgba(255,209,102,0.12)',
                border: '1px solid rgba(255,209,102,0.3)',
                borderRadius: 10,
                padding: '12px 20px',
                marginBottom: 28,
              }}>
                <span style={{ fontSize: 28 }}>{badge.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#ffd166' }}>Badge Unlocked: {badge.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{badge.desc}</div>
                </div>
              </div>
            ) : null;
          })()}
          <br />
          <button className="btn btn-primary" onClick={onBack}>
            Back to Lessons
          </button>
        </div>
      )}

      {/* Phase: Fail */}
      {phase === 'fail' && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>😤</div>
          <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 24, color: '#ff6b6b', marginBottom: 8 }}>
            Not Quite There
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>
            You scored {cpStats?.wpm} WPM with {cpStats?.accuracy}% accuracy.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.45)', marginBottom: 24, fontSize: 14 }}>
            Required: {lesson.minWpm} WPM and {lesson.minAcc}% accuracy. Keep practicing!
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => {
              setCpTyped('');
              setCpStartTime(null);
              setCpTimeLeft(60000);
              setCpRunning(false);
              setCpStats(null);
              setPhase('drill');
            }}>
              Practice More
            </button>
            <button className="btn btn-primary" onClick={() => {
              setCpTyped('');
              setCpStartTime(null);
              setCpTimeLeft(60000);
              setCpRunning(false);
              setCpStats(null);
              setPhase('checkpoint');
            }}>
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
