/**
 * 分数份数 — 点选若干等份，体会「几分之几」
 */
import { useState, useCallback } from 'react'

export default function FractionParts({ question, onAnswer, disabled }) {
  const manipulative = question?.manipulative
  if (manipulative?.mode !== 'fraction_parts') return null

  const {
    emoji = '🍕',
    totalParts = 2,
    takeParts = 1,
    answer,
  } = manipulative

  const [selected, setSelected] = useState(() => new Set())
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(null)

  const handleToggle = useCallback((idx) => {
    if (disabled || showResult) return
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else if (next.size < takeParts) next.add(idx)
      return next
    })
  }, [disabled, showResult, takeParts])

  const handleSubmit = useCallback(() => {
    if (disabled || showResult) return
    const correct = selected.size === takeParts
    setIsCorrect(correct)
    setShowResult(true)
    onAnswer?.(correct ? answer : `选了${selected.size}份`)
  }, [disabled, showResult, selected, takeParts, answer, onAnswer])

  return (
    <div style={container} role="region" aria-label="分数份数练习">
      <div style={sceneLabel} id="fraction-hint">
        👆 一共 {totalParts} 份，点选 {takeParts} 份
      </div>

      <div
        style={partsRow}
        role="group"
        aria-labelledby="fraction-hint"
      >
        {Array.from({ length: totalParts }, (_, idx) => {
          const on = selected.has(idx)
          return (
            <button
              key={idx}
              type="button"
              disabled={disabled || showResult}
              aria-pressed={on}
              aria-label={`第 ${idx + 1} 份${on ? '，已选中' : ''}`}
              onClick={() => handleToggle(idx)}
              style={{
                ...partBtn,
                background: on ? '#FFF3E0' : 'white',
                borderColor: on ? '#FFB347' : '#E8ECF0',
                transform: on ? 'scale(1.06)' : 'scale(1)',
                opacity: showResult && !on ? 0.4 : 1,
              }}
            >
              <span style={{ fontSize: '2rem' }} aria-hidden="true">{emoji}</span>
            </button>
          )
        })}
      </div>

      <div style={counter} role="status" aria-live="polite">
        已选 <strong style={{ color: '#FFB347' }}>{selected.size}</strong> / {takeParts} 份
      </div>

      {!showResult && (
        <button
          type="button"
          style={{
            ...submitBtn,
            opacity: selected.size === takeParts ? 1 : 0.35,
            cursor: selected.size === takeParts && !disabled ? 'pointer' : 'not-allowed',
          }}
          disabled={selected.size !== takeParts || disabled}
          aria-label={`确认选了 ${selected.size} 份`}
          onClick={handleSubmit}
        >
          选好了
        </button>
      )}

      {showResult && (
        <div
          role="status"
          aria-live="assertive"
          style={{
            ...resultBar,
            backgroundColor: isCorrect ? '#E8F5E9' : '#FFEBEE',
            borderColor: isCorrect ? '#4CAF50' : '#FF6B6B',
            color: isCorrect ? '#2E7D32' : '#C62828',
          }}
        >
          {isCorrect ? `✓ 对啦！这是「${answer}」` : `✗ 应该选 ${takeParts} 份，是「${answer}」`}
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
  maxWidth: '480px',
  margin: '0 auto',
}

const sceneLabel = {
  textAlign: 'center',
  fontSize: '1rem',
  color: '#636E72',
  fontWeight: 500,
}

const partsRow = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '10px',
  justifyContent: 'center',
  background: 'white',
  borderRadius: '16px',
  padding: '16px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
}

const partBtn = {
  width: '72px',
  height: '72px',
  borderRadius: '16px',
  border: '3px solid',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s ease',
}

const counter = {
  textAlign: 'center',
  fontSize: '1rem',
  color: '#636E72',
}

const submitBtn = {
  background: 'linear-gradient(135deg, #FFB347, #FF8A65)',
  color: 'white',
  border: 'none',
  padding: '14px 24px',
  borderRadius: '50px',
  fontSize: '1.05rem',
  fontWeight: 700,
  margin: '0 auto',
}

const resultBar = {
  padding: '12px',
  borderRadius: '14px',
  textAlign: 'center',
  fontWeight: 600,
  border: '2px solid',
}
