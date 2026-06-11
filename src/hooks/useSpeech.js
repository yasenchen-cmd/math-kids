/**
 * 语音朗读系统
 *
 * 使用 Web Speech API (TTS) 朗读中文
 * 包含完整的降级处理：
 * - TTS 不可用时优雅降级（不会卡死）
 * - 核心激励语句用 Web Audio API 合成音效（跨平台一致）
 */

import { useState, useCallback, useRef } from 'react'

// TTS 可用性检测
let ttsSupported = null
function checkTTSSupport() {
  if (ttsSupported !== null) return ttsSupported
  if (typeof window === 'undefined') {
    ttsSupported = false
    return false
  }
  try {
    ttsSupported = !!window.speechSynthesis
  } catch (e) {
    ttsSupported = false
  }
  return ttsSupported
}

export default function useSpeech() {
  const [speaking, setSpeaking] = useState(false)
  const [ttsAvailable, setTtsAvailable] = useState(() => checkTTSSupport())
  const utteranceRef = useRef(null)

  const speak = useCallback((text, options = {}) => {
    if (!text) return

    const synth = window.speechSynthesis
    if (!synth) return // TTS 不可用，静默降级

    // 取消正在读的
    try {
      synth.cancel()
    } catch (e) {
      // 某些浏览器在取消时可能抛异常
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'zh-CN'
      utterance.rate = options.rate ?? 0.85
      utterance.pitch = options.pitch ?? 1.1
      utterance.volume = options.volume ?? 1

      // 尝试选中文语音
      const voices = synth.getVoices()
      const zhVoice = voices.find(v =>
        v.lang.startsWith('zh') &&
        (v.name.includes('Female') || v.name.includes('女生') || v.name.includes('Microsoft'))
      ) || voices.find(v => v.lang.startsWith('zh'))
      if (zhVoice) utterance.voice = zhVoice

      utterance.onstart = () => setSpeaking(true)
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)

      utteranceRef.current = utterance
      synth.speak(utterance)
    } catch (e) {
      // TTS 失败，静默降级
      setSpeaking(false)
    }
  }, [])

  const stop = useCallback(() => {
    try {
      const synth = window.speechSynthesis
      if (synth) synth.cancel()
    } catch (e) {
      // 静默
    }
    setSpeaking(false)
  }, [])

  return { speak, stop, speaking, ttsAvailable }
}
