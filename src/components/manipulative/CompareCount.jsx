/**
 * 比较多少 — 两边分别点数，再选哪边更多
 */
import { useState, useCallback } from 'react'

function Pile({ side, tapped, onTap, disabled, showResult }) {
  const { label, items } = side
  const count = tapped.size

  return (
    <div style={pileWrap}>
      <div style={pileLabel}>{label}</div>
      <div style={pileGrid}>
        {items.map((emoji, idx) => {
          const isTapped = tapped.has(idx)
          return (
            <button
              key={idx}
              type="button"
              disabled={disabled || showResult}
              onClick={() => onTap(idx)}
              style={{
                ...tapItem,
                background: isTapped ? '#E3F2FD' : 'white',
                borderColor: isTapped ? '#4F8CF6' : '#E8ECF0',
                transform: isTapped ? 'scale(1.08)' : 'scale(1)',
                opacity: showResult && !isTapped ? 0.35 : 1,
              }}
            >
              <span style={{ fontSize: items.length > 8 ? '1.4rem' : '1.8rem' }}>{emoji}</span>
              {isTapped && <span style={orderBadge}>{count}</span>}
            </button>
          )
        })}
      </div>
      <div style={countBadge}>已数 {count} 个</div>
    </div>
  )
}

export default function CompareCount({ question, onAnswer, disabled }) {
  const manipulative = question?.manipulative
  if (manipulative?.mode !== 'compare_count') return null

  const { left, right, answer, options } = manipulative
  const [leftTapped, setLeftTapped] = useState(new Set())
  const [rightTapped, setRightTapped] = useState(new Set())
  const [picked, setPicked] = useState(null)
  const [showResult, setShowResult] = useState(false)

  const toggleTap = useCallback((side, idx) => {
    if (disabled || showResult) return
    const setter = side === 'left' ? setLeftTapped : setRightTapped
    const current = side === 'left' ? leftTapped : rightTapped
    const next = new Set(current)
    if (next.has(idx)) next.delete(idx)
    else next.add(idx)
    setter(next)
  }, [disabled, showResult, leftTapped, rightTapped])

  const handlePick = useCallback((opt) => {
    if (disabled || showResult) return
    setPicked(opt)
    setShowResult(true)
    onAnswer?.(opt)
  }, [disabled, showResult, onAnswer])

  const isCorrect = picked === answer

  return (
    <div style={container}>
      <div style={sceneLabel}>👆 先分别数一数 A 和 B，再选哪边更多</div>

      <div style={compareRow}>
        <Pile
          side={left}
          tapped={leftTapped}
          onTap={(idx) => toggleTap('left', idx)}
          disabled={disabled}
          showResult={showResult}
        />
        <div style={vs}>VS</div>
        <Pile
          side={right}
          tapped={rightTapped}
          onTap={(idx) => toggleTap('right', idx)}
          disabled={disabled}
          showResult={showResult}
        />
      </div>

      <div style={choiceRow}>
        {options.map(opt => {
          let bg = 'white'
          let border = '2px solid #E8ECF0'
          if (showResult) {
            if (opt === answer) { bg = '#E8F5E9'; border = '2px solid #4CAF50' }
            else if (opt === picked) { bg = '#FFEBEE'; border = '2px solid #FF6B6B' }
          }
          return (
            <button
              key={opt}
              type="button"
              disabled={disabled || showResult}
              onClick={() => handlePick(opt)}
              style={{ ...choiceBtn, background: bg, border }}
            >
              {opt}
            </button>
          )
        })}
      </div>

      {showResult && (
        <div style={{
          ...resultBar,
          background: isCorrect ? '#E8F5E9' : '#FFEBEE',
          borderColor: isCorrect ? '#4CAF50' : '#FF6B6B',
        }}>
          {isCorrect ? '✓ 对啦！' : `✗ 答案是 ${answer}`}
        </div>
      )}
    </div>
  )
}

const container = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  padding: '8px 0',
  maxWidth: '520px',
  margin: '0 auto',
}

const sceneLabel = {
  textAlign: 'center',
  fontSize: '1rem',
  color: '#636E72',
}

const compareRow = {
  display: 'flex',
  alignItems: 'stretch',
  gap: '8px',
}

const pileWrap = {
  flex: 1,
  background: 'white',
  borderRadius: '16px',
  padding: '10px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
}

const pileLabel = {
  textAlign: 'center',
  fontWeight: 700,
  color: '#B2BEC3',
  marginBottom: '6px',
}

const pileGrid = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  justifyContent: 'center',
  minHeight: '88px',
}

const tapItem = {
  position: 'relative',
  width: '52px',
  height: '52px',
  border: '2px solid',
  borderRadius: '12px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s ease',
}

const orderBadge = {
  position: 'absolute',
  top: '-5px',
  right: '-5px',
  background: '#4F8CF6',
  color: 'white',
  width: '18px',
  height: '18px',
  borderRadius: '50%',
  fontSize: '0.65rem',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const countBadge = {
  marginTop: '8px',
  textAlign: 'center',
  fontSize: '0.85rem',
  color: '#4F8CF6',
  fontWeight: 600,
}

const vs = {
  alignSelf: 'center',
  fontWeight: 800,
  color: '#FFB347',
  fontSize: '0.95rem',
}

const choiceRow = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '8px',
}

const choiceBtn = {
  padding: '14px',
  borderRadius: '14px',
  fontSize: '1.05rem',
  fontWeight: 600,
  cursor: 'pointer',
}

const resultBar = {
  padding: '12px',
  borderRadius: '14px',
  textAlign: 'center',
  fontWeight: 600,
  border: '2px solid',
}
