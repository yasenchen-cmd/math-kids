/**
 * 填数组 — 乘法交互
 *
 * 按行填格子，每行 perGroup 个，体会「几组每组几个」
 */
import { useState, useCallback, useMemo } from 'react'

export default function FillArray({ question, onAnswer, disabled }) {
  const manipulative = question?.manipulative
  const rows = manipulative?.rows || 2
  const perGroup = manipulative?.perGroup || 2
  const emoji = manipulative?.emoji || '🟦'
  const answer = manipulative?.answer

  const [grid, setGrid] = useState(() =>
    Array.from({ length: rows }, () => Array(perGroup).fill(false))
  )
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(null)

  const totalFilled = useMemo(
    () => grid.reduce((sum, row) => sum + row.filter(Boolean).length, 0),
    [grid]
  )
  const allFilled = totalFilled === rows * perGroup

  const handleToggle = useCallback((ri, ci) => {
    if (disabled || showResult) return
    setGrid(prev => {
      const next = prev.map(r => [...r])
      next[ri][ci] = !next[ri][ci]
      return next
    })
  }, [disabled, showResult])

  const handleSubmit = useCallback(() => {
    const correct = totalFilled === answer
    setIsCorrect(correct)
    setShowResult(true)
    onAnswer?.(correct ? answer : totalFilled)
  }, [totalFilled, answer, onAnswer])

  if (manipulative?.mode !== 'fill_array') return null

  return (
    <div style={container}>
      <div style={sceneLabel}>
        👆 每行填 {perGroup} 个，一共 {rows} 行
      </div>

      <div style={gridWrap}>
        {grid.map((row, ri) => (
          <div key={ri} style={rowWrap}>
            <span style={rowLabel}>第 {ri + 1} 行</span>
            <div style={rowCells}>
              {row.map((filled, ci) => (
                <button
                  key={ci}
                  type="button"
                  style={{
                    ...cell,
                    background: filled ? '#E3F2FD' : 'white',
                    borderColor: filled ? '#4F8CF6' : '#E8ECF0',
                    transform: filled ? 'scale(1.05)' : 'scale(1)',
                  }}
                  disabled={disabled || showResult}
                  onClick={() => handleToggle(ri, ci)}
                >
                  <span style={{ fontSize: filled ? '1.6rem' : '1.2rem', opacity: filled ? 1 : 0.25 }}>
                    {filled ? emoji : '＋'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={counter}>
        已填 <strong style={{ color: '#4F8CF6', fontSize: '1.4rem' }}>{totalFilled}</strong> / {answer} 个
      </div>

      {!showResult && (
        <button
          type="button"
          style={{
            ...submitBtn,
            opacity: allFilled ? 1 : 0.35,
            cursor: allFilled && !disabled ? 'pointer' : 'not-allowed',
          }}
          disabled={!allFilled || disabled}
          onClick={handleSubmit}
        >
          填满了，一共 {totalFilled} 个
        </button>
      )}

      {showResult && (
        <div style={{
          ...resultBar,
          backgroundColor: isCorrect ? '#E8F5E9' : '#FFEBEE',
          borderColor: isCorrect ? '#4CAF50' : '#FF6B6B',
        }}>
          {isCorrect
            ? `✓ 对啦！${rows} × ${perGroup} = ${answer}`
            : `✗ 应该是 ${answer} 个（${rows} × ${perGroup}）`}
        </div>
      )}
    </div>
  )
}

const container = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  padding: '8px',
  maxWidth: '480px',
  margin: '0 auto',
}

const sceneLabel = {
  textAlign: 'center',
  fontSize: '1rem',
  color: '#636E72',
  fontWeight: 500,
}

const gridWrap = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  background: 'white',
  borderRadius: '16px',
  padding: '14px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
}

const rowWrap = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
}

const rowLabel = {
  fontSize: '0.75rem',
  fontWeight: 700,
  color: '#B2BEC3',
  minWidth: '48px',
}

const rowCells = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
  flex: 1,
}

const cell = {
  width: '52px',
  height: '52px',
  border: '2px solid',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
}

const counter = {
  textAlign: 'center',
  fontSize: '1rem',
  color: '#636E72',
}

const submitBtn = {
  background: 'linear-gradient(135deg, #4F8CF6, #A66CFF)',
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
