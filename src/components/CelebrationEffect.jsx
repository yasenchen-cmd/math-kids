/**
 * 庆祝动画效果
 * 答对时撒花 / 通关时放烟花
 */

import { useEffect, useState } from 'react'

const EMOJIS = ['⭐', '🌟', '✨', '🎉', '🎊', '💫', '🌈', '🌸', '💖', '🎀']

function randomBetween(min, max) {
  return Math.random() * (max - min) + min
}

function Particle({ emoji, startTime, duration }) {
  const delay = randomBetween(0, 0.2)
  const x = randomBetween(-80, 80)
  const y = randomBetween(-120, -20)
  const rot = randomBetween(-180, 180)
  const scale = randomBetween(0.5, 1.2)

  return (
    <div style={{
      position: 'absolute',
      left: '50%',
      top: '50%',
      fontSize: '1.5rem',
      pointerEvents: 'none',
      animation: `particleFly ${duration}s ease-out ${delay}s forwards`,
      opacity: 0,
      '--x': `${x}px`,
      '--y': `${y}px`,
      '--rot': `${rot}deg`,
      '--scale': scale,
    }}>
      {emoji}
    </div>
  )
}

export default function CelebrationEffect({ type = 'correct', duration = 1000 }) {
  const [particles, setParticles] = useState([])
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const count = type === 'complete' ? 20 : 8
    const items = Array.from({ length: count }, (_, i) => ({
      id: i,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    }))
    setParticles(items)

    const timer = setTimeout(() => setVisible(false), duration + 300)
    return () => clearTimeout(timer)
  }, [type, duration])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 300,
    }}>
      {/* 注入 keyframes */}
      <style>{`
        @keyframes particleFly {
          0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(0); }
          30% { opacity: 1; transform: translate(calc(var(--x) * 0.3), calc(var(--y) * 0.3)) rotate(calc(var(--rot) * 0.3)) scale(var(--scale)); }
          100% { opacity: 0; transform: translate(var(--x), var(--y)) rotate(var(--rot)) scale(0.3); }
        }
      `}</style>
      {particles.map(p => (
        <Particle key={p.id} emoji={p.emoji} startTime={0} duration={duration / 1000} />
      ))}
    </div>
  )
}
