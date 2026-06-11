/**
 * 学习会话状态机（Learning Session State Machine）
 *
 * 统一仲裁层，取代散落在各处的 if/else 条件判断。
 * 所有子系统（adaptive、intervention、mascot、pacing）只读当前状态，
 * 不直接读 errorProfile 做决策。
 *
 * 状态流转：
 *   EXPLORING ──→ FOCUSED ──→ MASTERING
 *       │             │            │
 *       │             ├──→ BORED ←─┘
 *       ↓             │
 *   STRUGGLING ──→ FRUSTRATED
 *       │             │
 *       └──→ RECOVERING ←─┘
 *              │
 *              └──→ FOCUSED
 */

import { eventBus, Events } from './eventBus'

// ===== 状态定义 =====
export const States = {
  EXPLORING: 'EXPLORING',     // 初始/探索中
  FOCUSED: 'FOCUSED',         // 专注答题
  STRUGGLING: 'STRUGGLING',   // 遇到困难
  FRUSTRATED: 'FRUSTRATED',   // 高度挫败
  RECOVERING: 'RECOVERING',   // 恢复中
  MASTERING: 'MASTERING',     // 熟练掌握
  BORED: 'BORED',             // 注意力断裂
}

const STATE_ORDER = [
  States.FRUSTRATED,
  States.STRUGGLING,
  States.EXPLORING,
  States.RECOVERING,
  States.FOCUSED,
  States.MASTERING,
  States.BORED,
]

// ===== 上下文 =====
function createContext() {
  return {
    currentState: States.EXPLORING,
    streak: 0,             // 连续答对
    errors: 0,             // 当前连续错误
    totalCorrect: 0,
    totalWrong: 0,
    totalAttempts: 0,
    accuracy: 0,           // 本轮正确率
    idleTime: 0,           // 当前无操作秒数
    lastStateChange: Date.now(),
    stateHistory: [],      // [{ from, to, reason, timestamp }]
  }
}

// ===== 状态转移规则 =====
// 每条规则：[fromStates, toState, condition]
const RULES = {
  // ---- 答对时 ----
  [Events.ANSWER_CORRECT]: [
    // FRUSTRATED → RECOVERING（只要有1次答对）
    { from: [States.FRUSTRATED], to: States.RECOVERING, priority: 90 },
    // STRUGGLING → RECOVERING（1次答对）
    { from: [States.STRUGGLING], to: States.RECOVERING, priority: 80 },
    // RECOVERING → FOCUSED（连续2次答对）
    { from: [States.RECOVERING], to: States.FOCUSED, condition: (ctx) => ctx.streak >= 2, priority: 70 },
    // EXPLORING / BORED → FOCUSED（连续2次答对）
    { from: [States.EXPLORING, States.BORED], to: States.FOCUSED, condition: (ctx) => ctx.streak >= 2, priority: 60 },
    // FOCUSED → MASTERING（连续3次答对 + 正确率 ≥ 80%）
    { from: [States.FOCUSED], to: States.MASTERING, condition: (ctx) => ctx.streak >= 3 && ctx.accuracy >= 0.8, priority: 50 },
    // MASTERING → MASTERING（继续保持）
    { from: [States.MASTERING], to: States.MASTERING, priority: 10 },
    // 默认保持
    { from: [], to: null, priority: 0 },
  ],

  // ---- 答错时 ----
  [Events.ANSWER_WRONG]: [
    // 连续错误 ≥ 3 → FRUSTRATED
    { from: [States.STRUGGLING], to: States.FRUSTRATED, condition: (ctx) => ctx.errors >= 3, priority: 90 },
    { from: [States.FOCUSED, States.EXPLORING], to: States.STRUGGLING, condition: (ctx) => ctx.errors >= 2, priority: 80 },
    { from: [States.RECOVERING], to: States.STRUGGLING, priority: 70 },
    { from: [States.MASTERING], to: States.FOCUSED, priority: 60 },
    { from: [States.FRUSTRATED], to: States.FRUSTRATED, priority: 50 },
    // 第一次答错，还没到阈值
    { from: [], to: null, priority: 0 },
  ],

  // ---- 注意力下降 ----
  [Events.IDLE_START]: [
    { from: [States.FOCUSED, States.MASTERING], to: States.BORED, condition: (ctx) => ctx.idleTime >= 8, priority: 80 },
    { from: [States.STRUGGLING], to: States.BORED, condition: (ctx) => ctx.idleTime >= 10, priority: 70 },
    { from: [], to: null, priority: 0 },
  ],

  // ---- 交互恢复 ----
  [Events.INPUT_EVENT]: [
    { from: [States.BORED], to: States.EXPLORING, priority: 90 },
    { from: [], to: null, priority: 0 },
  ],
}

// ===== Session State 类 =====
export class SessionState {
  constructor() {
    this.ctx = createContext()
    this._subscriptions = []
    this._autoSubscribe()
  }

