import { useMemo } from 'react';

const bubbleConfigs = [
  { size: 14, left: '5%',  delay: 0,    duration: 14 },
  { size: 22, left: '12%', delay: 2,    duration: 18 },
  { size: 10, left: '22%', delay: 5,    duration: 12 },
  { size: 30, left: '35%', delay: 1,    duration: 22 },
  { size: 18, left: '48%', delay: 7,    duration: 16 },
  { size: 12, left: '58%', delay: 3,    duration: 13 },
  { size: 26, left: '67%', delay: 9,    duration: 20 },
  { size: 8,  left: '75%', delay: 4,    duration: 11 },
  { size: 20, left: '82%', delay: 6,    duration: 17 },
  { size: 16, left: '90%', delay: 11,   duration: 15 },
  { size: 24, left: '93%', delay: 2.5,  duration: 19 },
  { size: 10, left: '28%', delay: 8,    duration: 12 },
];

export default function BubbleBackground() {
  return (
    <div className="bubble-container">
      {bubbleConfigs.map((b, i) => (
        <div
          key={i}
          className="bubble"
          style={{
            width: b.size,
            height: b.size,
            left: b.left,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
