import { describe, it, expect } from 'vitest'
import { parseChineseNumber } from '../src/hooks/useSpeechRecognition.js'
import { generateQuestion } from '../src/engine/questionGenerator.js'

describe('parseChineseNumber', () => {
  it('parses arabic digits', () => {
    expect(parseChineseNumber('有3个')).toBe(3)
  })

  it('parses chinese digits', () => {
    expect(parseChineseNumber('五个')).toBe(5)
    expect(parseChineseNumber('两')).toBe(2)
  })

  it('parses teens', () => {
    expect(parseChineseNumber('十二')).toBe(12)
    expect(parseChineseNumber('二十')).toBe(20)
  })
})

describe('counting say-first flow', () => {
  it('enables sayFirst for basic counting skills', () => {
    for (const skillId of ['counting_1_5', 'counting_1_10', 'counting_1_20']) {
      const q = generateQuestion(skillId, { difficulty: 1 })
      expect(q.manipulative?.sayFirst).toBe(true)
      expect(q.prompt).toMatch(/说出来/)
    }
  })

  it('enables sayFirst for small number_recognition fallback', () => {
    for (let i = 0; i < 10; i++) {
      const q = generateQuestion('number_recognition', { difficulty: 1 })
      if (q.interactiveFallback && q.answer <= 6) {
        expect(q.interactiveFallback.sayFirst).toBe(true)
        return
      }
    }
  })
})
