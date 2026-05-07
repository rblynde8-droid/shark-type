import { useState, useEffect, useRef, useCallback } from 'react';

export default function TypingEngine({
  passage,
  onComplete,
  onProgress,
  timeLimit = 0,
  autoFocus = true,
  disabled = false,
}) {
  const [typed, setTyped] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [finished, setFinished] = useState(false);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  const calcStats = useCallback((typedText, elapsed) => {
    const elapsedMin = elapsed / 60000;
    let correct = 0;
    let errors = 0;
    for (let i = 0; i < typedText.length; i++) {
      if (i < passage.length) {
        if (typedText[i] === passage[i]) correct++;
        else errors++;
      }
    }
    const wpm = elapsedMin > 0 ? Math.round((correct / 5) / elapsedMin) : 0;
    const accuracy = typedText.length > 0
      ? Math.round((correct / typedText.length) * 100)
      : 100;
    return { wpm, accuracy, correct, errors };
  }, [passage]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus, passage]);

  useEffect(() => {
    setTyped('');
    setStartTime(null);
    setTimeLeft(timeLimit);
    setFinished(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [passage, timeLimit]);

  useEffect(() => {
    if (startTime && timeLimit > 0 && !finished) {
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, timeLimit - elapsed);
        setTimeLeft(remaining);

        if (remaining <= 0) {
          clearInterval(timerRef.current);
          setFinished(true);
          const stats = calcStats(typed, timeLimit);
          onComplete && onComplete(stats);
        }
      }, 100);
      return () => clearInterval(timerRef.current);
    }
  }, [startTime, timeLimit, finished, typed, calcStats, onComplete]);

  const handleInput = (e) => {
    if (finished || disabled) return;
    const val = e.target.value;

    if (!startTime && val.length > 0) {
      setStartTime(Date.now());
    }

    if (val.length <= passage.length) {
      setTyped(val);
      const elapsed = startTime ? Date.now() - startTime : 0;
      const stats = calcStats(val, elapsed);
      onProgress && onProgress(stats);

      if (val.length === passage.length && timeLimit === 0) {
        setFinished(true);
        onComplete && onComplete(stats);
      }
    }
  };

  const elapsed = startTime ? Date.now() - startTime : 0;
  const { wpm, accuracy } = calcStats(typed, elapsed);

  const renderPassage = () => {
    return passage.split('').map((char, i) => {
      let cls = 'char-pending';
      if (i < typed.length) {
        cls = typed[i] === char ? 'char-correct' : 'char-wrong';
      } else if (i === typed.length) {
        cls = 'char-current';
      }
      return (
        <span key={i} className={cls}>
          {char}
        </span>
      );
    });
  };

  return (
    <div>
      {timeLimit > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 12,
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="stat-pill">
              <span className="val">{wpm}</span>
              <span className="label">WPM</span>
            </div>
            <div className="stat-pill">
              <span className="val">{accuracy}%</span>
              <span className="label">ACC</span>
            </div>
          </div>
          <div style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: '28px',
            fontWeight: 700,
            color: timeLeft < 10000 ? '#ff6b6b' : '#00b4d8',
          }}>
            {Math.ceil(timeLeft / 1000)}s
          </div>
        </div>
      )}

      <div
        style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px',
          padding: '20px 24px',
          fontFamily: 'Space Mono, monospace',
          fontSize: '18px',
          lineHeight: 1.9,
          letterSpacing: '0.03em',
          wordBreak: 'break-word',
          cursor: 'text',
          minHeight: '120px',
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {renderPassage()}
        {finished && (
          <span style={{ color: '#00b4d8', marginLeft: 4 }}>|</span>
        )}
      </div>

      <input
        ref={inputRef}
        value={typed}
        onChange={handleInput}
        disabled={finished || disabled}
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          width: 1,
          height: 1,
        }}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />

      {!startTime && !finished && (
        <p style={{ marginTop: 10, fontSize: '13px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
          Click above and start typing to begin
        </p>
      )}
    </div>
  );
}
