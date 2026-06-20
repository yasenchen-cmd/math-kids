/**
 * 乘法 — 填数组 / 选择题
 */

import { buildQuestion, groupsVisual, makeChoices, numericDistractors, pickOne, randInt } from './_utils.js'

const FACTOR_EMOJI = { 2: '🐾', 3: '🍃', 4: '🟦', 5: '✋' }

function buildArrayManipulative(rows, perGroup, emoji, answer) {
  return {
    mode: 'fill_array',
    rows,
    perGroup,
    emoji,
    answer,
  }
}

export function generateQuestion(skillId, options = {}) {
  const { difficulty = 1, forceInteractive = false } = options
  if (skillId === 'multiplication_meaning') return genMeaning(difficulty, forceInteractive)
  if (skillId === 'multiplication_2_5') return genTable(skillId, [2, 5], difficulty, forceInteractive)
  return genTable(skillId, [3, 4], difficulty, forceInteractive)
}

function genMeaning(difficulty, forceInteractive) {
  const groups = randInt(2, Math.min(3 + difficulty, 5))
  const perGroup = randInt(2, Math.min(3 + difficulty, 5))
  const answer = groups * perGroup
  const emoji = pickOne(['🍎', '🌟', '🐟', '🟦'])
  const useManipulative = forceInteractive || difficulty <= 3

  const arrayManip = buildArrayManipulative(groups, perGroup, emoji, answer)

  return buildQuestion({
    skillId: 'multiplication_meaning',
    prompt: useManipulative ? `每行 ${perGroup} 个，填 ${groups} 行，一共几个？` : '一共有几个？',
    promptNarrative: `${groups} 组，每组 ${perGroup} 个，一共 ${answer} 个`,
    answer,
    visual: useManipulative ? null : groupsVisual(emoji, groups, perGroup),
    manipulative: useManipulative ? arrayManip : null,
    interactiveFallback: useManipulative ? null : arrayManip,
    choice: makeChoices(answer, numericDistractors(answer, [-2, -1, 1, 2, groups, perGroup])),
    difficulty,
  })
}

function genTable(skillId, factors, difficulty, forceInteractive) {
  const factor = pickOne(factors)
  const multiplier = randInt(1, Math.min(5 + difficulty, 9))
  const answer = factor * multiplier
  const emoji = FACTOR_EMOJI[factor] || '🟦'
  const useManipulative = forceInteractive || difficulty <= 3

  const arrayManip = buildArrayManipulative(multiplier, factor, emoji, answer)

  return buildQuestion({
    skillId,
    prompt: useManipulative
      ? `${factor} × ${multiplier} = ?（每行 ${factor} 个，填 ${multiplier} 行）`
      : `${factor} × ${multiplier} = ?`,
    promptNarrative: `${multiplier} 个 ${factor} 是多少？`,
    answer,
    visual: useManipulative ? null : groupsVisual(emoji, multiplier, factor),
    manipulative: useManipulative ? arrayManip : null,
    interactiveFallback: useManipulative ? null : arrayManip,
    choice: makeChoices(answer, numericDistractors(answer, [-factor, -1, 1, factor, factor * 2])),
    difficulty,
  })
}
