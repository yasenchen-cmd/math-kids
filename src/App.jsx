import { useState, useEffect, useRef, useCallback } from 'react'
import SkillTreeView from './components/SkillTreeView'
import GameScreen from './components/GameScreen'
import { loadProfile, saveProfile } from './engine/errorProfile'
import { useProgress } from './hooks/useProgress'
import { setSoundEnabled, getSoundEnabled, playSafe, playClick } from './utils/sound'
import { checkFirstMastery } from './hooks/useSecretCharacter'

export default function App() {
  const [showSkillTree, setShowSkillTree] = useState(true)
  const [currentSkill, setCurrentSkill] = useState(null)

  // 错误画像 — 唯一的 state 来源，GameScreen 和 SkillTreeView 共享
  const [errorProfile, setErrorProfile] = useState(() => loadProfile())

  const [soundOn, setSoundOn] = useState(() => getSoundEnabled())
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const { progress } = useProgress()

  // 风狮爷解锁通知
  const [minnanToast, setMinnanToast] = useState(false)

  useEffect(() => { setSoundEnabled(soundOn) }, [soundOn])

  // 定期保存错误画像
  useEffect(() => {
    const interval = setInterval(() => { saveProfile(errorProfile) }, 5000)
    return () => clearInterval(interval)
  }, [errorProfile])

  function handleSelectSkill(skillId) {
    setCurrentSkill(skillId)
    setShowSkillTree(false)
  }

  // 从关卡返回，接收 GameScreen 传回的 errorProfile
  function handleBack(updatedProfile) {
    if (updatedProfile) {
      setErrorProfile(updatedProfile)
      saveProfile(updatedProfile)
    }
    setShowSkillTree(true)
    setCurrentSkill(null)
  }

  // 技能完成，接收 GameScreen 传回的 errorProfile
  function handleMastered(skillId, stars, updatedProfile) {
    // 检测是否第一次拿 3 星 ➜ 解锁风狮爷
    if (checkFirstMastery(stars)) {
      setMinnanToast(true)
      setTimeout(() => setMinnanToast(false), 4000)
    }
    if (updatedProfile) {
      setErrorProfile(updatedProfile)
      saveProfile(updatedProfile)
    }
  }

  function handleReset() {
    const fresh = {
      digitConfusion: {}, calculationOffset: {}, directionErrors: 0,
      skillErrors: {}, consecutiveErrors: 0, totalAttempts: 0,
      skillScores: {}, skillHistory: {},
    }
    setErrorProfile(fresh)
    try {
      localStorage.removeItem('math_kids_error_profile')
      localStorage.removeItem('math_kids_progress')
      localStorage.removeItem('math_kids_minnan_unlocked')
    } catch {}
    setShowResetConfirm(false)
  }

  return (
    <div style={{ position:'relative', minHeight:'100dvh' }}>
      {/* 工具栏 */}
      <div style={toolbar}>
        <button style={toolBtn} onClick={() => { playSafe(playClick); setSoundOn(v => !v) }} title={soundOn ? '关闭音效' : '开启音效'}>
          {soundOn ? '🔊' : '🔇'}
        </button>
        <button style={toolBtn} onClick={() => { playSafe(playClick); setShowResetConfirm(true) }} title="重置所有进度">
          🔄
        </button>
      </div>

      {/* 主内容 */}
      {showSkillTree ? (
        <SkillTreeView
          progress={progress}
          errorProfile={errorProfile}
          onSelectSkill={handleSelectSkill}
        />
      ) : (
        <GameScreen
          skillId={currentSkill}
          onBack={handleBack}
          onMastered={handleMastered}
        />
      )}

      {/* 风狮爷解锁通知 */}
      {minnanToast && (
        <div style={toastOverlay}>
          <div style={toastCard}>
            <div style={{ fontSize:'3rem', marginBottom:'8px' }}>🦁</div>
            <h3 style={{ fontSize:'1.3rem', fontWeight:800, color:'#D4380D', marginBottom:'4px' }}>
              风狮爷出现啦！
            </h3>
            <p style={{ fontSize:'0.95rem', color:'#636E72', lineHeight:1.5 }}>
              汝真𠢕！风狮爷来保庇汝学数学～
              <br />
              <span style={{ fontSize:'0.85rem', color:'#B2BEC3' }}>
                （以后学数学有机会遇到风狮爷喔！）
              </span>
            </p>
          </div>
        </div>
      )}

      {/* 重置确认弹窗 */}
      {showResetConfirm && (
        <div style={overlay}>
          <div style={confirmCard}>
            <h3 style={{fontSize:'1.2rem',fontWeight:700,marginBottom:'12px',color:'#2D3436'}}>重置所有进度</h3>
            <p style={{fontSize:'1rem',color:'#636E72',marginBottom:'20px',lineHeight:1.5}}>
              所有闯关记录、星星和技能掌握度都会被清除，确定吗？
            </p>
            <div style={{display:'flex',gap:'12px',justifyContent:'center'}}>
              <button style={{background:'#E8ECF0',color:'#636E72',border:'none',padding:'10px 24px',borderRadius:'12px',fontSize:'1rem',fontWeight:600,cursor:'pointer'}}
                onClick={() => setShowResetConfirm(false)}>取消</button>
              <button style={{background:'#FF6B6B',color:'white',border:'none',padding:'10px 24px',borderRadius:'12px',fontSize:'1rem',fontWeight:600,cursor:'pointer'}}
                onClick={handleReset}>确定重置</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const toolbar = {
  position:'fixed', top:'12px', right:'12px', display:'flex', gap:'8px', zIndex:100,
}
const toolBtn = {
  background:'white', border:'2px solid #E8ECF0', borderRadius:'50%', width:'40px', height:'40px',
  display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem',
  cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
}
const toastOverlay = {
  position:'fixed', inset:0, background:'rgba(0,0,0,0.25)', display:'flex',
  alignItems:'center', justifyContent:'center', zIndex:300, padding:'20px',
  animation:'fadeInUp 0.3s ease-out',
}
const toastCard = {
  background:'white', borderRadius:'24px', padding:'32px', maxWidth:'320px',
  width:'100%', textAlign:'center', boxShadow:'0 8px 40px rgba(0,0,0,0.2)',
  animation:'popIn 0.4s ease-out',
  border:'3px solid #D4380D',
}
const overlay = {
  position:'fixed', inset:0, background:'rgba(0,0,0,0.3)', display:'flex',
  alignItems:'center', justifyContent:'center', zIndex:200, padding:'20px',
}
const confirmCard = {
  background:'white', borderRadius:'20px', padding:'28px', maxWidth:'340px',
  width:'100%', textAlign:'center', boxShadow:'0 8px 30px rgba(0,0,0,0.15)',
}
