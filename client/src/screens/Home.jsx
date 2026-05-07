import { ALL_BADGES } from '../userStore';

const MODES = [
  {
    id: 'lessons',
    title: 'Lessons',
    icon: '📚',
    desc: 'Master key rows step by step with guided drills and checkpoint tests.',
    color: '#0d6b4a',
  },
  {
    id: 'chase',
    title: 'Shark Chase',
    icon: '🦈',
    desc: 'Type fast or get eaten! Race against the shark across 3 lives.',
    color: '#1255a0',
    ranked: true,
  },
  {
    id: 'chunk',
    title: 'Chunk Reading',
    icon: '📖',
    desc: 'Boost reading speed by typing highlighted word chunks from memory.',
    color: '#6a2888',
  },
  {
    id: 'homerow',
    title: 'Home Row Drill',
    icon: '⌨️',
    desc: 'Build finger muscle memory starting from the home row keys.',
    color: '#8a4010',
  },
];

export default function Home({ user, setScreen }) {
  const recentBadges = ALL_BADGES.filter(b => user?.badges?.includes(b.id)).slice(-4);

  return (
    <div style={{ padding: '40px 32px', position: 'relative', zIndex: 1 }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{
          fontFamily: 'Orbitron, sans-serif',
          fontSize: 'clamp(24px, 4vw, 38px)',
          fontWeight: 900,
          background: 'linear-gradient(135deg, #00b4d8, #90e0ef)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: 8,
        }}>
          Welcome back, {user?.username}!
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>
          Ready to dive in? Choose a mode below.
        </p>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 40, flexWrap: 'wrap' }}>
        {[
          { label: 'Best WPM', val: user?.bestWpm || 0 },
          { label: 'Best Acc', val: `${user?.bestAccuracy || 0}%` },
          { label: 'Sessions', val: user?.sessionsPlayed || 0 },
          { label: 'Badges', val: `${user?.badges?.length || 0}/12` },
        ].map(s => (
          <div key={s.label} className="stat-pill">
            <span className="val">{s.val}</span>
            <span className="label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Mode cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 20,
        marginBottom: 40,
      }}>
        {MODES.map(mode => (
          <button
            key={mode.id}
            onClick={() => setScreen(mode.id)}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14,
              padding: '28px 24px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              color: 'inherit',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.borderColor = '#00b4d8';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,180,216,0.2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0, right: 0,
              width: 80, height: 80,
              background: `radial-gradient(circle, ${mode.color}40 0%, transparent 70%)`,
              borderRadius: '0 14px 0 0',
            }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 32 }}>{mode.icon}</div>
              {mode.ranked && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'rgba(255,209,102,0.12)',
                  border: '1px solid rgba(255,209,102,0.35)',
                  borderRadius: 20,
                  padding: '3px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#ffd166',
                  letterSpacing: '0.04em',
                }}>
                  🏆 RANKED
                </div>
              )}
            </div>
            <div>
              <div style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: 16,
                fontWeight: 700,
                color: '#00b4d8',
                marginBottom: 6,
              }}>
                {mode.title}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                {mode.desc}
              </div>
            </div>
            <div style={{
              marginTop: 'auto',
              fontSize: 12,
              color: '#00b4d8',
              fontWeight: 600,
              letterSpacing: '0.05em',
            }}>
              PLAY →
            </div>
          </button>
        ))}
      </div>

      {/* Recent badges */}
      {recentBadges.length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 40,
        }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 14, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Recent Badges
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {recentBadges.map(b => (
              <div key={b.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,209,102,0.1)',
                border: '1px solid rgba(255,209,102,0.3)',
                borderRadius: 8,
                padding: '8px 14px',
              }}>
                <span style={{ fontSize: 18 }}>{b.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ffd166' }}>{b.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <footer style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13, paddingBottom: 20 }}>
        Built by Ryan Lynde
      </footer>
    </div>
  );
}
