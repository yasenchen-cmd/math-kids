/**
 * 语音朗读系统 — Web Speech API (TTS)
 * 针对 iOS / iPadOS：预加载 voice、resume 防静音、需用户点击触发
 */

import { useState, useCallback, useRef, useEffect } from 'react'

let voicesCache = []
let voicesReady = false

function getSynth() {
  if (typeof window === 'undefined') return null
  try {
    return window.speechSynthesis || null
  } catch {
    return null
  }
}

function refreshVoices() {
  const synth = getSynth()
  if (!synth) return []
  voicesCache = synth.getVoices() || []
  if (voicesCache.length > 0) voicesReady = true
  return voicesCache
}

function pickZhVoice(voices) {
  return voices.find(v => v.lang.startsWith('zh-CN'))
    || voices.find(v => v.lang.startsWith('zh'))
    || null
}

function resumeSynth(synth) {
  if (!synth) return
  try {
    if (synth.paused) synth.resume()
  } catch { /* noop */ }
}

export function primeSpeech() {
  const synth = getSynth()
  if (!synth) return
  refreshVoices()
  resumeSynth(synth)
}

export default function useSpeech() {
  const [speaking, setSpeaking] = useState(false)
  const [ttsAvailable, setTtsAvailable] = useState(() => !!getSynth())
  const utteranceRef = useRef(null)
  const spokeOnceRef = useRef(false)

  useEffect(() => {
    const synth = getSynth()
    if (!synth) return undefined
    refreshVoices()
    const onVoices = () => refreshVoices()
    synth.addEventListener?.('voiceschanged', onVoices)
    window.speechSynthesis.onvoiceschanged = onVoices
    return () => {
      synth.removeEventListener?.('voiceschanged', onVoices)
    }
  }, [])

  const speak = useCallback((text, options = {}) => {
    if (!text) return

    const synth = getSynth()
    if (!synth) return

    try {
      synth.cancel()
    } catch { /* noop */ }

    resumeSynth(synth)

    const deliver = () => {
      const voices = refreshVoices()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'zh-CN'
      utterance.rate = options.rate ?? 0.85
      utterance.pitch = options.pitch ?? 1.1
      utterance.volume = options.volume ?? 1

      const zhVoice = pickZhVoice(voices)
      if (zhVoice) utterance.voice = zhVoice

      utterance.onstart = () => {
        spokeOnceRef.current = true
        setSpeaking(true)
      }
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)

      utteranceRef.current = utterance
      resumeSynth(synth)
      synth.speak(utterance)
      setTimeout(() => resumeSynth(synth), 100)
    }

    if (!voicesReady) {
      setTimeout(deliver, voicesCache.length === 0 ? 200 : 0)
    } else {
      deliver()
    }
  }, [])

  const stop = useCallback(() => {
    try {
      getSynth()?.cancel()
    } catch { /* noop */ }
    setSpeaking(false)
  }, [])

  return { speak, stop, speaking, ttsAvailable, primeSpeech }
}
