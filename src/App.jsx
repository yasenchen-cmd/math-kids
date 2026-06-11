import { useState, useEffect, useCallback } from 'react'
import SkillTreeView from './components/SkillTreeView'
import GameScreen from './components/GameScreen'
import PayWall from './components/PayWall'
import { loadProfile, saveProfile } from './engine/errorProfile'
import { useProgress } from './hooks/useProgress'
import { setSoundEnabled, getSoundEnabled, playSafe, playClick } from './utils/sound'
import { checkFirstMastery } from './hooks/useSecretCharacter'
import usePayment from './hooks/usePayment'

export default function App() {
  const [showSkillTree, setShowSkillTree] = useState(true)
  const [currentSkill, setCurrentSkill] = useState(null)
  const [pendingSkill, setPendingSkill] = useState(null)

  const [errorProfile, setErrorProfile] = useState(() => loadProfile())
  const [soundOn, setSoundOn] = useState(() => getSoundEnabled())
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showPayWall, setShowPayWall] = useState(false)
  const { progress } = useProgress()
  const [minnanToast, setMinnanToast] = useState(false)

  const {
    unlocked,
    trialRemaining,
    consumeTrial,
    createOrder,
    startPolling,
  } = usePayment()

  useEffect(() => { setSoundEnabled(soundOn) }, [soundOn])

  useEffect(() => {
    const interval = setInterval(() => { saveProfile(errorProfile) }, 5000)
    return () => clearInterval(interval)
  }, [errorProfile])

  function handleSelectSkill(skillId) {
    // 免费试用逻辑
    if (!unlocked) {
      if (trialRemaining > 0) {
        consumeTrial()
      } else {
        setPendingSkill(skillId)
        setShowPayWall(true)
        return
      }
    }
    setCurrentSkill(skillId)
    setShowSkillTree(false)
  }

  function handlePaySuccess() {
    setShowPayWall(false)
    if (pendingSkill) {
      setCurrentSkill(pendingSkill)
      setShowSkillTree(false)
      setPendingSkill(null)
    }
  }

  function handleBack(updatedProfile) {
    if (updatedProfile) {
      setErrorProfile(updatedProfile)
      saveProfile(updatedProfile)
    }
    setShowSkillTree(true)
    setCurrentSkill(null)
    setPendingSkill(null)
  }

  function handleMastered(skillId, stars, updatedProfile) {
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
      localStorage.removeItem('math_kids_trial_count')
    } catch {}
    setShowResetConfirm(false)
  }

  return (
    <div style={{ position:'relative', minHeight:'100dvh' }}>
      {/* 工具栏 */}
      <div style={toolbar}>
        {unlocked && (
          <span style={proBadge}>PRO</span>
        )}
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
          trialRemaining={unlocked ? -1 : trialRemaining}
          unlocked={unlocked}
        />
      ) : (
        <GameScreen
          skillId={currentSkill}
          onBack={handleBack}
          onMastered={handleMastered}
        />
      )}

      {/* 付费墙 */}
      {showPayWall && (
        <PayWall deviceId={deviceId}
          onCreateOrder={createOrder}
          onStartPolling={(orderId, cb) => {
            startPolling(orderId, () => {
              handlePaySuccess()
              cb?.()
            })
          }}
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
  alignItems:'center',
}
const toolBtn = {
  background:'white', border:'2px solid #E8ECF0', borderRadius:'50%', width:'40px', height:'40px',
  display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem',
  cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
}
const proBadge = {
  background:'linear-gradient(135deg,#D4380D,#FF6B6B)', color:'white',
  padding:'3px 10px', borderRadius:'10px', fontSize:'0.7rem', fontWeight:700,
  letterSpacing:'0.5px',
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
