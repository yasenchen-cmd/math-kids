/**
 * 减法生成器
 */

const THEMES = {
  fruits:  ['🍎','🍊','🍋','🍇','🍓','🍑'],
  animals: ['🐱','🐶','🐰','🐼','🐸'],
  candies: ['🍬','🍭','🍫','🍩','🍪'],
}

function pickOne(theme) {
  const pool = THEMES[theme] || THEMES.fruits
  return pool[Math.floor(Math.random() * pool.length)]
}

export function generateQuestion(skillId, options = {}) {
  const { difficulty = 1, visualTheme } = options

  const ranges = {
    subtraction_meaning:    { min: 2, max: 4 },
    subtraction_within_5:  { min: 2, max: 5 },
    subtraction_within_10: { min: 3, max: 10 },
  }
  const range = ranges[skillId] || { min: 2, max: 5 }

  const total = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
  const take = Math.floor(Math.random() * (total - 1)) + 1
  const answer = total - take

  const theme = visualTheme || 'fruits'
  const emoji = pickOne(theme)
  const items = Array(total).fill(emoji)
  const taken = items.slice(0, take)

  const distractors = new Set()
  distractors.add(answer + 1)
  distractors.add(answer - 1)
  if (difficulty > 1) { distractors.add(answer + 2); distractors.add(answer - 2) }
  const filtered = Array.from(distractors).filter(d => d >= 0 && d !== answer)

  return {
    skillId,
    prompt: `${total} − ${take} = ?`,
    promptNarrative: `有${total}个${emoji}，拿走${take}个，还剩几个？`,
    answer,
    manipulative: {
      mode: 'drag_split',
      totalItems: items,
      takeCount: take,
      answer,
    },
    choice: {
      options: shuffle([answer, ...filtered]).slice(0, 4),
      answer,
    },
    difficulty,
  }
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
