/**
 * 形状与空间
 */

import { buildQuestion, makeChoices, pickOne, shuffle, pickOneManipulative } from './_utils.js'

const SHAPES = [
  { name: '圆形', emoji: '⭕' },
  { name: '三角形', emoji: '🔺' },
  { name: '正方形', emoji: '🟧' },
  { name: '长方形', emoji: '▬' },
  { name: '星星', emoji: '⭐' },
]

const POSITIONS = [
  { scene: '🐱 在 🐶 的左边', question: '🐱 在 🐶 的哪一边？', answer: '左边', wrong: ['右边', '上面', '下面'] },
  { scene: '🐦 在 🌳 的上面', question: '🐦 在 🌳 的哪一边？', answer: '上面', wrong: ['下面', '左边', '右边'] },
  { scene: '🐟 在 🪨 的下面', question: '🐟 在 🪨 的哪一边？', answer: '下面', wrong: ['上面', '左边', '右边'] },
  { scene: '🚗 在 🏠 的右边', question: '🚗 在 🏠 的哪一边？', answer: '右边', wrong: ['左边', '上面', '下面'] },
]

export function generateQuestion(skillId, options = {}) {
  switch (skillId) {
    case 'shape_recognition': return genShapeRecognition(options)
    case 'shape_composition': return genShapeComposition(options)
    case 'symmetry': return genSymmetry(options)
    case 'spatial_position': return genSpatial(options)
    default: return genShapeRecognition(options)
  }
}

function genShapeRecognition(options) {
  const { difficulty = 1, forceInteractive = false, distractorCount } = options
  const target = pickOne(SHAPES.slice(0, Math.min(3 + difficulty, SHAPES.length)))
  const distractors = shuffle(SHAPES.filter(s => s.name !== target.name).map(s => s.name)).slice(0, 3)
  const choiceCount = distractorCount != null ? distractorCount + 1 : 4
  const choice = makeChoices(target.name, distractors, choiceCount)
  const wantInteractive = forceInteractive || difficulty <= 2
  const manip = pickOneManipulative({
    variant: 'shape',
    options: choice.options,
    answer: target.name,
    hint: '👆 看看图形，点一点它的名字',
    style: 'text',
  })

  return buildQuestion({
    skillId: 'shape_recognition',
    prompt: '这是什么形状？',
    promptNarrative: `看看图，这是${target.name}`,
    answer: target.name,
    visual: { type: 'shape_show', emoji: target.emoji, label: target.name },
    manipulative: wantInteractive ? manip : null,
    interactiveFallback: manip,
    choice,
    difficulty,
  })
}

function genShapeComposition(options) {
  const { difficulty = 1, forceInteractive = false } = options
  const puzzles = [
    {
      prompt: '2 个相同的三角形可以拼成什么？',
      narrative: '把两个一样大的三角形拼在一起',
      answer: '正方形',
      visual: '🔺 + 🔺 → ?',
      options: ['正方形', '圆形', '长方形', '星星'],
    },
    {
      prompt: '4 个相同的小正方形可以拼成什么？',
      narrative: '四个小正方形拼在一起',
      answer: '大正方形',
      visual: '🟧🟧\n🟧🟧',
      options: ['大正方形', '三角形', '圆形', '长方形'],
    },
  ]
  const puzzle = pickOne(puzzles.slice(0, Math.min(1 + difficulty, puzzles.length)))
  const opts = shuffle(puzzle.options)
  const wantInteractive = forceInteractive || difficulty <= 2
  const manip = pickOneManipulative({
    variant: 'shape',
    options: opts,
    answer: puzzle.answer,
    hint: '👆 想一想能拼成什么，点一点',
    style: 'text',
  })

  return buildQuestion({
    skillId: 'shape_composition',
    prompt: puzzle.prompt,
    promptNarrative: puzzle.narrative,
    answer: puzzle.answer,
    visual: { type: 'scene', text: puzzle.visual },
    manipulative: wantInteractive ? manip : null,
    interactiveFallback: manip,
    choice: { options: opts, answer: puzzle.answer },
    difficulty,
  })
}

function genSymmetry(options) {
  const { difficulty = 1, forceInteractive = false } = options
  const pairs = [
    { symmetric: '🦋', asymmetric: '🐚', label: '蝴蝶' },
    { symmetric: '❤️', asymmetric: '🐌', label: '爱心' },
    { symmetric: '⭕', asymmetric: '🔺', label: '圆形' },
  ]
  const pair = pickOne(pairs)
  const optionsList = shuffle([pair.symmetric, pair.asymmetric, '⭐', '📎'])
  const wantInteractive = forceInteractive || difficulty <= 2
  const manip = pickOneManipulative({
    variant: 'shape',
    options: optionsList,
    answer: pair.symmetric,
    hint: '👆 点一点左右对折能重合的图形',
    style: 'emoji',
  })

  return buildQuestion({
    skillId: 'symmetry',
    prompt: '哪个图形左右对折能重合？',
    promptNarrative: '左右对折后，哪个图形两边一样？',
    answer: pair.symmetric,
    visual: { type: 'scene', text: `${pair.symmetric} 还是 ${pair.asymmetric}？` },
    manipulative: wantInteractive ? manip : null,
    interactiveFallback: manip,
    choice: { options: optionsList, answer: pair.symmetric, style: 'emoji' },
    difficulty,
  })
}

function genSpatial(options) {
  const { difficulty = 1, forceInteractive = false, distractorCount } = options
  const pos = pickOne(POSITIONS)
  const choiceCount = distractorCount != null ? distractorCount + 1 : 4
  const choice = makeChoices(pos.answer, pos.wrong, choiceCount)
  const wantInteractive = forceInteractive || difficulty <= 2
  const manip = pickOneManipulative({
    variant: 'spatial',
    options: choice.options,
    answer: pos.answer,
    hint: '👆 看一看位置，点一点答案',
    style: 'text',
  })

  return buildQuestion({
    skillId: 'spatial_position',
    prompt: pos.question,
    promptNarrative: pos.scene,
    answer: pos.answer,
    visual: { type: 'scene', text: pos.scene },
    manipulative: wantInteractive ? manip : null,
    interactiveFallback: manip,
    choice,
    difficulty,
  })
}
