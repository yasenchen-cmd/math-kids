/**
 * 解锁码校验（纯本地）
 *
 * 说明：静态站点无法做到真正服务端鉴权；这里用设备绑定令牌，
 * 避免 `localStorage.setItem('unlocked','true')` 即可绕过。
 * 解锁状态存的是校验通过的码本身，而非布尔标记。
 */

export const UNLOCK_SECRET = 'mn-unlock-v2'
export const UNLOCK_TOKEN_KEY = 'math_kids_unlock_token'
/** @deprecated 旧版明文标记，读取时忽略并清理 */
export const LEGACY_UNLOCK_KEY = 'math_kids_unlocked'

/** FNV-1a 32-bit，再混一轮得到稳定 hex */
function hashDigest(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  let h2 = 2166136261
  const mid = `${h >>> 0}:${str.length}:${UNLOCK_SECRET}`
  for (let i = 0; i < mid.length; i++) {
    h2 ^= mid.charCodeAt(i)
    h2 = Math.imul(h2, 16777619)
  }
  const a = (h >>> 0).toString(16).padStart(8, '0')
  const b = (h2 >>> 0).toString(16).padStart(8, '0')
  return `${a}${b}`
}

function toUrlSafeBase64(raw) {
  if (typeof btoa === 'function') {
    return btoa(raw).replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  }
  // Node / vitest
  return Buffer.from(raw, 'utf8').toString('base64').replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

/** 根据设备 ID 生成解锁码（卖家工具与客户端共用） */
export function generateUnlockCode(deviceId) {
  if (!deviceId || typeof deviceId !== 'string') return ''
  const digest = hashDigest(`${UNLOCK_SECRET}:${deviceId.trim()}`)
  return toUrlSafeBase64(digest)
}

export function isValidUnlockCode(deviceId, code) {
  if (!deviceId || !code || typeof code !== 'string') return false
  const trimmed = code.trim()
  if (trimmed.length < 8) return false
  return generateUnlockCode(deviceId) === trimmed
}

export function readStoredUnlockToken() {
  try {
    return localStorage.getItem(UNLOCK_TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function isDeviceUnlocked(deviceId) {
  try {
    // 清理旧版可伪造标记
    if (localStorage.getItem(LEGACY_UNLOCK_KEY) != null) {
      localStorage.removeItem(LEGACY_UNLOCK_KEY)
    }
  } catch { /* ignore */ }
  return isValidUnlockCode(deviceId, readStoredUnlockToken())
}

export function persistUnlock(deviceId, code) {
  const trimmed = String(code || '').trim()
  if (!isValidUnlockCode(deviceId, trimmed)) return false
  try {
    localStorage.setItem(UNLOCK_TOKEN_KEY, trimmed)
    localStorage.removeItem(LEGACY_UNLOCK_KEY)
  } catch { /* ignore */ }
  return true
}

export function clearUnlock() {
  try {
    localStorage.removeItem(UNLOCK_TOKEN_KEY)
    localStorage.removeItem(LEGACY_UNLOCK_KEY)
  } catch { /* ignore */ }
}
