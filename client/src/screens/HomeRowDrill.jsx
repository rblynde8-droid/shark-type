import { useState, useRef, useEffect } from 'react';
import KeyboardDiagram from '../components/KeyboardDiagram';
import { saveUser, checkAndAwardBadges } from '../userStore';

const KEY_ROWS = [
  { label: 'Home Row', keys: ['a','s','d','f','j','k','l',';'], display: ['A','S','D','F','J','K','L',';'] },
  { label: '+ Top Row', keys: ['a','s','d','f','j','k','l',';','q','w','e','r','t','y','u','i','o','p'], display: ['Q','W','E','R','T','Y','U','I','O','P'] },
  { label: '+ Bottom Row', keys: ['a','s','d','f','j','k','l',';','q','w','e','r','t','y','u','i','o','p','z','x','c','v','b','n','m'], display: ['Z','X','C','V','B','N','M'] },
];

function makeWord(availableKeys, minLen = 2, maxLen = 6) {
  const len = minLen + Math.floor(Math.random() * (maxLen - minLen + 1));
  let word = '';
  for (let i = 0; i < len; i++) {
    word += availableKeys[Math.floor(Math.random() * availableKeys.length)];
  }
  return word;
}

function generateWords(keys, count = 20) {
  const words = [];
  for (let i = 0; i < count; i++) {
    words.push(makeWord(keys));
  }
  return words;
}

const HOME_ROW_GUIDED = ['a','s','d','f','j','k','l',';'];

