/**
 * 角色小伙伴组件
 *
 * 显示在界面中的 AI 陪伴角色
 * - 不同角色有不同外观和配色
 * - 支持情绪动画（高兴、思考、鼓励、等待）
 * - 点击角色会说出鼓励的话
 */

import { useState, useEffect } from 'react'
import { getCharacter, pickLine } from '../data/characters'

const MOOD_ANIMS = {
  encourage: {
    animation: 'bounce 0.6s ease-in-out 2',
    scale: 1.05,
  },
  happy: {
    animation: 'bounce 0.5s ease-in-out',
    scale: 1.1,
  },
  celebrate: {
    animation: 'bounce 0.4s ease-in-out 3',
    scale: 1.2,
  },
  thinking: {
    animation: 'float 1.5s ease-in-out infinite',
    scale: 1,
  },
  sad: {
    animation: 'shake 0.3s ease-in-out',
    scale: 0.95,
  },
  idle: {
    animation: 'float 2s ease-in-out infinite',
    scale: 1,
  },
}

export default function CharacterMascot({
  areaId = 'number_sense',
  mood = 'idle',
  showSpeech = false,
  customText = '',
  size = 'medium',
  onClick,
}) {
  const chara = getCharacter(areaId)
  const [speechText, setSpeechText] = useState('')
  const [showText, setShowText] = useState(false)

  useEffect(() => {
    if (showSpeech && customText) {
      setSpeechText(customText)
      setShowText(true)
      const timer = setTimeout(() => setShowText(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [showSpeech, customText])

  const moodStyle = MOOD_ANIMS[mood] || MOOD_ANIMS.idle
  const emojiSize = size === 'small' ? '2rem' : size === 'large' ? '4rem' : '3rem'
  const containerSize = size === 'small' ? '50px' : size === 'large' ? '90px' : '70px'

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      // 默认：随机说一句鼓励的话
      const line = pickLine(areaId, 'idle')
      setSpeechText(line)
      setShowText(true)
      setTimeout(() => setShowText(false), 2500)
    }
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      {/* 角色头像 */}
      <div
        onClick={handleClick}
        style={{
          width: containerSize,
          height: containerSize,
          borderRadius: '50%',
          background: chara.bgGradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          animation: moodStyle.animation,
          transform: `scale(${moodStyle.scale})`,
          transition: 'transform 0.2s ease',
          boxShadow: mood === 'happy' || mood === 'celebrate'
            ? `0 0 20px ${chara.color}66`
            : mood === 'encourage'
              ? `0 0 14px ${chara.color}44`
              : '0 2px 8px rgba(0,0,0,0.08)',
          border: `2px solid ${chara.color}`,
          position: 'relative',
        }}
      >
        <span style={{ fontSize: emojiSize, lineHeight: 1 }}>{chara.emoji}</span>

        {/* 情绪小标记 */}
        {mood === 'happy' && <span style={badgeTopRight}>⭐</span>}
        {mood === 'encourage' && <span style={badgeTopRight}>💪</span>}
        {mood === 'celebrate' && <span style={badgeTopRight}>🎉</span>}
        {mood === 'thinking' && <span style={badgeTopRight}>💭</span>}
      </div>

      {/* 角色名字 */}
      <span style={{
        fontSize: size === 'small' ? '0.7rem' : '0.85rem',
        fontWeight: 600,
        color: chara.color,
      }}>
        {chara.name}
      </span>

      {/* 对话气泡 */}
      {showText && speechText && (
        <div style={speechBubble}>
          {speechText}
        </div>
      )}
    </div>
  )
}

const badgeTopRight = {
  position: 'absolute',
  top: '-4px',
  right: '-4px',
  fontSize: '0.8rem',
}

const speechBubble = {
  position: 'absolute',
  top: '-60px',
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'white',
  padding: '8px 14px',
  borderRadius: '12px',
  fontSize: '0.85rem',
  color: '#2D3436',
  fontWeight: 500,
  whiteSpace: 'nowrap',
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  animation: 'popIn 0.2s ease-out',
  zIndex: 10,
}

// 在全局 style 中注入角色动画
const styleSheet = document.createElement('style')
styleSheet.textContent = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
  }
`
document.head.appendChild(styleSheet)
