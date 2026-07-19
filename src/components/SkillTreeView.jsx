/**
 * 技能树视图 — V2（角色情绪版）
 * 完全基于 skillGraph，不依赖旧题库
 * 闽南彩蛋：风狮爷解锁后在标题旁显示小标记
 */
import { useState, useMemo } from 'react'
import { getAllSkills, areas, recommendNext } from '../engine/skillGraph'
import { calcMastery, isSkillMastered, areDepsMet } from '../engine/adaptive'
import { isSkillImplemented } from '../engine/questionGenerator'
import { getCharacter } from '../data/characters'
import CharacterMascot from './CharacterMascot'
import { playSafe, playClick } from '../utils/sound'
import { isMinnanUnlocked } from '../hooks/useSecretCharacter'

export default function SkillTreeView({ errorProfile, onSelectSkill, trialRemaining = -1, unlocked = false }) {
  const [expandedAreas, setExpandedAreas] = useState({})
  const skillScores = errorProfile?.skillScores || {}
  const allSkills = useMemo(() => getAllSkills(), [])
  const totalSkills = allSkills.length
  const masteredCount = useMemo(
    () => allSkills.filter(s => isSkillMastered(s.id, skillScores, errorProfile)).length,
    [allSkills, skillScores, errorProfile]
  )
  const minnanUnlocked = isMinnanUnlocked()
  const recommended = useMemo(() => {
    const completed = allSkills
      .filter(s => isSkillMastered(s.id, skillScores, errorProfile))
      .map(s => s.id)
    return recommendNext(completed, skillScores, isSkillImplemented)
  }, [allSkills, skillScores, errorProfile])

  const skillsByArea = useMemo(() => {
    const grouped = {}
    allSkills.forEach(s => {
      if (!grouped[s.area]) grouped[s.area] = []
      grouped[s.area].push(s)
    })
    return grouped
  }, [allSkills])

  return (
    <div style={container}>
      <div style={header}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' }}>
          <h1 style={title}>数学闯关</h1>
          {minnanUnlocked && (
            <span style={minnanBadge} title="风狮爷已解锁！学数学有机会遇到他喔 🦁">
              🦁 闽
            </span>
          )}
        </div>
        <p style={subtitle}>幼儿园 ~ 小学三年级</p>
        <div style={masteryBanner}>
          <span>🏆</span>
          <span>{masteredCount}/{totalSkills} 技能已掌握</span>
        </div>
        {!unlocked && trialRemaining > 0 && (
          <div style={trialBanner}>
            <span>🔍</span>
            <span>免费试用：还可体验 <strong>{trialRemaining}</strong> 个技能</span>
          </div>
        )}
        {!unlocked && trialRemaining === 0 && (
          <div style={trialBannerExpired}>
            <span>🔒</span>
            <span>免费试用已结束，点击任意技能解锁全部内容</span>
          </div>
        )}
        {recommended && (
          <button
            type="button"
            style={recommendBanner}
            onClick={() => {
              const depMet = areDepsMet(recommended.dependencies, skillScores, errorProfile)
              if (depMet && isSkillImplemented(recommended.id)) {
                playSafe(playClick)
                onSelectSkill(recommended.id)
              }
            }}
          >
            <span>👉</span>
            <span>推荐下一关：{recommended.name}</span>
          </button>
        )}
      </div>

      <div style={list}>
        {areas.filter(a => skillsByArea[a.id]).map((area) => {
          const skills = skillsByArea[area.id] || []
          const mastered = skills.filter(s => isSkillMastered(s.id, skillScores, errorProfile)).length
          const isExpanded = expandedAreas[area.id] || false
          const chara = getCharacter(area.id)

          return (
            <div key={area.id} style={areaCard}>
              <button style={{...areaHeader, borderLeft:`6px solid ${area.color}`}}
                onClick={() => {
                  playSafe(playClick)
                  setExpandedAreas(prev => ({...prev, [area.id]: !prev[area.id]}))
                }}>
                <CharacterMascot areaId={area.id} mood="idle" size="small" />
                <div style={areaInfo}>
                  <span style={areaTitle}>{area.name}</span>
                  <span style={areaProgress}>{chara.name} · {mastered}/{skills.length} 已掌握</span>
                </div>
                <span style={{fontSize:'0.8rem',color:'#B2BEC3'}}>{isExpanded ? '▲' : '▼'}</span>
              </button>

              {isExpanded && (
                <div style={skillGrid}>
                  {skills.map(s => {
                    const mastery = calcMastery(s.id, skillScores, errorProfile)
                    const mastered = mastery >= 80
                    const depMet = areDepsMet(s.dependencies, skillScores, errorProfile)
                    const implemented = isSkillImplemented(s.id)
                    const playable = depMet && implemented

                    return (
                      <button key={s.id} style={{
                        ...skillCard,
                        opacity: playable ? 1 : depMet ? 0.55 : 0.4,
                        cursor: playable ? 'pointer' : 'not-allowed',
                        borderColor: mastered ? '#4CAF50' : playable ? area.color : '#E8ECF0',
                        background: mastered ? '#F1F8E9' : !implemented && depMet ? '#FAFAFA' : 'white',
                      }}
                        disabled={!playable}
                        onClick={() => { if (playable) { playSafe(playClick); onSelectSkill(s.id) } }}>
                        <div style={masteryRing}>
                          <svg width="36" height="36" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15" fill="none" stroke="#E8ECF0" strokeWidth="3"/>
                            <circle cx="18" cy="18" r="15" fill="none" stroke={mastered ? '#4CAF50' : area.color}
                              strokeWidth="3" strokeDasharray={`${2*Math.PI*15*mastery/100} ${2*Math.PI*15*(100-mastery)/100}`}
                              strokeLinecap="round" transform="rotate(-90, 18, 18)"/>
                        </svg>
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:600,fontSize:'0.85rem',color:'#2D3436',marginBottom:'2px'}}>{s.name}</div>
                          <div style={{fontSize:'0.7rem',color: mastered ? '#4CAF50' : !implemented && depMet ? '#FF9800' : '#B2BEC3'}}>
                            {mastered ? '✓ 已掌握' : !implemented && depMet ? '🚧 开发中' : `${Math.round(mastery)}%`}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const container = {
  maxWidth:'600px', margin:'0 auto', padding:'20px 16px 40px',
}
const header = {
  textAlign:'center', marginBottom:'24px', paddingTop:'12px',
}
const title = {
  fontSize:'1.75rem', fontWeight:800, color:'#2D3436', marginBottom:'4px',
}
const subtitle = {
  fontSize:'0.9rem', color:'#B2BEC3', marginBottom:'16px',
}
const masteryBanner = {
  display:'inline-flex', alignItems:'center', gap:'8px', background:'#E8F5E9', color:'#2E7D32',
  padding:'8px 16px', borderRadius:'20px', fontSize:'0.9rem', fontWeight:600,
}
const list = {
  display:'flex', flexDirection:'column', gap:'12px',
}
const areaCard = {
  background:'white', borderRadius:'16px', overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.04)',
}
const areaHeader = {
  display:'flex', alignItems:'center', gap:'12px', padding:'14px 16px',
  width:'100%', background:'none', cursor:'pointer', fontSize:'inherit', textAlign:'left',
  border:'none', borderBottom:'1px solid #F0F0F0',
}
const areaInfo = {
  flex:1,
}
const areaTitle = {
  display:'block', fontSize:'1rem', fontWeight:700, color:'#2D3436',
}
const areaProgress = {
  display:'block', fontSize:'0.75rem', color:'#B2BEC3', marginTop:'2px',
}
const skillGrid = {
  display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', padding:'12px',
}
const skillCard = {
  display:'flex', alignItems:'center', gap:'8px', padding:'10px', borderRadius:'12px',
  border:'2px solid #E8ECF0', background:'white', transition:'all 0.15s ease',
  minHeight:'56px',
}
const masteryRing = {
  width:'36px', height:'36px', display:'flex', alignItems:'center', justifyContent:'center',
  flexShrink:0,
}
const minnanBadge = {
  display:'inline-flex', alignItems:'center', gap:'3px',
  background:'#FFF1E6', color:'#D4380D', border:'1.5px solid #D4380D',
  padding:'2px 8px', borderRadius:'10px', fontSize:'0.7rem', fontWeight:700,
  animation:'popIn 0.4s ease-out',
}

const trialBanner = {
  display:'inline-flex', alignItems:'center', gap:'6px',
  background:'#E3F2FD', color:'#1565C0', border:'1.5px solid #90CAF9',
  padding:'6px 14px', borderRadius:'12px', fontSize:'0.8rem', fontWeight:500,
  marginTop:'8px',
}
const trialBannerExpired = {
  display:'inline-flex', alignItems:'center', gap:'6px',
  background:'#FFF3E0', color:'#E65100', border:'1.5px solid #FFCC80',
  padding:'6px 14px', borderRadius:'12px', fontSize:'0.8rem', fontWeight:500,
  marginTop:'8px', animation:'pulse 2s ease-in-out infinite',
}
const recommendBanner = {
  display:'inline-flex', alignItems:'center', gap:'8px',
  background:'#EEF4FF', color:'#1565C0', border:'1.5px solid #90CAF9',
  padding:'8px 16px', borderRadius:'14px', fontSize:'0.85rem', fontWeight:600,
  marginTop:'10px', cursor:'pointer',
}
