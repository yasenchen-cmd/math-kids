/**
 * 数字顺序
 */

import {
  buildQuestion, makeChoices, numericDistractors, randInt, sequenceVisual,
  sortOrderManipulative, shuffle,
} from './_utils.js'
import { shouldUseInteractive } from '../retrySupport.js'

export function generateQuestion(skillId, options = {}) {
  const { difficulty = 1, forceInteractive = false } = options
  const max = Math.min(8 + difficulty * 2, 20)
  const useSort = shouldUseInteractive(difficulty, forceInteractive) && Math.random() > 0.35

  if (useSort) {
    const len = Math.min(3 + Math.floor(difficulty / 2), 5)
    const start = randInt(1, Math.max(1, max - len))
    const targetOrder = Array.from({ length: len }, (_, i) => start + i)
    const answer = targetOrder.join(',')
    const sortManip = sortOrderManipulative(targetOrder, targetOrder, '按从小到大点进格子')

    return buildQuestion({
      skillId,
      prompt: '把这些数字排成正确的顺序',
      promptNarrative: `从小到大排：${targetOrder.join('、')}`,
      answer,
      visual: null,
      manipulative: sortManip,
      interactiveFallback: null,
      choice: makeChoices(answer, [
        shuffle([...targetOrder]).join(','),
        [...targetOrder].reverse().join(','),
      ]),
      difficulty,
    })
  }

  const kind = Math.random() > 0.45 ? 'gap' : 'next'

  if (kind === 'gap') {
    const start = randInt(1, Math.max(1, max - 4))
    const seq = [start, start + 1, start + 2, start + 3]
    const missingIndex = randInt(1, 2)
    const answer = seq[missingIndex]
    const range = { min: 1, max: max + 2 }
    const sortFallback = sortOrderManipulative(seq, seq, '把数字排成正确顺序')

    return buildQuestion({
      skillId,
      prompt: '找一找，问号应该是几？',
      promptNarrative: `数字按顺序排列，问号那里应该是 ${answer}`,
      answer,
      visual: sequenceVisual(seq, missingIndex),
      interactiveFallback: sortFallback,
      choice: makeChoices(answer, numericDistractors(answer, [-2, -1, 1, 2], range)),
      difficulty,
    })
  }

  const n = randInt(1, max - 1)
  const answer = n + 1
  return buildQuestion({
    skillId,
    prompt: `${n} 的后面一个数是几？`,
    promptNarrative: `${n} 后面一个数字是多少？`,
    answer,
    visual: sequenceVisual([n, n + 1, n + 2], -1),
    choice: makeChoices(answer, [n, n + 2, n - 1]),
    difficulty,
  })
}
