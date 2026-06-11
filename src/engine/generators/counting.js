/**
 * 数感生成器 — 数数、认数字
 */

const THEMES = {
  fruits:  ['🍎','🍊','🍋','🍇','🍓','🍑','🍒','🍌','🥝','🍐'],
  animals: ['🐱','🐶','🐰','🐼','🐸','🦊','🐻','🐨','🐷','🐵'],
  blocks:  ['🟦','🟥','🟩','🟨','🟣','🟧','⬛','🟤','🔵','🔴'],
  stars:   ['⭐','✨','🌟','💫'],
  candies: ['🍬','🍭','🍫','🍩','🍪'],
}

function pickItems(theme, count) {
  const pool = THEMES[theme] || THEMES.fruits
  const items = []
  for (let i = 0; i < count; i++) {
    items.push(pool[Math.floor(Math.random() * pool.length)])
  }
  return items
}

export function generateQuestion(skillId, options = {}) {
  const { difficulty = 1, visualTheme } = options

  const ranges = {
    counting_1_5:   { min: 1, max: 5 },
    counting_1_10:  { min: 1, max: 10 },
    counting_1_20:  { min: 1, max: 20 },
    counting_1_100: { min: 1, max: 100 },
  }
  const range = ranges[skillId] || { min: 1, max: 5 }
  const count = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min

  const theme = visualTheme || randomTheme()
  const items = pickItems(theme, count)

  const distractors = new Set()
  distractors.add(count + 1)
  distractors.add(count - 1)
  if (count > 2 && difficulty > 1) {
    distractors.add(count + 2)
    distractors.add(count - 2)
  }
  const filtered = Array.from(distractors).filter(d => d >= range.min && d <= range.max && d !== count)
  const options_arr = shuffle([count, ...filtered]).slice(0, 4)

  return {
    skillId,
    prompt: '数一数，有几个？',
    promptNarrative: '',
    answer: count,
    manipulative: {
      mode: 'count',
      items,
      count,
    },
    choice: {
      options: options_arr,
      answer: count,
    },
    difficulty,
  }
}

const THEME_LIST = Object.keys(THEMES)
function randomTheme() { return THEME_LIST[Math.floor(Math.random() * THEME_LIST.length)] }
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
