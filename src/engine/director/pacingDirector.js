/**
 * 节奏导演（Pacing Director）
 *
 * 基于当前学习状态和最近事件，决定「此刻该做什么」。
 * 不负责出题，只负责节奏编排：
 *   - 什么时候奖励（celebrate/particles）
 *   - 什么时候让角色说话（mascot_speak）
 *   - 什么时候调整难度（difficulty_adjust）
 *   - 什么时候切换交互模式（switch_interaction）
 *   - 什么时候插入简单题（easy_win）
 *
 * 一条指令（Directive）的格式：
 *   { type: string, payload: object, delay: number }
 */

import { eventBus, Events } from './eventBus'
import { States } from './sessionState'

const notRetried = (p) => !p.retried

// ===== 每个状态下的指令表 =====
// 指令可以绑定到：
//   onEnter: 进入状态时触发
//   onEvent: 某个事件发生时触发（带条件）
//   onTick: 在状态中持续触发

const DIRECTIVES = {
  // --- 探索中 ---
  [States.EXPLORING]: {
    onEnter: [
      { type: 'mascot_speak', mood: 'happy', delay: 300 },
    ],
    onEvent: {
      [Events.ANSWER_CORRECT]: [
        { type: 'celebrate', intensity: 'normal', condition: notRetried, delay: 100 },
      ],
      [Events.ANSWER_WRONG]: [
        { type: 'mascot_speak', mood: 'encourage', delay: 300 },
      ],
    },
  },

  // --- 专注中 ---
  [States.FOCUSED]: {
    onEnter: [
      { type: 'mascot_speak', mood: 'happy', delay: 400, text: '你越来越棒了！' },
    ],
    onEvent: {
      [Events.ANSWER_CORRECT]: [
        { type: 'celebrate', intensity: 'high', condition: (ctx) => ctx.streak >= 3 && notRetried(ctx), delay: 100 },
      ],
      [Events.ANSWER_WRONG]: [
        { type: 'mascot_speak', mood: 'encourage', delay: 300 },
      ],
    },
  },

  // --- 遇到困难 ---
  [States.STRUGGLING]: {
    onEnter: [
      { type: 'mascot_speak', mood: 'encourage', delay: 200, text: '没关系，我们一起慢慢来！' },
      { type: 'simplify', level: 1, delay: 100 },
    ],
    onEvent: {
      [Events.ANSWER_CORRECT]: [
        { type: 'celebrate', intensity: 'high', condition: notRetried, delay: 100 },
      ],
      [Events.ANSWER_WRONG]: [
        { type: 'mascot_speak', mood: 'encourage', delay: 300 },
      ],
    },
  },

  // --- 高度挫败 ---
  [States.FRUSTRATED]: {
    onEnter: [
      { type: 'easy_win', guarantee: true, delay: 0 },      // 强制简单题
      { type: 'mascot_speak', mood: 'comfort', delay: 200 },
      { type: 'celebrate', intensity: 'high', delay: 600 },   // 答对后庆祝
      { type: 'intervention_force', delay: 0 },                // 强制开干预
    ],
    onEvent: {
      [Events.ANSWER_CORRECT]: [
        { type: 'celebrate', intensity: 'over_the_top', condition: notRetried, delay: 100 },
      ],
    },
  },

  // --- 恢复中 ---
  [States.RECOVERING]: {
    onEnter: [
      { type: 'mascot_speak', mood: 'happy', delay: 400, text: '看，你做到了！' },
    ],
    onEvent: {
      [Events.ANSWER_CORRECT]: [
        { type: 'celebrate', intensity: 'normal', condition: notRetried, delay: 100 },
      ],
    },
  },

  // --- 熟练掌握 ---
  [States.MASTERING]: {
    onEnter: [
      { type: 'mascot_speak', mood: 'celebrate', delay: 300, text: '你已经很厉害了！我们挑战一下？' },
      { type: 'difficulty_up', level: 1, delay: 500 },
    ],
    onEvent: {
      [Events.ANSWER_WRONG]: [
        { type: 'mascot_speak', mood: 'encourage', delay: 200 },
      ],
    },
  },

  // --- 注意力断裂 ---
  [States.BORED]: {
    onEnter: [
      { type: 'mascot_speak', mood: 'thinking', delay: 500, text: '嘿，我在这里哦～' },
      { type: 'switch_interaction', delay: 1000 },
      { type: 'surprise', delay: 1500 },
    ],
    onEvent: {
      [Events.INPUT_EVENT]: [
        { type: 'mascot_speak', mood: 'happy', delay: 200, text: '你回来啦！' },
        { type: 'easy_win', guarantee: true, delay: 0 },
      ],
    },
  },
}

// ===== Pacing Director =====
export class PacingDirector {
  constructor() {
    this._subscriptions = []
    this._currentState = States.EXPLORING
    this._pendingDirectives = []

    // 订阅状态变更
    const unsub = eventBus.on(Events.STATE_CHANGED, (data) => {
      this._currentState = data.to
      this._emitDirectives(data.to, 'onEnter', { context: data.ctx })
    })
    this._subscriptions.push(unsub)
  }

  /**
   * 处理一个事件，产生对应的节奏指令
   * 由外部调用（如 GameScreen 在答题后调用）
   */
  handleEvent(event, payload = {}) {
    const stateDirectives = DIRECTIVES[this._currentState]
    if (!stateDirectives) return []

    const eventDirectives = stateDirectives.onEvent?.[event]
    if (!eventDirectives) return []

    const directives = eventDirectives
      .filter(d => !d.condition || d.condition(payload))
      .map(d => ({
        ...d,
        source: 'event',
        state: this._currentState,
      }))

    this._emit(directives)
    return directives
  }

  /**
   * 获取当前状态下的节奏建议（不发射指令，仅供 UI / 调试轮询）
   * @returns {Array<{ type: string, mood?: string, text?: string, level?: number, guarantee?: boolean }>}
   */
  getSuggestions() {
    const stateDirectives = DIRECTIVES[this._currentState]
    if (!stateDirectives?.onEnter) return []
    return stateDirectives.onEnter.map(({ type, mood, text, level, guarantee, intensity }) => ({
      type,
      ...(mood != null && { mood }),
      ...(text != null && { text }),
      ...(level != null && { level }),
      ...(guarantee != null && { guarantee }),
      ...(intensity != null && { intensity }),
    }))
  }

  /** 销毁 */
  destroy() {
    this._subscriptions.forEach(unsub => unsub())
    this._subscriptions = []
  }

  /** 内部：进入状态时自动发射指令 */
  _emitDirectives(state, phase, extra = {}) {
    const stateDirectives = DIRECTIVES[state]
    if (!stateDirectives) return

    const directives = (stateDirectives[phase] || []).map(d => ({
      ...d,
      source: phase,
      state,
      ...extra,
    }))

    this._emit(directives)
  }

  /** 发射指令（通过 eventBus 通知 UI） */
  _emit(directives) {
    directives.forEach(d => {
      eventBus.emit(Events.DIRECTIVE_ISSUED, d)
    })
  }
}

// 创建一个已连接 eventBus 的 director 实例
export function createPacingDirector() {
  return new PacingDirector()
}
