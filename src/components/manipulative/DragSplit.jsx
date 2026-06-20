/**
 * 拖拽/点选拿走 — 减法的操作型交互
 */
import { useState, useCallback } from 'react'

export default function DragSplit({ question, onAnswer, disabled }) {
  const manipulative = question?.manipulative
  const totalItems = manipulative?.totalItems || []
  const takeCount = manipulative?.takeCount || 0
  const answer = manipulative?.answer

  const [taken, setTaken] = useState([])
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(null)

  const remaining = totalItems.length - taken.length
  const canTakeMore = taken.length < takeCount

  const handleTap = useCallback((idx) => {
    if (disabled || showResult || taken.includes(idx)) return
    if (taken.length >= takeCount) return
    setTaken(prev => [...prev, idx])
  }, [disabled, showResult, taken, takeCount])

  const handleUntake = useCallback((idx) => {
    if (disabled || showResult) return
    setTaken(prev => prev.filter(i => i !== idx))
  }, [disabled, showResult])

  const handleSubmit = useCallback(() => {
    const correct = remaining === answer
    setIsCorrect(correct)
    setShowResult(true)
    onAnswer?.(correct ? answer : remaining)
  }, [remaining, answer, onAnswer])

  if (manipulative?.mode !== 'drag_split') return null

  return (
    <div style={container}>
      <div style={sceneLabel}>
        👆 点 {takeCount} 个物品到「拿走了」，看看还剩几个
      </div>

      <div style={playArea}>
        <div style={zone}>
          <div style={zoneTitle}>剩下</div>
          <div style={itemsGrid}>
            {totalItems.map((emoji, idx) => {
              if (taken.includes(idx)) return null
              return (
                <button
                  key={idx}
                  type="button"
                  style={{
                    ...itemBtn,
                    cursor: disabled || showResult || !canTakeMore ? 'default' : 'pointer',
                    opacity: !canTakeMore ? 0.45 : 1,
                  }}
                  disabled={disabled || showResult || !canTakeMore}
                  onClick={() => handleTap(idx)}
                >
                  <span style={{ fontSize: totalItems.length > 8 ? '1.6rem' : '2rem' }}>{emoji}</span>
                </button>
              )
            })}
          </div>
          <div style={countBadge}>还剩 <strong>{remaining}</strong> 个</div>
        </div>

        <div style={arrow}>→</div>

        <div style={{ ...zone, background: '#FFF8F0', borderColor: '#FFB347' }}>
          <div style={zoneTitle}>拿走了</div>
          <div style={itemsGrid}>
            {taken.map((idx) => (
              <button
                key={idx}
                type="button"
                style={{ ...itemBtn, background: '#FFEBEE', borderColor: '#FF6B6B', cursor: disabled || showResult ? 'default' : 'pointer' }}
                disabled={disabled || showResult}
                onClick={() => handleUntake(idx)}
              >
                <span style={{ fontSize: '2rem' }}>{totalItems[idx]}</span>
              </button>
            ))}
          </div>
          <div style={countBadge}>{taken.length} / {takeCount} 个</div>
        </div>
      </div>

      {!showResult && (
        <button
          type="button"
          style={{
            ...submitBtn,
            opacity: taken.length === takeCount ? 1 : 0.35,
            cursor: taken.length === takeCount && !disabled ? 'pointer' : 'not-allowed',
          }}
          disabled={taken.length !== takeCount || disabled}
          onClick={handleSubmit}
        >
          拿完了，还剩 {remaining} 个
        </button>
      )}

      {showResult && (
        <div style={{
          ...resultBar,
          backgroundColor: isCorrect ? '#E8F5E9' : '#FFEBEE',
          borderColor: isCorrect ? '#4CAF50' : '#FF6B6B',
        }}>
          {isCorrect
            ? `✓ 对啦！拿走 ${takeCount} 个，还剩 ${answer} 个`
            : `✗ 不对哦，应该还剩 ${answer} 个`}
        </div>
      )}

      {taken.length === 0 && !showResult && (
        <div style={hint}>先点选要拿走的 {takeCount} 个物品</div>
      )}
    </div>
  )
}

const container = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  padding: '8px',
  maxWidth: '560px',
  margin: '0 auto',
}

const sceneLabel = {
  textAlign: 'center',
  fontSize: '1rem',
  color: '#636E72',
  fontWeight: 500,
}

const playArea = {
  display: 'flex',
  alignItems: 'stretch',
  gap: '8px',
}

const zone = {
  flex: 1,
  background: 'white',
  borderRadius: '16px',
  border: '2px solid #E8ECF0',
  padding: '12px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
}

const zoneTitle = {
  fontSize: '0.85rem',
  fontWeight: 700,
  color: '#B2BEC3',
  textAlign: 'center',
  marginBottom: '8px',
}

const itemsGrid = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  justifyContent: 'center',
  minHeight: '80px',
  alignContent: 'flex-start',
}

const itemBtn = {
  border: '2px solid #E8ECF0',
  borderRadius: '12px',
  padding: '6px',
  background: 'white',
  transition: 'all 0.15s ease',
  lineHeight: 1,
}

const countBadge = {
  textAlign: 'center',
  marginTop: '8px',
  fontSize: '0.9rem',
  color: '#636E72',
}

const arrow = {
  display: 'flex',
  alignItems: 'center',
  fontSize: '1.4rem',
  color: '#B2BEC3',
  flexShrink: 0,
}

const submitBtn = {
  background: 'linear-gradient(135deg, #FF6B6B, #FFB347)',
  color: 'white',
  border: 'none',
  padding: '14px 24px',
  borderRadius: '50px',
  fontSize: '1.05rem',
  fontWeight: 700,
  margin: '0 auto',
}

const resultBar = {
  padding: '12px 16px',
  borderRadius: '14px',
  border: '2px solid',
  textAlign: 'center',
  fontSize: '1.05rem',
  fontWeight: 600,
}

const hint = {
  textAlign: 'center',
  fontSize: '0.9rem',
  color: '#B2BEC3',
}
