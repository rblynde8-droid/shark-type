import { useState, useRef } from 'react';
import TypingEngine from '../components/TypingEngine';
import { saveUser, DEFAULT_USER } from '../userStore';

const ASSESSMENT_PASSAGE = "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump. The five boxing wizards jump quickly.";

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState('welcome'); // welcome | assess | result
  const [username, setUsername] = useState('');
  const [detectedLevel, setDetectedLevel] = useState(null);
  const [chosenLevel, setChosenLevel] = useState(null);
  const [assessStats, setAssessStats] = useState(null);

  const detectLevel = (wpm) => {
    if (wpm < 25) return 'Beginner';
    if (wpm <= 45) return 'Intermediate';
    return 'Advanced';
  };

  const handleAssessComplete = (stats) => {
    const level = detectLevel(stats.wpm);
    setDetectedLevel(level);
    setChosenLevel(level);
    setAssessStats(stats);
    setStep('result');
  };

  const handleFinish = () => {
    const user = {
      ...DEFAULT_USER,
      username: username.trim() || 'Anonymous',
      level: chosenLevel || 'Beginner',
    };
    saveUser(user);
    onComplete(user);
  };

  const levels = ['Beginner', 'Intermediate', 'Advanced'];
  const levelDescs = {
    Beginner: '< 25 WPM — learning the ropes',
    Intermediate: '25–45 WPM — building momentum',
    Advanced: '45+ WPM — blazing fast',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      position: 'relative',
      zIndex: 1,
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{
          fontFamily: 'Orbitron, sans-serif',
          fontSize: 'clamp(40px, 8vw, 72px)',
          fontWeight: 900,
          background: 'linear-gradient(135deg, #00b4d8 0%, #48cae4 50%, #90e0ef 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '0.08em',
          lineHeight: 1.1,
          marginBottom: 8,
        }}>
          SHARKTYPE
        </div>
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '15px', letterSpacing: '0.1em' }}>
          MASTER THE KEYBOARD. OUTSWIM THE SHARK.
        </div>
      </div>

      <div style={{
        width: '100%',
        maxWidth: 640,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: '36px 40px',
      }}>
        {step === 'welcome' && (
          <>
            <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 20, marginBottom: 8, color: '#00b4d8' }}>
              Welcome, Typist
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 28, fontSize: 14 }}>
              Choose a username to get started. Then we'll run a quick 30-second typing assessment to set your level.
            </p>

            <label style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
              Username
            </label>
            <input
              className="input-base"
              placeholder="Enter your username..."
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && username.trim() && setStep('assess')}
              maxLength={20}
              autoFocus
            />

            <div style={{ marginTop: 28, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setChosenLevel('Beginner');
                  const user = { ...DEFAULT_USER, username: username.trim() || 'Anonymous', level: 'Beginner' };
                  saveUser(user);
                  onComplete(user);
                }}
                style={{ fontSize: 13 }}
              >
                Skip Assessment
              </button>
              <button
                className="btn btn-primary"
                disabled={!username.trim()}
                onClick={() => setStep('assess')}
                style={{ opacity: username.trim() ? 1 : 0.5 }}
              >
                Take Assessment →
              </button>
            </div>
          </>
        )}

        {step === 'assess' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 18, color: '#00b4d8' }}>
                Speed Assessment
              </h2>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>30 seconds</span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>
              Type the passage below as fast and accurately as you can.
            </p>
            <TypingEngine
              passage={ASSESSMENT_PASSAGE}
              timeLimit={30000}
              onComplete={handleAssessComplete}
              autoFocus={true}
            />
          </>
        )}

        {step === 'result' && (
          <>
            <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 18, color: '#00b4d8', marginBottom: 20 }}>
              Assessment Complete!
            </h2>

            <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
              <div className="stat-pill" style={{ flex: 1 }}>
                <span className="val">{assessStats?.wpm}</span>
                <span className="label">WPM</span>
              </div>
              <div className="stat-pill" style={{ flex: 1 }}>
                <span className="val">{assessStats?.accuracy}%</span>
                <span className="label">Accuracy</span>
              </div>
            </div>

            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>
              Detected level: <strong style={{ color: '#00b4d8' }}>{detectedLevel}</strong>. You can override below:
            </p>

            <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
              {levels.map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setChosenLevel(lvl)}
                  style={{
                    flex: 1,
                    padding: '12px 8px',
                    borderRadius: 10,
                    border: `2px solid ${chosenLevel === lvl ? '#00b4d8' : 'rgba(255,255,255,0.1)'}`,
                    background: chosenLevel === lvl ? 'rgba(0,180,216,0.15)' : 'rgba(255,255,255,0.04)',
                    color: chosenLevel === lvl ? '#00b4d8' : 'rgba(255,255,255,0.6)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{lvl}</div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>{levelDescs[lvl]}</div>
                </button>
              ))}
            </div>

            <button className="btn btn-primary" onClick={handleFinish} style={{ width: '100%', padding: 14 }}>
              Start Typing — Let's Go! 🦈
            </button>
          </>
        )}
      </div>
    </div>
  );
}
