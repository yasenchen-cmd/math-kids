/**
 * 认识钱币
 */

import { buildQuestion, makeChoices, pickOne, randInt } from './_utils.js'

const SCENARIOS = [
  {
    id: 'five_jiao',
    build: () => {
      const fives = randInt(1, 3)
      const answer = fives * 5
      const coins = Array(fives).fill('🪙5角')
      return {
        prompt: `一共是多少角？`,
        promptNarrative: `${fives} 个 5 角，一共 ${answer} 角`,
        answer,
        visual: { type: 'coins', items: coins },
        distractors: [answer - 5, answer + 5, fives * 10].filter(n => n > 0),
      }
    },
  },
  {
    id: 'mix',
    build: () => {
      const ones = randInt(1, 2)
      const fives = randInt(1, 2)
      const answer = ones * 10 + fives * 5
      const coins = [...Array(ones).fill('💴1元'), ...Array(fives).fill('🪙5角')]
      return {
        prompt: '一共是多少角？',
        promptNarrative: `${ones} 个 1 元 和 ${fives} 个 5 角，一共 ${answer} 角`,
        answer,
        visual: { type: 'coins', items: coins },
        distractors: [answer - 5, answer + 5, ones * 10],
      }
    },
  },
  {
    id: 'yuan',
    build: () => {
      const yuan = randInt(2, 4)
      const answer = yuan
      return {
        prompt: `${yuan * 10} 角等于几元？`,
        promptNarrative: `${yuan * 10} 角就是 ${yuan} 元`,
        answer,
        visual: { type: 'coins', items: Array(yuan).fill('💴1元') },
        distractors: [yuan - 1, yuan + 1, yuan * 2].filter(n => n > 0),
      }
    },
  },
]

export function generateQuestion(skillId, options = {}) {
  const { difficulty = 1 } = options
  const scenario = pickOne(SCENARIOS.slice(0, Math.min(1 + difficulty, SCENARIOS.length)))
  const { prompt, promptNarrative, answer, visual, distractors } = scenario.build()

  return buildQuestion({
    skillId,
    prompt,
    promptNarrative,
    answer,
    visual,
    choice: makeChoices(answer, distractors),
    difficulty,
  })
}
