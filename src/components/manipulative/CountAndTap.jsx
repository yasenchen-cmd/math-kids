/**
 * 点数交互 — 点击物品数数
 *
 * 孩子用手指点着物品一个个数
 * 每点一下物品变亮并计一个数
 */
import { useState, useCallback } from 'react'

export default function CountAndTap({ question, onAnswer, disabled }) {
  const { manipulative } = question
  if (!manipulative || manipulative.mode !== 'count') {
    return fallbackRender(question)
  }

  const { items, count: correctCount } = manipulative
  const [tapped, setTapped] = useState(new Set())
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(null)
  const [counting, setCounting] = useState(0)

  const handleTap = useCallback((idx) => {
    if (disabled || showResult || tapped.has(idx)) return
    const next = new Set(tapped)
    next.add(idx)
    setTapped(next)
    setCounting(next.size)
  }, [disabled, showResult, tapped])

  const handleSubmit = useCallback(() => {
    const correct = counting === correctCount
    setIsCorrect(correct)
    setShowResult(true)
    if (onAnswer) onAnswer(correct ? correctCount : counting)
  }, [counting, correctCount, onAnswer])

  const handleUntap = useCallback((idx) => {
    if (disabled || showResult) return
    const next = new Set(tapped)
    next.delete(idx)
    setTapped(next)
    setCounting(next.size)
  }, [disabled, showResult, tapped])

  return (
    <div style={container}>
      <div style={sceneLabel}>
        👆 用手指点着数一数
      </div>

      <div style={itemsGrid}>
        {items.map((emoji, idx) => {
          const isTapped = tapped.has(idx)
          return (
            <div
              key={idx}
              onClick={() => isTapped ? handleUntap(idx) : handleTap(idx)}
              style={{
                ...tapItem,
                transform: isTapped ? 'scale(1.15)' : 'scale(1)',
                opacity: showResult ? (isTapped ? 1 : 0.3) : 1,
                background: isTapped ? '#E3F2FD' : 'white',
                borderColor: isTapped ? '#4F8CF6' : '#E8ECF0',
                boxShadow: isTapped ? '0 4px 15px rgba(79,140,246,0.2)' : '0 2px 6px rgba(0,0,0,0.04)',
                cursor: disabled || showResult ? 'default' : 'pointer',
              }}
            >
              <span style={{fontSize: items.length > 10 ? '1.6rem' : '2.2rem'}}>{emoji}</span>
              {isTapped && <div style={tapOrderBadge}>{idx + 1}</div>}
            </div>
          )
        })}
      </div>

      {/* 计数显示 */}
      <div style={counterBar}>
        <span style={counterLabel}>已数：</span>
        <span style={counterNum}>{counting}</span>
        <span style={counterUnit}>个</span>
        {!showResult && (
          <button
            style={{
              ...submitBtn,
              opacity: counting > 0 ? 1 : 0.3,
              cursor: counting > 0 && !disabled ? 'pointer' : 'not-allowed',
            }}
            onClick={handleSubmit}
            disabled={counting === 0 || disabled}
          >
            数完了
          </button>
        )}
      </div>

      {showResult && (
        <div style={{
          ...resultBar,
          backgroundColor: isCorrect ? '#E8F5E9' : '#FFEBEE',
        }}>
          <span style={{fontSize:'1.2rem',fontWeight:600,color:isCorrect?'#2E7D32':'#C62828'}}>
            {isCorrect ? `✓ 对啦！一共${correctCount}个` : `✗ 不对哦，一共${correctCount}个，你数了${counting}个`}
          </span>
        </div>
      )}

      {counting === 0 && !showResult && (
        <div style={hintText}>👆 点一下物品就开始数吧！</div>
      )}
    </div>
  )
}

function fallbackRender(question) {
  const items = question.manipulative?.items || ['🍎','🍎','🍎']
  return (
    <div style={container}>
      <div style={itemsGrid}>
        {items.map((emoji, idx) => (
          <div key={idx} style={{...tapItem, cursor:'default', background:'white', borderColor:'#E8ECF0'}}>
            <span style={{fontSize:'2rem'}}>{emoji}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const container = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  padding: '16px',
  maxWidth: '500px',
  margin: '0 auto',
}

const sceneLabel = {
  textAlign: 'center',
  fontSize: '1.1rem',
  color: '#636E72',
}

const itemsGrid = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '10px',
  justifyContent: 'center',
  padding: '16px',
  background: 'white',
  borderRadius: '20px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  minHeight: '120px',
}

const tapItem = {
  position: 'relative',
  border: '2px solid',
  borderRadius: '14px',
  padding: '8px',
  transition: 'all 0.15s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '70px',
  height: '70px',
}

const tapOrderBadge = {
  position: 'absolute',
  top: '-6px',
  right: '-6px',
  background: '#4F8CF6',
  color: 'white',
  width: '22px',
  height: '22px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.75rem',
  fontWeight: 700,
}

const counterBar = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '12px',
  background: 'white',
  borderRadius: '50px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
}

const counterLabel = { fontSize: '1.1rem', color: '#636E72' }
const counterNum = { fontSize: '2rem', fontWeight: 800, color: '#4F8CF6' }
const counterUnit = { fontSize: '1.1rem', color: '#636E72' }

const submitBtn = {
  background: 'linear-gradient(135deg, #4F8CF6, #7AADFF)',
  color: 'white',
  border: 'none',
  padding: '8px 20px',
  borderRadius: '50px',
  fontSize: '1rem',
  fontWeight: 600,
  marginLeft: '12px',
}

const resultBar = {
  padding: '12px 20px',
  borderRadius: '16px',
  textAlign: 'center',
  border: '2px solid',
  borderColor: 'inherit',
}

const hintText = {
  textAlign: 'center',
  fontSize: '1rem',
  color: '#B2BEC3',
  animation: 'bounce 1s ease-in-out infinite',
}
