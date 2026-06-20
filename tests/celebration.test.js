import { describe, it, expect } from 'vitest'
import { pickLine } from '../src/data/characters.js'
import { STYLE_BY_TYPE } from '../src/components/CelebrationEffect.jsx'
import { createPacingDirector } from '../src/engine/director/pacingDirector.js'
import { Events } from '../src/engine/director/eventBus.js'

describe('retry success celebration', () => {
  it('provides retry_correct lines for each character area', () => {
    const areas = ['number_sense', 'patterns', 'addition', 'subtraction', 'geometry', 'multiplication', 'advanced', 'minnan_secret']
    for (const area of areas) {
      const line = pickLine(area, 'retry_correct')
      expect(line.length).toBeGreaterThan(0)
      expect(line).not.toEqual(pickLine(area, 'correct'))
    }
  })

  it('uses gentler retry_correct celebration config', () => {
    expect(STYLE_BY_TYPE.retry_correct.count).toBeLessThan(STYLE_BY_TYPE.correct.count)
    expect(STYLE_BY_TYPE.retry_correct.variant).toBe('rise')
    expect(STYLE_BY_TYPE.correct.variant).toBe('burst')
  })

  it('skips director celebrate when answer was retried', () => {
    const director = createPacingDirector()
    const fresh = director.handleEvent(Events.ANSWER_CORRECT, { streak: 1, retried: false })
    const retried = director.handleEvent(Events.ANSWER_CORRECT, { streak: 1, retried: true })

    expect(fresh.some(d => d.type === 'celebrate')).toBe(true)
    expect(retried.some(d => d.type === 'celebrate')).toBe(false)
    director.destroy()
  })
})
