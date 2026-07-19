/**
 * 支付 Hook（纯本地版，不需要后端）
 *
 * 流程：
 * 1. 免费试用 3 个技能
 * 2. 试用耗尽，显示付费墙 + 微信号
 * 3. 家长加微信付款，发送设备 ID
 * 4. 卖家生成解锁码，家长输入后解锁
 * 5. 本地存储设备绑定令牌（非明文 true）
 */

import { useState, useCallback } from 'react'
import { isDeviceUnlocked, persistUnlock, clearUnlock } from '../utils/unlockCode'

const DEVICE_KEY = 'math_kids_device_id'
const TRIAL_KEY = 'math_kids_trial_count'
const TRIAL_LIMIT = 3

function generateId() {
  return 'mn_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10)
}

function getDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY)
    if (!id) {
      id = generateId()
      localStorage.setItem(DEVICE_KEY, id)
    }
    return id
  } catch {
    return generateId()
  }
}

function getTrialCount() {
  try {
    return parseInt(localStorage.getItem(TRIAL_KEY) || '0', 10)
  } catch {
    return 0
  }
}

export default function usePayment() {
  const [deviceId] = useState(() => getDeviceId())
  const [trialUsed, setTrialUsed] = useState(() => getTrialCount())
  const [unlocked, setUnlocked] = useState(() => isDeviceUnlocked(getDeviceId()))

  const trialRemaining = Math.max(0, TRIAL_LIMIT - trialUsed)
  const showPayWall = !unlocked && trialRemaining <= 0

  const consumeTrial = useCallback(() => {
    const next = trialUsed + 1
    setTrialUsed(next)
    try { localStorage.setItem(TRIAL_KEY, String(next)) } catch {}
  }, [trialUsed])

  const doUnlock = useCallback((code) => {
    if (!persistUnlock(deviceId, code)) return false
    setUnlocked(true)
    return true
  }, [deviceId])

  const resetUnlock = useCallback(() => {
    clearUnlock()
    setUnlocked(false)
  }, [])

  return {
    deviceId,
    unlocked,
    trialRemaining,
    trialUsed,
    TRIAL_LIMIT,
    showPayWall,
    consumeTrial,
    doUnlock,
    resetUnlock,
  }
}
