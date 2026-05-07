import { useState } from 'react';
import LessonDetail from './LessonDetail';

export const LESSONS = [
  {
    id: 0,
    title: 'Home Row',
    subtitle: 'ASDF JKL;',
    icon: '🏠',
    keys: ['A','S','D','F','J','K','L',';'],
    tip: 'Rest your left fingers on A S D F and right on J K L ;. These are your anchor keys — always return here!',
    minWpm: 15,
    minAcc: 90,
    badge: 'lesson_1',
  },
  {
    id: 1,
    title: 'Top Row',
    subtitle: 'QWERTY UIOP',
    icon: '🔝',
    keys: ['Q','W','E','R','T','Y','U','I','O','P'],
    tip: 'Reach up with your fingers from the home row. Keep your wrists steady and return to home after each keystroke.',
    minWpm: 20,
    minAcc: 88,
    badge: 'lesson_2',
  },
  {
    id: 2,
    title: 'Bottom Row',
    subtitle: 'ZXCV BNM',
    icon: '⬇️',
    keys: ['Z','X','C','V','B','N','M'],
    tip: 'Curl your fingers down to the bottom row. Your pinky handles Z, and your index fingers reach for B and N.',
    minWpm: 20,
    minAcc: 88,
    badge: 'lesson_3',
  },
  {
    id: 3,
    title: 'Numbers',
    subtitle: '1 2 3 4 5 6 7 8 9 0',
    icon: '🔢',
    keys: ['1','2','3','4','5','6','7','8','9','0'],
    tip: 'Reach up past the top row. Left hand: 1-5, Right hand: 6-0. Keep your eyes on the screen, not the keyboard!',
    minWpm: 15,
    minAcc: 85,
    badge: 'lesson_4',
  },
  {
    id: 4,
    title: 'Symbols',
    subtitle: '! @ # $ % & punctuation',
    icon: '💫',
    keys: ['!','@','#','$','%','&','*','(',')','_','+','-','=',',','.','/',';',"'",'"','[',']','\\'],
    tip: 'Symbols require stretching and holding Shift. Practice the most common ones: period, comma, slash, apostrophe.',
    minWpm: 15,
    minAcc: 85,
    badge: 'lesson_5',
  },
];

export default function Lessons({ user, setUser, setScreen }) {
  const [activeLesson, setActiveLesson] = useState(null);
  const completed = user?.lessonsCompleted || [];

  if (activeLesson !== null) {
    return (
      <LessonDetail
        lesson={LESSONS[activeLesson]}
        user={user}
        setUser={setUser}
        onBack={() => setActiveLesson(null)}
      />
    );
  }

  return (
    <div style={{ padding: '40px 32px', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button className="btn btn-secondary" onClick={() => setScreen('home')} style={{ fontSize: 13 }}>
          ← Back
        </button>
        <div>
          <h1 style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: 26,
            fontWeight: 700,
            color: '#00b4d8',
            marginBottom: 4,
          }}>Lessons</h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>
            Complete lessons in order to unlock new key rows
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 700 }}>
        {LESSONS.map((lesson, idx) => {
          const isCompleted = completed.includes(lesson.id);
          const isUnlocked = idx === 0 || completed.includes(LESSONS[idx - 1].id);
          const isLocked = !isUnlocked;

          return (
            <div
              key={lesson.id}
              onClick={() => !isLocked && setActiveLesson(idx)}
              style={{
                background: isCompleted
                  ? 'rgba(82,214,138,0.06)'
                  : isLocked
                    ? 'rgba(255,255,255,0.02)'
                    : 'rgba(255,255,255,0.05)',
                border: `1px solid ${isCompleted ? 'rgba(82,214,138,0.25)' : isLocked ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 12,
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                cursor: isLocked ? 'not-allowed' : 'pointer',
                opacity: isLocked ? 0.45 : 1,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                if (!isLocked) {
                  e.currentTarget.style.borderColor = '#00b4d8';
                  e.currentTarget.style.background = 'rgba(0,180,216,0.08)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = isCompleted ? 'rgba(82,214,138,0.25)' : isLocked ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)';
                e.currentTarget.style.background = isCompleted ? 'rgba(82,214,138,0.06)' : isLocked ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)';
              }}
            >
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: isCompleted
                  ? 'rgba(82,214,138,0.2)'
                  : isLocked
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(0,180,216,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                flexShrink: 0,
              }}>
                {isLocked ? '🔒' : isCompleted ? '✅' : lesson.icon}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: 15,
                  fontWeight: 700,
                  color: isCompleted ? '#52d68a' : isLocked ? 'rgba(255,255,255,0.3)' : '#00b4d8',
                  marginBottom: 4,
                }}>
                  Lesson {idx + 1}: {lesson.title}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                  Keys: <span style={{ fontFamily: 'Space Mono, monospace', color: 'rgba(255,255,255,0.7)' }}>{lesson.subtitle}</span>
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
                  Required: {lesson.minWpm} WPM / {lesson.minAcc}% acc
                </div>
                {isCompleted && (
                  <span style={{ fontSize: 12, color: '#52d68a', fontWeight: 700 }}>COMPLETED ✓</span>
                )}
                {!isLocked && !isCompleted && (
                  <span style={{ fontSize: 12, color: '#00b4d8', fontWeight: 700 }}>START →</span>
                )}
                {isLocked && (
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>LOCKED</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
