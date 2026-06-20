/**
 * 题目情境视觉 — 在选项上方展示图意，弥补纯文字/纯选项的不足
 */

const focusRing = {
  boxShadow: '0 0 0 3px rgba(255, 179, 71, 0.55)',
  animation: 'pulseHint 1.2s ease-in-out infinite',
}

function pileStyle(side, visualFocus) {
  if (!visualFocus?.focusSide) return {}
  const { focusSide } = visualFocus
  if (focusSide === 'both') return focusRing
  if (focusSide === side) return focusRing
  return {}
}

export default function QuestionVisual({ visual, visualFocus }) {
  if (!visual) return null

  switch (visual.type) {
    case 'emoji_grid':
      return (
        <div style={{ ...wrap, ...(visualFocus?.focusVisual ? focusRing : {}) }}>
          <div style={grid}>
            {visual.items.map((emoji, i) => (
              <span key={i} style={cell}>{emoji}</span>
            ))}
          </div>
        </div>
      )

    case 'groups':
      return (
        <div style={wrap}>
          {visual.rows.map((row, gi) => (
            <div key={gi} style={groupRow}>
              {row.map((emoji, i) => (
                <span key={i} style={cellSm}>{emoji}</span>
              ))}
            </div>
          ))}
          <div style={caption}>每组 {visual.perGroup} 个，共 {visual.groups} 组</div>
        </div>
      )

    case 'compare':
      return (
        <div style={compareWrap}>
          <div style={{ ...pile, ...pileStyle('A', visualFocus), borderRadius: '14px', padding: '8px' }}>
            <div style={pileLabel}>A</div>
            <div style={grid}>
              {Array.from({ length: visual.left.count }, (_, i) => (
                <span key={i} style={cellSm}>{visual.left.emoji}</span>
              ))}
            </div>
          </div>
          <div style={vs}>VS</div>
          <div style={{ ...pile, ...pileStyle('B', visualFocus), borderRadius: '14px', padding: '8px' }}>
            <div style={pileLabel}>B</div>
            <div style={grid}>
              {Array.from({ length: visual.right.count }, (_, i) => (
                <span key={i} style={cellSm}>{visual.right.emoji}</span>
              ))}
            </div>
          </div>
        </div>
      )

    case 'sequence':
      return (
        <div style={wrap}>
          <div style={seqRow}>
            {visual.numbers.map((n, i) => {
              const isMissing = i === visual.missingIndex
              const pulseMissing = visualFocus?.focusMissing && isMissing
              return (
                <span key={i} style={{
                  ...seqNum,
                  opacity: isMissing && !pulseMissing ? 0.35 : 1,
                  borderColor: isMissing || pulseMissing ? '#FFB347' : '#E8ECF0',
                  ...(pulseMissing ? focusRing : {}),
                }}>
                  {isMissing ? '?' : n}
                </span>
              )
            })}
          </div>
        </div>
      )

    case 'clock':
      return (
        <div style={wrap}>
          <div style={clockFace}>{visual.emoji}</div>
          {visual.hint && <div style={caption}>{visual.hint}</div>}
        </div>
      )

    case 'place_value':
      return (
        <div style={wrap}>
          <div style={blocksRow}>
            {Array.from({ length: visual.tens }, (_, i) => (
              <span key={`t${i}`} style={tenBlock}>10</span>
            ))}
            {Array.from({ length: visual.ones }, (_, i) => (
              <span key={`o${i}`} style={oneBlock}>1</span>
            ))}
          </div>
          <div style={caption}>{visual.tens} 个十 + {visual.ones} 个一</div>
        </div>
      )

    case 'coins':
      return (
        <div style={wrap}>
          <div style={grid}>
            {visual.items.map((item, i) => (
              <span key={i} style={coinCell}>{item}</span>
            ))}
          </div>
        </div>
      )

    case 'shape_show':
      return (
        <div style={wrap}>
          <div style={{ ...shapeHero, ...(visualFocus?.focusShape ? focusRing : {}), borderRadius: '16px', display: 'inline-block', padding: '8px' }}>
            {visual.emoji}
          </div>
          {visual.label && !visualFocus?.focusShape && <div style={caption}>{visual.label}</div>}
        </div>
      )

    case 'scene':
      return (
        <div style={{ ...wrap, ...(visualFocus?.focusScene || visualFocus?.focusVisual ? focusRing : {}) }}>
          <div style={sceneText}>{visual.text}</div>
        </div>
      )

    default:
      return null
  }
}

const wrap = {
  background: 'white',
  borderRadius: '20px',
  padding: '16px',
  marginBottom: '12px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  textAlign: 'center',
}

const grid = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  justifyContent: 'center',
}

const cell = { fontSize: '2rem', lineHeight: 1 }
const cellSm = { fontSize: '1.6rem', lineHeight: 1 }

const groupRow = {
  display: 'flex',
  gap: '6px',
  justifyContent: 'center',
  marginBottom: '8px',
  padding: '8px 12px',
  background: '#F8FAFC',
  borderRadius: '12px',
}

const caption = {
  marginTop: '8px',
  fontSize: '0.9rem',
  color: '#636E72',
}

const compareWrap = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  background: 'white',
  borderRadius: '20px',
  padding: '16px',
  marginBottom: '12px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
}

const pile = { flex: 1, textAlign: 'center' }
const pileLabel = { fontSize: '0.85rem', fontWeight: 700, color: '#B2BEC3', marginBottom: '6px' }
const vs = { fontSize: '1rem', fontWeight: 800, color: '#FFB347' }

const seqRow = { display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }
const seqNum = {
  minWidth: '44px',
  padding: '10px 14px',
  borderRadius: '12px',
  border: '2px solid',
  fontSize: '1.4rem',
  fontWeight: 700,
  color: '#2D3436',
  background: '#FAFAFA',
}

const clockFace = { fontSize: '4.5rem', lineHeight: 1 }

const blocksRow = { display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }
const tenBlock = {
  background: '#4F8CF6', color: 'white', padding: '12px 16px',
  borderRadius: '10px', fontWeight: 700, fontSize: '1rem',
}
const oneBlock = {
  background: '#FFB347', color: 'white', padding: '8px 12px',
  borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem',
}

const coinCell = { fontSize: '1.8rem', padding: '4px 8px' }
const shapeHero = { fontSize: '4rem', lineHeight: 1 }
const sceneText = { fontSize: '1.5rem', lineHeight: 1.6, fontWeight: 600, color: '#2D3436' }
