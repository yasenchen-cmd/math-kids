import { describe, it, expect } from 'vitest'
import { getAllSkills } from '../src/engine/skillGraph.js'
import {
  generateQuestion,
  isSkillImplemented,
  getImplementedSkillIds,
} from '../src/engine/questionGenerator.js'

describe('isSkillImplemented', () => {
  it('returns true for all skill graph entries', () => {
    for (const skill of getAllSkills()) {
      expect(isSkillImplemented(skill.id)).toBe(true)
    }
  })
})

describe('generateQuestion quality', () => {
  it('every skill has prompt, answer, and valid choices', () => {
    for (const skillId of getImplementedSkillIds()) {
      const q = generateQuestion(skillId, { difficulty: 2 })
      expect(q.skillId).toBe(skillId)
      expect(q.prompt).toBeTruthy()
      expect(q.promptNarrative).toBeTruthy()
      expect(q.answer).toBeDefined()
      expect(q.choice.options).toContain(q.answer)
    }
  })

  it('most skills include visual context for young learners', () => {
    const withVisual = getImplementedSkillIds().filter(id => {
      const q = generateQuestion(id, { difficulty: 2 })
      return q.visual || q.manipulative
    })
    expect(withVisual.length).toBeGreaterThanOrEqual(25)
  })

  it('domain-specific prompts are meaningful', () => {
    expect(generateQuestion('shape_recognition').prompt).toMatch(/形状/)
    expect(generateQuestion('multiplication_2_5').prompt).toMatch(/×/)
    expect(generateQuestion('time_basic').prompt).toMatch(/几点/)
    expect(generateQuestion('quantity_comparison').prompt).toMatch(/更多/)
    expect(generateQuestion('make_ten').prompt).toMatch(/凑/)
  })

  it('number_recognition differs from pure counting', () => {
    const q = generateQuestion('number_recognition', { difficulty: 1 })
    expect(q.prompt).toMatch(/数字/)
  })

  it('counting_1_100 avoids rendering 100 individual items', () => {
    const q = generateQuestion('counting_1_100', { difficulty: 2 })
    const itemCount = q.visual?.items?.length || q.manipulative?.items?.length || 0
    expect(itemCount).toBeLessThanOrEqual(10)
  })
})

describe('skill graph coverage', () => {
  it('all 29 skills have dedicated generators', () => {
    expect(getAllSkills().length).toBe(29)
    expect(getImplementedSkillIds().length).toBe(29)
  })
})
