/**
 * 认识钟表
 */

import { buildQuestion, makeChoices, clockEmoji, randInt, pickOneManipulative } from './_utils.js'

function formatHour(h) {
  return `${h}点`
}

function formatHalf(h) {
  return `${h}点半`
}

export function generateQuestion(skillId, options = {}) {
  const { difficulty = 1, forceInteractive = false, distractorCount } = options
  const useHalf = difficulty > 1 && Math.random() > 0.45
  const choiceCount = distractorCount != null ? distractorCount + 1 : 4

  if (useHalf) {
    const hour = randInt(1, 11)
    const answer = formatHalf(hour)
    const choice = makeChoices(answer, [formatHour(hour), formatHalf(hour + 1), formatHour(hour + 1)], choiceCount)
    const wantInteractive = forceInteractive || difficulty <= 2
    return buildQuestion({
      skillId,
      prompt: '现在是几点？',
      promptNarrative: `时针在 ${hour} 和 ${hour + 1} 之间，分针指向 6，是 ${answer}`,
      answer,
      visual: {
        type: 'clock',
        emoji: clockEmoji(hour, true),
        hint: '分针指向 6 表示半',
      },
      manipulative: wantInteractive
        ? pickOneManipulative({
            variant: 'time',
            options: choice.options,
            answer,
            hint: '👆 看看钟面，点一点现在几点',
            style: 'text',
          })
        : null,
      interactiveFallback: pickOneManipulative({
        variant: 'time',
        options: choice.options,
        answer,
        hint: '👆 看看钟面，点一点现在几点',
        style: 'text',
      }),
      choice,
      difficulty,
    })
  }

  const hour = randInt(1, 12)
  const answer = formatHour(hour)
  const choice = makeChoices(answer, [
    formatHour(hour === 12 ? 1 : hour + 1),
    formatHour(hour === 1 ? 12 : hour - 1),
    formatHalf(hour === 12 ? 0 : hour),
  ], choiceCount)
  const wantInteractive = forceInteractive || difficulty <= 2

  return buildQuestion({
    skillId,
    prompt: '现在是几点？',
    promptNarrative: `时针和分针都指着 ${hour === 12 ? 12 : hour}，是 ${answer}`,
    answer,
    visual: {
      type: 'clock',
      emoji: clockEmoji(hour === 12 ? 0 : hour, false),
      hint: '整点：分针指向 12',
    },
    manipulative: wantInteractive
      ? pickOneManipulative({
          variant: 'time',
          options: choice.options,
          answer,
          hint: '👆 看看钟面，点一点现在几点',
          style: 'text',
        })
      : null,
    interactiveFallback: pickOneManipulative({
      variant: 'time',
      options: choice.options,
      answer,
      hint: '👆 看看钟面，点一点现在几点',
      style: 'text',
    }),
    choice,
    difficulty,
  })
}
