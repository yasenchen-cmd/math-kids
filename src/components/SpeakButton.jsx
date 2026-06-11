/**
 * 朗读按钮 — 点击后朗读指定文本
 * 专门为幼儿园小朋友设计：大大的喇叭图标，清晰的反馈
 */
export default function SpeakButton({ text, speaking, onSpeak, size = 'normal' }) {
  const btnSize = size === 'large' ? 56 : size === 'small' ? 32 : 44
  const iconSize = size === 'large' ? 28 : size === 'small' ? 16 : 22

  if (!text) return null

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onSpeak(text)
      }}
      style={{
        width: btnSize,
        height: btnSize,
        borderRadius: '50%',
        border: speaking ? '3px solid #4F8CF6' : '2px solid #D0D8E5',
        background: speaking ? '#E3F2FD' : 'white',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        flexShrink: 0,
        boxShadow: speaking ? '0 0 12px rgba(79,140,246,0.3)' : 'none',
        animation: speaking ? 'bounce 0.5s ease-in-out infinite' : 'none',
      }}
      title="点击朗读"
      aria-label="朗读"
    >
      {speaking ? (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
          <rect x="6" y="4" width="4" height="16" rx="1" fill="#4F8CF6"/>
          <rect x="14" y="4" width="4" height="16" rx="1" fill="#4F8CF6"/>
        </svg>
      ) : (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
          <path d="M3 9v6h4l5 5V4L7 9H3z" fill="#4F8CF6"/>
          <path d="M16 7.5A4.5 4.5 0 0116 16M19 4a8 8 0 010 16" stroke="#4F8CF6" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )}
    </button>
  )
}
