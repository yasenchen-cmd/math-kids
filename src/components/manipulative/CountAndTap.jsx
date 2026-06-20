/**
 * 点数交互 — 先「说出/报数」，再按需逐个点数
 *
 * say 阶段：看物报数（可选语音识别 + 点选确认）
 * count 阶段：逐个点数（原有交互）
 */
import { useState, useCallback, useEffect } from 'react'
import useSpeechRecognition from '../../hooks/useSpeechRecognition'

function ItemsGrid({ items, tapped, showResult, interactive, onTap, onUntap }) {
  return (
    <div style={itemsGrid}>
      {items.map((emoji, idx) => {
        const isTapped = tapped?.has(idx)
        return (
          <div
            key={idx}
            onClick={() => interactive && (isTapped ? onUntap?.(idx) : onTap?.(idx))}
            style={{
              ...tapItem,
              transform: isTapped ? 'scale(1.15)' : 'scale(1)',
              opacity: showResult ? (isTapped ? 1 : 0.3) : 1,
              background: isTapped ? '#E3F2FD' : 'white',
              borderColor: isTapped ? '#4F8CF6' : '#E8ECF0',
              boxShadow: isTapped ? '0 4px 15px rgba(79,140,246,0.2)' : '0 2px 6px rgba(0,0,0,0.04)',
              cursor: interactive && !showResult ? 'pointer' : 'default',
            }}
          >
            <span style={{ fontSize: items.length > 10 ? '1.6rem' : '2.2rem' }}>{emoji}</span>
            {isTapped && <div style={tapOrderBadge}>{idx + 1}</div>}
          </div>
        )
      })}
    </div>
  )
}

