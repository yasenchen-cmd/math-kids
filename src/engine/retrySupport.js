/**
 * 再试提示 & 交互升级 — 统一 recovery 辅助
 */

/** 低难度阈值内默认走 manipulative */
export const INTERACTIVE_DIFFICULTY_CAP = 3

const SPATIAL_OPPOSITES = {
  左边: '右边',
  右边: '左边',
  上面: '下面',
  下面: '上面',
}

const HINT_STYLE = {
  borderColor: '#FFB347',
  background: '#FFF8E1',
  boxShadow: '0 0 0 2px rgba(255, 179, 71, 0.35)',
}

export function shouldUseInteractive(difficulty, forceInteractive, preferLowDiff = true) {
  if (forceInteractive) return true
  if (preferLowDiff && difficulty <= INTERACTIVE_DIFFICULTY_CAP) return true
  return false
}

export function isEmojiString(value) {
  if (typeof value !== 'string') return false
  return /\p{Extended_Pictographic}/u.test(value) && value.length <= 4
}

function baseHint(text, direction, userAnswer, extra = {}) {
  return { text, direction, userAnswer, ...extra }
}

function hintComparison(question, userAnswer) {
  const { visual } = question
  if (visual?.type !== 'compare') {
    return baseHint('提示：再数一数两边各有几个 👀', 'count_compare', userAnswer)
  }

  const leftCount = visual.left.count
  const rightCount = visual.right.count

  if (leftCount === rightCount) {
    return baseHint('提示：两边一样多，再仔细比比 👯', 'equal', userAnswer, { focusSide: 'both' })
  }

  const heavier = leftCount > rightCount ? 'A' : 'B'
  const lighter = heavier === 'A' ? 'B' : 'A'

  if (String(userAnswer).includes('一样多')) {
    return baseHint(
      `提示：两边不一样多哦，先数一数 ${lighter} 那边 👀`,
      heavier === 'A' ? 'focus_a' : 'focus_b',
      userAnswer,
      { focusSide: lighter },
    )
  }

  if (String(userAnswer).includes('A') && heavier === 'B') {
    return baseHint('提示：B 那边更多，再数一数 B 👀', 'focus_b', userAnswer, { focusSide: 'B' })
  }

  if (String(userAnswer).includes('B') && heavier === 'A') {
    return baseHint('提示：A 那边更多，再数一数 A 👀', 'focus_a', userAnswer, { focusSide: 'A' })
  }

  return baseHint('提示：一个一个数，哪边更多？', 'count_compare', userAnswer, { focusSide: heavier })
}

function hintPattern(question, userAnswer) {
  const { visual } = question

  if (visual?.type === 'sequence') {
    const items = visual.numbers.filter(n => n !== '?')
    const last = items[items.length - 1]
    const prev = items[items.length - 2]

    if (typeof last === 'number' && typeof prev === 'number') {
      const step = last - prev
      if (step > 0) {
        return baseHint('提示：数字在变大，想想每次加多少 👆', 'higher', userAnswer, { focusMissing: true })
      }
      if (step < 0) {
        return baseHint('提示：数字在变小，想想每次减多少 👇', 'lower', userAnswer, { focusMissing: true })
      }
    }

    if (isEmojiString(last)) {
      if (prev && isEmojiString(prev) && last !== prev) {
        return baseHint('提示：颜色和图案在轮流出现 🔄', 'pattern_alternate', userAnswer, { focusMissing: true })
      }
      if (prev && last === prev) {
        return baseHint('提示：相同的会连着出现哦 🔁', 'pattern_repeat', userAnswer, { focusMissing: true })
      }
    }
  }

  return baseHint('提示：从第一个开始，看看怎么变化的 🔍', 'pattern', userAnswer, { focusMissing: true })
}

function hintClassification(question, userAnswer) {
  const catMatch = question.prompt?.match(/哪个不是(.+)？/)
  const category = catMatch?.[1] || '这一类'
  return baseHint(`提示：找出不是${category}的那个 🔍`, 'odd_one_out', userAnswer)
}

function hintSpatial(question, userAnswer) {
  if (SPATIAL_OPPOSITES[userAnswer] === question.answer) {
    return baseHint('提示：方向弄反啦，想想另一边 ↔️', 'spatial_flip', userAnswer)
  }
  return baseHint('提示：看看图里，谁在谁的哪一边？👀', 'spatial_relook', userAnswer, { focusScene: true })
}

function hintFractions(question, userAnswer) {
  const scene = question.visual?.text || ''
  if (scene.includes('➗4')) {
    return baseHint('提示：平均分成了 4 份，拿 1 份 🍰', 'fraction_quarter', userAnswer)
  }
  if (scene.includes('➗3')) {
    return baseHint('提示：平均分成了 3 份，拿 1 份 🍫', 'fraction_third', userAnswer)
  }
  if (scene.includes('➗2')) {
    return baseHint('提示：平均分成了 2 份，拿 1 份 🍕', 'fraction_half', userAnswer)
  }
  return baseHint('提示：看分成了几份，再想想拿一份叫什么', 'fraction_parts', userAnswer)
}

