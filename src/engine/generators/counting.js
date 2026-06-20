/**
 * 数感生成器 — 数数、认数字
 */

import {
  buildQuestion, makeChoices, numericDistractors, randInt, pickOne,
  emojiGridVisual, blocksVisual, countManipulative,
} from './_utils.js'

const THEMES = {
  fruits:  ['🍎','🍊','🍋','🍇','🍓','🍑','🍒','🍌','🥝','🍐'],
  animals: ['🐱','🐶','🐰','🐼','🐸','🦊','🐻','🐨','🐷','🐵'],
  blocks:  ['🟦','🟥','🟩','🟨','🟣','🟧','⬛','🟤','🔵','🔴'],
  stars:   ['⭐','✨','🌟','💫'],
  candies: ['🍬','🍭','🍫','🍩','🍪'],
}

function pickItems(theme, count) {
  const pool = THEMES[theme] || THEMES.fruits
  const emoji = pickOne(pool)
  return Array(count).fill(emoji)
}

export function generateQuestion(skillId, options = {}) {
  if (skillId === 'number_recognition') return genNumberRecognition(options)
  if (skillId === 'counting_1_100') return genCounting100(options)
  return genCounting(skillId, options)
}

function genCounting(skillId, options) {
  const { difficulty = 1, visualTheme } = options
  const ranges = {
    counting_1_5:  { min: 1, max: 5 },
    counting_1_10: { min: 1, max: 10 },
    counting_1_20: { min: 1, max: Math.min(10 + difficulty * 2, 20) },
  }
  const range = ranges[skillId] || { min: 1, max: 5 }
  const count = randInt(range.min, range.max)
  const theme = visualTheme || pickOne(Object.keys(THEMES))
  const items = pickItems(theme, count)

  return buildQuestion({
    skillId,
    prompt: '看看有几个？先说出来！',
    promptNarrative: '能直接说出来吗？说不出来再一个一个数',
    answer: count,
    visual: emojiGridVisual(items),
    manipulative: countManipulative(items, count, count, true),
    choice: makeChoices(count, numericDistractors(count, [-2, -1, 1, 2], range)),
    difficulty,
  })
}

function genNumberRecognition(options) {
  const { difficulty = 1 } = options
  const count = randInt(1, Math.min(6 + difficulty * 2, 20))
  const items = pickItems('blocks', count)
  const range = { min: 1, max: 20 }
  const countFallback = countManipulative(items, count, count, count <= 6)

  return buildQuestion({
    skillId: 'number_recognition',
    prompt: '看看有几个？先说出数字！',
    promptNarrative: `看看图，先说出是几；说不出来再数一数`,
    answer: count,
    visual: emojiGridVisual(items),
    interactiveFallback: countFallback,
    choice: makeChoices(count, numericDistractors(count, [-3, -2, -1, 1, 2, 3], range)),
    difficulty,
  })
}

function genCounting100(options) {
  const { difficulty = 1 } = options
  const kind = difficulty > 2 && Math.random() > 0.5 ? 'compose' : 'tens'

  if (kind === 'tens') {
    const tens = randInt(2, Math.min(4 + difficulty, 9))
    const answer = tens * 10
    const items = Array(tens).fill('🔟')
    return buildQuestion({
      skillId: 'counting_1_100',
      prompt: '数一数，一共是多少？',
      promptNarrative: `每个方块代表 10，数一数一共多少`,
      answer,
      visual: { type: 'emoji_grid', items },
      interactiveFallback: countManipulative(items, tens, tens * 10),
      choice: makeChoices(answer, [answer - 10, answer + 10, tens, answer - 20].filter(n => n > 0)),
      difficulty,
    })
  }

  const tens = randInt(1, 5)
  const ones = randInt(1, 9)
  const number = tens * 10 + ones
  const composeFallback = {
    mode: 'drag_combine',
    groups: [
      { count: tens, emoji: '🔟', label: '10' },
      { count: ones, emoji: '🟧', label: '1' },
    ],
    targetLabel: '一共',
    answer: number,
  }
  return buildQuestion({
    skillId: 'counting_1_100',
    prompt: `${number} 可以看成几个十和几个一？`,
    promptNarrative: `${number} 里有 ${tens} 个十和 ${ones} 个一，这个数是几？`,
    answer: number,
    visual: blocksVisual(tens, ones),
    interactiveFallback: composeFallback,
    choice: makeChoices(number, [number - 1, number + 1, tens * 10, number + 10]),
    difficulty,
  })
}