export default function CountAndTap({ question, onAnswer, disabled, speak }) {
  const { manipulative } = question
  if (!manipulative || manipulative.mode !== 'count') {
    return fallbackRender(question)
  }

  const { items, count: correctCount, answer: submitAnswer, sayFirst = false } = manipulative
  const resolvedAnswer = submitAnswer ?? correctCount
  const sayOptions = question.choice?.options || []

  const [phase, setPhase] = useState(() => (sayFirst ? 'say' : 'count'))
  const [tapped, setTapped] = useState(new Set())
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(null)
  const [counting, setCounting] = useState(0)
  const [sayFeedback, setSayFeedback] = useState('')
  const [pickedSay, setPickedSay] = useState(null)

  const { listen, listening, supported: sttSupported } = useSpeechRecognition()

  useEffect(() => {
    if (phase !== 'say' || disabled) return
    speak?.('看看图，先大声说出有几个！', { rate: 0.82 })
  }, [phase, disabled, speak])

  const goToCount = useCallback((message) => {
    setPhase('count')
    setSayFeedback(message || '')
    setTapped(new Set())
    setCounting(0)
    speak?.(message || '好，我们一个一个来数！', { rate: 0.85 })
  }, [speak])

  const handleSayAnswer = useCallback((n) => {
    if (disabled || showResult) return
    setPickedSay(n)
    if (n === resolvedAnswer) {
      setIsCorrect(true)
      setShowResult(true)
      onAnswer?.(resolvedAnswer)
      return
    }
    goToCount('没关系，我们一个一个来数！')
  }, [disabled, showResult, resolvedAnswer, onAnswer, goToCount])

  const handleListen = useCallback(() => {
    if (disabled || listening) return
    const started = listen((n) => {
      if (n == null) {
        setSayFeedback('没听清，你可以点下面的数字，或者说「我要数」')
        speak?.('没听清，点一下你说的数字吧', { rate: 0.85 })
        return
      }
      handleSayAnswer(n)
    })
    if (!started) {
      setSayFeedback('这里不能听语音，点一下你说的数字吧')
    }
  }, [disabled, listening, listen, handleSayAnswer, speak])

  const handleTap = useCallback((idx) => {
    if (disabled || showResult || tapped.has(idx)) return
    const next = new Set(tapped)
    next.add(idx)
    setTapped(next)
    setCounting(next.size)
  }, [disabled, showResult, tapped])

  const handleUntap = useCallback((idx) => {
    if (disabled || showResult) return
    const next = new Set(tapped)
    next.delete(idx)
    setTapped(next)
    setCounting(next.size)
  }, [disabled, showResult, tapped])

  const handleSubmit = useCallback(() => {
    const correct = counting === correctCount
    setIsCorrect(correct)
    setShowResult(true)
    onAnswer?.(correct ? resolvedAnswer : counting)
  }, [counting, correctCount, resolvedAnswer, onAnswer])

  if (phase === 'say') {
    return (
      <div style={container}>
        <div style={sayBanner}>
          <span style={sayIcon}>🗣️</span>
          <div>
            <div style={sayTitle}>先看看，大声说出有几个！</div>
            <div style={saySub}>说出来后，点对应的数字；说不出来就一个一个数</div>
          </div>
        </div>

        <ItemsGrid items={items} interactive={false} />

        {sttSupported && (
          <button
            type="button"
            style={{
              ...micBtn,
              opacity: disabled || listening ? 0.6 : 1,
              boxShadow: listening ? '0 0 0 3px rgba(79,140,246,0.35)' : 'none',
            }}
            disabled={disabled || listening}
            onClick={handleListen}
          >
            {listening ? '🎤 正在听…' : '🎤 我说完了（听一听）'}
          </button>
        )}

        <div style={sayPrompt}>点一下你说的数字：</div>
        <div style={sayGrid}>
          {sayOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              disabled={disabled || showResult}
              onClick={() => handleSayAnswer(opt)}
              style={{
                ...sayBtn,
                borderColor: pickedSay === opt && opt !== resolvedAnswer ? '#FF6B6B' : '#E8ECF0',
              }}
            >
              {opt}
            </button>
          ))}
        </div>

        <button
          type="button"
          style={countLinkBtn}
          disabled={disabled}
          onClick={() => goToCount('好，我们一个一个来数！')}
        >
          我还说不出来，一个一个数 →
        </button>

        {sayFeedback && <div style={hintText}>{sayFeedback}</div>}
      </div>
    )
  }

  return (
    <div style={container}>
      {sayFeedback && (
        <div style={countHintBanner}>{sayFeedback}</div>
      )}
      <div style={sceneLabel}>👆 用手指点着，一个一个数</div>

      <ItemsGrid
        items={items}
        tapped={tapped}
        showResult={showResult}
        interactive
        onTap={handleTap}
        onUntap={handleUntap}
      />

      <div style={counterBar}>
        <span style={counterLabel}>已数：</span>
        <span style={counterNum}>{counting}</span>
        <span style={counterUnit}>个</span>
        {!showResult && (
          <button
            type="button"
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
          <span style={{ fontSize: '1.2rem', fontWeight: 600, color: isCorrect ? '#2E7D32' : '#C62828' }}>
            {isCorrect
              ? `✓ 对啦！一共${correctCount}个`
              : `✗ 不对哦，一共${correctCount}个，你数了${counting}个`}
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
  const items = question.manipulative?.items || ['🍎', '🍎', '🍎']
  return (
    <div style={container}>
      <ItemsGrid items={items} interactive={false} />
    </div>
  )
}

const container = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  padding: '16px',
  maxWidth: '500px',
  margin: '0 auto',
}

const sayBanner = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
  background: 'linear-gradient(135deg, #E3F2FD, #F0F6FF)',
  border: '2px solid #90CAF9',
  borderRadius: '16px',
  padding: '14px 16px',
}

const sayIcon = { fontSize: '1.6rem', flexShrink: 0 }
const sayTitle = { fontSize: '1.05rem', fontWeight: 700, color: '#1565C0' }
const saySub = { fontSize: '0.85rem', color: '#1976D2', marginTop: '4px', lineHeight: 1.4 }

const sayPrompt = {
  textAlign: 'center',
  fontSize: '0.95rem',
  color: '#636E72',
  fontWeight: 600,
}

const sayGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '10px',
}

const sayBtn = {
  padding: '18px',
  borderRadius: '16px',
  border: '2px solid',
  background: 'white',
  fontSize: '1.5rem',
  fontWeight: 700,
  cursor: 'pointer',
}

const micBtn = {
  width: '100%',
  padding: '14px',
  borderRadius: '14px',
  border: '2px solid #4F8CF6',
  background: 'white',
  color: '#1565C0',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
}

const countLinkBtn = {
  background: 'none',
  border: 'none',
  color: '#FFB347',
  fontSize: '0.95rem',
  fontWeight: 600,
  cursor: 'pointer',
  textDecoration: 'underline',
  padding: '4px',
}

const countHintBanner = {
  textAlign: 'center',
  fontSize: '0.9rem',
  color: '#E65100',
  background: '#FFF8E1',
  borderRadius: '12px',
  padding: '8px 12px',
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
  fontSize: '0.95rem',
  color: '#636E72',
}
