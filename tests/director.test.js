import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SessionState, Events, createPacingDirector, eventBus } from '../src/engine/director/index.js'
import { applyInterventions, resetActiveInterventions } from '../src/engine/interventionMatrix.js'

describe('SessionState', () => {
  let session

  beforeEach(() => {
    session = new SessionState()
    session.reset()
  })

  afterEach(() => {
    session.destroy()
  })

  it('increments streak on correct and resets on wrong', () => {
    session.handleEvent(Events.ANSWER_CORRECT)
    session.handleEvent(Events.ANSWER_CORRECT)
    expect(session.context.streak).toBe(2)
    expect(session.context.errors).toBe(0)

    session.handleEvent(Events.ANSWER_WRONG)
    expect(session.context.streak).toBe(0)
    expect(session.context.errors).toBe(1)
  })
})

describe('PacingDirector', () => {
  it('emits celebrate directive on correct in EXPLORING', () => {
    const director = createPacingDirector()
    const seen = []
    const unsub = eventBus.on(Events.DIRECTIVE_ISSUED, (d) => seen.push(d))

    director.handleEvent(Events.ANSWER_CORRECT, { retried: false })

    expect(seen.some(d => d.type === 'celebrate')).toBe(true)
    unsub()
    director.destroy()
  })
})

describe('interventionMatrix', () => {
  beforeEach(() => {
    resetActiveInterventions()
  })

  it('consecutive errors trigger recovery options', () => {
    const profile = {
      consecutiveErrors: 3,
      skillErrors: {},
      digitConfusion: {},
      calculationOffset: {},
      directionErrors: 0,
      totalAttempts: 5,
    }
    const { options, activeIds } = applyInterventions(profile)
    expect(activeIds.length).toBeGreaterThan(0)
    expect(
      options.forceInteractive === true ||
      (typeof options.difficultyBoost === 'number' && options.difficultyBoost < 0) ||
      options.stepByStep === true,
    ).toBe(true)
  })
})
