/**
 * 答题选项网格 — 支持数字/文字/大号 emoji 选项 + 再试方向高亮
 */

import { getChoiceHintStyle } from '../engine/retrySupport.js'

function isEmojiOption(opt) {
  if (typeof opt !== 'string') return false
  return /\p{Extended_Pictographic}/u.test(opt) && opt.length <= 4
}

function detectChoiceStyle(options, explicit) {
  if (explicit === 'emoji' || explicit === 'text') return explicit
  if (options.every(isEmojiOption)) return 'emoji'
  return 'text'
}

export default function ChoiceGrid({ question, feedback, retryHint, disabled, onAnswer, onSpeak }) {
  const options = question.choice?.options || []
  const style = detectChoiceStyle(options, question.choice?.style)
  const isEmoji = style === 'emoji'

  return (
    <div
      role="group"
      aria-label="答题选项"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: isEmoji ? '14px' : '10px',
      }}
    >
      {options.map((opt, idx) => {
        let bg = 'white'
        let border = '2px solid #E8ECF0'
        let boxShadow = 'none'

        if (feedback) {
          if (opt === question.answer) { bg = '#E8F5E9'; border = '2px solid #4CAF50' }
          else if (opt === feedback.userAnswer) { bg = '#FFEBEE'; border = '2px solid #FF6B6B' }
          else { bg = '#F5F5F5'; border = '2px solid #E8ECF0' }
        } else if (retryHint) {
          const hintStyle = getChoiceHintStyle(opt, retryHint, question.answer)
          if (hintStyle) {
            bg = hintStyle.background
            border = `2px solid ${hintStyle.borderColor}`
            boxShadow = hintStyle.boxShadow
          } else if (opt === retryHint.userAnswer) {
            bg = '#FFEBEE'
            border = '2px solid #FF6B6B'
          }
        }

        return (
          <button
            key={idx}
            type="button"
            style={{
              position: 'relative',
              padding: isEmoji ? '28px 16px' : '20px 12px',
              borderRadius: isEmoji ? '20px' : '16px',
              fontSize: isEmoji ? '2.8rem' : '1.2rem',
              fontWeight: 600,
              transition: 'all 0.15s ease',
              textAlign: 'center',
              backgroundColor: bg,
              border,
              boxShadow,
              cursor: disabled ? 'default' : 'pointer',
              transform: feedback && opt === question.answer ? 'scale(1.05)' : 'scale(1)',
              minHeight: isEmoji ? '100px' : '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            disabled={disabled}
            aria-label={`选项 ${opt}`}
            onClick={() => !disabled && onAnswer(opt)}
          >
            <span style={{
              fontSize: isEmoji ? '2.8rem' : '1.5rem',
              color: isEmoji ? 'inherit' : '#2D3436',
              lineHeight: 1.2,
            }}>
              {opt}
            </span>
            {!disabled && onSpeak && (
              <span
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '8px',
                  fontSize: '0.75rem',
                  opacity: 0.4,
                }}
                onClick={(e) => { e.stopPropagation(); onSpeak(String(opt)) }}
              >
                🔊
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export { detectChoiceStyle, isEmojiOption }
