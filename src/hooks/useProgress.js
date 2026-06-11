import { useState, useEffect, useCallback } from 'react'
import { loadProgress } from '../utils/storage'

export function useProgress() {
  const [progress, setProgress] = useState(() => loadProgress())

  useEffect(() => {
    try {
      localStorage.setItem('math_kids_progress', JSON.stringify(progress))
    } catch (e) {}
  }, [progress])

  const completeLevel = useCallback((worldId, levelId, stars) => {
    setProgress(prev => {
      const key = `${worldId}-${levelId}`
      const oldStars = prev.stars[key] || 0
      const newStars = Math.max(oldStars, stars)
      const collectibles = prev.collectibles.includes(key)
        ? prev.collectibles
        : [...prev.collectibles, key]
      const unlockedLevels = { ...prev.unlockedLevels }
      unlockedLevels[`${worldId}-${levelId + 1}`] = true
      return {
        ...prev,
        stars: { ...prev.stars, [key]: newStars },
        collectibles,
        unlockedLevels,
        streak: 0,
      }
    })
  }, [])

  const updateStreak = useCallback((isCorrect) => {
    setProgress(prev => {
      const streak = isCorrect ? prev.streak + 1 : 0
      return { ...prev, streak, bestStreak: Math.max(prev.bestStreak, streak) }
    })
  }, [])

  const resetAll = useCallback(() => {
    const fresh = {
      stars: {},
      collectibles: [],
      unlockedLevels: {},
      streak: 0,
      bestStreak: 0,
    }
    setProgress(fresh)
    try {
      localStorage.removeItem('math_kids_progress')
    } catch (e) {}
  }, [])

  return { progress, completeLevel, updateStreak, resetAll }
}
