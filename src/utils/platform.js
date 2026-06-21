/** 移动端 / 语音能力检测 */

export function isAppleTouchDevice() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  if (/iPad|iPhone|iPod/.test(ua)) return true
  // iPadOS 13+ 可能报 MacIntel
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

/**
 * 检测 Web Speech Recognition 是否真正可用
 *
 * 注意：iOS Safari 上 `webkitSpeechRecognition` 构造函数虽然存在，
 * 但调用 `start()` 时返回 'service-not-allowed'，实际不可用。
 * 这里提前拦截苹果设备，由调用方提供友好的降级指引。
 */
export function isSpeechRecognitionReliable() {
  if (typeof window === 'undefined') return false
  if (isAppleTouchDevice()) return false
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition
  return !!Ctor
}
