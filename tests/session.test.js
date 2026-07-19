import { describe, it, expect } from 'vitest'
import { generateUniqueQuestion, generateQuestion } from '../src/engine/questionGenerator.js'
import { questionFingerprint } from '../src/engine/generators/_utils.js'
import { generateQuestion as genSubtraction } from '../src/engine/generators/subtraction.js'
import { generateQuestion as genAddition } from '../src/engine/generators/addition.js'
import { generateQuestion as genDivision } from '../src/engine/generators/division.js'
import { generateQuestion as genMultiplication } from '../src/engine/generators/multiplication.js'
import { applyInterventions, resetActiveInterventions } from '../src/engine/interventionMatrix.js'
import { upgradeQuestionToInteractive } from '../src/engine/retrySupport.js'

describe('generateUniqueQuestion', () => {
  it('avoids duplicate fingerprints within a session', () => {
    const seen = new Set()
    const fps = []
    for (let i = 0; i < 5; i++) {
      const q = generateUniqueQuestion('addition_within_5', { difficulty: 3 }, seen)
      seen.add(questionFingerprint(q))
      fps.push(questionFingerprint(q))
    }
    expect(new Set(fps).size).toBe(5)
  })
})

describe('subtraction drag_split', () => {
  it('uses manipulative at low difficulty', () => {
    const q = genSubtraction('subtraction_meaning', { difficulty: 1 })
    expect(q.manipulative?.mode).toBe('drag_split')
    expect(q.visual).toBeNull()
  })

  it('uses choice at high difficulty', () => {
    const q = genSubtraction('subtraction_within_10', { difficulty: 4 })
    expect(q.manipulative).toBeNull()
    expect(q.visual?.type).toBe('emoji_grid')
  })
})

describe('addition drag-first', () => {
  it('uses drag at low difficulty for addition_meaning', () => {
    const q = genAddition('addition_meaning', { difficulty: 1 })
    expect(q.manipulative?.mode).toBe('drag_combine')
  })

  it('uses choice at high difficulty for addition_within_5', () => {
    const q = genAddition('addition_within_5', { difficulty: 4 })
    expect(q.manipulative).toBeNull()
    expect(q.visual?.type).toBe('emoji_grid')
  })

  it('make_ten uses drag_to_target only at low difficulty', () => {
    const low = genAddition('make_ten', { difficulty: 1 })
    const high = genAddition('make_ten', { difficulty: 4 })
    expect(low.manipulative?.mode).toBe('drag_to_target')
    expect(high.manipulative).toBeNull()
  })
})

describe('emoji choice style', () => {
  it('classification marks emoji style', () => {
    const q = generateQuestion('classification', { difficulty: 1 })
    expect(q.choice.style).toBe('emoji')
  })
})

describe('division drag_share', () => {
  it('uses share manipulative at low difficulty', () => {
    const q = genDivision('division_basic', { difficulty: 2 })
    expect(q.manipulative?.mode).toBe('drag_share')
    expect(q.visual).toBeNull()
  })

  it('uses choice at high difficulty without forceInteractive', () => {
    const q = genDivision('division_basic', { difficulty: 5 })
    expect(q.manipulative).toBeNull()
    expect(q.visual?.type).toBe('emoji_grid')
  })

  it('forces share when forceInteractive', () => {
    const q = genDivision('division_basic', { difficulty: 5, forceInteractive: true })
    expect(q.manipulative?.mode).toBe('drag_share')
  })
})

describe('wrong-answer recovery via forceInteractive', () => {
  it('addition switches to drag when forceInteractive', () => {
    const q = genAddition('addition_within_5', { difficulty: 5, forceInteractive: true })
    expect(q.manipulative?.mode).toBe('drag_combine')
  })

  it('intervention triggers on consecutive error', () => {
    resetActiveInterventions()
    const { options, feedback } = applyInterventions({ consecutiveErrors: 1 })
    expect(options.forceInteractive).toBe(true)
    expect(feedback).toContain('试一试')
  })
})

describe('multiplication fill_array', () => {
  it('uses fill_array at low difficulty', () => {
    const q = genMultiplication('multiplication_meaning', { difficulty: 2 })
    expect(q.manipulative?.mode).toBe('fill_array')
    expect(q.manipulative.rows).toBeGreaterThan(0)
    expect(q.visual).toBeNull()
  })

  it('uses choice at high difficulty', () => {
    const q = genMultiplication('multiplication_2_5', { difficulty: 5 })
    expect(q.manipulative).toBeNull()
    expect(q.visual?.type).toBe('groups')
  })

  it('forces fill_array when forceInteractive', () => {
    const q = genMultiplication('multiplication_3_4', { difficulty: 5, forceInteractive: true })
    expect(q.manipulative?.mode).toBe('fill_array')
  })
})

describe('interactiveFallback upgrades', () => {
  it('comparison upgrades to compare_count', () => {
    const q = generateQuestion('quantity_comparison', { difficulty: 2 })
    expect(q.interactiveFallback?.mode).toBe('compare_count')
    const upgraded = upgradeQuestionToInteractive(q)
    expect(upgraded.manipulative?.mode).toBe('compare_count')
    expect(upgraded.visual).toBeNull()
  })

  it('number_recognition upgrades to count', () => {
    const q = generateQuestion('number_recognition', { difficulty: 2 })
    expect(q.interactiveFallback?.mode).toBe('count')
    expect(upgradeQuestionToInteractive(q).manipulative?.mode).toBe('count')
  })

  it('place_value upgrades to count or drag_combine', () => {
    for (let i = 0; i < 8; i++) {
      const q = generateQuestion('place_value', { difficulty: 2 })
      expect(['count', 'drag_combine']).toContain(q.interactiveFallback?.mode)
    }
  })

  it('counting_1_100 tens uses mapped submit answer', () => {
    for (let i = 0; i < 15; i++) {
      const q = generateQuestion('counting_1_100', { difficulty: 3 })
      if (q.interactiveFallback?.mode === 'count' && q.interactiveFallback.answer !== q.interactiveFallback.count) {
        expect(q.interactiveFallback.answer % 10).toBe(0)
        return
      }
    }
  })
})

describe('pattern pick_one', () => {
  it('classification uses pick_one at low difficulty', () => {
    const q = generateQuestion('classification', { difficulty: 1 })
    expect(q.manipulative?.mode).toBe('pick_one')
    expect(q.manipulative?.variant).toBe('classification')
    expect(q.visual).toBeNull()
  })

  it('classification has pick_one fallback at high difficulty', () => {
    const q = generateQuestion('classification', { difficulty: 5 })
    expect(q.manipulative).toBeNull()
    expect(q.interactiveFallback?.mode).toBe('pick_one')
    expect(upgradeQuestionToInteractive(q).manipulative?.variant).toBe('classification')
  })

  it('emoji pattern includes sequence in pick_one', () => {
    for (let i = 0; i < 10; i++) {
      const q = generateQuestion('pattern_recognition', { difficulty: 1 })
      if (q.manipulative?.mode === 'pick_one') {
        expect(q.manipulative.sequence?.numbers).toContain('?')
        expect(q.manipulative.style).toBe('emoji')
        return
      }
    }
  })

  it('numeric pattern uses pick_one fallback', () => {
    for (let i = 0; i < 15; i++) {
      const q = generateQuestion('pattern_recognition', { difficulty: 4 })
      if (q.interactiveFallback?.variant === 'pattern_number') {
        expect(q.interactiveFallback.mode).toBe('pick_one')
        expect(q.interactiveFallback.sequence?.numbers).toContain('?')
        return
      }
    }
  })
})
