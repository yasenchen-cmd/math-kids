import { describe, it, expect } from 'vitest'
import {
  getRetryHint,
  upgradeQuestionToInteractive,
  getChoiceHintStyle,
  getVisualFocus,
  isEmojiString,
  shouldUseInteractive,
  INTERACTIVE_DIFFICULTY_CAP,
} from '../src/engine/retrySupport.js'
import { generateQuestion } from '../src/engine/generators/subtraction.js'
import { generateQuestion as genAddition } from '../src/engine/generators/addition.js'
import { generateQuestion as genMultiplication } from '../src/engine/generators/multiplication.js'
import { generateQuestion as genComparison } from '../src/engine/generators/comparison.js'
import { generateQuestion as genPattern } from '../src/engine/generators/pattern.js'
import { generateQuestion as genGeometry } from '../src/engine/generators/geometry.js'
import { generateQuestion as genFractions } from '../src/engine/generators/fractions.js'

describe('getRetryHint — numeric', () => {
  it('suggests lower when user answer is too high', () => {
    const hint = getRetryHint({ answer: 5 }, 8)
    expect(hint.direction).toBe('lower')
    expect(hint.text).toMatch(/更小/)
    expect(hint.userAnswer).toBe(8)
  })

  it('suggests higher when user answer is too low', () => {
    const hint = getRetryHint({ answer: 7 }, 3)
    expect(hint.direction).toBe('higher')
    expect(hint.text).toMatch(/更大/)
  })
})

describe('getRetryHint — comparison', () => {
  it('points to side B when user wrongly picks A more', () => {
    const q = {
      skillId: 'quantity_comparison',
      answer: 'B 更多',
      visual: { type: 'compare', left: { count: 3, emoji: '🍎' }, right: { count: 7, emoji: '🐱' } },
    }
    const hint = getRetryHint(q, 'A 更多')
    expect(hint.text).toMatch(/B/)
    expect(hint.focusSide).toBe('B')
    expect(hint.direction).toBe('focus_b')
  })

  it('suggests equal when counts match', () => {
    const q = {
      skillId: 'quantity_comparison',
      answer: '一样多',
      visual: { type: 'compare', left: { count: 4, emoji: '🍎' }, right: { count: 4, emoji: '🐱' } },
    }
    const hint = getRetryHint(q, 'A 更多')
    expect(hint.direction).toBe('equal')
    expect(hint.focusSide).toBe('both')
  })
})

describe('getRetryHint — pattern & classification', () => {
  it('hints alternating pattern for emoji sequences', () => {
    const q = {
      skillId: 'pattern_recognition',
      answer: '🔴',
      visual: { type: 'sequence', numbers: ['🔴', '🔵', '🔴', '🔵', '?'], missingIndex: 4 },
    }
    const hint = getRetryHint(q, '🟡')
    expect(hint.direction).toBe('pattern_alternate')
    expect(hint.focusMissing).toBe(true)
  })

  it('hints category for classification', () => {
    const q = genPattern('classification', { difficulty: 1 })
    const wrong = q.choice.options.find(o => o !== q.answer)
    const hint = getRetryHint(q, wrong)
    expect(hint.direction).toBe('odd_one_out')
    expect(hint.text).toMatch(/不是/)
  })
})

describe('getRetryHint — geometry & fractions', () => {
  it('hints spatial flip when opposite direction chosen', () => {
    const q = genGeometry('spatial_position', { difficulty: 1 })
    const opposite = q.choice.options.find(o => o !== q.answer)
    const hint = getRetryHint(q, opposite)
    if (['左边', '右边', '上面', '下面'].includes(q.answer) && ['左边', '右边', '上面', '下面'].includes(opposite)) {
      const opposites = { 左边: '右边', 右边: '左边', 上面: '下面', 下面: '上面' }
      if (opposites[opposite] === q.answer) {
        expect(hint.direction).toBe('spatial_flip')
        expect(hint.text).toMatch(/另一边/)
      }
    }
  })

  it('hints fraction parts from visual', () => {
    const q = genFractions('fractions_intro', { difficulty: 1 })
    const wrong = q.choice.options.find(o => o !== q.answer)
    const hint = getRetryHint(q, wrong)
    expect(['fraction_half', 'fraction_third', 'fraction_quarter', 'fraction_parts']).toContain(hint.direction)
  })

  it('focuses shape visual on shape recognition retry', () => {
    const q = genGeometry('shape_recognition', { difficulty: 1 })
    const wrong = q.choice.options.find(o => o !== q.answer)
    const hint = getRetryHint(q, wrong)
    expect(hint.direction).toBe('match_visual')
    expect(hint.focusShape).toBe(true)
  })
})

