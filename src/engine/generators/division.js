/**
 * 简单除法 — 平分/分享
 */

import {
  buildQuestion, makeChoices, numericDistractors, pickOne, randInt,
} from './_utils.js'

const EMOJIS = ['🍎', '🍬', '🐟', '⭐', '🧸']

export function generateQuestion(skillId, options = {}) {
  const { difficulty = 1, forceInteractive = false } = options
  const groups = randInt(2, Math.min(3 + difficulty, 5))
  const perGroup = randInt(2, Math.min(3 + difficulty, 6))
  const total = groups * perGroup
  const answer = perGroup
  const emoji = pickOne(EMOJIS)
  const items = Array(total).fill(emoji)

  const useManipulative = forceInteractive || difficulty <= 3
  const useStory = useManipulative || Math.random() > 0.4

  const shareFallback = {
    mode: 'drag_share',
    totalItems: items,
    groups,
    answer,
  }

  if (useManipulative) {
    return buildQuestion({
      skillId,
      prompt: `${total} 个${emoji}平均分给 ${groups} 人，每人几个？`,
      promptNarrative: `把 ${total} 个${emoji} 分给 ${groups} 位小朋友，每人一样多`,
      answer,
      visual: null,
      manipulative: shareFallback,
      choice: makeChoices(answer, numericDistractors(answer, [-1, 1, 2, groups])),
      difficulty,
    })
  }

  if (useStory) {
    return buildQuestion({
      skillId,
      prompt: `${total} 个${emoji}平均分给 ${groups} 人，每人几个？`,
      promptNarrative: `${total} 个${emoji}，${groups} 个人平分`,
      answer,
      visual: { type: 'emoji_grid', items },
      interactiveFallback: shareFallback,
      choice: makeChoices(answer, numericDistractors(answer, [-1, 1, 2, groups])),
      difficulty,
    })
  }

  return buildQuestion({
    skillId,
    prompt: `${total} ÷ ${groups} = ?`,
    promptNarrative: `${total} 平均分成 ${groups} 份，每份 ${answer} 个`,
    answer,
    visual: { type: 'emoji_grid', items },
    interactiveFallback: shareFallback,
    choice: makeChoices(answer, numericDistractors(answer, [-1, 1, groups, total - groups])),
    difficulty,
  })
}
