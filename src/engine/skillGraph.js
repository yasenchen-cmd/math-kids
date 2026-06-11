/**
 * 技能树 — 数学启蒙的知识依赖图
 *
 * 每个技能节点定义：
 * - 前置依赖（必须先学什么）
 * - 可选的交互模式
 * - 视觉主题
 * - 难度范围
 * - 关联的生成器
 *
 * 这是一个有向无环图（DAG），支持：
 * - 自适应推荐（该学什么）
 * - 错题回溯（哪个前置技能没掌握）
 * - 技能进度追踪
 */

const skillGraph = {
  // ========== 领域 1：数感基础 ==========
  counting_1_5: {
    id: 'counting_1_5',
    name: '数 1–5',
    area: 'number_sense',
    order: 1,
    dependencies: [],
    difficultyRange: { min: 1, max: 5 },
    visualThemes: ['fruits', 'animals', 'blocks', 'stars', 'candies'],
    interactionModes: ['count', 'select'],
    generator: 'counting',
  },
  counting_1_10: {
    id: 'counting_1_10',
    name: '数 1–10',
    area: 'number_sense',
    order: 2,
    dependencies: ['counting_1_5'],
    difficultyRange: { min: 1, max: 10 },
    visualThemes: ['fruits', 'animals', 'blocks', 'stars', 'candies'],
    interactionModes: ['count', 'select'],
    generator: 'counting',
  },
  number_recognition: {
    id: 'number_recognition',
    name: '认数字',
    area: 'number_sense',
    order: 3,
    dependencies: ['counting_1_5'],
    difficultyRange: { min: 1, max: 20 },
    visualThemes: ['cards', 'dice', 'fingers'],
    interactionModes: ['select'],
    generator: 'number_recognition',
  },
  counting_1_20: {
    id: 'counting_1_20',
    name: '数 1–20',
    area: 'number_sense',
    order: 4,
    dependencies: ['counting_1_10', 'number_recognition'],
    difficultyRange: { min: 1, max: 20 },
    visualThemes: ['fruits', 'animals', 'blocks'],
    interactionModes: ['count', 'select'],
    generator: 'counting',
  },
  quantity_comparison: {
    id: 'quantity_comparison',
    name: '比较多少',
    area: 'number_sense',
    order: 5,
    dependencies: ['counting_1_10'],
    difficultyRange: { min: 1, max: 10 },
    visualThemes: ['fruits', 'animals', 'blocks'],
    interactionModes: ['compare', 'select'],
    generator: 'comparison',
  },
  number_sequence: {
    id: 'number_sequence',
    name: '数字顺序',
    area: 'number_sense',
    order: 6,
    dependencies: ['counting_1_10'],
    difficultyRange: { min: 1, max: 20 },
    visualThemes: ['cards', 'train'],
    interactionModes: ['sort', 'select'],
    generator: 'sequence',
  },
  counting_1_100: {
    id: 'counting_1_100',
    name: '数 1–100',
    area: 'number_sense',
    order: 7,
    dependencies: ['counting_1_20'],
    difficultyRange: { min: 1, max: 100 },
    visualThemes: ['grid', 'stairs'],
    interactionModes: ['count', 'select'],
    generator: 'counting',
  },
  place_value: {
    id: 'place_value',
    name: '位值概念',
    area: 'number_sense',
    order: 8,
    dependencies: ['counting_1_100'],
    difficultyRange: { min: 10, max: 99 },
    visualThemes: ['blocks_10', 'abacus'],
    interactionModes: ['select'],
    generator: 'place_value',
  },

  // ========== 领域 2：模式与规律 ==========
  pattern_recognition: {
    id: 'pattern_recognition',
    name: '找规律',
    area: 'patterns',
    order: 1,
    dependencies: ['counting_1_5'],
    difficultyRange: { min: 1, max: 3 },
    visualThemes: ['shapes', 'colors', 'fruits'],
    interactionModes: ['select'],
    generator: 'pattern',
  },
  classification: {
    id: 'classification',
    name: '分类',
    area: 'patterns',
    order: 2,
    dependencies: ['counting_1_5'],
    difficultyRange: { min: 1, max: 3 },
    visualThemes: ['shapes', 'colors', 'fruits'],
    interactionModes: ['select', 'sort'],
    generator: 'classification',
  },

  // ========== 领域 3：加法 ==========
  addition_meaning: {
    id: 'addition_meaning',
    name: '加法的意义',
    area: 'addition',
    order: 1,
    dependencies: ['counting_1_10'],
    difficultyRange: { min: 1, max: 5 },
    visualThemes: ['fruits', 'animals', 'candies', 'blocks'],
    interactionModes: ['drag_combine', 'count'],
    generator: 'addition',
  },
  addition_within_5: {
    id: 'addition_within_5',
    name: '5 以内加法',
    area: 'addition',
    order: 2,
    dependencies: ['addition_meaning'],
    difficultyRange: { min: 1, max: 5 },
    visualThemes: ['fruits', 'animals', 'candies', 'blocks', 'toys'],
    interactionModes: ['drag_combine', 'count', 'select'],
    generator: 'addition',
  },
  addition_within_10: {
    id: 'addition_within_10',
    name: '10 以内加法',
    area: 'addition',
    order: 3,
    dependencies: ['addition_within_5'],
    difficultyRange: { min: 1, max: 10 },
    visualThemes: ['fruits', 'animals', 'candies', 'blocks', 'toys'],
    interactionModes: ['drag_combine', 'count', 'select'],
    generator: 'addition',
  },
  make_ten: {
    id: 'make_ten',
    name: '凑十法',
    area: 'addition',
    order: 4,
    dependencies: ['addition_within_10'],
    difficultyRange: { min: 1, max: 10 },
    visualThemes: ['ten_frame', 'eggs', 'fingers'],
    interactionModes: ['drag_to_target', 'select'],
    generator: 'make_ten',
  },
  addition_within_20: {
    id: 'addition_within_20',
    name: '20 以内加法',
    area: 'addition',
    order: 5,
    dependencies: ['make_ten', 'counting_1_20'],
    difficultyRange: { min: 1, max: 20 },
    visualThemes: ['fruits', 'blocks', 'candies'],
    interactionModes: ['drag_combine', 'select'],
    generator: 'addition',
  },

  // ========== 领域 4：减法 ==========
  subtraction_meaning: {
    id: 'subtraction_meaning',
    name: '减法的意义',
    area: 'subtraction',
    order: 1,
    dependencies: ['counting_1_10', 'addition_meaning'],
    difficultyRange: { min: 1, max: 5 },
    visualThemes: ['fruits', 'animals', 'candies'],
    interactionModes: ['drag_split', 'count'],
    generator: 'subtraction',
  },
  subtraction_within_5: {
    id: 'subtraction_within_5',
    name: '5 以内减法',
    area: 'subtraction',
    order: 2,
    dependencies: ['subtraction_meaning'],
    difficultyRange: { min: 1, max: 5 },
    visualThemes: ['fruits', 'animals', 'candies'],
    interactionModes: ['drag_split', 'select'],
    generator: 'subtraction',
  },
  subtraction_within_10: {
    id: 'subtraction_within_10',
    name: '10 以内减法',
    area: 'subtraction',
    order: 3,
    dependencies: ['subtraction_within_5'],
    difficultyRange: { min: 1, max: 10 },
    visualThemes: ['fruits', 'animals', 'candies'],
    interactionModes: ['drag_split', 'select'],
    generator: 'subtraction',
  },

  // ========== 领域 5：形状与空间 ==========
  shape_recognition: {
    id: 'shape_recognition',
    name: '认识形状',
    area: 'geometry',
    order: 1,
    dependencies: [],
    difficultyRange: { min: 1, max: 4 },
    visualThemes: ['shapes', 'everyday'],
    interactionModes: ['select'],
    generator: 'shape_recognition',
  },
  shape_composition: {
    id: 'shape_composition',
    name: '拼图与组合',
    area: 'geometry',
    order: 2,
    dependencies: ['shape_recognition'],
    difficultyRange: { min: 2, max: 6 },
    visualThemes: ['tangram', 'puzzle'],
    interactionModes: ['select'],
    generator: 'shape_composition',
  },
  symmetry: {
    id: 'symmetry',
    name: '对称',
    area: 'geometry',
    order: 3,
    dependencies: ['shape_recognition'],
    difficultyRange: { min: 1, max: 3 },
    visualThemes: ['shapes', 'nature', 'letters'],
    interactionModes: ['select'],
    generator: 'symmetry',
  },
  spatial_position: {
    id: 'spatial_position',
    name: '方位',
    area: 'geometry',
    order: 4,
    dependencies: [],
    visualThemes: ['scene', 'animals'],
    interactionModes: ['select'],
    generator: 'spatial',
  },

  // ========== 领域 6：乘法 ==========
  multiplication_meaning: {
    id: 'multiplication_meaning',
    name: '乘法的意义',
    area: 'multiplication',
    order: 1,
    dependencies: ['addition_within_20', 'counting_1_20'],
    difficultyRange: { min: 1, max: 5 },
    visualThemes: ['array', 'groups', 'stairs'],
    interactionModes: ['fill_array', 'count', 'select'],
    generator: 'multiplication',
  },
  multiplication_2_5: {
    id: 'multiplication_2_5',
    name: '2、5 的乘法',
    area: 'multiplication',
    order: 2,
    dependencies: ['multiplication_meaning'],
    difficultyRange: { min: 1, max: 9 },
    visualThemes: ['array', 'groups', 'stairs'],
    interactionModes: ['fill_array', 'select'],
    generator: 'multiplication',
  },
  multiplication_3_4: {
    id: 'multiplication_3_4',
    name: '3、4 的乘法',
    area: 'multiplication',
    order: 3,
    dependencies: ['multiplication_2_5'],
    difficultyRange: { min: 1, max: 9 },
    visualThemes: ['array', 'groups'],
    interactionModes: ['fill_array', 'select'],
    generator: 'multiplication',
  },

  // ========== 领域 7：进阶 ==========
  time_basic: {
    id: 'time_basic',
    name: '认识钟表',
    area: 'advanced',
    order: 1,
    dependencies: ['counting_1_12'],
    visualThemes: ['clock'],
    interactionModes: ['select'],
    generator: 'time',
  },
  money_basic: {
    id: 'money_basic',
    name: '认识钱币',
    area: 'advanced',
    order: 2,
    dependencies: ['addition_within_20'],
    visualThemes: ['coins', 'bills'],
    interactionModes: ['select', 'count'],
    generator: 'money',
  },
  fractions_intro: {
    id: 'fractions_intro',
    name: '分数入门',
    area: 'advanced',
    order: 3,
    dependencies: ['addition_within_10'],
    visualThemes: ['pizza', 'cake', 'chocolate'],
    interactionModes: ['select'],
    generator: 'fractions',
  },
  division_basic: {
    id: 'division_basic',
    name: '简单除法',
    area: 'advanced',
    order: 4,
    dependencies: ['multiplication_meaning'],
    visualThemes: ['sharing', 'groups'],
    interactionModes: ['drag_split', 'select'],
    generator: 'division',
  },
}

