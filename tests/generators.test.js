import { describe, it, expect } from 'vitest'
import { generateQuestion } from '../src/engine/generators/geometry.js'
import { generateQuestion as genPattern } from '../src/engine/generators/pattern.js'
import { generateQuestion as genComparison } from '../src/engine/generators/comparison.js'
import { generateQuestion as genMakeTen } from '../src/engine/generators/addition.js'

describe('geometry generator', () => {
  it('shape_recognition uses shape names as answers', () => {
    const q = generateQuestion('shape_recognition', { difficulty: 1 })
    expect(['圆形', '三角形', '正方形', '长方形', '星星']).toContain(q.answer)
    expect(q.visual?.type).toBe('shape_show')
  })

  it('spatial_position does not leak the answer in prompt', () => {
    const q = generateQuestion('spatial_position', { difficulty: 1 })
    expect(q.prompt).not.toContain(`${q.answer}是哪个方向`)
    expect(['左边', '右边', '上面', '下面']).toContain(q.answer)
  })
})

describe('pattern generator', () => {
  it('classification uses emoji options', () => {
    const q = genPattern('classification', { difficulty: 1 })
    expect(q.prompt).toMatch(/哪个不是/)
    expect(q.choice.options).toContain(q.answer)
  })
})

describe('comparison generator', () => {
  it('shows A/B piles visually', () => {
    const q = genComparison('quantity_comparison', { difficulty: 2 })
    expect(q.visual?.type).toBe('compare')
    expect(q.answer).toMatch(/更多|一样多/)
  })
})

describe('make_ten generator', () => {
  it('always sums to 10', () => {
    for (let i = 0; i < 10; i++) {
      const q = genMakeTen('make_ten', { difficulty: 1 })
      expect(q.answer).toBe(10)
      expect(q.prompt).toMatch(/凑/)
    }
  })
})
