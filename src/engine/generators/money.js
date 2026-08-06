/**
 * 认识钱币
 */

import {
  buildQuestion,
  makeChoices,
  pickOne,
  randInt,
  pickOneManipulative,
  countManipulative,
  repeatEmoji,
} from './_utils.js'

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
        coinCount: fives,
        unitValue: 5,
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
        coinCount: yuan,
        unitValue: 1,
        countIsAnswer: true,
      }
    },
  },
]

export function generateQuestion(skillId, options = {}) {
  const { difficulty = 1, forceInteractive = false, distractorCount } = options
  const scenario = pickOne(SCENARIOS.slice(0, Math.min(1 + difficulty, SCENARIOS.length)))
  const built = scenario.build()
  const { prompt, promptNarrative, answer, visual, distractors } = built
  const choiceCount = distractorCount != null ? distractorCount + 1 : 4
  const choice = makeChoices(answer, distractors, choiceCount)
  const wantInteractive = forceInteractive || difficulty <= 2

  let manipulative = null
  if (wantInteractive && built.countIsAnswer && built.coinCount) {
    manipulative = countManipulative(repeatEmoji('💴', built.coinCount), built.coinCount, answer)
  } else if (wantInteractive) {
    manipulative = pickOneManipulative({
      variant: 'money',
      options: choice.options,
      answer,
      hint: '👆 数一数钱币，点一点答案',
      style: 'text',
    })
  }

  return buildQuestion({
    skillId,
    prompt,
    promptNarrative,
    answer,
    visual,
    manipulative,
    interactiveFallback: pickOneManipulative({
      variant: 'money',
      options: choice.options,
      answer,
      hint: '👆 数一数钱币，点一点答案',
      style: 'text',
    }),
    choice,
    difficulty,
  })
}
