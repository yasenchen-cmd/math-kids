/**
 * useDirector — React Hook，连接导演层到 UI
 *
 * 封装 SessionState + PacingDirector + EventBus
 * GameScreen 通过这个 hook 获取：
 *   - 当前学习状态
 *   - 节奏指令（mascot_speak, celebrate, easy_win 等）
 *   - 状态变更通知
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { eventBus, Events, SessionState, createPacingDirector, States, getStateLabel } from '../engine/director'

export default function useDirector() {
  const [currentState, setCurrentState] = useState(States.EXPLORING)
  const [pendingDirective, setPendingDirective] = useState(null)
  const [context, setContext] = useState(null)

  const sessionRef = useRef(null)
  const directorRef = useRef(null)

  // 初始化（只一次）
  useEffect(() => {
    const session = new SessionState()
    const director = createPacingDirector()
    sessionRef.current = session
    directorRef.current = director

    // 订阅状态变更
    const unsubState = session.onStateChange((data) => {
      setCurrentState(data.to)
      setContext(data.ctx)
    })

    // 订阅指令
    const unsubDirective = eventBus.on(Events.DIRECTIVE_ISSUED, (directive) => {
      setPendingDirective(directive)
      // 自动清除指令（1 秒后，除非被新的覆盖）
      setTimeout(() => {
        setPendingDirective(prev => prev === directive ? null : prev)
      }, 1000)
    })

    session.reset()
    eventBus.emit(Events.SESSION_START, { skillId: null })

    return () => {
      eventBus.emit(Events.SESSION_END, {})
      unsubState()
      unsubDirective()
      session.destroy()
      director.destroy()
    }
  }, [])

  // 处理答对
  const onCorrect = useCallback((data = {}) => {
    eventBus.emit(Events.ANSWER_CORRECT, { ...data, timestamp: Date.now() })
    if (directorRef.current) {
      return directorRef.current.handleEvent(Events.ANSWER_CORRECT, {
        ...data,
        context: sessionRef.current?.context,
      })
    }
    return []
  }, [])

  // 处理答错
  const onWrong = useCallback((data = {}) => {
    eventBus.emit(Events.ANSWER_WRONG, { ...data, timestamp: Date.now() })
    if (directorRef.current) {
      return directorRef.current.handleEvent(Events.ANSWER_WRONG, {
        ...data,
        context: sessionRef.current?.context,
      })
    }
    return []
  }, [])

  // 用户交互事件（点击/触摸/拖拽）
  const onInput = useCallback(() => {
    eventBus.emit(Events.INPUT_EVENT, { timestamp: Date.now() })
  }, [])

  // 记录空闲
  const onIdle = useCallback((seconds) => {
    eventBus.emit(Events.IDLE_START, { seconds, timestamp: Date.now() })
  }, [])

  // 获取当前上下文
  const getContext = useCallback(() => {
    return sessionRef.current?.context || null
  }, [])

  return {
    // 状态
    currentState,
    stateLabel: getStateLabel(currentState),
    context,

    // 指令
    pendingDirective,
    clearDirective: () => setPendingDirective(null),

    // 事件发射
    onCorrect,
    onWrong,
    onInput,
    onIdle,

    // 工具
    getContext,

    // 引用（对外暴露，谨慎使用）
    eventBus,
    session: sessionRef,
    director: directorRef,
  }
}