// ========== 工具函数 ==========

// 获取所有技能列表（按 order 排序）
export function getAllSkills() {
  const skills = Object.values(skillGraph)
  // 先按 area 分组，再按 order 排序
  const areas = {}
  skills.forEach(s => {
    if (!areas[s.area]) areas[s.area] = []
    areas[s.area].push(s)
  })
  return Object.values(areas).flatMap(areaSkills =>
    areaSkills.sort((a, b) => a.order - b.order)
  )
}

// 获取单个技能
export function getSkill(id) {
  return skillGraph[id] || null
}

// 获取某个技能的前置技能（依赖链）
export function getDependencyChain(skillId) {
  const visited = new Set()
  const chain = []
  function walk(id) {
    if (visited.has(id)) return
    visited.add(id)
    const skill = skillGraph[id]
    if (!skill) return
    skill.dependencies.forEach(depId => walk(depId))
    chain.push(id)
  }
  walk(skillId)
  return chain
}

// 检查技能是否可以学（前置技能是否已完成）
export function isSkillUnlockable(skillId, completedSkills) {
  const skill = skillGraph[skillId]
  if (!skill) return false
  return skill.dependencies.every(depId => completedSkills.includes(depId))
}

// 推荐下一个该学的技能
export function recommendNext(completedSkills, skillScores) {
  const skills = getAllSkills()
  const unlocked = skills.filter(s =>
    !completedSkills.includes(s.id) &&
    s.dependencies.every(d => completedSkills.includes(d))
  )
  // 按关联的未完成前置技能数排序（优先推荐依赖已全部完成的）
  // 再按 skillScores 中最低分的优先推荐
  unlocked.sort((a, b) => {
    const scoreA = skillScores[a.id] || 0
    const scoreB = skillScores[b.id] || 0
    return scoreA - scoreB
  })
  return unlocked[0] || null
}

// 获取某个领域的所有技能
export function getSkillsByArea(area) {
  return getAllSkills().filter(s => s.area === area)
}

// 所有领域列表
export const areas = [
  { id: 'number_sense', name: '数感基础', icon: '🔢', color: '#4F8CF6' },
  { id: 'patterns', name: '模式与规律', icon: '🧩', color: '#A66CFF' },
  { id: 'addition', name: '加法', icon: '➕', color: '#6BCB77' },
  { id: 'subtraction', name: '减法', icon: '➖', color: '#FF6B6B' },
  { id: 'geometry', name: '形状与空间', icon: '🔷', color: '#FFD93D' },
  { id: 'multiplication', name: '乘法', icon: '✖️', color: '#FF8A65' },
  { id: 'advanced', name: '进阶', icon: '🌟', color: '#4DD0E1' },
]

export default skillGraph
