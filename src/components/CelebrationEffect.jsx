/**
 * 庆祝动画效果
 * correct — 首次答对撒花
 * retry_correct — 再试答对：温和上升粒子
 * complete — 通关烟花
 */

import { useEffect, useState } from 'react'

const FESTIVE_EMOJIS = ['⭐', '🌟', '✨', '🎉', '🎊', '💫', '🌈', '🌸', '💖', '🎀']
const RETRY_EMOJIS = ['💪', '👏', '🌱', '✨', '🌟', '💛', '🌼', '🙌']

function randomBetween(min, max) {
  return Math.random() * (max - min) + min
}

function Particle({ emoji, duration, variant = 'burst' }) {
  const delay = randomBetween(0, variant === 'rise' ? 0.15 : 0.2)
  const x = randomBetween(variant === 'rise' ? -40 : -80, variant === 'rise' ? 40 : 80)
  const y = randomBetween(variant === 'rise' ? -100 : -120, variant === 'rise' ? -40 : -20)
  const rot = randomBetween(-90, 90)
  const scale = randomBetween(variant === 'rise' ? 0.7 : 0.5, variant === 'rise' ? 1 : 1.2)
  const anim = variant === 'rise' ? 'particleRise' : 'particleFly'

  return (
    <div style={{
      position: 'absolute',
      left: '50%',
      top: variant === 'rise' ? '62%' : '50%',
      fontSize: variant === 'rise' ? '1.35rem' : '1.5rem',
      pointerEvents: 'none',
      animation: `${anim} ${duration}s ease-out ${delay}s forwards`,
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

const STYLE_BY_TYPE = {
  correct: { count: 8, pool: FESTIVE_EMOJIS, variant: 'burst' },
  retry_correct: { count: 5, pool: RETRY_EMOJIS, variant: 'rise' },
  complete: { count: 20, pool: FESTIVE_EMOJIS, variant: 'burst' },
}

export default function CelebrationEffect({ type = 'correct', duration = 1000 }) {
  const [particles, setParticles] = useState([])
  const [visible, setVisible] = useState(true)
  const config = STYLE_BY_TYPE[type] || STYLE_BY_TYPE.correct

  useEffect(() => {
    const items = Array.from({ length: config.count }, (_, i) => ({
      id: i,
      emoji: config.pool[Math.floor(Math.random() * config.pool.length)],
    }))
    setParticles(items)

    const timer = setTimeout(() => setVisible(false), duration + 300)
    return () => clearTimeout(timer)
  }, [type, duration, config.count, config.pool])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 300,
    }}>
      <style>{`
        @keyframes particleFly {
          0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(0); }
          30% { opacity: 1; transform: translate(calc(var(--x) * 0.3), calc(var(--y) * 0.3)) rotate(calc(var(--rot) * 0.3)) scale(var(--scale)); }
          100% { opacity: 0; transform: translate(var(--x), var(--y)) rotate(var(--rot)) scale(0.3); }
        }
        @keyframes particleRise {
          0% { opacity: 0; transform: translate(0, 12px) scale(0.4); }
          20% { opacity: 1; transform: translate(calc(var(--x) * 0.2), calc(var(--y) * 0.15)) scale(var(--scale)); }
          100% { opacity: 0; transform: translate(var(--x), var(--y)) scale(0.85); }
        }
      `}</style>
      {particles.map(p => (
        <Particle key={p.id} emoji={p.emoji} duration={duration / 1000} variant={config.variant} />
      ))}
    </div>
  )
}

export { STYLE_BY_TYPE }
