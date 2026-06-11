/**
 * 风狮爷解锁机制
 *
 * - 第一次获得 3 星时解锁
 * - 解锁后，风狮爷会在 GameScreen 中随机客串
 * - 状态持久化到 localStorage
 */

const STORAGE_KEY = 'math_kids_minnan_unlocked'

export function isMinnanUnlocked() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function unlockMinnan() {
  try {
    localStorage.setItem(STORAGE_KEY, 'true')
    return true
  } catch {
    return false
  }
}

export function shouldShowSecretMascot() {
  if (!isMinnanUnlocked()) return false
  return Math.random() < 0.25
}

export function checkFirstMastery(stars) {
  if (stars >= 3 && !isMinnanUnlocked()) {
    unlockMinnan()
    return true
  }
  return false
}

export default function useSecretCharacter() {
  return {
    unlocked: isMinnanUnlocked(),
    unlockMinnan,
    shouldShow: shouldShowSecretMascot(),
  }
}