export default function HomeRowDrill({ user, setUser, setScreen }) {
  const [rowTier, setRowTier] = useState(0);
  const [words, setWords] = useState(() => generateWords(KEY_ROWS[0].keys));
  const [wordIdx, setWordIdx] = useState(0);
  const [input, setInput] = useState('');
  const [streak, setStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [active, setActive] = useState(false);
  const inputRef = useRef(null);

  // Guided intro state
  const [guidedMode, setGuidedMode] = useState(true);
  const [guidedKeyIdx, setGuidedKeyIdx] = useState(0);
  const [guidedRound, setGuidedRound] = useState(0);
  const [guidedFeedback, setGuidedFeedback] = useState(null);

  const allActiveKeys = KEY_ROWS.slice(0, rowTier + 1).flatMap(r => r.display);

  useEffect(() => {
    if (active && !guidedMode && inputRef.current) inputRef.current.focus();
  }, [active, guidedMode]);

  // Guided single-key listener
  useEffect(() => {
    if (!active || !guidedMode) return;
    const handleKey = (e) => {
      if (e.key.length !== 1 || e.metaKey || e.ctrlKey) return;
      const expected = HOME_ROW_GUIDED[guidedKeyIdx];
      if (e.key.toLowerCase() === expected) {
        setGuidedFeedback('correct');
        setTimeout(() => {
          setGuidedFeedback(null);
          const nextIdx = guidedKeyIdx + 1;
          if (nextIdx >= HOME_ROW_GUIDED.length) {
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
  }, [active, guidedMode, guidedKeyIdx, guidedRound]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = input.trim();
      const expected = words[wordIdx];

      if (val === expected) {
        const ns = streak + 1;
        setStreak(ns);
        setTotalCorrect(c => c + 1);
        setFeedback('correct');

        // Unlock next row every 10 correct
        if (ns > 0 && ns % 10 === 0 && rowTier < KEY_ROWS.length - 1) {
          setRowTier(t => {
            const next = t + 1;
            setWords(generateWords(KEY_ROWS.slice(0, next + 1).flatMap(r => r.keys)));
            setWordIdx(0);
            return next;
          });
        }
      } else {
        setStreak(0);
        setFeedback('wrong');
      }

      setTimeout(() => {
        setFeedback(null);
        setWordIdx(i => {
          const next = (i + 1) % words.length;
          return next;
        });
        setInput('');
      }, 250);
    }
  };

  const streakToNextUnlock = rowTier < KEY_ROWS.length - 1
    ? 10 - (streak % 10)
    : null;
  const progressToNext = rowTier < KEY_ROWS.length - 1
    ? ((streak % 10) / 10) * 100
    : 100;

  return (
    <div style={{ padding: '40px 32px', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button className="btn btn-secondary" onClick={() => setScreen('home')} style={{ fontSize: 13 }}>
          ← Back
        </button>
        <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 26, fontWeight: 700, color: '#00b4d8' }}>
          Home Row Drill
        </h1>
      </div>

      {/* Keyboard */}
      <div style={{ marginBottom: 24, overflowX: 'auto' }}>
        <KeyboardDiagram
          highlightKeys={allActiveKeys}
          activeKeys={active && words[wordIdx] ? [...words[wordIdx].toUpperCase()] : []}
        />
      </div>

      {/* Active key tiers */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {KEY_ROWS.slice(0, rowTier + 1).map((row, i) => (
          <div key={i} style={{
            background: 'rgba(0,180,216,0.12)',
            border: '1px solid rgba(0,180,216,0.3)',
            borderRadius: 6,
            padding: '4px 12px',
            fontSize: 12,
            color: '#00b4d8',
            fontWeight: 600,
          }}>
            {row.label}
          </div>
        ))}
        {rowTier < KEY_ROWS.length - 1 && (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            padding: '4px 12px',
            fontSize: 12,
            color: 'rgba(255,255,255,0.3)',
          }}>
            🔒 {KEY_ROWS[rowTier + 1].label.replace('+ ', '')} (unlock at streak {(Math.floor(streak / 10) + 1) * 10})
          </div>
        )}
      </div>

      {/* Streak and progress */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'flex-start' }}>
        <div className="stat-pill">
          <span className="val">{streak}</span>
          <span className="label">Streak</span>
        </div>
        <div className="stat-pill">
          <span className="val">{totalCorrect}</span>
          <span className="label">Total</span>
        </div>

        {rowTier < KEY_ROWS.length - 1 && (
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
              <span>Progress to unlock {KEY_ROWS[rowTier + 1].label.replace('+ ', '')}</span>
              <span>{streak % 10}/10</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progressToNext}%` }} />
            </div>
          </div>
        )}

        {rowTier === KEY_ROWS.length - 1 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <span style={{
              background: 'rgba(82,214,138,0.1)',
              border: '1px solid rgba(82,214,138,0.3)',
              color: '#52d68a',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 700,
            }}>
              All rows unlocked! 🎉
            </span>
          </div>
        )}
      </div>

      {/* Word display */}
      {!active ? (
        <div style={{ maxWidth: 500 }}>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
            We'll start by pressing each home row key one at a time. Then move on to word drills. Every 10 correct words, a new row unlocks.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => setActive(true)}
            style={{ width: '100%', padding: 14, fontSize: 15 }}
          >
            Start Drill
          </button>
        </div>
      ) : active && guidedMode ? (
        /* Guided key-by-key intro */
        <div style={{ maxWidth: 540, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 16, color: '#00b4d8', marginBottom: 6 }}>
              Step 1: Press Each Key in Order
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              Round {guidedRound + 1} of 2 — find each key and press it
            </p>
          </div>

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
            {HOME_ROW_GUIDED[guidedKeyIdx]?.toUpperCase()}
          </div>

          <p style={{ textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 28 }}>
            {guidedFeedback === 'correct' ? '✓ Nice!' : guidedFeedback === 'wrong' ? '✗ Wrong key — try again' : 'Press this key on your keyboard'}
          </p>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 32 }}>
            {HOME_ROW_GUIDED.map((k, i) => (
              <div key={i} style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                background: i < guidedKeyIdx ? 'rgba(82,214,138,0.12)' : i === guidedKeyIdx ? 'rgba(0,180,216,0.15)' : 'rgba(255,255,255,0.04)',
                border: `2px solid ${i < guidedKeyIdx ? '#52d68a' : i === guidedKeyIdx ? '#00b4d8' : 'rgba(255,255,255,0.1)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
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
            <button className="btn btn-secondary" onClick={() => {
              setActive(false);
              setGuidedMode(true);
              setGuidedKeyIdx(0);
              setGuidedRound(0);
            }} style={{ fontSize: 13 }}>
              ← Back
            </button>
            <button className="btn btn-secondary" onClick={() => setGuidedMode(false)} style={{ fontSize: 13 }}>
              Skip to Word Drill →
            </button>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 560 }}>
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            borderRadius: 12,
            padding: '32px',
            textAlign: 'center',
            marginBottom: 20,
            border: `2px solid ${feedback === 'correct' ? '#52d68a' : feedback === 'wrong' ? '#ff6b6b' : 'rgba(255,255,255,0.1)'}`,
            transition: 'border-color 0.2s',
          }}>
            <div style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: 13,
              color: 'rgba(255,255,255,0.25)',
              marginBottom: 12,
              letterSpacing: '0.1em',
            }}>
              {words.slice(wordIdx + 1, wordIdx + 4).join(' · ')}
            </div>
            <div style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: 42,
              fontWeight: 700,
              color: feedback === 'correct' ? '#52d68a' : feedback === 'wrong' ? '#ff6b6b' : '#00b4d8',
              letterSpacing: '0.12em',
              transition: 'color 0.2s',
            }}>
              {words[wordIdx]}
            </div>
          </div>

          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="input-base"
            placeholder="Type the word above, then press Enter..."
            style={{ fontFamily: 'Space Mono, monospace', fontSize: 18, textAlign: 'center', marginBottom: 16 }}
            autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
          />

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" onClick={() => {
              setActive(false);
              setStreak(0);
              setTotalCorrect(0);
              setRowTier(0);
              setWords(generateWords(KEY_ROWS[0].keys));
              setWordIdx(0);
              setGuidedMode(true);
              setGuidedKeyIdx(0);
              setGuidedRound(0);
            }} style={{ fontSize: 13 }}>
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
