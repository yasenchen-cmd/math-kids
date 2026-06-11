/**
 * localStorage 进度持久化
 */
const STORAGE_KEY = 'math_kids_progress'

const defaultProgress = {
  stars: {},
  collectibles: [],
  unlockedLevels: {},
  streak: 0,
  bestStreak: 0,
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return { ...defaultProgress, ...JSON.parse(raw) }
    }
  } catch (e) {
    console.warn('Failed to load progress:', e)
  }
  return { ...defaultProgress }
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch (e) {
    console.warn('Failed to save progress:', e)
  }
}

export function resetProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {
    console.warn('Failed to reset progress:', e)
  }
}

export function isLevelUnlocked(progress, worldId, levelId) {
  if (worldId === 1 && levelId === 1) return true
  return !!progress.unlockedLevels[`${worldId}-${levelId}`]
}

export function getLevelStars(progress, worldId, levelId) {
  return progress.stars[`${worldId}-${levelId}`] || 0
}

export function getWorldStars(progress, worldId, levels) {
  return levels.reduce((sum, l) => sum + getLevelStars(progress, worldId, l.id), 0)
}

export function getWorldProgress(progress, worldId, levels) {
  const total = levels.length * 3
  const earned = getWorldStars(progress, worldId, levels)
  return Math.round((earned / total) * 100)
}

export function getTotalStars(progress, worlds) {
  return worlds.reduce((sum, w) => sum + getWorldStars(progress, w.id, w.levels), 0)
}

export function getMaxStars(worlds) {
  return worlds.reduce((sum, w) => sum + w.levels.length * 3, 0)
}

