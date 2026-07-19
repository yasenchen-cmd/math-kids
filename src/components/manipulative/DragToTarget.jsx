/**
 * 拖到目标区 — 凑十 / 十格板
 * 把珠子拖进 2×5 十格，填满后提交
 */

import { useState, useRef, useCallback, useEffect } from 'react'

export default function DragToTarget({ question, onAnswer, disabled }) {
  const manip = question?.manipulative
  if (!manip || manip.mode !== 'drag_to_target') {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>暂不支持此题型</div>
  }

  const { items = [], slots = 10, targetLabel = '凑成 10', answer } = manip
  const [filled, setFilled] = useState(() => Array(slots).fill(null))
  const [poolLeft, setPoolLeft] = useState(() => items.map((emoji, i) => ({ id: i, emoji })))
  const [dragging, setDragging] = useState(null)
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 })
  const [submitted, setSubmitted] = useState(false)
  const frameRef = useRef(null)

  useEffect(() => {
    setFilled(Array(slots).fill(null))
    setPoolLeft(items.map((emoji, i) => ({ id: i, emoji })))
    setSubmitted(false)
  }, [question, slots, items])

  const filledCount = filled.filter(Boolean).length

  const handlePointerDown = useCallback((item, e) => {
    if (disabled || submitted) return
    e.preventDefault()
    e.target.setPointerCapture?.(e.pointerId)
    setDragging(item)
    setDragPos({ x: e.clientX, y: e.clientY })
  }, [disabled, submitted])

  const handlePointerMove = useCallback((e) => {
    if (!dragging) return
    e.preventDefault()
    setDragPos({ x: e.clientX, y: e.clientY })
  }, [dragging])

  const handlePointerUp = useCallback((e) => {
    if (!dragging) return
    e.preventDefault()
    const rect = frameRef.current?.getBoundingClientRect()
    const inside = rect && (
      e.clientX >= rect.left && e.clientX <= rect.right &&
      e.clientY >= rect.top && e.clientY <= rect.bottom
    )
    if (inside) {
      const emptyIdx = filled.findIndex(s => !s)
      if (emptyIdx >= 0) {
        setFilled(prev => {
          const next = [...prev]
          next[emptyIdx] = dragging.emoji
          return next
        })
        setPoolLeft(prev => prev.filter(p => p.id !== dragging.id))
      }
    }
    setDragging(null)
  }, [dragging, filled])

  const handleSubmit = () => {
    if (disabled || submitted) return
    setSubmitted(true)
    const ok = filledCount === answer
    onAnswer?.(ok ? answer : filledCount)
  }

  const handleReset = () => {
    if (disabled || submitted) return
    setFilled(Array(slots).fill(null))
    setPoolLeft(items.map((emoji, i) => ({ id: i, emoji })))
  }

  return (
    <div
      style={container}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => setDragging(null)}
    >
      <div style={label}>{targetLabel} · 已放 {filledCount}/{slots}</div>

      <div ref={frameRef} style={tenFrame} aria-label="十格板">
        {filled.map((emoji, i) => (
          <div key={i} style={slot}>
            {emoji ? <span style={{ fontSize: '1.6rem' }}>{emoji}</span> : <span style={slotNum}>{i + 1}</span>}
          </div>
        ))}
      </div>

      <div style={poolLabel}>拖动珠子进格子</div>
      <div style={pool}>
        {poolLeft.map((item) => (
          <div
            key={item.id}
            role="button"
            tabIndex={0}
            aria-label={`拖动 ${item.emoji}`}
            onPointerDown={(e) => handlePointerDown(item, e)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                const emptyIdx = filled.findIndex(s => !s)
                if (emptyIdx < 0 || disabled || submitted) return
                setFilled(prev => {
                  const next = [...prev]
                  next[emptyIdx] = item.emoji
                  return next
                })
                setPoolLeft(prev => prev.filter(p => p.id !== item.id))
              }
            }}
            style={{
              ...poolItem,
              opacity: dragging?.id === item.id ? 0.35 : 1,
              touchAction: 'none',
            }}
          >
            <span style={{ fontSize: '1.8rem' }}>{item.emoji}</span>
          </div>
        ))}
        {poolLeft.length === 0 && <div style={{ color: '#B2BEC3', fontSize: '0.85rem' }}>珠子都放进去啦</div>}
      </div>

      {dragging && (
        <div style={{
          position: 'fixed',
          left: dragPos.x - 24,
          top: dragPos.y - 24,
          fontSize: '2rem',
          pointerEvents: 'none',
          zIndex: 50,
        }}>
          {dragging.emoji}
        </div>
      )}

      <div style={actions}>
        <button type="button" style={resetBtn} disabled={disabled || submitted} onClick={handleReset}>
          重来
        </button>
        <button
          type="button"
          style={{ ...submitBtn, opacity: filledCount === 0 ? 0.5 : 1 }}
          disabled={disabled || submitted || filledCount === 0}
          onClick={handleSubmit}
        >
          好了 ✓
        </button>
      </div>
    </div>
  )
}

const container = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '8px 0' }
const label = { fontSize: '1rem', fontWeight: 600, color: '#2D3436' }
const tenFrame = {
  display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px',
  background: '#E3F2FD', border: '3px solid #4F8CF6', borderRadius: '16px',
  padding: '10px', width: '100%', maxWidth: '320px',
}
const slot = {
  aspectRatio: '1', background: 'white', borderRadius: '10px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: '2px dashed #BBDEFB', minHeight: '48px',
}
const slotNum = { fontSize: '0.7rem', color: '#B2BEC3' }
const poolLabel = { fontSize: '0.85rem', color: '#636E72' }
const pool = {
  display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center',
  minHeight: '56px', width: '100%',
}
const poolItem = {
  width: '52px', height: '52px', background: 'white', borderRadius: '12px',
  border: '2px solid #E8ECF0', display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'grab', boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
}
const actions = { display: 'flex', gap: '12px', marginTop: '4px' }
const resetBtn = {
  background: '#E8ECF0', color: '#636E72', border: 'none',
  padding: '12px 20px', borderRadius: '12px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
}
const submitBtn = {
  background: '#4F8CF6', color: 'white', border: 'none',
  padding: '12px 28px', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
}