  /** 重置为一个新会话 */
  reset() {
    this.ctx = createContext()
    eventBus.emit(Events.STATE_CHANGED, {
      from: null,
      to: this.ctx.currentState,
      reason: 'session_start',
      ctx: { ...this.ctx },
    })
  }

  /** 获取当前状态 */
  get state() { return this.ctx.currentState }

  /** 获取上下文副本 */
  get context() { return { ...this.ctx } }

  /** 手动触发状态变更（外部可以直接调用） */
  handleEvent(event, data = {}) {
    switch (event) {
      case Events.ANSWER_CORRECT:
        this._onCorrect(data)
        break
      case Events.ANSWER_WRONG:
        this._onWrong(data)
        break
      case Events.IDLE_START:
        this._onIdle(data)
        break
      case Events.INPUT_EVENT:
        this._onInput(data)
        break
    }
  }

  // ---- 内部处理 ----
  _onCorrect(data = {}) {
    this.ctx.streak++
    this.ctx.errors = 0
    this.ctx.totalCorrect++
    this.ctx.totalAttempts++
    this.ctx.accuracy = this.ctx.totalCorrect / this.ctx.totalAttempts
    this.ctx.idleTime = 0
    this._transition(Events.ANSWER_CORRECT, data)
    // 发射 streak 事件
    if (this.ctx.streak >= 3) {
      eventBus.emit(Events.CONSECUTIVE_CORRECT, { streak: this.ctx.streak })
    }
  }

  _onWrong(data = {}) {
    this.ctx.streak = 0
    this.ctx.errors++
    this.ctx.totalWrong++
    this.ctx.totalAttempts++
    this.ctx.accuracy = this.ctx.totalCorrect / this.ctx.totalAttempts
    this.ctx.idleTime = 0
    this._transition(Events.ANSWER_WRONG, data)
    if (this.ctx.errors >= 3) {
      eventBus.emit(Events.CONSECUTIVE_WRONG, { errors: this.ctx.errors })
    }
  }

  _onIdle(data = {}) {
    this.ctx.idleTime = data.seconds || (this.ctx.idleTime + 1)
    this._transition(Events.IDLE_START, data)
  }

  _onInput(data = {}) {
    // 点击/触摸重置空闲计时
    this.ctx.idleTime = 0
    const oldState = this.ctx.currentState
    if (oldState === States.BORED) {
      this._transition(Events.INPUT_EVENT, data)
    }
  }

  /** 执行状态转移 */
  _transition(event, data) {
    const rules = RULES[event] || []
    const oldState = this.ctx.currentState

    for (const rule of rules) {
      // 检查是否匹配当前状态
      const stateMatch = rule.from.length === 0 || rule.from.includes(oldState)
      if (!stateMatch) continue

      // 检查条件
      if (rule.condition && !rule.condition(this.ctx)) continue

      // 找到匹配规则
      const newState = rule.to
      if (newState && newState !== oldState) {
        this.ctx.currentState = newState
        this.ctx.lastStateChange = Date.now()
        this.ctx.stateHistory.push({
          from: oldState,
          to: newState,
          reason: event,
          timestamp: Date.now(),
        })

        eventBus.emit(Events.STATE_CHANGED, {
          from: oldState,
          to: newState,
          reason: event,
          ctx: { ...this.ctx },
        })
      }
      break // 只执行优先级最高的匹配规则
    }
  }

  /** 订阅状态变更 */
  onStateChange(callback) {
    const unsub = eventBus.on(Events.STATE_CHANGED, callback)
    this._subscriptions.push(unsub)
    return unsub
  }

  /** 清理 */
  destroy() {
    this._subscriptions.forEach(unsub => unsub())
    this._subscriptions = []
  }

  /** 自动订阅相关事件 */
  _autoSubscribe() {
    const events = [
      Events.ANSWER_CORRECT,
      Events.ANSWER_WRONG,
      Events.IDLE_START,
      Events.INPUT_EVENT,
    ]
    events.forEach(event => {
      const unsub = eventBus.on(event, (data) => this.handleEvent(event, data))
      this._subscriptions.push(unsub)
    })
  }
}

// 获取状态的中文描述（用于角色反馈）
export function getStateLabel(state) {
  const labels = {
    [States.EXPLORING]: '探索中',
    [States.FOCUSED]: '专注中',
    [States.STRUGGLING]: '遇到困难',
    [States.FRUSTRATED]: '需要帮助',
    [States.RECOVERING]: '恢复中',
    [States.MASTERING]: '很熟练',
    [States.BORED]: '有点无聊',
  }
  return labels[state] || '未知'
}

// 状态排序（用于 UI 显示）
export function getStateOrder(state) {
  const idx = STATE_ORDER.indexOf(state)
  return idx >= 0 ? idx : 99
}
