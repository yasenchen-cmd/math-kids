/**
 * 付费墙组件
 *
 * 家长加微信付款后，卖家生成解锁码，家长输入后解锁。
 */

import { useState } from 'react'

const UNLOCK_SECRET = 'mn-unlock-v1'

function isValidUnlockCode(deviceId, code) {
  if (!code || code.length < 10) return false
  const expected = btoa(UNLOCK_SECRET + ':' + deviceId).replace(/=/g, '')
  return code === expected
}

export default function PayWall({ deviceId, onUnlock }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [copiedWechat, setCopiedWechat] = useState(false)
  const [copiedDevice, setCopiedDevice] = useState(false)

  function copyText(text, setter) {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text)
      } else {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setter(true)
      setTimeout(() => setter(false), 2000)
    } catch {}
  }

  const handleSubmit = () => {
    if (isValidUnlockCode(deviceId, code.trim())) {
      setUnlocked(true)
      setError('')
      setTimeout(() => onUnlock(), 800)
    } else {
      setError('解锁码错误，请联系卖家')
    }
  }

  return (
    <div style={overlay}>
      <div style={card}>
        <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🔓</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2D3436', marginBottom: '4px' }}>
          继续学习
        </h2>
        <p style={{ fontSize: '0.9rem', color: '#636E72', marginBottom: '20px', lineHeight: 1.5 }}>
          免费试用已结束<br />
          解锁全部 30+ 技能，全年畅学
        </p>

        {/* 价格 */}
        <div style={priceCard}>
          <div style={{ fontSize: '0.85rem', color: '#636E72', marginBottom: '4px' }}>
            限时优惠 · 年卡
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
            <span style={{ fontSize: '1rem', color: '#B2BEC3', textDecoration: 'line-through' }}>¥199</span>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#D4380D' }}>¥29.9</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#B2BEC3', marginTop: '4px' }}>
            一天不到一毛钱
          </div>
        </div>

        {/* 步骤一：微信联系 */}
        <div style={{ marginTop: '16px', padding: '14px', background: '#F5F5F5', borderRadius: '12px' }}>
          <div style={{ fontSize: '0.85rem', color: '#636E72', marginBottom: '8px', textAlign: 'center' }}>
            步骤一：添加微信购买
          </div>
          <button onClick={() => copyText('arthurchan1977', setCopiedWechat)} style={copyBtn}>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#07C160', flex: 1, textAlign: 'center' }}>
              arthurchan1977
            </span>
            <span style={copyLabel}>
              {copiedWechat ? '已复制 ✓' : '复制'}
            </span>
          </button>

          <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#999', lineHeight: 1.5, textAlign: 'center' }}>
            加好友后发送下方的设备 ID 给卖家
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <div style={deviceIdBox}>{deviceId}</div>
            <button onClick={() => copyText(deviceId, setCopiedDevice)} style={smallCopyBtn}>
              {copiedDevice ? '✓' : '复制'}
            </button>
          </div>
        </div>

        {/* 步骤二：解锁码输入 */}
        {!unlocked && (
          <div style={{ marginTop: '16px', padding: '14px', background: '#F0FFF4', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: '#636E72', marginBottom: '10px' }}>
              步骤二：付款后输入解锁码
            </div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="输入卖家给你的解锁码"
              style={inputStyle}
            />
            {error && (
              <div style={{ color: '#FF6B6B', fontSize: '0.8rem', marginTop: '6px' }}>
                {error}
              </div>
            )}
            <button
              style={{
                ...unlockBtn,
                opacity: code.length < 5 ? 0.5 : 1,
              }}
              disabled={code.length < 5}
              onClick={handleSubmit}
            >
              解锁
            </button>
          </div>
        )}

        {/* 解锁成功 */}
        {unlocked && (
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🎉</div>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#2E7D32' }}>
              解锁成功，开始学习吧！
            </p>
          </div>
        )}

        <div style={{ marginTop: '16px', fontSize: '0.75rem', color: '#B2BEC3', lineHeight: 1.6 }}>
          • 付款后永久使用<br />
          • 不满意可退款
        </div>
      </div>
    </div>
  )
}

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 500, padding: '20px', animation: 'fadeInUp 0.3s ease-out',
}
const card = {
  background: 'white', borderRadius: '24px', padding: '32px 28px',
  maxWidth: '360px', width: '100%', textAlign: 'center',
  boxShadow: '0 8px 40px rgba(0,0,0,0.2)', animation: 'popIn 0.4s ease-out',
}
const priceCard = {
  background: '#FFF8F0', border: '2px solid #FFE0B2',
  borderRadius: '16px', padding: '16px',
}
const copyBtn = {
  display: 'flex', alignItems: 'center', gap: '8px',
  width: '100%', background: '#fff', border: '2px solid #07C160',
  borderRadius: '10px', padding: '8px 12px', cursor: 'pointer',
  fontSize: 'inherit',
}
const copyLabel = {
  fontSize: '0.7rem', color: '#07C160', fontWeight: 600,
  whiteSpace: 'nowrap', flexShrink: 0,
}
const deviceIdBox = {
  flex: 1, padding: '8px 10px', fontSize: '0.75rem',
  color: '#333', background: '#fff', borderRadius: '8px',
  border: '1px dashed #ccc', wordBreak: 'break-all',
  overflow: 'hidden',
}
const smallCopyBtn = {
  background: '#D4380D', color: 'white', border: 'none',
  borderRadius: '8px', padding: '8px 12px', fontSize: '0.75rem',
  fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
}
const inputStyle = {
  width: '100%', padding: '10px 14px', fontSize: '0.9rem',
  border: '2px solid #E8ECF0', borderRadius: '10px',
  textAlign: 'center', outline: 'none', boxSizing: 'border-box',
}
const unlockBtn = {
  display: 'block', width: '100%', marginTop: '10px',
  background: '#D4380D', color: 'white', border: 'none',
  padding: '12px 0', borderRadius: '12px', fontSize: '1rem', fontWeight: 700,
}
