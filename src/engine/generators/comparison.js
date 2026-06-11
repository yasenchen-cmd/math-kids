export function generateQuestion(skillId, options = {}) {
  const { difficulty = 1 } = options
  const maxN = Math.min(5 + difficulty * 2, 15)
  const a = Math.floor(Math.random() * maxN) + 1
  let b = Math.floor(Math.random() * maxN) + 1
  while (b === a) b = Math.floor(Math.random() * maxN) + 1

  const opts = [String(a), String(b), '一样大']
  const answer = a > b ? opts[0] : opts[1]
  return {
    skillId,
    prompt: `${a} 和 ${b}，哪个大？`,
    answer,
    manipulative: { mode: 'compare', left: a, right: b },
    choice: { options: opts, answer },
    difficulty,
  }
}
