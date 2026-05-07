import { useState, useEffect } from 'react';

export default function Leaderboard({ user, setScreen }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(data => {
        setRows(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load leaderboard. Is the server running?');
        setLoading(false);
      });
  }, []);

  const filtered = rows.filter(r =>
    !filter || r.username.toLowerCase().includes(filter.toLowerCase())
  );

  const levelClass = (level) => {
    const l = (level || '').toLowerCase();
    if (l === 'beginner') return 'level-beginner';
    if (l === 'intermediate') return 'level-intermediate';
    return 'level-advanced';
  };

  return (
    <div style={{ padding: '40px 32px', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button className="btn btn-secondary" onClick={() => setScreen('home')} style={{ fontSize: 13 }}>
          ← Back
        </button>
        <div>
          <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 26, fontWeight: 700, color: '#00b4d8', marginBottom: 4 }}>
            Leaderboard
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Top 200 typists by WPM</p>
        </div>
      </div>

      <div style={{ maxWidth: 760 }}>
        <input
          className="input-base"
          placeholder="Search by username..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ marginBottom: 20 }}
        />

        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>
            Loading leaderboard...
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(255,107,107,0.1)',
            border: '1px solid rgba(255,107,107,0.3)',
            borderRadius: 10,
            padding: 20,
            color: '#ff6b6b',
            fontSize: 14,
          }}>
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>
            {filter ? 'No users match your search.' : 'No scores yet. Play a game to get on the board!'}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '50px 1fr 90px 90px 120px 120px',
              padding: '12px 20px',
              background: 'rgba(0,180,216,0.08)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              fontSize: 12,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              <div>#</div>
              <div>Username</div>
              <div style={{ textAlign: 'right' }}>WPM</div>
              <div style={{ textAlign: 'right' }}>Acc</div>
              <div>Level</div>
              <div>Date</div>
            </div>

            {/* Rows */}
            {filtered.map((row, i) => {
              const isCurrentUser = row.username === user?.username;
              const rank = rows.indexOf(row) + 1;
              const medalColor = rank === 1 ? '#ffd166' : rank === 2 ? '#c0c0c0' : rank === 3 ? '#cd7f32' : null;
              const date = row.date ? new Date(row.date).toLocaleDateString() : '—';

              return (
                <div
                  key={row.username}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '50px 1fr 90px 90px 120px 120px',
                    padding: '13px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: isCurrentUser
                      ? 'rgba(0,180,216,0.1)'
                      : 'transparent',
                    borderLeft: isCurrentUser ? '3px solid #00b4d8' : '3px solid transparent',
                    transition: 'background 0.1s',
                    alignItems: 'center',
                    fontSize: 14,
                  }}
                >
                  <div style={{
                    fontFamily: 'Space Mono, monospace',
                    fontWeight: 700,
                    color: medalColor || 'rgba(255,255,255,0.4)',
                    fontSize: 13,
                  }}>
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                  </div>
                  <div style={{
                    fontWeight: isCurrentUser ? 700 : 400,
                    color: isCurrentUser ? '#00b4d8' : 'rgba(255,255,255,0.85)',
                  }}>
                    {row.username}
                    {isCurrentUser && (
                      <span style={{ marginLeft: 8, fontSize: 11, color: '#00b4d8', opacity: 0.7 }}>(you)</span>
                    )}
                  </div>
                  <div style={{
                    textAlign: 'right',
                    fontFamily: 'Space Mono, monospace',
                    fontWeight: 700,
                    color: '#00b4d8',
                  }}>
                    {Math.round(row.wpm)}
                  </div>
                  <div style={{
                    textAlign: 'right',
                    fontFamily: 'Space Mono, monospace',
                    color: row.accuracy >= 95 ? '#52d68a' : 'rgba(255,255,255,0.6)',
                  }}>
                    {Math.round(row.accuracy)}%
                  </div>
                  <div>
                    <span className={`level-pill ${levelClass(row.level)}`}>
                      {row.level}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{date}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
