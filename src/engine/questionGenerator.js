/**
 * 题目生成器入口
 * 根据技能 ID 自动路由到对应的生成器
 *
 * 使用 ESM 静态导入 + 函数映射，无需动态 require
 */

import { generateQuestion as genCounting } from './generators/counting'
import { generateQuestion as genAddition } from './generators/addition'
import { generateQuestion as genSubtraction } from './generators/subtraction'
import { generateQuestion as genComparison } from './generators/comparison'

const ROUTER = {
  counting_1_5:        genCounting,
  counting_1_10:       genCounting,
  counting_1_20:       genCounting,
  counting_1_100:      genCounting,
  number_recognition:  genCounting,
  quantity_comparison: genComparison,
  addition_meaning:     genAddition,
  addition_within_5:   genAddition,
  addition_within_10:  genAddition,
  make_ten:            genAddition,
  addition_within_20:  genAddition,
  subtraction_meaning:    genSubtraction,
  subtraction_within_5:  genSubtraction,
  subtraction_within_10: genSubtraction,
}

export function generateQuestion(skillId, options = {}) {
  const fn = ROUTER[skillId]
  if (fn) return fn(skillId, options)
  return genFallback(skillId, options)
}

function genFallback(skillId, options) {
  const { difficulty = 1 } = options
  const a = Math.floor(Math.random() * 5) + 1
  const b = Math.floor(Math.random() * 5) + 1
  const answer = a + b
  return {
    skillId,
    prompt: `${a} + ${b} = ?`,
    answer,
    choice: { options: shuffle([answer, answer+1, answer-1, answer+2]), answer },
    manipulative: null,
    difficulty,
  }
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
