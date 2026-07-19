/**
 * 规律与分类
 */

import {
  buildQuestion, makeChoices, pickOne, pickOneManipulative, sequenceVisual, shuffle,
  sortBinsManipulative,
} from './_utils.js'
import { shouldUseInteractive } from '../retrySupport.js'

const COLOR_PATTERNS = [
  { items: ['🔴', '🔵', '🔴', '🔵'], answer: '🔴' },
  { items: ['🟡', '🟢', '🟡', '🟢'], answer: '🟡' },
  { items: ['⭐', '⭐', '🌙', '⭐', '⭐'], answer: '🌙' },
  { items: ['🍎', '🍊', '🍎', '🍊', '🍎'], answer: '🍊' },
]

const NUMBER_STEPS = [
  { step: 2, start: 2, len: 4 },
  { step: 5, start: 5, len: 3 },
  { step: 10, start: 10, len: 3 },
]

const CLASS_GROUPS = [
  { category: '水果', members: ['🍎', '🍊', '🍇', '🍓'], outsider: '🚗' },
  { category: '动物', members: ['🐱', '🐶', '🐰', '🐼'], outsider: '🍎' },
  { category: '学习用品', members: ['✏️', '📏', '📐', '🖍️'], outsider: '⚽' },
]

export function generateQuestion(skillId, options = {}) {
  if (skillId === 'classification') return genClassification(options)
  return genPattern(skillId, options)
}

function genPattern(skillId, options) {
  const { difficulty = 1, forceInteractive = false } = options
  const useNumbers = difficulty > 1 && Math.random() > 0.35

  if (useNumbers) {
    const cfg = pickOne(NUMBER_STEPS)
    const seq = Array.from({ length: cfg.len }, (_, i) => cfg.start + cfg.step * i)
    const answer = cfg.start + cfg.step * cfg.len
    const range = { min: 1, max: 20 }
    const choice = makeChoices(answer, [answer - 1, answer + cfg.step, answer - cfg.step])
    const sequence = sequenceVisual([...seq, '?'], seq.length)
    const pickFallback = pickOneManipulative({
      variant: 'pattern_number',
      options: choice.options,
      answer,
      sequence,
      style: 'text',
    })
    const useManipulative = shouldUseInteractive(difficulty, forceInteractive)

    return buildQuestion({
      skillId,
      prompt: '找规律，下一个数是？',
      promptNarrative: `每次加 ${cfg.step}，下一个数是 ${answer}`,
      answer,
      visual: useManipulative ? null : sequence,
      manipulative: useManipulative ? pickFallback : null,
      interactiveFallback: useManipulative ? null : pickFallback,
      choice,
      difficulty,
    })
  }

  const pat = pickOne(COLOR_PATTERNS)
  const display = [...pat.items, '?']
  const distractors = shuffle(['🔴', '🔵', '🟡', '🟢', '🌙', '⭐', '🍎', '🍊'].filter(e => e !== pat.answer)).slice(0, 3)
  const choice = { ...makeChoices(pat.answer, distractors), style: 'emoji' }
  const sequence = sequenceVisual(display, display.length - 1)
  const pickFallback = pickOneManipulative({
    variant: 'pattern_next',
    options: choice.options,
    answer: pat.answer,
    sequence,
    style: 'emoji',
  })
  const useManipulative = shouldUseInteractive(difficulty, forceInteractive)

  return buildQuestion({
    skillId,
    prompt: '找规律，下一个是什么？',
    promptNarrative: '看看颜色或图案的规律，选出下一个',
    answer: pat.answer,
    visual: useManipulative ? null : sequence,
    manipulative: useManipulative ? pickFallback : null,
    interactiveFallback: useManipulative ? null : pickFallback,
    choice,
    difficulty,
  })
}

function genClassification(options) {
  const { difficulty = 1, forceInteractive = false } = options
  const group = pickOne(CLASS_GROUPS)
  const members = group.members.slice(0, 3)
  const optionsList = shuffle([...members, group.outsider])
  const pickFallback = pickOneManipulative({
    variant: 'classification',
    options: optionsList,
    answer: group.outsider,
    hint: `👆 点一点，哪个不是${group.category}？`,
    style: 'emoji',
  })
  const sortManip = sortBinsManipulative(
    optionsList,
    [
      { id: 'in', label: group.category, members },
      { id: 'out', label: `不是${group.category}`, members: [group.outsider] },
    ],
    `先点物品，再放进「${group.category}」或「不是」`,
  )

  // 强制交互时交替使用分拣教具（skillGraph 声明的 sort）
  if (forceInteractive && Math.random() >= 0.5) {
    return buildQuestion({
      skillId: 'classification',
      prompt: `把物品分一分：哪些是${group.category}？`,
      promptNarrative: `把${group.category}放一边，不是的放另一边`,
      answer: 'sorted',
      manipulative: sortManip,
      interactiveFallback: pickFallback,
      choice: { options: optionsList, answer: group.outsider, style: 'emoji' },
      difficulty,
    })
  }

  const useManipulative = shouldUseInteractive(difficulty, forceInteractive)
  return buildQuestion({
    skillId: 'classification',
    prompt: `哪个不是${group.category}？`,
    promptNarrative: `找出不一样的，哪个不是${group.category}？`,
    answer: group.outsider,
    manipulative: useManipulative ? pickFallback : null,
    interactiveFallback: useManipulative ? null : pickFallback,
    choice: { options: optionsList, answer: group.outsider, style: 'emoji' },
    difficulty,
  })
}
