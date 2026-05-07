export default function Navbar({ user, screen, setScreen }) {
  const levelClass = user?.level
    ? `level-pill level-${user.level.toLowerCase()}`
    : 'level-pill level-beginner';

  return (
    <nav style={{
      position: 'relative',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 32px',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      background: 'rgba(4,16,30,0.85)',
      backdropFilter: 'blur(12px)',
    }}>
      <button
        onClick={() => setScreen('home')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <span style={{
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '22px',
          fontWeight: 900,
          background: 'linear-gradient(135deg, #00b4d8, #90e0ef)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '0.05em',
        }}>
          SHARKTYPE
        </span>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <nav style={{ display: 'flex', gap: 4 }}>
          {[
            { id: 'home', label: 'Home' },
            { id: 'leaderboard', label: 'Leaderboard' },
            { id: 'profile', label: 'Profile' },
          ].map(item => (
            <button
              key={item.id}
              className="btn btn-secondary"
              onClick={() => setScreen(item.id)}
              style={{
                padding: '6px 14px',
                fontSize: '13px',
                background: screen === item.id ? 'rgba(0,180,216,0.15)' : 'transparent',
                borderColor: screen === item.id ? '#00b4d8' : 'transparent',
                color: screen === item.id ? '#00b4d8' : 'rgba(255,255,255,0.6)',
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{user?.username}</span>
          <span className={levelClass}>{user?.level}</span>
        </div>
      </div>
    </nav>
  );
}
