/**
 * 支付 Hook（纯本地版，不需要后端）
 *
 * 流程：
 * 1. 免费试用 3 个技能
 * 2. 试用耗尽，显示付费墙 + 微信号
 * 3. 家长加微信付款，发送设备 ID
 * 4. 卖家确认后，告诉家长点击「已付款」按钮
 * 5. 本地存储解锁标记，永久可用
 */

import { useState, useCallback } from 'react'

const DEVICE_KEY = 'math_kids_device_id'
const TRIAL_KEY = 'math_kids_trial_count'
const UNLOCK_KEY = 'math_kids_unlocked'
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
  const [unlocked, setUnlocked] = useState(() => {
    try { return localStorage.getItem(UNLOCK_KEY) === 'true' } catch { return false }
  })

  const trialRemaining = Math.max(0, TRIAL_LIMIT - trialUsed)
  const showPayWall = !unlocked && trialRemaining <= 0

  // 消耗一次试用
  const consumeTrial = useCallback(() => {
    const next = trialUsed + 1
    setTrialUsed(next)
    try { localStorage.setItem(TRIAL_KEY, String(next)) } catch {}
  }, [trialUsed])

  // 手动解锁（卖家确认付款后调用）
  const doUnlock = useCallback(() => {
    setUnlocked(true)
    try { localStorage.setItem(UNLOCK_KEY, 'true') } catch {}
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
  }
}
