/**
 * 付费墙组件（纯本地版）
 *
 * 试用耗尽后显示微信号，家长付款后点击「已付款」解锁。
 * 不需要任何后端。
 */

import { useState } from 'react'

export default function PayWall({ deviceId, onUnlock }) {
  const [showConfirm, setShowConfirm] = useState(false)

  const handleConfirmPaid = () => {
    onUnlock()
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

        {/* 微信联系 */}
        <div style={{ marginTop: '16px', padding: '14px', background: '#F5F5F5', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: '#636E72', marginBottom: '8px' }}>
            添加微信购买
          </div>
          <div style={{
            display: 'inline-block', background: '#fff', border: '2px solid #07C160',
            borderRadius: '10px', padding: '8px 20px', fontSize: '1.1rem',
            fontWeight: 700, color: '#07C160', userSelect: 'all',
          }}>
            arthurchan1977
          </div>
          <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#999', lineHeight: 1.5 }}>
            加好友时发送下方的设备 ID<br/>
            付款后点击「已付款」即可解锁
          </div>
          <div style={{
            marginTop: '6px', padding: '8px 12px', fontSize: '0.75rem',
            color: '#333', background: '#fff', borderRadius: '8px',
            border: '1px dashed #ccc', wordBreak: 'break-all',
            userSelect: 'all', WebkitUserSelect: 'all',
            cursor: 'text',
          }}>
            {deviceId}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '4px' }}>
            点按即可复制
          </div>
        </div>

        {/* 已付款按钮 */}
        {!showConfirm ? (
          <button
            style={confirmBtn}
            onClick={() => setShowConfirm(true)}
          >
            我已付款
          </button>
        ) : (
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '0.85rem', color: '#636E72', marginBottom: '12px' }}>
              确认卖家已收款后点击下方按钮
            </p>
            <button
              style={unlockBtn}
              onClick={handleConfirmPaid}
            >
              ✅ 已付款，解锁
            </button>
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
const confirmBtn = {
  display: 'block', width: '100%', marginTop: '16px',
  background: 'linear-gradient(135deg, #07C160, #06AD56)',
  color: 'white', border: 'none', padding: '14px 0',
  borderRadius: '14px', fontSize: '1.1rem', fontWeight: 700,
  boxShadow: '0 4px 12px rgba(7,193,96,0.3)',
}
const unlockBtn = {
  background: '#D4380D', color: 'white', border: 'none',
  padding: '12px 32px', borderRadius: '14px', fontSize: '1rem', fontWeight: 700,
}
