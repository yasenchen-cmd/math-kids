/**
 * 中文数字语音识别 — iOS 16.5+ Safari 支持，Android Chrome 支持
 * 不支持的浏览器自动降级为手点数字
 */

import { useState, useCallback, useRef } from 'react'
import { isSpeechRecognitionReliable } from '../utils/platform.js'

const CN_DIGIT = {
  零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4,
  五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10,
}

export function parseChineseNumber(text) {
  if (!text) return null
  const raw = text.replace(/\s/g, '')
  const ascii = raw.match(/(\d+)/)
  if (ascii) return parseInt(ascii[1], 10)

  if (raw.includes('十')) {
    if (raw === '十') return 10
    const parts = raw.split('十')
    const tens = parts[0] ? (CN_DIGIT[parts[0]] ?? 0) : 1
    const ones = parts[1] ? (CN_DIGIT[parts[1]] ?? 0) : 0
    return tens * 10 + ones
  }

  for (const [word, value] of Object.entries(CN_DIGIT)) {
    if (raw.includes(word)) return value
  }
  return null
}

function getRecognitionCtor() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

const ERROR_MSG = {
  'not-allowed': '请在浏览器设置里允许麦克风，或直接点数字',
  'service-not-allowed': '这个浏览器不支持听语音，请直接点数字',
  'no-speech': '没听到声音，请大声一点，或直接点数字',
  'aborted': '听语音已取消，请直接点数字',
  network: '网络不好，请直接点数字',
  audio: '麦克风不可用，请直接点数字',
}

export function speechRecognitionErrorMessage(code) {
  return ERROR_MSG[code] || '没听清，请直接点下面的数字'
}

export default function useSpeechRecognition() {
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)
  const supported = isSpeechRecognitionReliable()

  const listen = useCallback((onResult, { timeoutMs = 6000 } = {}) => {
    const Ctor = getRecognitionCtor()
    if (!Ctor || !supported) return false

    try {
      if (recRef.current) {
        try { recRef.current.abort?.() || recRef.current.stop() } catch { /* noop */ }
      }

      const rec = new Ctor()
      rec.lang = 'zh-CN'
      rec.interimResults = false
      rec.continuous = false
      rec.maxAlternatives = 5
      recRef.current = rec

      let settled = false
      const finish = (value, errorCode = null) => {
        if (settled) return
        settled = true
        setListening(false)
        try { rec.stop() } catch { /* noop */ }
        onResult?.({ value, error: errorCode })
      }

      const timer = setTimeout(() => finish(null, 'no-speech'), timeoutMs)

      rec.onresult = (event) => {
        clearTimeout(timer)
        const transcript = Array.from(event.results)
          .map(r => r[0]?.transcript || '')
          .join('')
        const value = parseChineseNumber(transcript)
        finish(value, value == null ? 'no-speech' : null)
      }

      rec.onerror = (event) => {
        clearTimeout(timer)
        finish(null, event.error || 'unknown')
      }

      rec.onend = () => {
        setListening(false)
        if (!settled) {
          clearTimeout(timer)
          finish(null, 'no-speech')
        }
      }

      setListening(true)
      rec.start()
      return true
    } catch {
      setListening(false)
      return false
    }
  }, [supported])

  const stop = useCallback(() => {
    try {
      recRef.current?.abort?.() || recRef.current?.stop()
    } catch { /* noop */ }
    setListening(false)
  }, [])

  return { listen, stop, listening, supported }
}
