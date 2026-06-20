/**
 * 位值概念
 */

import {
  buildQuestion, makeChoices, numericDistractors, pickOne, randInt,
  blocksVisual, countManipulative,
} from './_utils.js'

function placeValueComposeFallback(tens, ones, number) {
  return {
    mode: 'drag_combine',
    groups: [
      { count: tens, emoji: '🔟', label: '10' },
      { count: ones, emoji: '🟧', label: '1' },
    ],
    targetLabel: '一共',
    answer: number,
  }
}

export function generateQuestion(skillId, options = {}) {
  const { difficulty = 1 } = options
  const tens = randInt(1, Math.min(3 + difficulty, 9))
  const ones = randInt(0, 9)
  const number = tens * 10 + ones
  const kind = pickOne(['tens', 'ones', 'value'])

  if (kind === 'tens') {
    const answer = tens
    const items = Array(tens).fill('🔟')
    return buildQuestion({
      skillId,
      prompt: `${number} 里有几个十？`,
      promptNarrative: `看积木：${tens} 个十和 ${ones} 个一，有几个十？`,
      answer,
      visual: blocksVisual(tens, ones),
      interactiveFallback: countManipulative(items, tens),
      choice: makeChoices(answer, numericDistractors(answer, [-1, 1, 2], { min: 0, max: 9 })),
      difficulty,
    })
  }

  if (kind === 'ones') {
    const answer = ones
    const items = ones > 0 ? Array(ones).fill('🟧') : ['🟧']
    const countTarget = Math.max(ones, 1)
    return buildQuestion({
      skillId,
      prompt: `${number} 的个位是几？`,
      promptNarrative: `${number} 个位上的数字是几？`,
      answer,
      visual: blocksVisual(tens, ones),
      interactiveFallback: ones > 0
        ? countManipulative(items, ones)
        : placeValueComposeFallback(tens, ones, number),
      choice: makeChoices(answer, numericDistractors(answer, [-1, 1, 2], { min: 0, max: 9 })),
      difficulty,
    })
  }

  return buildQuestion({
    skillId,
    prompt: '这些积木表示哪个数？',
    promptNarrative: `${tens} 个十和 ${ones} 个一，合起来是多少？`,
    answer: number,
    visual: blocksVisual(tens, ones),
    interactiveFallback: placeValueComposeFallback(tens, ones, number),
    choice: makeChoices(number, [number - 1, number + 1, tens * 10, number + 10]),
    difficulty,
  })
}
