/**
 * 支付 Hook
 *
 * 管理：
 * - 设备 ID（localStorage 持久化）
 * - 试用剩余次数
 * - 付费状态检查
 * - 订单创建与轮询
 */

import { useState, useEffect, useCallback, useRef } from 'react'

const DEVICE_KEY = 'math_kids_device_id'
const TRIAL_KEY = 'math_kids_trial_count'
const TRIAL_LIMIT = 3
const UNLOCK_KEY = 'math_kids_unlocked'

// Worker API 地址（部署后替换）
const API_BASE = 'https://math-kids-pay.xxx.workers.dev'

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

function setTrialCount(n) {
  try { localStorage.setItem(TRIAL_KEY, String(n)) } catch {}
}

function isLocallyUnlocked() {
  try { return localStorage.getItem(UNLOCK_KEY) === 'true' } catch { return false }
}

function setLocalUnlock() {
  try { localStorage.setItem(UNLOCK_KEY, 'true') } catch {}
}

export default function usePayment() {
  const [deviceId] = useState(() => getDeviceId())
  const [trialUsed, setTrialUsed] = useState(() => getTrialCount())
  const [unlocked, setUnlocked] = useState(() => isLocallyUnlocked())
  const [checking, setChecking] = useState(false)
  const pollingRef = useRef(null)

  const trialRemaining = Math.max(0, TRIAL_LIMIT - trialUsed)
  const showPayWall = !unlocked && trialRemaining <= 0

  // 启动时检查服务端解锁状态
  useEffect(() => {
    if (unlocked) return
    setChecking(true)
    fetch(`${API_BASE}/api/check-unlock?device_id=${deviceId}`)
      .then(r => r.json())
      .then(data => {
        if (data.unlocked) {
          setUnlocked(true)
          setLocalUnlock()
        }
      })
      .catch(() => {}) // 网络错误不影响体验
      .finally(() => setChecking(false))
  }, [deviceId])

  // 消耗一次试用
  const consumeTrial = useCallback(() => {
    const next = trialUsed + 1
    setTrialUsed(next)
    setTrialCount(next)
  }, [trialUsed])

  // 创建支付订单
  const createOrder = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId }),
    })
    return await res.json()
  }, [deviceId])

  // 轮询订单状态
  const startPolling = useCallback((orderId, onPaid) => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/check-order?order_id=${orderId}`)
        const data = await res.json()
        if (data.status === 'paid') {
          clearInterval(pollingRef.current)
          pollingRef.current = null
          setUnlocked(true)
          setLocalUnlock()
          onPaid?.()
        }
      } catch {}
    }, 2000)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  // 清理轮询
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  return {
    deviceId,
    unlocked,
    checking,
    trialRemaining,
    trialUsed,
    TRIAL_LIMIT,
    showPayWall,
    consumeTrial,
    createOrder,
    startPolling,
  }
}
