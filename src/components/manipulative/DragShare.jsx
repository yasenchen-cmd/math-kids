/**
 * 平分交互 — 除法/分享
 *
 * 把物品点选分到每个小朋友篮子里，每人一样多
 */
import { useState, useCallback, useMemo } from 'react'

const PERSON_EMOJI = ['👧', '👦', '🧒', '👶', '🙂']

export default function DragShare({ question, onAnswer, disabled }) {
  const manipulative = question?.manipulative
  const totalItems = manipulative?.totalItems || []
  const groups = manipulative?.groups || 2
  const answer = manipulative?.answer

  const [buckets, setBuckets] = useState(() => Array.from({ length: groups }, () => []))
  const [selected, setSelected] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(null)

  const pool = useMemo(() => {
    const assigned = new Set(buckets.flat())
    return totalItems
      .map((emoji, idx) => ({ emoji, idx }))
      .filter(item => !assigned.has(item.idx))
  }, [totalItems, buckets])

  const allAssigned = pool.length === 0

  const handleSelectPool = useCallback((idx) => {
    if (disabled || showResult) return
    setSelected(prev => (prev === idx ? null : idx))
  }, [disabled, showResult])

  const handleAssignBucket = useCallback((bucketIdx) => {
    if (disabled || showResult || selected === null) return
    setBuckets(prev => {
      const next = prev.map(b => [...b])
      next[bucketIdx] = [...next[bucketIdx], selected]
      return next
    })
    setSelected(null)
  }, [disabled, showResult, selected])

  const handleUnassign = useCallback((bucketIdx, itemIdx) => {
    if (disabled || showResult) return
    setBuckets(prev => {
      const next = prev.map(b => [...b])
      next[bucketIdx] = next[bucketIdx].filter(i => i !== itemIdx)
      return next
    })
  }, [disabled, showResult])

  const handleSubmit = useCallback(() => {
    const counts = buckets.map(b => b.length)
    const perPerson = counts[0] ?? 0
    const even = counts.every(c => c === perPerson)
    const correct = even && perPerson === answer
    setIsCorrect(correct)
    setShowResult(true)
    onAnswer?.(correct ? answer : perPerson)
  }, [buckets, answer, onAnswer])

  if (manipulative?.mode !== 'drag_share') return null

  return (
    <div style={container} role="region" aria-label="平分物品">
      <div style={sceneLabel} id="drag-share-hint">
        👆 把 {totalItems.length} 个物品分给 {groups} 位小朋友，每人一样多
      </div>

      <div style={poolZone} role="group" aria-label="待分配物品">
        <div style={zoneTitle}>待分配</div>
        <div style={itemsRow}>
          {pool.map(({ emoji, idx }) => (
            <button
              key={idx}
              type="button"
              style={{
                ...itemBtn,
                borderColor: selected === idx ? '#4F8CF6' : '#E8ECF0',
                background: selected === idx ? '#E3F2FD' : 'white',
                transform: selected === idx ? 'scale(1.08)' : 'scale(1)',
              }}
              disabled={disabled || showResult}
              aria-pressed={selected === idx}
              aria-label={`选择第 ${idx + 1} 个物品`}
              onClick={() => handleSelectPool(idx)}
            >
              <span style={{ fontSize: '1.8rem' }} aria-hidden="true">{emoji}</span>
            </button>
          ))}
          {pool.length === 0 && !showResult && (
            <span style={emptyHint} role="status">全部分完啦 ✓</span>
          )}
        </div>
      </div>

      <div style={bucketsGrid}>
        {buckets.map((bucket, bi) => (
          <div key={bi} style={bucketZone} role="group" aria-label={`小朋友 ${bi + 1}`}>
            <div style={bucketTitle}>
              <span aria-hidden="true">{PERSON_EMOJI[bi % PERSON_EMOJI.length]}</span> 小朋友{bi + 1}
            </div>
            <button
              type="button"
              style={{
                ...bucketDrop,
                borderColor: selected !== null ? '#6BCB77' : '#E8ECF0',
                background: selected !== null ? '#F1F8E9' : '#FAFAFA',
              }}
              disabled={disabled || showResult || selected === null}
              aria-label={`放到小朋友 ${bi + 1}`}
              onClick={() => handleAssignBucket(bi)}
            >
              {selected !== null ? '放这里' : `${bucket.length} 个`}
            </button>
            <div style={itemsRow}>
              {bucket.map(itemIdx => (
                <button
                  key={itemIdx}
                  type="button"
                  style={{ ...itemBtn, background: '#E8F5E9', borderColor: '#6BCB77' }}
                  disabled={disabled || showResult}
                  aria-label={`从小朋友 ${bi + 1} 拿回`}
                  onClick={() => handleUnassign(bi, itemIdx)}
                >
                  <span style={{ fontSize: '1.5rem' }} aria-hidden="true">{totalItems[itemIdx]}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {!showResult && (
        <button
          type="button"
          style={{
            ...submitBtn,
            opacity: allAssigned ? 1 : 0.35,
            cursor: allAssigned && !disabled ? 'pointer' : 'not-allowed',
          }}
          disabled={!allAssigned || disabled}
          onClick={handleSubmit}
        >
          分完了，每人 {buckets[0]?.length || 0} 个
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
          }}
        >
          {isCorrect
            ? `✓ 对啦！每人 ${answer} 个`
            : `✗ 不对哦，应该每人 ${answer} 个`}
        </div>
      )}

      {selected !== null && !showResult && (
        <div style={hint}>再点一个小朋友的「放这里」</div>
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

const poolZone = {
  background: 'white',
  borderRadius: '16px',
  border: '2px solid #E8ECF0',
  padding: '12px',
}

const zoneTitle = {
  fontSize: '0.85rem',
  fontWeight: 700,
  color: '#B2BEC3',
  textAlign: 'center',
  marginBottom: '8px',
}

const itemsRow = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  justifyContent: 'center',
  minHeight: '48px',
}

const itemBtn = {
  border: '2px solid',
  borderRadius: '12px',
  padding: '6px',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  lineHeight: 1,
}

const bucketsGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '10px',
}

const bucketZone = {
  background: 'white',
  borderRadius: '14px',
  border: '2px solid #E8ECF0',
  padding: '10px',
  textAlign: 'center',
}

const bucketTitle = {
  fontSize: '0.85rem',
  fontWeight: 700,
  color: '#636E72',
  marginBottom: '6px',
}

const bucketDrop = {
  width: '100%',
  border: '2px dashed',
  borderRadius: '10px',
  padding: '8px',
  marginBottom: '8px',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#636E72',
  background: '#FAFAFA',
  cursor: 'pointer',
}

const submitBtn = {
  background: 'linear-gradient(135deg, #6BCB77, #4F8CF6)',
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

const emptyHint = {
  fontSize: '0.9rem',
  color: '#6BCB77',
  fontWeight: 600,
}
