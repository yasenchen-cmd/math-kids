/**
 * 减法生成器
 */

import { buildQuestion, emojiGridVisual, makeChoices, numericDistractors, pickOne, randInt } from './_utils.js'

const THEMES = {
  fruits:  ['🍎','🍊','🍋','🍇','🍓','🍑'],
  animals: ['🐱','🐶','🐰','🐼','🐸'],
  candies: ['🍬','🍭','🍫','🍩','🍪'],
}

const DRAG_SKILLS = new Set(['subtraction_meaning', 'subtraction_within_5'])

export function generateQuestion(skillId, options = {}) {
  const { difficulty = 1, visualTheme, forceInteractive = false } = options

  const ranges = {
    subtraction_meaning:    { min: 3, max: 5 },
    subtraction_within_5:  { min: 2, max: 5 },
    subtraction_within_10: { min: 3, max: 10 },
  }
  const range = ranges[skillId] || { min: 2, max: 5 }

  const total = randInt(range.min, range.max)
  const take = randInt(1, total - 1)
  const answer = total - take

  const theme = visualTheme || pickOne(Object.keys(THEMES))
  const emoji = pickOne(THEMES[theme] || THEMES.fruits)
  const items = Array(total).fill(emoji)

  const useManipulative = difficulty <= 2 && (DRAG_SKILLS.has(skillId) || skillId === 'subtraction_meaning')
    || options.forceInteractive
  const useStory = skillId === 'subtraction_meaning' || useManipulative

  const splitFallback = {
    mode: 'drag_split',
    totalItems: items,
    takeCount: take,
    answer,
  }

  return buildQuestion({
    skillId,
    prompt: useStory ? `拿走 ${take} 个，还剩几个？` : `${total} − ${take} = ?`,
    promptNarrative: `有 ${total} 个${emoji}，拿走 ${take} 个，还剩几个？`,
    answer,
    visual: useManipulative ? null : emojiGridVisual(items),
    manipulative: useManipulative ? splitFallback : null,
    interactiveFallback: useManipulative ? null : splitFallback,
    choice: makeChoices(answer, numericDistractors(answer, [-2, -1, 1, 2, take])),
    difficulty,
  })
}
