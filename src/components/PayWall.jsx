/**
 * 付费墙组件
 *
 * 试用耗尽后显示，引导家长扫码付费。
 * 支持两种模式：
 * - 真实模式：显示虎皮椒生成的二维码
 * - 模拟模式：显示模拟支付链接（测试用）
 */

import { useState } from 'react'

export default function PayWall({ onCreateOrder, onStartPolling }) {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePay = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await onCreateOrder()
      if (data.error) {
        setError(data.error)
        return
      }
      setOrder(data)
      if (data.order_id) {
        onStartPolling(data.order_id, () => {})
      }
    } catch (e) {
      setError('创建订单失败，请稍后重试')
    } finally {
      setLoading(false)
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

        {!order ? (
          <>
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

            {error && (
              <div style={{ color: '#FF6B6B', fontSize: '0.85rem', marginBottom: '12px' }}>
                {error}
              </div>
            )}

            <button
              style={{
                ...payBtn,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'wait' : 'pointer',
              }}
              onClick={handlePay}
              disabled={loading}
            >
              {loading ? '生成支付码中...' : '微信扫码支付 ¥29.9'}
            </button>

            <div style={{ fontSize: '0.75rem', color: '#B2BEC3', marginTop: '12px', lineHeight: 1.6 }}>
              • 支持微信 / 支付宝<br />
              • 不满意可退款<br />
              • 一次购买，全平台通用
            </div>
          </>
        ) : order.unlocked ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🎉</div>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#2E7D32', marginBottom: '8px' }}>
              已解锁！开始学习吧
            </p>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#2D3436', marginBottom: '12px' }}>
              扫码支付 ¥29.9
            </div>

            {order.qr_url ? (
              <img src={order.qr_url} alt="支付二维码"
                style={{ width: '200px', height: '200px', borderRadius: '12px', marginBottom: '12px' }}
              />
            ) : (
              <div style={demoQr}>
                <div style={{ fontSize: '3rem', marginBottom: '8px' }}>📱</div>
                <div style={{ fontSize: '0.85rem', color: '#636E72', marginBottom: '4px' }}>
                  模拟支付模式
                </div>
                <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '8px' }}>
                  （演示用，不扣费）
                </div>
                <a href={order.order_url || '#'} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#4F8CF6', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                  点击模拟支付
                </a>
              </div>
            )}

            <div style={{ fontSize: '0.8rem', color: '#B2BEC3', marginTop: '8px' }}>
              支付完成后自动解锁，请勿关闭此页面
            </div>
          </div>
        )}

        {/* 联系作者 */}
        {!order?.qr_url && !order?.unlocked && (
          <div style={{ marginTop: '14px', padding: '10px', background: '#F5F5F5', borderRadius: '12px', fontSize: '0.85rem' }}>
            当前为演示模式，如需购买请
            <a href="https://github.com/yasenchen-cmd/math-kids/issues/new?template=buy.md" target="_blank" rel="noopener noreferrer"
              style={{ color: '#D4380D', fontWeight: 700, textDecoration: 'underline' }}>
              联系作者
            </a>
          </div>
        )}

        <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#B2BEC3' }}>
          数学闯关 · 适合 3–8 岁儿童
        </div>
      </div>
    </div>
  )
}

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 500, padding: '20px',
  animation: 'fadeInUp 0.3s ease-out',
}
const card = {
  background: 'white', borderRadius: '24px', padding: '32px 28px',
  maxWidth: '360px', width: '100%', textAlign: 'center',
  boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
  animation: 'popIn 0.4s ease-out',
}
const priceCard = {
  background: '#FFF8F0', border: '2px solid #FFE0B2',
  borderRadius: '16px', padding: '16px', marginBottom: '16px',
}
const payBtn = {
  display: 'block', width: '100%',
  background: 'linear-gradient(135deg, #07C160, #06AD56)',
  color: 'white', border: 'none', padding: '14px 0',
  borderRadius: '14px', fontSize: '1.1rem', fontWeight: 700,
  boxShadow: '0 4px 12px rgba(7,193,96,0.3)',
}
const demoQr = {
  background: '#F5F5F5', borderRadius: '16px', padding: '24px',
  marginBottom: '12px',
}
