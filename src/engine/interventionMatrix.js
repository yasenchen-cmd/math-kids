/**
 * 干预矩阵（Intervention Matrix）
 *
 * 错误画像 → 干预规则匹配 → 出题参数调整 + 角色反馈
 *
 * 位置在 errorProfile 和 generateQuestion 之间：
 *   errorProfile (诊断)
 *        ↓
 *   Intervention Matrix (匹配规则 → 生成干预参数)
 *        ↓
 *   getAdaptiveConfig + intervention (合并 → 传给 generator)
 *        ↓
 *   generateQuestion (按干预参数调整出题逻辑)
 */

// ===== 干预规则定义 =====
const INTERVENTIONS = [
  {
    id: 'consecutive_errors',
    priority: 90,
    match: (profile) => (profile.consecutiveErrors || 0) >= 3,
    modify: (base) => ({
      ...base,
      difficultyBoost: -1,
      forceInteractive: true,
      autoRead: true,
      showHints: true,
      maxItems: Math.min(base.maxItems || 10, 5),
      stepByStep: true,
    }),
    feedback: '我们换一种方法来试试！',
    rounds: 2, // 持续 2 轮后重新评估
  },

  {
    id: 'calculation_offset_+1',
    priority: 70,
    match: (profile) => (profile.calculationOffset?.['+1'] || 0) > 3,
    modify: (base) => ({
      ...base,
      stepByStep: true,
      maxItems: Math.min(base.maxItems || 10, 5),
      showNumberLine: true,
      recountHint: true,
    }),
    feedback: '每次数一个，点一下数一个哦～',
    rounds: 3,
  },

  {
    id: 'calculation_offset_-1',
    priority: 70,
    match: (profile) => (profile.calculationOffset?.['-1'] || 0) > 3,
    modify: (base) => ({
      ...base,
      stepByStep: true,
      maxItems: Math.min(base.maxItems || 10, 5),
      showNumberLine: true,
      recountHint: true,
    }),
    feedback: '数完再检查一遍～',
    rounds: 3,
  },

  {
    id: 'digit_confusion_6_9',
    priority: 80,
    match: (profile) => {
      const c = profile.digitConfusion || {}
      const count = (c['6_9'] || 0) + (c['9_6'] || 0)
      return count > 2
    },
    modify: (base) => ({
      ...base,
      avoidDigits: [6, 9],
      showComparison: true,
      forceVisual: true,
    }),
    feedback: '看看 6 和 9 有什么不一样？',
    rounds: 3,
  },

  {
    id: 'rapid_random_tapping',
    priority: 95,
    match: (profile) => {
      // 检测乱点模式：答题数 > 5 但所有技能正确率 < 20%
      if ((profile.totalAttempts || 0) < 5) return false
      const scores = Object.values(profile.skillScores || {})
      if (scores.length < 2) return false
      return scores.every(s => s < 20)
    },
    modify: (base) => ({
      ...base,
      forceSlowMode: true,
      enforceTapCount: true,
      difficulty: 1,
      autoRead: true,
      showHints: true,
      maxItems: 3,
      stepByStep: true,
    }),
    feedback: '慢慢来，看清楚再点哦～',
    rounds: 3,
  },
]

// ===== 活跃干预状态（防止重复触发） =====
// 每条干预规则匹配后开始计轮次，rounds 用完后重新评估
let activeInterventions = {}

export function resetActiveInterventions() {
  activeInterventions = {}
}

/**
 * 对当前 errorProfile 应用干预矩阵
 * @param {object} profile - 错误画像
 * @returns {{ options: object, feedback: string, activeIds: string[] }}
 */
export function applyInterventions(profile) {
  // 减少活跃干预的剩余轮次
  for (const id of Object.keys(activeInterventions)) {
    activeInterventions[id]--
    if (activeInterventions[id] <= 0) {
      delete activeInterventions[id]
    }
  }

  // 匹配新规则（只匹配当前不活跃的）
  const newlyMatched = INTERVENTIONS
    .filter(rule =>
      !activeInterventions[rule.id] &&
      rule.match(profile)
    )
    .sort((a, b) => b.priority - a.priority)

  // 激活新匹配的规则
  newlyMatched.forEach(rule => {
    activeInterventions[rule.id] = rule.rounds
  })

  // 所有当前活跃的规则
  const activeRules = INTERVENTIONS.filter(rule => activeInterventions[rule.id])

  // 合并干预参数（优先级高的覆盖低的）
  const mergedOptions = activeRules.reduce((acc, rule) => ({
    ...acc,
    ...rule.modify(acc),
  }), {})

  // 取最高优先级的反馈语
  const feedback = activeRules[0]?.feedback || ''
  const activeIds = activeRules.map(r => r.id)

  return { options: mergedOptions, feedback, activeIds }
}

// 导出干预规则列表（供调试/测试用）
export function getInterventionRules() {
  return INTERVENTIONS
}
