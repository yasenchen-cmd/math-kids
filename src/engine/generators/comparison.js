/**
 * 比较多少
 */

import {
  buildQuestion, compareCountManipulative, compareVisual, pickOne, randInt,
} from './_utils.js'

const EMOJIS = ['🍎', '🐱', '⭐', '🍬', '🟦']

export function generateQuestion(skillId, options = {}) {
  const { difficulty = 1 } = options
  const maxN = Math.min(4 + difficulty * 2, 12)
  const a = randInt(2, maxN)
  let b = randInt(2, maxN)
  while (b === a) b = randInt(2, maxN)

  const emojiA = pickOne(EMOJIS)
  const emojiB = pickOne(EMOJIS.filter(e => e !== emojiA))
  const opts = [`A 更多`, `B 更多`, '一样多']
  const answer = a > b ? opts[0] : b > a ? opts[1] : opts[2]
  const compareFallback = compareCountManipulative(emojiA, a, emojiB, b, answer)

  return buildQuestion({
    skillId,
    prompt: '哪一边更多？',
    promptNarrative: `看看 A 和 B，哪一边的东西更多？`,
    answer,
    visual: compareVisual(emojiA, a, emojiB, b),
    interactiveFallback: compareFallback,
    choice: { options: opts, answer },
    difficulty,
  })
}
