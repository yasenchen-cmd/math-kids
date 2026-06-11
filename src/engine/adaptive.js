/**
 * 自适应难度调度
 *
 * 根据孩子的表现动态调整：
 * - 数字范围（难度）
 * - 干扰项数量
 * - 辅助提示层级
 * - 交互模式选择
 */

const DEFAULT = {
  difficulty: 1,
  helpLevel: 2,
  showVisual: true,
  autoRead: true,
  distractors: 2,
}

export function getAdaptiveConfig(skillId, skillScores = {}, errorProfile = {}) {
  const score = skillScores[skillId] || 0
  const errors = errorProfile[skillId] || 0

  let difficulty = 1
  let helpLevel = 2
  let showVisual = true
  let autoRead = true
  let distractors = 2

  if (score >= 90 && errors < 2) {
    difficulty = Math.min(score / 20, 8)
    helpLevel = 0
    showVisual = false
    autoRead = false
    distractors = 4
  } else if (score >= 70) {
    difficulty = Math.max(1, score / 20)
    helpLevel = 1
    showVisual = true
    autoRead = true
    distractors = 3
  } else {
    difficulty = Math.max(1, Math.floor(score / 25))
    helpLevel = 2
    showVisual = true
    autoRead = true
    distractors = 2
  }

  if (errors > 5) {
    difficulty = Math.max(1, difficulty - 1)
    helpLevel = Math.min(2, helpLevel + 1)
    autoRead = true
  }

  return { difficulty, helpLevel, showVisual, autoRead, distractors }
}

export function calcMastery(skillId, skillScores = {}, errorProfile = {}) {
  const score = skillScores[skillId] || 0
  const errors = errorProfile[skillId] || 0
  return Math.max(0, Math.min(100, score - errors * 5))
}

export function isSkillMastered(skillId, skillScores = {}, errorProfile = {}) {
  return calcMastery(skillId, skillScores, errorProfile) >= 80
}

/**
 * 技能解锁判定
 * 前置技能只需答过至少一题即可，不需要掌握 80%
 */
export function areDepsMet(dependencies, skillScores = {}, errorProfile = {}) {
  // 前置技能满足条件：完成一轮（5题）或连续答对2题
  // 防止孩子乱点解锁整棵技能树
  if (!dependencies || dependencies.length === 0) return true
  return dependencies.every(depId => {
    const history = errorProfile.skillHistory?.[depId]
    if (!history || history.length === 0) return false
    // 条件A：完成过一轮完整答题（5题以上）
    if (history.length >= 5) return true
    // 条件B：最近2题连续答对
    if (history.length >= 2 && history[history.length - 1] === 1 && history[history.length - 2] === 1) return true
    return false
  })
}
