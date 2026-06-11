/**
 * 拖拽合并 — 加法的操作型交互
 *
 * 基于 Pointer Events，兼容触摸屏（iPad / Android 平板）
 * 孩子用手指拖动物品到合并区
 */

import { useState, useRef, useCallback, useEffect } from 'react'

const ALL_ITEMS = ['🍎','🍊','🍋','🍇','🍓','🍑','🍒','🍌','🥝','🍐']
const COLORS = ['#FF6B6B','#FFB347','#FFD93D','#6BCB77','#4F8CF6','#A66CFF','#FF8A65','#81D4FA','#CE93D8','#AED581']

function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)]
}

function pickEmoji() {
  return ALL_ITEMS[Math.floor(Math.random() * ALL_ITEMS.length)]
}

export default function DragCombine({ question, onAnswer, disabled }) {
  const { manipulative } = question
  const [phase, setPhase] = useState('drag') // drag, result
  const [isCorrect, setIsCorrect] = useState(null)
  const [mergedCount, setMergedCount] = useState(0)
  const [mergeAreaHover, setMergeAreaHover] = useState(false)

  // 用 tabIndex 禁用拖拽反馈
  const containerRef = useRef(null)

  if (!manipulative || manipulative.mode !== 'drag_combine') {
    return <div style={{padding:'20px',textAlign:'center',color:'#999'}}>暂不支持此题型</div>
  }

  const { groups, targetLabel, answer, themeName } = manipulative
  const totalItems = groups.reduce((s, g) => s + g.count, 0)
  const itemEmojis = groups.flatMap(g => Array(g.count).fill(g.emoji || pickEmoji()))
  const itemColors = itemEmojis.map(() => randomColor())

  // Pointer Events 状态
  const [draggingIdx, setDraggingIdx] = useState(null)
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 })
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 })
  const itemRefs = useRef([])
  const mergeRef = useRef(null)
  const [inMergeZone, setInMergeZone] = useState(false)

  // 初始化 refs
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, totalItems)
  }, [totalItems])
  
  const handlePointerDown = useCallback((idx, e) => {
    if (disabled || phase === 'result' || idx < mergedCount) return
    e.preventDefault()
    e.target.setPointerCapture(e.pointerId)
    setDraggingIdx(idx)
    setDragPos({ x: e.clientX, y: e.clientY })
    setDragStartPos({ x: e.clientX, y: e.clientY })
  }, [disabled, phase, mergedCount])

  const handlePointerMove = useCallback((e) => {
    if (draggingIdx === null) return
    e.preventDefault()
    setDragPos({ x: e.clientX, y: e.clientY })
    
    // 检测是否在合并区上方
    if (mergeRef.current) {
      const rect = mergeRef.current.getBoundingClientRect()
      const inside = (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      )
      setInMergeZone(inside)
    }
  }, [draggingIdx])

  const handlePointerUp = useCallback((e) => {
    if (draggingIdx === null) return
    e.preventDefault()
    
    if (inMergeZone && draggingIdx >= mergedCount) {
      // 成功拖入合并区
      const newCount = mergedCount + 1
      setMergedCount(newCount)
      
      // 全部拖入后自动提交
      if (newCount === totalItems) {
        const correct = newCount === answer
        setIsCorrect(correct)
        setPhase('result')
        if (onAnswer) onAnswer(correct ? answer : newCount)
      }
    }
    
    setDraggingIdx(null)
    setInMergeZone(false)
  }, [draggingIdx, inMergeZone, mergedCount, totalItems, answer, onAnswer])

  // 计算已拖入的物品（前 mergedCount 个在合并区）
  const merged = itemEmojis.slice(0, mergedCount)
  const remaining = itemEmojis.slice(mergedCount)
  const remainingColors = itemColors.slice(mergedCount)

  // 拖拽中的物品
  const dragItem = draggingIdx !== null ? {
    emoji: itemEmojis[draggingIdx],
    color: itemColors[draggingIdx],
  } : null

  return (
    <div ref={containerRef} style={container}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => { setDraggingIdx(null); setInMergeZone(false) }}
    >
      <div style={sceneLabel}>
        🧺 用手指把物品拖到篮子里吧！
      </div>

      <div style={playArea}>
        {/* 左侧：物品区 */}
        <div style={{
          ...sourceArea,
          opacity: phase === 'result' ? 0.5 : 1,
          pointerEvents: phase === 'result' ? 'none' : 'auto',
        }}>
          {remaining.map((emoji, idx) => {
            const globalIdx = mergedCount + idx
            const isDragging = draggingIdx === globalIdx
            return (
              <div
                key={globalIdx}
                ref={el => itemRefs.current[globalIdx] = el}
                onPointerDown={(e) => handlePointerDown(globalIdx, e)}
                style={{
                  ...itemBox,
                  background: remainingColors[idx] + '22',
                  borderColor: remainingColors[idx],
                  cursor: disabled ? 'default' : 'grab',
                  touchAction: 'none',
                  opacity: isDragging ? 0.3 : 1,
                  transform: isDragging ? 'scale(0.9)' : 'scale(1)',
                }}
              >
                <span style={{fontSize:'1.8rem', pointerEvents:'none'}}>{emoji}</span>
              </div>
            )
          })}
        </div>

        {/* 箭头 */}
        {remaining.length > 0 && <div style={arrowStyle}>→</div>}

        {/* 右侧：合并区（篮子） */}
        <div
          ref={mergeRef}
          style={{
            ...targetArea,
            borderColor: phase === 'result'
              ? (isCorrect ? '#4CAF50' : '#FF6B6B')
              : (inMergeZone ? '#6BCB77' : '#4F8CF6'),
            backgroundColor: phase === 'result'
              ? (isCorrect ? '#E8F5E9' : '#FFEBEE')
              : (inMergeZone ? '#E8F5E9' : '#F0F6FF'),
            transform: inMergeZone ? 'scale(1.02)' : 'scale(1)',
            transition: 'all 0.15s ease',
          }}
          onPointerEnter={() => {}}
        >
          <div style={targetLabelStyle}>{targetLabel || '篮子'}</div>
          <div style={itemsRow}>
            {merged.map((emoji, idx) => (
              <div key={idx} style={{
                ...mergedItem,
                animation: 'popIn 0.2s ease-out',
              }}>
                <span style={{fontSize:'1.8rem'}}>{emoji}</span>
              </div>
            ))}
          </div>
          <div style={countBadge}>
            {mergedCount} / {totalItems} 个
          </div>
        </div>
      </div>

      {/* 拖拽中的浮动物品 */}
      {dragItem && (
        <div style={{
          position: 'fixed',
          left: dragPos.x - 28,
          top: dragPos.y - 28,
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          background: dragItem.color + '44',
          border: `3px solid ${dragItem.color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 1000,
          transform: 'scale(1.15)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        }}>
          <span style={{fontSize:'2rem'}}>{dragItem.emoji}</span>
        </div>
      )}

      {/* 结果反馈 */}
      {phase === 'result' && (
        <div style={{
          ...resultBar,
          backgroundColor: isCorrect ? '#E8F5E9' : '#FFEBEE',
          borderColor: isCorrect ? '#4CAF50' : '#FF6B6B',
        }}>
          <span style={{fontSize:'1.2rem',fontWeight:600,color:isCorrect?'#2E7D32':'#C62828'}}>
            {isCorrect ? `✓ 对啦！一共 ${answer} 个` : `✗ 不对哦，应该是 ${answer} 个`}
          </span>
        </div>
      )}

      {/* 提示 */}
      {remaining.length === totalItems && phase === 'drag' && (
        <div style={hintStyle}>
          👆 用手指把物品拖到右边篮子里
        </div>
      )}

      {mergedCount > 0 && mergedCount < totalItems && phase === 'drag' && (
        <div style={hintStyle}>
          还有 {totalItems - mergedCount} 个，继续拖！
        </div>
      )}
    </div>
  )
}

const container = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  padding: '12px',
  maxWidth: '600px',
  margin: '0 auto',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  touchAction: 'none',
}

const sceneLabel = {
  textAlign: 'center',
  fontSize: '1rem',
  color: '#636E72',
}

const playArea = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  minHeight: '180px',
}

const sourceArea = {
  flex: 1,
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  justifyContent: 'center',
  background: 'white',
  borderRadius: '16px',
  padding: '12px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  minHeight: '100px',
  alignContent: 'flex-start',
}

const itemBox = {
  width: '56px',
  height: '56px',
  borderRadius: '12px',
  border: '2px solid',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s ease',
  touchAction: 'none',
}

const arrowStyle = {
  fontSize: '1.5rem',
  color: '#B2BEC3',
  flexShrink: 0,
}

const targetArea = {
  flex: 1,
  border: '3px dashed',
  borderRadius: '16px',
  padding: '12px',
  minHeight: '120px',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
}

const targetLabelStyle = {
  fontSize: '1rem',
  fontWeight: 600,
  color: '#636E72',
  marginBottom: '8px',
}

const itemsRow = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '4px',
  justifyContent: 'center',
  minHeight: '40px',
  padding: '4px 0',
}

const mergedItem = {
  width: '44px',
  height: '44px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const countBadge = {
  display: 'inline-block',
  background: '#4F8CF6',
  color: 'white',
  padding: '2px 12px',
  borderRadius: '12px',
  fontSize: '0.85rem',
  fontWeight: 600,
  marginTop: '4px',
}

const hintStyle = {
  textAlign: 'center',
  fontSize: '0.9rem',
  color: '#B2BEC3',
  padding: '8px',
}

const resultBar = {
  padding: '10px 16px',
  borderRadius: '14px',
  border: '2px solid',
  textAlign: 'center',
}
