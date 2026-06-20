import { describe, it, expect } from 'vitest'
import {
  getAdaptiveConfig,
  calcMastery,
  isSkillMastered,
  areDepsMet,
} from '../src/engine/adaptive.js'

describe('getAdaptiveConfig', () => {
  it('raises helpLevel when skillErrors exceed threshold', () => {
    const skillScores = { counting_1_5: 75 }
    const withoutErrors = getAdaptiveConfig('counting_1_5', skillScores, { skillErrors: {} })
    const withErrors = getAdaptiveConfig('counting_1_5', skillScores, {
      skillErrors: { counting_1_5: 6 },
    })

    expect(withErrors.helpLevel).toBeGreaterThan(withoutErrors.helpLevel)
    expect(withErrors.autoRead).toBe(true)
  })

  it('ignores wrong errorProfile shape (legacy bug guard)', () => {
    const legacy = { counting_1_5: 99 }
    const config = getAdaptiveConfig('counting_1_5', { counting_1_5: 90 }, legacy)
    expect(config.helpLevel).toBe(0)
  })

  it('prefers interactive when help level is high', () => {
    const cfg = getAdaptiveConfig('counting_1_5', {}, { consecutiveErrors: 1 })
    expect(cfg.preferInteractive).toBe(true)
  })

  it('returns preferInteractive flag', () => {
    const cfg = getAdaptiveConfig('x', { x: 50 }, {})
    expect(cfg).toHaveProperty('preferInteractive')
  })
})

describe('calcMastery', () => {
  it('subtracts 5 points per skill error', () => {
    const mastery = calcMastery('addition_within_5', { addition_within_5: 80 }, {
      skillErrors: { addition_within_5: 3 },
    })
    expect(mastery).toBe(65)
  })

  it('clamps mastery between 0 and 100', () => {
    expect(calcMastery('x', { x: 10 }, { skillErrors: { x: 99 } })).toBe(0)
    expect(calcMastery('x', { x: 100 }, { skillErrors: { x: 0 } })).toBe(100)
  })
})

describe('isSkillMastered', () => {
  it('requires mastery >= 80', () => {
    expect(isSkillMastered('x', { x: 85 }, {})).toBe(true)
    expect(isSkillMastered('x', { x: 75 }, {})).toBe(false)
  })
})

describe('areDepsMet', () => {
  it('returns true when dependency has 5+ attempts', () => {
    const errorProfile = {
      skillHistory: { counting_1_5: [1, 0, 1, 1, 0] },
    }
    expect(areDepsMet(['counting_1_5'], {}, errorProfile)).toBe(true)
  })

  it('returns true when last 2 answers are correct', () => {
    const errorProfile = {
      skillHistory: { counting_1_5: [0, 1, 1] },
    }
    expect(areDepsMet(['counting_1_5'], {}, errorProfile)).toBe(true)
  })

  it('returns false for missing dependency history', () => {
    expect(areDepsMet(['counting_1_5'], {}, {})).toBe(false)
  })

  it('returns true for empty dependencies', () => {
    expect(areDepsMet([], {}, {})).toBe(true)
  })
})
