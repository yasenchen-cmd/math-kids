/**
 * 分数入门
 */

import { buildQuestion, makeChoices, pickOne } from './_utils.js'

const FRACTIONS = [
  {
    name: '一半',
    emoji: '🍕',
    totalParts: 2,
    takeParts: 1,
    prompt: '披萨平均分成 2 份，拿 1 份是？',
    narrative: '分成两份，拿一份就是一半',
  },
  {
    name: '四分之一',
    emoji: '🍰',
    totalParts: 4,
    takeParts: 1,
    prompt: '蛋糕平均分成 4 份，拿 1 份是？',
    narrative: '四等分，拿一份是四分之一',
  },
  {
    name: '三分之一',
    emoji: '🍫',
    totalParts: 3,
    takeParts: 1,
    prompt: '巧克力平均分成 3 份，拿 1 份是？',
    narrative: '三等分，拿一份是三分之一',
  },
]

const ALL_NAMES = ['一半', '三分之一', '四分之一']

function fractionPartsManipulative(frac) {
  return {
    mode: 'fraction_parts',
    emoji: frac.emoji,
    totalParts: frac.totalParts,
    takeParts: frac.takeParts,
    answer: frac.name,
    options: ALL_NAMES,
  }
}

export function generateQuestion(skillId, options = {}) {
  const { difficulty = 1, forceInteractive = false, distractorCount } = options
  const pool = FRACTIONS.slice(0, Math.min(1 + difficulty, FRACTIONS.length))
  const frac = pickOne(pool)
  const distractors = ALL_NAMES.filter(n => n !== frac.name)
  const choiceCount = distractorCount != null ? distractorCount + 1 : 4
  const choice = makeChoices(frac.name, distractors, Math.min(choiceCount, ALL_NAMES.length))
  const wantInteractive = forceInteractive || difficulty <= 2
  const parts = fractionPartsManipulative(frac)

  return buildQuestion({
    skillId,
    prompt: frac.prompt,
    promptNarrative: frac.narrative,
    answer: frac.name,
    visual: { type: 'scene', text: `${frac.emoji}  分成 ${frac.totalParts} 份` },
    manipulative: wantInteractive ? parts : null,
    interactiveFallback: parts,
    choice,
    difficulty,
  })
}
