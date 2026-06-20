import { describe, it, expect } from 'vitest'
import { recordAttempt } from '../src/engine/errorProfile.js'

const baseProfile = {
  digitConfusion: {},
  calculationOffset: {},
  directionErrors: 0,
  skillErrors: {},
  consecutiveErrors: 0,
  totalAttempts: 0,
  skillScores: {},
  skillHistory: {},
}

describe('recordAttempt', () => {
  it('updates skillScores from rolling history', () => {
    const afterCorrect = recordAttempt(baseProfile, 'counting_1_5', { answer: 3 }, 3, true)
    expect(afterCorrect.skillScores.counting_1_5).toBe(100)
    expect(afterCorrect.skillHistory.counting_1_5).toEqual([1])
  })

  it('increments skillErrors on wrong answer', () => {
    const afterWrong = recordAttempt(baseProfile, 'counting_1_5', { answer: 3 }, 4, false)
    expect(afterWrong.skillErrors.counting_1_5).toBe(1)
    expect(afterWrong.consecutiveErrors).toBe(1)
  })

  it('resets consecutiveErrors after correct answer', () => {
    const withErrors = {
      ...baseProfile,
      consecutiveErrors: 2,
      skillErrors: { counting_1_5: 2 },
      skillHistory: { counting_1_5: [0, 0] },
      skillScores: { counting_1_5: 0 },
    }
    const afterCorrect = recordAttempt(withErrors, 'counting_1_5', { answer: 3 }, 3, true)
    expect(afterCorrect.consecutiveErrors).toBe(0)
  })

  it('does not mutate input profile', () => {
    const frozen = { ...baseProfile, skillErrors: {}, skillScores: {}, skillHistory: {} }
    recordAttempt(frozen, 'counting_1_5', { answer: 2 }, 2, true)
    expect(frozen.totalAttempts).toBe(0)
    expect(frozen.skillScores).toEqual({})
  })
})
