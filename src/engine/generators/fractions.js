/**
 * 分数入门
 */

import { buildQuestion, makeChoices, pickOne } from './_utils.js'

const FRACTIONS = [
  {
    name: '一半',
    emoji: '🍕',
    visual: '🍕➗2',
    prompt: '披萨平均分成 2 份，拿 1 份是？',
    narrative: '分成两份，拿一份就是一半',
  },
  {
    name: '四分之一',
    emoji: '🍰',
    visual: '🍰➗4',
    prompt: '蛋糕平均分成 4 份，拿 1 份是？',
    narrative: '四等分，拿一份是四分之一',
  },
  {
    name: '三分之一',
    emoji: '🍫',
    visual: '🍫➗3',
    prompt: '巧克力平均分成 3 份，拿 1 份是？',
    narrative: '三等分，拿一份是三分之一',
  },
]

const ALL_NAMES = ['一半', '三分之一', '四分之一']

export function generateQuestion(skillId, options = {}) {
  const { difficulty = 1 } = options
  const pool = FRACTIONS.slice(0, Math.min(1 + difficulty, FRACTIONS.length))
  const frac = pickOne(pool)
  const distractors = ALL_NAMES.filter(n => n !== frac.name)

  return buildQuestion({
    skillId,
    prompt: frac.prompt,
    promptNarrative: frac.narrative,
    answer: frac.name,
    visual: { type: 'scene', text: `${frac.emoji}  ${frac.visual}` },
    choice: makeChoices(frac.name, distractors),
    difficulty,
  })
}
