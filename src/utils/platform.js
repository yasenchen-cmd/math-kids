/** 移动端 / 语音能力检测 */

export function isAppleTouchDevice() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  if (/iPad|iPhone|iPod/.test(ua)) return true
  // iPadOS 13+ 可能报 MacIntel
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

/**
 * 检测是否支持 Web 语音识别
 *
 * iOS 16.5+ 的 Safari 已支持 SpeechRecognition（webkitSpeechRecognition），
 * 但仍需用户手势触发且识别精度受限。这里不再提前拦截苹果设备，
 * 让浏览器自己决定是否可用，失败时由调用方处理错误提示。
 */
export function isSpeechRecognitionReliable() {
  if (typeof window === 'undefined') return false
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition
  return !!Ctor
}
