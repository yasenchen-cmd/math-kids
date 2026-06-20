/** 再试提示条 */
export default function RetryHintBanner({ hint, upgraded }) {
  if (!hint) return null

  return (
    <div style={banner}>
      <span style={icon}>💡</span>
      <div style={textWrap}>
        <div style={mainText}>{hint.text}</div>
        {upgraded && (
          <div style={subText}>已切换为动手模式，试着操作一下吧</div>
        )}
      </div>
    </div>
  )
}

const banner = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  background: 'linear-gradient(135deg, #FFF8E1, #FFF3E0)',
  border: '2px solid #FFB347',
  borderRadius: '14px',
  padding: '12px 16px',
  marginBottom: '12px',
  animation: 'fadeInUp 0.3s ease-out',
}

const icon = { fontSize: '1.4rem', flexShrink: 0 }
const textWrap = { flex: 1 }
const mainText = { fontSize: '0.95rem', fontWeight: 600, color: '#E65100' }
const subText = { fontSize: '0.8rem', color: '#F57C00', marginTop: '2px' }
