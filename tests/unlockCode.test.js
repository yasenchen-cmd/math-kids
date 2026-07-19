import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateUnlockCode,
  isValidUnlockCode,
  persistUnlock,
  isDeviceUnlocked,
  clearUnlock,
  UNLOCK_TOKEN_KEY,
  LEGACY_UNLOCK_KEY,
} from '../src/utils/unlockCode.js'

function mockLocalStorage() {
  const store = Object.create(null)
  globalThis.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v) },
    removeItem: (k) => { delete store[k] },
  }
}

describe('unlockCode', () => {
  const deviceId = 'mn_test_device_abc'

  beforeEach(() => {
    mockLocalStorage()
    clearUnlock()
  })

  it('generates stable codes for the same device', () => {
    expect(generateUnlockCode(deviceId)).toBe(generateUnlockCode(deviceId))
    expect(generateUnlockCode(deviceId).length).toBeGreaterThan(8)
  })

  it('rejects forged or legacy-style codes', () => {
    const real = generateUnlockCode(deviceId)
    expect(isValidUnlockCode(deviceId, real)).toBe(true)
    expect(isValidUnlockCode(deviceId, 'true')).toBe(false)
    expect(isValidUnlockCode(deviceId, btoa('mn-unlock-v1:' + deviceId).replace(/=/g, ''))).toBe(false)
    expect(isValidUnlockCode('other', real)).toBe(false)
  })

  it('does not unlock from legacy boolean flag', () => {
    localStorage.setItem(LEGACY_UNLOCK_KEY, 'true')
    expect(isDeviceUnlocked(deviceId)).toBe(false)
    expect(localStorage.getItem(LEGACY_UNLOCK_KEY)).toBeNull()
  })

  it('persists only a valid device-bound token', () => {
    expect(persistUnlock(deviceId, 'nope')).toBe(false)
    expect(isDeviceUnlocked(deviceId)).toBe(false)

    const code = generateUnlockCode(deviceId)
    expect(persistUnlock(deviceId, code)).toBe(true)
    expect(isDeviceUnlocked(deviceId)).toBe(true)
    expect(localStorage.getItem(UNLOCK_TOKEN_KEY)).toBe(code)
  })
})
