const FINGER_COLORS = {
  pinky:        '#1255a0',
  ring:         '#0d6b4a',
  middle:       '#8a4010',
  index_inner:  '#6a2888',
  index_stretch:'#472878',
  thumb:        '#244a6a',
  number:       '#333a50',
  symbol:       '#2a2a40',
};

const KEY_MAP = {
  // Row 1 - numbers
  '`': 'symbol', '1': 'number', '2': 'number', '3': 'number', '4': 'number',
  '5': 'number', '6': 'number', '7': 'number', '8': 'number', '9': 'number',
  '0': 'number', '-': 'symbol', '=': 'symbol',
  // Row 2 - QWERTY
  'Q': 'pinky', 'W': 'ring', 'E': 'middle', 'R': 'index_inner', 'T': 'index_stretch',
  'Y': 'index_stretch', 'U': 'index_inner', 'I': 'middle', 'O': 'ring', 'P': 'pinky',
  '[': 'pinky', ']': 'pinky', '\\': 'pinky',
  // Row 3 - home row
  'A': 'pinky', 'S': 'ring', 'D': 'middle', 'F': 'index_inner', 'G': 'index_stretch',
  'H': 'index_stretch', 'J': 'index_inner', 'K': 'middle', 'L': 'ring', ';': 'pinky', "'": 'pinky',
  // Row 4 - bottom
  'Z': 'pinky', 'X': 'ring', 'C': 'middle', 'V': 'index_inner', 'B': 'index_stretch',
  'N': 'index_stretch', 'M': 'index_inner', ',': 'middle', '.': 'ring', '/': 'pinky',
  // Space
  'SPACE': 'thumb',
};

const HOME_ROW_KEYS = new Set(['A','S','D','F','J','K','L',';']);

const ROWS = [
  ['`','1','2','3','4','5','6','7','8','9','0','-','='],
  ['Q','W','E','R','T','Y','U','I','O','P','[',']','\\'],
  ['A','S','D','F','G','H','J','K','L',";","'"],
  ['Z','X','C','V','B','N','M',',','.','/'  ],
  ['SPACE'],
];

export default function KeyboardDiagram({ highlightKeys = [], activeKeys = [] }) {
  const highlightSet = new Set(highlightKeys.map(k => k.toUpperCase()));
  const activeSet = new Set(activeKeys.map(k => k.toUpperCase()));

  const getKeyStyle = (key) => {
    const fingerKey = KEY_MAP[key] || 'symbol';
    const colorMap = {
      pinky: FINGER_COLORS.pinky,
      ring: FINGER_COLORS.ring,
      middle: FINGER_COLORS.middle,
      index_inner: FINGER_COLORS.index_inner,
      index_stretch: FINGER_COLORS.index_stretch,
      thumb: FINGER_COLORS.thumb,
      number: FINGER_COLORS.number,
      symbol: FINGER_COLORS.symbol,
    };
    const bg = colorMap[fingerKey] || '#333';
    const isHighlighted = highlightSet.has(key);
    const isActive = activeSet.has(key);

    return {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      width: key === 'SPACE' ? 260 : 36,
      height: 36,
      margin: '2px',
      borderRadius: '5px',
      background: isActive ? '#00b4d8' : bg,
      border: isHighlighted
        ? '2px solid #00b4d8'
        : '1px solid rgba(255,255,255,0.2)',
      boxShadow: isHighlighted
        ? '0 0 10px rgba(0,180,216,0.6), inset 0 1px 0 rgba(255,255,255,0.15)'
        : 'inset 0 1px 0 rgba(255,255,255,0.1)',
      fontSize: '11px',
      fontFamily: "'Space Mono', monospace",
      fontWeight: 600,
      color: isActive ? '#04101e' : 'rgba(255,255,255,0.85)',
      cursor: 'default',
      transition: 'all 0.15s',
      flexShrink: 0,
    };
  };

  const rowOffsets = ['0px', '8px', '16px', '24px', '80px'];

  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
      padding: '16px 20px',
      display: 'inline-block',
    }}>
      {ROWS.map((row, ri) => (
        <div key={ri} style={{
          display: 'flex',
          marginLeft: rowOffsets[ri],
          marginBottom: 2,
        }}>
          {row.map((key) => (
            <div key={key} style={getKeyStyle(key)}>
              {key === 'SPACE' ? '' : key}
              {HOME_ROW_KEYS.has(key) && (
                <div style={{
                  position: 'absolute',
                  bottom: '4px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.7)',
                }} />
              )}
            </div>
          ))}
        </div>
      ))}
      <div style={{
        display: 'flex',
        gap: 16,
        marginTop: 12,
        flexWrap: 'wrap',
      }}>
        {[
          { label: 'Pinky', color: FINGER_COLORS.pinky },
          { label: 'Ring', color: FINGER_COLORS.ring },
          { label: 'Middle', color: FINGER_COLORS.middle },
          { label: 'Index', color: FINGER_COLORS.index_inner },
          { label: 'Stretch', color: FINGER_COLORS.index_stretch },
          { label: 'Thumb', color: FINGER_COLORS.thumb },
        ].map(({ label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: color, border: '1px solid rgba(255,255,255,0.2)' }} />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