describe('getRetryHint — emoji answers', () => {
  it('uses symmetry hint for emoji symmetry questions', () => {
    const q = genGeometry('symmetry', { difficulty: 1 })
    const wrong = q.choice.options.find(o => o !== q.answer)
    const hint = getRetryHint(q, wrong)
    expect(hint.direction).toBe('symmetry')
    expect(isEmojiString(q.answer)).toBe(true)
  })
})

describe('upgradeQuestionToInteractive', () => {
  it('upgrades choice-only subtraction to drag_split', () => {
    const q = generateQuestion('subtraction_within_10', { difficulty: 5 })
    expect(q.manipulative).toBeNull()
    expect(q.interactiveFallback?.mode).toBe('drag_split')

    const upgraded = upgradeQuestionToInteractive(q)
    expect(upgraded.manipulative?.mode).toBe('drag_split')
    expect(upgraded.visual).toBeNull()
  })

  it('does not double-upgrade when already manipulative', () => {
    const q = generateQuestion('subtraction_meaning', { difficulty: 1 })
    expect(q.manipulative?.mode).toBe('drag_split')
    expect(upgradeQuestionToInteractive(q)).toBe(q)
  })

  it('upgrades addition at high difficulty via interactiveFallback', () => {
    const q = genAddition('addition_basic', { difficulty: 5 })
    if (!q.interactiveFallback) return
    const upgraded = upgradeQuestionToInteractive(q)
    expect(upgraded.manipulative?.mode).toBe('drag_combine')
  })

  it('upgrades multiplication to fill_array', () => {
    const q = genMultiplication('multiplication_meaning', { difficulty: 5 })
    expect(q.interactiveFallback?.mode).toBe('fill_array')
    const upgraded = upgradeQuestionToInteractive(q)
    expect(upgraded.manipulative?.mode).toBe('fill_array')
  })
})

describe('getChoiceHintStyle', () => {
  const hintLower = { direction: 'lower', userAnswer: 8 }
  const hintHigher = { direction: 'higher', userAnswer: 3 }

  it('highlights options between wrong and correct when too high', () => {
    const style = getChoiceHintStyle(6, hintLower, 5)
    expect(style).not.toBeNull()
    expect(style.borderColor).toBe('#FFB347')
  })

  it('does not highlight the wrong answer itself', () => {
    expect(getChoiceHintStyle(8, hintLower, 5)).toBeNull()
  })

  it('does not highlight the correct answer', () => {
    expect(getChoiceHintStyle(5, hintLower, 5)).toBeNull()
  })

  it('does not reveal spatial opposite as highlight', () => {
    const hint = { direction: 'spatial_flip', userAnswer: '左边' }
    expect(getChoiceHintStyle('右边', hint, '右边')).toBeNull()
  })

  it('does not highlight classification options', () => {
    const q = genPattern('classification', { difficulty: 1 })
    const wrong = q.choice.options.find(o => o !== q.answer)
    const hint = getRetryHint(q, wrong)
    for (const opt of q.choice.options) {
      if (opt !== q.answer) {
        expect(getChoiceHintStyle(opt, hint, q.answer)).toBeNull()
      }
    }
  })
})

describe('getVisualFocus', () => {
  it('maps comparison hint to side focus', () => {
    const q = genComparison('quantity_comparison', { difficulty: 2 })
    const wrong = q.answer === 'A 更多' ? 'B 更多' : 'A 更多'
    const hint = getRetryHint(q, wrong)
    const focus = getVisualFocus(hint)
    expect(focus?.focusSide).toBeTruthy()
  })

  it('maps pattern hint to missing cell focus', () => {
    const q = {
      skillId: 'pattern_recognition',
      answer: '🔴',
      visual: { type: 'sequence', numbers: ['🔴', '🔵', '?'], missingIndex: 2 },
    }
    const focus = getVisualFocus(getRetryHint(q, '🔵'))
    expect(focus?.focusMissing).toBe(true)
  })
})

describe('shouldUseInteractive', () => {
  it('respects forceInteractive', () => {
    expect(shouldUseInteractive(10, true)).toBe(true)
  })

  it('uses difficulty cap by default', () => {
    expect(shouldUseInteractive(INTERACTIVE_DIFFICULTY_CAP, false)).toBe(true)
    expect(shouldUseInteractive(INTERACTIVE_DIFFICULTY_CAP + 1, false)).toBe(false)
  })
})