function hintBySkill(question, userAnswer) {
  const { skillId } = question

  switch (skillId) {
    case 'quantity_comparison':
      return hintComparison(question, userAnswer)
    case 'classification':
      return hintClassification(question, userAnswer)
    case 'pattern_recognition':
    case 'number_pattern':
      return hintPattern(question, userAnswer)
    case 'shape_recognition':
      return baseHint('提示：对照上面的图形，想想它的名字 🔷', 'match_visual', userAnswer, { focusShape: true })
    case 'shape_composition':
      return baseHint('提示：想想拼完以后整体像什么形状？🧩', 'compose', userAnswer)
    case 'symmetry':
      return baseHint('提示：从中间对折，两边能重合吗？🪞', 'symmetry', userAnswer)
    case 'spatial_position':
      return hintSpatial(question, userAnswer)
    case 'fractions_intro':
    case 'fractions_basic':
      return hintFractions(question, userAnswer)
    default:
      return null
  }
}

function hintEmojiAnswer(question, userAnswer) {
  if (question.visual?.type === 'sequence') {
    return hintPattern(question, userAnswer)
  }
  return baseHint('提示：再看看上面的图形或规律 👀', 'relook_emoji', userAnswer, { focusVisual: true })
}

function hintTextAnswer(question, userAnswer) {
  if (question.visual) {
    return baseHint('提示：再看看上面的图，选一个不同的 👀', 'relook', userAnswer, { focusVisual: true })
  }
  return baseHint('提示：再仔细想一想～', 'generic', userAnswer)
}

/** 答错后再试：给出方向性提示，不泄露答案 */
export function getRetryHint(question, userAnswer) {
  const { answer } = question

  if (typeof answer === 'number' && typeof userAnswer === 'number') {
    const diff = userAnswer - answer
    if (diff > 0) {
      return baseHint('提示：试试更小的数 👇', 'lower', userAnswer)
    }
    if (diff < 0) {
      return baseHint('提示：试试更大的数 👆', 'higher', userAnswer)
    }
  }

  const skillHint = hintBySkill(question, userAnswer)
  if (skillHint) return skillHint

  if (isEmojiString(answer)) {
    return hintEmojiAnswer(question, userAnswer)
  }

  if (typeof answer === 'string') {
    return hintTextAnswer(question, userAnswer)
  }

  return baseHint('提示：再仔细想一想～', 'generic', userAnswer)
}

/** 再试时将选择题升级为 manipulative（若已备 fallback） */
export function upgradeQuestionToInteractive(question) {
  if (!question || question.manipulative) return question
  if (!question.interactiveFallback) return question
  return {
    ...question,
    manipulative: question.interactiveFallback,
    visual: null,
  }
}

export function getChoiceHintStyle(option, retryHint, answer) {
  if (!retryHint) return null
  if (option === answer || option === retryHint.userAnswer) return null

  if (typeof answer === 'number' && typeof option === 'number') {
    const ua = retryHint.userAnswer
    if (retryHint.direction === 'lower' && option < ua && option >= answer) {
      return HINT_STYLE
    }
    if (retryHint.direction === 'higher' && option > ua && option <= answer) {
      return HINT_STYLE
    }
  }

  if (typeof answer === 'string' && typeof option === 'string') {
    if (retryHint.direction === 'spatial_flip' && option === SPATIAL_OPPOSITES[retryHint.userAnswer]) {
      return null
    }

    if (retryHint.direction === 'fraction_quarter' && option.includes('四')) {
      return null
    }
    if (retryHint.direction === 'fraction_third' && option.includes('三')) {
      return null
    }
    if (retryHint.direction === 'fraction_half' && option.includes('一') && option.includes('半')) {
      return null
    }

    if (retryHint.direction === 'odd_one_out') {
      return null
    }
  }

  if (isEmojiString(option) && isEmojiString(answer)) {
    if (['pattern_alternate', 'pattern_repeat', 'relook_emoji'].includes(retryHint.direction)) {
      return null
    }
  }

  return null
}

/** QuestionVisual 侧向高亮（比较堆、问号位、图形等） */
export function getVisualFocus(retryHint) {
  if (!retryHint) return null
  return {
    focusSide: retryHint.focusSide || null,
    focusMissing: retryHint.focusMissing || false,
    focusShape: retryHint.focusShape || false,
    focusScene: retryHint.focusScene || false,
    focusVisual: retryHint.focusVisual || false,
  }
}
