/**
 * 题目生成器入口
 * 根据技能 ID 自动路由到对应的生成器
 */

import { generateQuestion as genCounting } from './generators/counting'
import { generateQuestion as genAddition } from './generators/addition'
import { generateQuestion as genSubtraction } from './generators/subtraction'
import { generateQuestion as genComparison } from './generators/comparison'
import { generateQuestion as genSequence } from './generators/sequence'
import { generateQuestion as genPlaceValue } from './generators/placeValue'
import { generateQuestion as genPattern } from './generators/pattern'
import { generateQuestion as genGeometry } from './generators/geometry'
import { generateQuestion as genMultiplication } from './generators/multiplication'
import { generateQuestion as genTime } from './generators/time'
import { generateQuestion as genMoney } from './generators/money'
import { generateQuestion as genFractions } from './generators/fractions'
import { generateQuestion as genDivision } from './generators/division'
import { questionFingerprint } from './generators/_utils.js'

const ROUTER = {
  counting_1_5:        genCounting,
  counting_1_10:       genCounting,
  counting_1_20:       genCounting,
  counting_1_100:      genCounting,
  number_recognition:  genCounting,
  quantity_comparison: genComparison,
  number_sequence:     genSequence,
  place_value:         genPlaceValue,
  pattern_recognition: genPattern,
  classification:      genPattern,
  addition_meaning:     genAddition,
  addition_within_5:   genAddition,
  addition_within_10:  genAddition,
  make_ten:            genAddition,
  addition_within_20:  genAddition,
  subtraction_meaning:    genSubtraction,
  subtraction_within_5:  genSubtraction,
  subtraction_within_10: genSubtraction,
  shape_recognition:   genGeometry,
  shape_composition:   genGeometry,
  symmetry:            genGeometry,
  spatial_position:    genGeometry,
  multiplication_meaning: genMultiplication,
  multiplication_2_5:  genMultiplication,
  multiplication_3_4:  genMultiplication,
  time_basic:          genTime,
  money_basic:         genMoney,
  fractions_intro:     genFractions,
  division_basic:      genDivision,
}

export function isSkillImplemented(skillId) {
  return skillId in ROUTER
}

export function getImplementedSkillIds() {
  return Object.keys(ROUTER)
}

export function generateQuestion(skillId, options = {}) {
  const fn = ROUTER[skillId]
  if (fn) return fn(skillId, options)
  return genFallback(skillId, options)
}

/** 一轮答题内避免重复题目 */
export function generateUniqueQuestion(skillId, options = {}, seen = new Set()) {
  let q
  let attempts = 0
  do {
    q = generateQuestion(skillId, options)
    attempts++
  } while (seen.has(questionFingerprint(q)) && attempts < 15)
  return q
}

export { questionFingerprint }

function genFallback(skillId, options) {
  const { difficulty = 1 } = options
  const a = Math.floor(Math.random() * 5) + 1
  const b = Math.floor(Math.random() * 5) + 1
  const answer = a + b
  return {
    skillId,
    prompt: `${a} + ${b} = ?`,
    answer,
    choice: { options: shuffle([answer, answer + 1, answer - 1, answer + 2]), answer },
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
