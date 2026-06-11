/**
 * 加法生成器 — 支持干预矩阵参数
 */

const THEMES = {
  fruits:  ['🍎','🍊','🍋','🍇','🍓','🍑','🍒','🍌'],
  animals: ['🐱','🐶','🐰','🐼','🐸','🦊','🐻','🐨'],
  candies: ['🍬','🍭','🍫','🍩','🍪','🧁','🎂','🍿'],
  blocks:  ['🟦','🟥','🟩','🟨','🟣','🟧','⬛','🟤'],
  toys:    ['🚗','🚀','🪁','🧸','🎈','⚽','🎮','🛴'],
  ten_frame: ['🔵'],
  eggs:    ['🥚'],
  fingers: ['🤚'],
}

const THEME_NAMES = {
  fruits: '水果', animals: '小动物', candies: '糖果',
  blocks: '积木', toys: '玩具',
}

function pickEmoji(theme, count) {
  const pool = THEMES[theme] || THEMES.fruits
  const emoji = pool[Math.floor(Math.random() * pool.length)]
  return Array(count).fill(emoji).join(' ')
}

function pickSingle(theme) {
  const pool = THEMES[theme] || THEMES.fruits
  return pool[Math.floor(Math.random() * pool.length)]
}

function filterDigits(pool, avoid) {
  if (!avoid || avoid.length === 0) return pool
  return pool.filter(d => !avoid.includes(d))
}

export function generateQuestion(skillId, options = {}) {
  const {
    difficulty = 1,
    visualTheme,
    maxItems: maxItemsOverride,
    avoidDigits,
    stepByStep,
    showNumberLine,
    forceVisual,
    recountHint,
  } = options

  const ranges = {
    addition_meaning:     { min: 1, max: 3 },
    addition_within_5:    { min: 1, max: 4 },
    addition_within_10:   { min: 2, max: 8 },
    make_ten:             { min: 1, max: 9 },
    addition_within_20:   { min: 5, max: 15 },
  }
  const range = ranges[skillId] || { min: 1, max: 5 }

  // 如果 maxItemsOverride 小于 range.max，取更小的
  const effMax = maxItemsOverride ? Math.min(maxItemsOverride, range.max) : range.max
  const maxA = Math.min(range.min + Math.floor(difficulty * 0.5), effMax)

  // 生成 a，避开 avoidDigits
  let aPool = Array.from({ length: maxA - range.min + 1 }, (_, i) => range.min + i)
  aPool = filterDigits(aPool, avoidDigits)
  const a = aPool.length > 0 ? aPool[Math.floor(Math.random() * aPool.length)] : 1

  // 生成 b，同样避开
  const maxB = Math.min(effMax - a, effMax)
  let bPool = maxB > 0 ? Array.from({ length: maxB }, (_, i) => i + 1) : [1]
  bPool = filterDigits(bPool, avoidDigits)
  const b = bPool.length > 0 ? bPool[Math.floor(Math.random() * bPool.length)] : 1

  const answer = a + b
  const theme = visualTheme || randomTheme()

  // 构建操作型交互参数
  let manipMode = 'drag_combine'
  let manipConfig = {}

  if (stepByStep || forceVisual) {
    // 分步引导版本：一次只拖一个
    const items = []
    const singleEmoji = pickSingle(theme)
    for (let i = 0; i < a + b; i++) {
      items.push(singleEmoji)
    }
    manipConfig = {
      items,
      stepByStep: true,
      recountHint: !!recountHint,
      showNumberLine: !!showNumberLine,
    }
  } else {
    manipConfig = {
      groups: [
        { count: a, emoji: pickEmoji(theme, 1).trim(), label: `${a}` },
        { count: b, emoji: pickEmoji(theme, 1).trim(), label: `${b}` },
      ],
      targetLabel: '一共',
      answer,
    }
  }

  // 选择题型
  const distractors = generateDistractors(answer, a, b, difficulty, avoidDigits)
  const choice = {
    options: shuffle([answer, ...distractors]),
    answer,
  }

  return {
    skillId,
    prompt: `${a} + ${b} = ?`,
    promptNarrative: stepByStep
      ? `${a}个${THEME_NAMES[theme]||''}加${b}个，我们一个一个数`
      : `${a}个${THEME_NAMES[theme]||''}加${b}个，一共多少个？`,
    answer,
    manipulative: {
      mode: manipMode,
      ...manipConfig,
    },
    choice,
    difficulty,
    interventions: {
      avoidDigits,
      stepByStep,
      showNumberLine,
      recountHint,
    },
  }
}

function generateDistractors(answer, a, b, difficulty, avoidDigits) {
  const count = Math.min(2 + Math.floor(difficulty / 2), 4)
  const distractors = new Set()
  const candidates = [
    answer + 1, answer - 1,
    answer + 2, answer - 2,
    a, b, a + b + 1, a + b - 1,
  ]
  for (const c of candidates) {
    if (c >= 0 && c !== answer) {
      if (avoidDigits && avoidDigits.length > 0) {
        const cStr = String(c)
        const avoidStr = avoidDigits.map(String)
        if (avoidStr.some(d => cStr.includes(d))) continue
      }
      distractors.add(c)
    }
    if (distractors.size >= count) break
  }
  while (distractors.size < count) {
    const d = answer + Math.floor(Math.random() * 5) - 2
    if (d >= 0 && d !== answer) distractors.add(d)
  }
  return Array.from(distractors).slice(0, count)
}

function randomTheme() {
  const themes = Object.keys(THEMES)
  return themes[Math.floor(Math.random() * themes.length)]
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
