/**
 * 题目构建辅助 — 统一结构、视觉字段、干扰项质量
 */

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function pickOne(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function makeChoices(answer, distractors = [], count = 4) {
  const pool = new Set([answer, ...distractors.filter(d => d !== answer && d !== undefined && d !== null)])
  if (typeof answer === 'number') {
    let guard = 0
    while (pool.size < count && guard < 20) {
      guard += 1
      const delta = randInt(1, 3) * (Math.random() > 0.5 ? 1 : -1)
      const candidate = answer + delta
      if (candidate !== answer && candidate >= 0) pool.add(candidate)
    }
  }
  const others = shuffle(Array.from(pool).filter(x => x !== answer)).slice(0, Math.max(0, count - 1))
  return {
    options: shuffle([answer, ...others]),
    answer,
  }
}

/** 围绕正确答案生成数值干扰项，可限制范围 */
export function numericDistractors(answer, deltas = [-2, -1, 1, 2, 3], range) {
  return deltas
    .map(d => answer + d)
    .filter(n => n !== answer && n >= 0 && (range ? n >= range.min && n <= range.max : true))
}

export function repeatEmoji(emoji, count) {
  return Array(count).fill(emoji)
}

export function emojiRow(emoji, count, sep = '') {
  return repeatEmoji(emoji, count).join(sep || ' ')
}

export function buildQuestion({
  skillId,
  prompt,
  promptNarrative,
  answer,
  choice,
  visual,
  manipulative = null,
  interactiveFallback = null,
  difficulty = 1,
}) {
  const resolvedChoice = choice?.options ? choice : makeChoices(answer, choice ? [] : undefined)
  return {
    skillId,
    prompt,
    promptNarrative: promptNarrative || prompt,
    answer,
    visual: visual || null,
    manipulative,
    interactiveFallback: manipulative ? null : interactiveFallback,
    choice: resolvedChoice,
    difficulty,
  }
}

/** 题目指纹 — 用于一轮内去重 */
export function questionFingerprint(q) {
  return `${q.skillId}|${q.prompt}|${String(q.answer)}`
}

/** 整点钟表 emoji（1–12） */
const CLOCK_WHOLE = ['🕛', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚']
const CLOCK_HALF = ['🕧', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦']

export function clockEmoji(hour, half = false) {
  const idx = hour % 12
  return half ? CLOCK_HALF[idx] : CLOCK_WHOLE[idx]
}

export function groupsVisual(emoji, groups, perGroup) {
  const rows = Array.from({ length: groups }, () => repeatEmoji(emoji, perGroup))
  return { type: 'groups', emoji, groups, perGroup, rows }
}

export function compareVisual(leftEmoji, leftCount, rightEmoji, rightCount) {
  return {
    type: 'compare',
    left: { emoji: leftEmoji, count: leftCount },
    right: { emoji: rightEmoji, count: rightCount },
  }
}

/** 比较题再试升级 — 两边分别点数后选择 */
export function compareCountManipulative(leftEmoji, leftCount, rightEmoji, rightCount, answer) {
  return {
    mode: 'compare_count',
    left: { label: 'A', emoji: leftEmoji, items: repeatEmoji(leftEmoji, leftCount), count: leftCount },
    right: { label: 'B', emoji: rightEmoji, items: repeatEmoji(rightEmoji, rightCount), count: rightCount },
    answer,
    options: ['A 更多', 'B 更多', '一样多'],
  }
}

export function countManipulative(items, count, submitAnswer = count, sayFirst = false) {
  return { mode: 'count', items, count, answer: submitAnswer, sayFirst }
}

/** 规律/分类 — 点选一项 */
export function pickOneManipulative({
  variant = 'classification',
  options,
  answer,
  sequence = null,
  hint = '',
  style = 'emoji',
}) {
  return {
    mode: 'pick_one',
    variant,
    options,
    answer,
    sequence,
    hint,
    style,
  }
}

export function emojiGridVisual(items) {
  return { type: 'emoji_grid', items }
}

export function sequenceVisual(numbers, missingIndex = -1) {
  return { type: 'sequence', numbers, missingIndex }
}

export function blocksVisual(tens, ones) {
  return { type: 'place_value', tens, ones }
}
