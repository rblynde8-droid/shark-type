import { ALL_BADGES } from '../userStore';

export default function BadgeGrid({ earnedBadges = [] }) {
  const earnedSet = new Set(earnedBadges);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: 12,
    }}>
      {ALL_BADGES.map((badge) => {
        const earned = earnedSet.has(badge.id);
        return (
          <div
            key={badge.id}
            style={{
              background: earned
                ? 'rgba(255,209,102,0.08)'
                : 'rgba(255,255,255,0.03)',
              border: `1px solid ${earned ? 'rgba(255,209,102,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 10,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              transition: 'all 0.2s',
              opacity: earned ? 1 : 0.5,
            }}
          >
            <div style={{
              fontSize: '28px',
              filter: earned ? 'none' : 'grayscale(1)',
              minWidth: 36,
              textAlign: 'center',
            }}>
              {badge.icon}
            </div>
            <div>
              <div style={{
                fontSize: '13px',
                fontWeight: 700,
                color: earned ? '#ffd166' : 'rgba(255,255,255,0.5)',
                marginBottom: 3,
              }}>
                {badge.name}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                {badge.desc}
              </div>
            </div>
            {earned && (
              <div style={{ marginLeft: 'auto', fontSize: '16px' }}>✓</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
