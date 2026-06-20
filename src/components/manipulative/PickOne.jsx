/**
 * 点选一项 — 分类找不同 / 规律选下一个
 */
import { useState, useCallback } from 'react'

const HINTS = {
  classification: '👆 点一点，哪个不一样？',
  pattern_next: '👆 看看规律，点一下下一个',
  pattern_number: '👆 看看规律，点一下问号应该是几',
}

function SequenceRow({ sequence }) {
  if (!sequence) return null
  return (
    <div style={seqWrap}>
      <div style={seqRow}>
        {sequence.numbers.map((n, i) => (
          <span
            key={i}
            style={{
              ...seqCell,
              opacity: i === sequence.missingIndex ? 0.45 : 1,
              borderColor: i === sequence.missingIndex ? '#FFB347' : '#E8ECF0',
            }}
          >
            {i === sequence.missingIndex ? '?' : n}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function PickOne({ question, onAnswer, disabled }) {
  const manipulative = question?.manipulative
  if (manipulative?.mode !== 'pick_one') return null

  const { variant, options, answer, sequence, hint, style } = manipulative
  const isEmoji = style === 'emoji'
  const [picked, setPicked] = useState(null)
  const [showResult, setShowResult] = useState(false)

  const handlePick = useCallback((opt) => {
    if (disabled || showResult) return
    setPicked(opt)
    setShowResult(true)
    onAnswer?.(opt)
  }, [disabled, showResult, onAnswer])

  const sceneHint = hint || HINTS[variant] || HINTS.classification
  const isCorrect = picked === answer

  return (
    <div style={container}>
      <div style={sceneLabel}>{sceneHint}</div>
      <SequenceRow sequence={sequence} />

      <div style={{
        ...grid,
        gridTemplateColumns: options.length <= 2 ? '1fr 1fr' : '1fr 1fr',
      }}>
        {options.map((opt, idx) => {
          let bg = 'white'
          let border = '2px solid #E8ECF0'
          if (showResult) {
            if (opt === answer) { bg = '#E8F5E9'; border = '2px solid #4CAF50' }
            else if (opt === picked) { bg = '#FFEBEE'; border = '2px solid #FF6B6B' }
            else { bg = '#F5F5F5'; border = '2px solid #E8ECF0' }
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={disabled || showResult}
              onClick={() => handlePick(opt)}
              style={{
                ...optionBtn,
                fontSize: isEmoji ? '2.8rem' : '1.4rem',
                minHeight: isEmoji ? '100px' : '72px',
                background: bg,
                border,
                transform: showResult && opt === answer ? 'scale(1.04)' : 'scale(1)',
              }}
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
          color: isCorrect ? '#2E7D32' : '#C62828',
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
  maxWidth: '480px',
  margin: '0 auto',
}

const sceneLabel = {
  textAlign: 'center',
  fontSize: '1rem',
  color: '#636E72',
  fontWeight: 500,
}

const seqWrap = {
  background: 'white',
  borderRadius: '16px',
  padding: '14px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
}

const seqRow = {
  display: 'flex',
  gap: '8px',
  justifyContent: 'center',
  flexWrap: 'wrap',
}

const seqCell = {
  minWidth: '40px',
  padding: '8px 12px',
  borderRadius: '12px',
  border: '2px solid',
  fontSize: '1.3rem',
  fontWeight: 700,
  background: '#FAFAFA',
}

const grid = {
  display: 'grid',
  gap: '12px',
}

const optionBtn = {
  borderRadius: '18px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px',
}

const resultBar = {
  padding: '12px',
  borderRadius: '14px',
  textAlign: 'center',
  fontWeight: 600,
  border: '2px solid',
}
