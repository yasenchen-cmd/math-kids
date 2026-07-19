/**
 * 排序 / 分拣教具
 * - order: 按正确顺序点选放入槽位（数字顺序）
 * - bins: 点选后分到两个筐（分类）
 */

import { useState, useEffect } from 'react'

export default function SortOrder({ question, onAnswer, disabled }) {
  const manip = question?.manipulative
  if (!manip || manip.mode !== 'sort') {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>暂不支持此题型</div>
  }

  const variant = manip.variant || 'order'

  if (variant === 'bins') {
    return <BinsSort manip={manip} question={question} onAnswer={onAnswer} disabled={disabled} />
  }
  return <OrderSort manip={manip} question={question} onAnswer={onAnswer} disabled={disabled} />
}

function OrderSort({ manip, question, onAnswer, disabled }) {
  const { items = [], targetOrder = [], hint = '按从小到大点一点' } = manip
  const [pool, setPool] = useState(items)
  const [placed, setPlaced] = useState([])
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    setPool(items)
    setPlaced([])
    setSubmitted(false)
  }, [question, items])

  const pick = (item, idx) => {
    if (disabled || submitted) return
    setPool(prev => prev.filter((_, i) => i !== idx))
    setPlaced(prev => [...prev, item])
  }

  const undo = () => {
    if (disabled || submitted || placed.length === 0) return
    const last = placed[placed.length - 1]
    setPlaced(prev => prev.slice(0, -1))
    setPool(prev => [...prev, last])
  }

  const submit = () => {
    if (disabled || submitted || placed.length !== targetOrder.length) return
    setSubmitted(true)
    const ok = placed.every((v, i) => String(v) === String(targetOrder[i]))
    onAnswer?.(ok ? question.answer : '__wrong__')
  }

  return (
    <div style={wrap}>
      <div style={hintStyle}>{hint}</div>
      <div style={slotsRow} aria-label="已排好的顺序">
        {targetOrder.map((_, i) => (
          <div key={i} style={slot}>
            {placed[i] != null ? <span style={slotVal}>{placed[i]}</span> : <span style={slotPh}>{i + 1}</span>}
          </div>
        ))}
      </div>
      <div style={poolRow}>
        {pool.map((item, idx) => (
          <button
            key={`${item}-${idx}`}
            type="button"
            disabled={disabled || submitted}
            aria-label={`选择 ${item}`}
            onClick={() => pick(item, idx)}
            style={chip}
          >
            {item}
          </button>
        ))}
      </div>
      <div style={actions}>
        <button type="button" style={secondary} disabled={disabled || submitted} onClick={undo}>撤销</button>
        <button
          type="button"
          style={{ ...primary, opacity: placed.length === targetOrder.length ? 1 : 0.5 }}
          disabled={disabled || submitted || placed.length !== targetOrder.length}
          onClick={submit}
        >
          好了 ✓
        </button>
      </div>
    </div>
  )
}

function BinsSort({ manip, question, onAnswer, disabled }) {
  const {
    items = [],
    bins = [
      { id: 'in', label: '属于', members: [] },
      { id: 'out', label: '不属于', members: [] },
    ],
    hint = '点一下，再选放到哪个筐',
  } = manip

  const [pool, setPool] = useState(items)
  const [binState, setBinState] = useState(() => Object.fromEntries(bins.map(b => [b.id, []])))
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    setPool(items)
    setBinState(Object.fromEntries(bins.map(b => [b.id, []])))
    setSelected(null)
    setSubmitted(false)
  }, [question, items, bins])

  const placeInBin = (binId) => {
    if (disabled || submitted || selected == null) return
    setBinState(prev => ({
      ...prev,
      [binId]: [...prev[binId], selected],
    }))
    setPool(prev => prev.filter(x => x !== selected))
    setSelected(null)
  }

  const submit = () => {
    if (disabled || submitted || pool.length > 0) return
    setSubmitted(true)
    const ok = bins.every((b) => {
      const got = [...(binState[b.id] || [])].map(String).sort()
      const expect = [...(b.members || [])].map(String).sort()
      return got.length === expect.length && got.every((v, i) => v === expect[i])
    })
    onAnswer?.(ok ? question.answer : '__wrong__')
  }

  return (
    <div style={wrap}>
      <div style={hintStyle}>{hint}</div>
      <div style={poolRow}>
        {pool.map((item) => (
          <button
            key={item}
            type="button"
            disabled={disabled || submitted}
            aria-label={`选择 ${item}`}
            aria-pressed={selected === item}
            onClick={() => setSelected(item)}
            style={{
              ...chip,
              borderColor: selected === item ? '#4F8CF6' : '#E8ECF0',
              background: selected === item ? '#E3F2FD' : 'white',
            }}
          >
            {item}
          </button>
        ))}
      </div>
      <div style={binsRow}>
        {bins.map((b) => (
          <button
            key={b.id}
            type="button"
            disabled={disabled || submitted || selected == null}
            aria-label={`放入${b.label}`}
            onClick={() => placeInBin(b.id)}
            style={binCard}
          >
            <div style={binTitle}>{b.label}</div>
            <div style={binItems}>
              {(binState[b.id] || []).map((x, i) => (
                <span key={`${x}-${i}`} style={{ fontSize: '1.6rem' }}>{x}</span>
              ))}
            </div>
          </button>
        ))}
      </div>
      <button
        type="button"
        style={{ ...primary, opacity: pool.length === 0 ? 1 : 0.5, alignSelf: 'center' }}
        disabled={disabled || submitted || pool.length > 0}
        onClick={submit}
      >
        好了 ✓
      </button>
    </div>
  )
}

const wrap = { display: 'flex', flexDirection: 'column', gap: '14px', padding: '4px 0' }
const hintStyle = { textAlign: 'center', fontSize: '0.95rem', color: '#636E72', fontWeight: 500 }
const slotsRow = { display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }
const slot = {
  width: '56px', height: '56px', borderRadius: '12px', background: '#F5F5F5',
  border: '2px dashed #B2BEC3', display: 'flex', alignItems: 'center', justifyContent: 'center',
}
const slotVal = { fontSize: '1.4rem', fontWeight: 700, color: '#2D3436' }
const slotPh = { fontSize: '0.75rem', color: '#B2BEC3' }
const poolRow = { display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }
const chip = {
  minWidth: '56px', height: '56px', padding: '0 12px', borderRadius: '14px',
  background: 'white', border: '2px solid #E8ECF0', fontSize: '1.5rem', fontWeight: 700,
  cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
}
const actions = { display: 'flex', gap: '12px', justifyContent: 'center' }
const primary = {
  background: '#4F8CF6', color: 'white', border: 'none',
  padding: '12px 28px', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
}
const secondary = {
  background: '#E8ECF0', color: '#636E72', border: 'none',
  padding: '12px 20px', borderRadius: '12px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
}
const binsRow = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }
const binCard = {
  minHeight: '120px', background: 'white', border: '2px solid #E8ECF0', borderRadius: '16px',
  padding: '12px', cursor: 'pointer', textAlign: 'center',
}
const binTitle = { fontSize: '0.9rem', fontWeight: 700, color: '#4F8CF6', marginBottom: '8px' }
const binItems = { display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }
