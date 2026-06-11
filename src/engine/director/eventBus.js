/**
 * 事件总线 — 子系统间单向通信
 *
 * 所有子系统（generator、adaptive、intervention、mascot、pacing）
 * 通过事件通信而不是直接调用，避免网状耦合。
 *
 * 使用方式：
 *   import { eventBus } from './eventBus'
 *   eventBus.emit('ANSWER_CORRECT', { streak: 3 })
 *   const unsub = eventBus.on('ANSWER_CORRECT', (data) => { ... })
 */

class EventBus {
  constructor() {
    this._listeners = {}
    this._history = []      // 可选：保留最近事件用于 debug
    this._historyMax = 100
  }

  /** 订阅事件，返回取消订阅函数 */
  on(event, callback) {
    if (!this._listeners[event]) {
      this._listeners[event] = new Set()
    }
    this._listeners[event].add(callback)
    return () => this._listeners[event]?.delete(callback)
  }

  /** 一次性订阅 */
  once(event, callback) {
    const wrapper = (data) => {
      callback(data)
      this._listeners[event]?.delete(wrapper)
    }
    return this.on(event, wrapper)
  }

  /** 发射事件 */
  emit(event, data = {}) {
    const listeners = this._listeners[event]
    if (!listeners || listeners.size === 0) return

    const entry = { event, data, timestamp: Date.now() }
    this._history.push(entry)
    if (this._history.length > this._historyMax) {
      this._history.shift()
    }

    listeners.forEach(callback => {
      try {
        callback(data)
      } catch (e) {
        console.warn(`[EventBus] Error in handler for "${event}":`, e)
      }
    })
  }

  /** 获取事件历史（用于 debug / replay） */
  getHistory(limit = 50) {
    return this._history.slice(-limit)
  }

  /** 清除历史 */
  clearHistory() {
    this._history = []
  }

  /** 获取某个事件的订阅者数量 */
  listenerCount(event) {
    return this._listeners[event]?.size || 0
  }
}

// 全局单例
export const eventBus = new EventBus()

// 预定义事件名常量
export const Events = {
  // 答题事件
  ANSWER_CORRECT: 'ANSWER_CORRECT',
  ANSWER_WRONG: 'ANSWER_WRONG',
  CONSECUTIVE_CORRECT: 'CONSECUTIVE_CORRECT',
  CONSECUTIVE_WRONG: 'CONSECUTIVE_WRONG',

  // 会话事件
  SESSION_START: 'SESSION_START',
  SESSION_END: 'SESSION_END',
  STATE_CHANGED: 'STATE_CHANGED',

  // 交互事件
  INPUT_EVENT: 'INPUT_EVENT',
  IDLE_START: 'IDLE_START',
  IDLE_END: 'IDLE_END',

  // 系统事件
  INTERVENTION_TRIGGERED: 'INTERVENTION_TRIGGERED',
  QUESTION_GENERATED: 'QUESTION_GENERATED',
  DIRECTIVE_ISSUED: 'DIRECTIVE_ISSUED',
}
