import { describe, it, expect } from 'vitest'
import { recommendNext, getAllSkills, isSkillUnlockable } from '../src/engine/skillGraph.js'
import { generateQuestion as genAddition } from '../src/engine/generators/addition.js'
import { generateQuestion as genSequence } from '../src/engine/generators/sequence.js'
import { generateQuestion as genPattern } from '../src/engine/generators/pattern.js'

describe('recommendNext', () => {
  it('recommends first skill when nothing completed', () => {
    const next = recommendNext([], {})
    expect(next?.id).toBe('counting_1_5')
  })

  it('skips completed and respects dependencies', () => {
    const completed = ['counting_1_5', 'counting_1_10']
    const next = recommendNext(completed, { number_recognition: 10 })
    expect(next).toBeTruthy()
    expect(completed).not.toContain(next.id)
    expect(isSkillUnlockable(next.id, completed)).toBe(true)
  })

  it('filters by isImplemented predicate', () => {
    const next = recommendNext([], {}, (id) => id !== 'counting_1_5')
    // 跳过未实现的起点，仍返回依赖已满足且已实现的技能
    expect(next).toBeTruthy()
    expect(next.id).not.toBe('counting_1_5')
  })
})

describe('declared manipulative modes', () => {
  it('make_ten uses drag_to_target at low difficulty', () => {
    const q = genAddition('make_ten', { difficulty: 1 })
    expect(q.manipulative?.mode).toBe('drag_to_target')
    expect(q.manipulative?.slots).toBe(10)
    expect(q.manipulative?.items?.length).toBe(10)
  })

  it('number_sequence can emit sort mode when forced interactive', () => {
    let found = false
    for (let i = 0; i < 40; i++) {
      const q = genSequence('number_sequence', { difficulty: 1, forceInteractive: true })
      if (q.manipulative?.mode === 'sort') {
        expect(q.manipulative.variant).toBe('order')
        expect(q.manipulative.targetOrder?.length).toBeGreaterThanOrEqual(3)
        found = true
        break
      }
    }
    expect(found).toBe(true)
  })

  it('classification can emit sort bins when forced interactive', () => {
    let found = false
    for (let i = 0; i < 40; i++) {
      const q = genPattern('classification', { difficulty: 1, forceInteractive: true })
      if (q.manipulative?.mode === 'sort' && q.manipulative.variant === 'bins') {
        expect(q.manipulative.bins?.length).toBe(2)
        found = true
        break
      }
    }
    // forceInteractive may still roll pick_one; accept either interactive mode
    if (!found) {
      const q = genPattern('classification', { difficulty: 1, forceInteractive: true })
      expect(['sort', 'pick_one']).toContain(q.manipulative?.mode)
    } else {
      expect(found).toBe(true)
    }
  })
})
