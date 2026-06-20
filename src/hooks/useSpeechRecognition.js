/**
 * 中文数字语音识别 — 轻量解析，不支持时静默降级
 */

import { useState, useCallback, useRef } from 'react'

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

export default function useSpeechRecognition() {
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)
  const supported = !!getRecognitionCtor()

  const listen = useCallback((onNumber, { timeoutMs = 4000 } = {}) => {
    const Ctor = getRecognitionCtor()
    if (!Ctor) return false

    try {
      if (recRef.current) {
        try { recRef.current.stop() } catch { /* noop */ }
      }

      const rec = new Ctor()
      rec.lang = 'zh-CN'
      rec.interimResults = false
      rec.maxAlternatives = 5
      recRef.current = rec

      let settled = false
      const finish = (value) => {
        if (settled) return
        settled = true
        setListening(false)
        try { rec.stop() } catch { /* noop */ }
        if (value != null) onNumber?.(value)
      }

      const timer = setTimeout(() => finish(null), timeoutMs)

      rec.onresult = (event) => {
        clearTimeout(timer)
        const transcript = Array.from(event.results)
          .map(r => r[0]?.transcript || '')
          .join('')
        finish(parseChineseNumber(transcript))
      }

      rec.onerror = () => {
        clearTimeout(timer)
        finish(null)
      }

      rec.onend = () => setListening(false)
      setListening(true)
      rec.start()
      return true
    } catch {
      setListening(false)
      return false
    }
  }, [])

  const stop = useCallback(() => {
    try { recRef.current?.stop() } catch { /* noop */ }
    setListening(false)
  }, [])

  return { listen, stop, listening, supported }
}
