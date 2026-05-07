import BadgeGrid from '../components/BadgeGrid';
import { saveUser, clearUser, ALL_BADGES } from '../userStore';

export default function Profile({ user, setUser, setScreen }) {
  const levelClass = `level-pill level-${(user?.level || 'beginner').toLowerCase()}`;

  const handleLevelChange = (lvl) => {
    const updated = { ...user, level: lvl };
    saveUser(updated);
    setUser(updated);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
      clearUser();
      window.location.reload();
    }
  };

  return (
    <div style={{ padding: '40px 32px', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button className="btn btn-secondary" onClick={() => setScreen('home')} style={{ fontSize: 13 }}>
          ← Back
        </button>
        <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 26, fontWeight: 700, color: '#00b4d8' }}>
          Profile
        </h1>
      </div>

      <div style={{ maxWidth: 760 }}>
        {/* User card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          padding: '28px 32px',
          marginBottom: 28,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 32,
          flexWrap: 'wrap',
        }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00b4d8, #0077a8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            flexShrink: 0,
          }}>
            🦈
          </div>

          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 22,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.95)',
              marginBottom: 6,
            }}>
              {user?.username}
            </div>

            <div style={{ marginBottom: 16 }}>
              <span className={levelClass}>{user?.level}</span>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'Best WPM', val: user?.bestWpm || 0 },
                { label: 'Best Acc', val: `${user?.bestAccuracy || 0}%` },
                { label: 'Sessions', val: user?.sessionsPlayed || 0 },
                { label: 'Chase', val: user?.chaseSessions || 0 },
                { label: 'Chunk', val: user?.chunkSessions || 0 },
              ].map(s => (
                <div key={s.label} className="stat-pill" style={{ minWidth: 80 }}>
                  <span className="val" style={{ fontSize: 18 }}>{s.val}</span>
                  <span className="label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Level selector */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 28,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 14 }}>
            Change Level
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {['Beginner', 'Intermediate', 'Advanced'].map(lvl => (
              <button
                key={lvl}
                onClick={() => handleLevelChange(lvl)}
                className={`btn ${user?.level === lvl ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, fontSize: 13 }}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Lessons progress */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 28,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 14 }}>
            Lessons Progress
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Home Row', 'Top Row', 'Bottom Row', 'Numbers', 'Symbols'].map((name, i) => {
              const done = (user?.lessonsCompleted || []).includes(i);
              return (
                <div key={i} style={{
                  flex: 1,
                  padding: '10px 8px',
                  borderRadius: 8,
                  background: done ? 'rgba(82,214,138,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${done ? 'rgba(82,214,138,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{done ? '✅' : '⬜'}</div>
                  <div style={{ fontSize: 11, color: done ? '#52d68a' : 'rgba(255,255,255,0.4)' }}>{name}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Badges */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 28,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
              Badges
            </div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              {user?.badges?.length || 0} / {ALL_BADGES.length} earned
            </span>
          </div>
          <BadgeGrid earnedBadges={user?.badges || []} />
        </div>

        {/* Danger zone */}
        <div style={{
          background: 'rgba(255,107,107,0.04)',
          border: '1px solid rgba(255,107,107,0.15)',
          borderRadius: 12,
          padding: '20px 24px',
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#ff6b6b', marginBottom: 10 }}>
            Danger Zone
          </div>
          <button className="btn btn-danger" onClick={handleReset} style={{ fontSize: 13 }}>
            Reset All Progress
          </button>
        </div>
      </div>
    </div>
  );
}
