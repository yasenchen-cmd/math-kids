/** 移动端 / 语音能力检测 */

export function isAppleTouchDevice() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  if (/iPad|iPhone|iPod/.test(ua)) return true
  // iPadOS 13+ 可能报 MacIntel
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

/** iOS/iPadOS 浏览器不支持可靠的 Web 语音识别 */
export function isSpeechRecognitionReliable() {
  if (typeof window === 'undefined') return false
  if (isAppleTouchDevice()) return false
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition
  return !!Ctor
}
