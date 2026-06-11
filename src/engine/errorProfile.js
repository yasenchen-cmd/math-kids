/**
 * 错误画像系统
 *
 * 记录的不是简单对错，而是「错误模式」：
 * - 数字混淆（6↔9, 12↔21 等）
 * - 方向错误（> < 搞混）
 * - 计算偏移（总差1/差2）
 */

const STORAGE_KEY = 'math_kids_error_profile'

function defaultProfile() {
  return {
    digitConfusion: {},
    calculationOffset: {},
    directionErrors: 0,
    skillErrors: {},
    consecutiveErrors: 0,
    totalAttempts: 0,
    skillScores: {},
    skillHistory: {},
  }
}

export function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...defaultProfile(), ...JSON.parse(raw) } : defaultProfile()
  } catch { return defaultProfile() }
}

export function saveProfile(profile) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)) } catch {}
}

/**
 * 记录一次答题结果并分析错误模式
 * 返回全新的 profile 对象，不修改输入（immutable）
 */
export function recordAttempt(profile, skillId, question, userAnswer, isCorrect) {
  const next = {
    ...profile,
    digitConfusion: { ...profile.digitConfusion },
    calculationOffset: { ...profile.calculationOffset },
    skillErrors: { ...profile.skillErrors },
    skillScores: { ...profile.skillScores },
    skillHistory: { ...profile.skillHistory },
  }

  next.totalAttempts = profile.totalAttempts + 1

  // 维护答题历史（最近10题）
  const history = [...(profile.skillHistory[skillId] || [])]
  history.push(isCorrect ? 1 : 0)
  if (history.length > 10) history.shift()
  next.skillHistory[skillId] = history

  // 计算移动平均分
  const sum = history.reduce((a, b) => a + b, 0)
  next.skillScores[skillId] = Math.round((sum / history.length) * 100)

  if (!isCorrect) {
    next.skillErrors[skillId] = (profile.skillErrors[skillId] || 0) + 1
    next.consecutiveErrors = profile.consecutiveErrors + 1
    analyzeError(next, question, userAnswer)
  } else {
    next.consecutiveErrors = 0
  }

  return next
}

// 分析错误模式
function analyzeError(profile, question, userAnswer) {
  const a = question.answer
  const u = userAnswer

  if (typeof a === 'number' && typeof u === 'number') {
    const offset = u - a
    const key = offset > 0 ? `+${offset}` : `${offset}`
    profile.calculationOffset[key] = (profile.calculationOffset[key] || 0) + 1

    // 数字混淆
    const aStr = String(a)
    const uStr = String(u)
    if (aStr.length === 1 && uStr.length === 1) {
      if (Math.abs(a - u) === 3 && (a === 6 || a === 9 || u === 6 || u === 9)) {
        const ck = [Math.min(a, u), Math.max(a, u)].join('_')
        profile.digitConfusion[ck] = (profile.digitConfusion[ck] || 0) + 1
      }
    }
  }
}

export function getTopErrorPatterns(profile, limit = 3) {
  const patterns = []
  const offsets = Object.entries(profile.calculationOffset)
    .sort((a, b) => b[1] - a[1]).slice(0, 2)
  offsets.forEach(([key, count]) => {
    if (count > 2) patterns.push({ type: 'offset', detail: `总差${key}`, count })
  })
  const confusions = Object.entries(profile.digitConfusion)
    .sort((a, b) => b[1] - a[1]).slice(0, 2)
  confusions.forEach(([key, count]) => {
    if (count > 1) {
      const [x, y] = key.split('_')
      patterns.push({ type: 'confusion', detail: `${x}和${y}混淆`, count })
    }
  })
  return patterns.slice(0, limit)
}
