
import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { getSkill } from '../engine/skillGraph'
import { generateQuestion } from '../engine/questionGenerator'
import { getAdaptiveConfig } from '../engine/adaptive'
import { applyInterventions } from '../engine/interventionMatrix'
import { recordAttempt, loadProfile } from '../engine/errorProfile'
import { playSafe, playCorrect, playWrong, playLevelComplete, playClick } from '../utils/sound'
import { getCharacter, pickLine } from '../data/characters'
import SpeakButton from './SpeakButton'
import CharacterMascot from './CharacterMascot'
import CelebrationEffect from './CelebrationEffect'
import useSpeech from '../hooks/useSpeech'
import useDirector from '../hooks/useDirector'
import { shouldShowSecretMascot } from '../hooks/useSecretCharacter'
import DragCombine from './manipulative/DragCombine'
import CountAndTap from './manipulative/CountAndTap'

const THEME_CYCLE = ['fruits', 'animals', 'candies', 'blocks', 'toys']

export default function GameScreen({ skillId, onBack, onMastered }) {
  const skill = getSkill(skillId)

  // 风狮爷彩蛋：解锁后 25% 概率随机客串
  const [secretActive] = useState(() => shouldShowSecretMascot())
  const effectiveArea = useMemo(() => {
    if (secretActive) return 'minnan_secret'
    return skill?.area
  }, [secretActive, skill?.area])

  const { speak, stop, speaking } = useSpeech()
  const chara = getCharacter(effectiveArea)
  const director = useDirector()

  // 游戏状态
  const [phase, setPhase] = useState('teach')
  const [question, setQuestion] = useState(null)
  const [qIndex, setQIndex] = useState(0)
  const [score, setScore] = useState(0)
  const totalQ = 5
  const [feedback, setFeedback] = useState(null)
  const [errorProfile, setErrorProfile] = useState(() => loadProfile())
  const [visualTheme, setVisualTheme] = useState(0)
  const [mascotMood, setMascotMood] = useState('idle')
  const [mascotSpeech, setMascotSpeech] = useState('')
  const [celebrate, setCelebrate] = useState(null)
  const [easyWinMode, setEasyWinMode] = useState(false)

  const skillScores = errorProfile.skillScores || {}
  const idleTimerRef = useRef(null)

  // ===== 导演层指令处理 =====
  useEffect(() => {
    const d = director.pendingDirective
    if (!d) return

    switch (d.type) {
      case 'mascot_speak':
        setMascotMood(d.mood || 'idle')
        const text = d.text || pickLine(effectiveArea, d.mood)
        setMascotSpeech(text)
        if (d.delay > 0) {
          setTimeout(() => speak(text, { rate: 0.85 }), d.delay)
        } else {
          speak(text, { rate: 0.85 })
        }
        break

      case 'celebrate': {
        const intensity = d.intensity || 'normal'
        const type = intensity === 'over_the_top' || intensity === 'high' ? 'complete' : 'correct'
        const dur = intensity === 'over_the_top' ? 2000 : intensity === 'high' ? 1200 : 800
        setCelebrate(type)
        setTimeout(() => setCelebrate(null), dur)
        break
      }

      case 'easy_win':
        if (d.guarantee) setEasyWinMode(true)
        break

      case 'simplify':
        // 由 nextQuestion 中 interventionOpts 处理
        break

      case 'surprise':
        setMascotMood('celebrate')
        setMascotSpeech('✨ 嘿！✨')
        setTimeout(() => setMascotMood('idle'), 1500)
        break

      case 'switch_interaction':
        // 后续扩展：切换交互模式
        break

      case 'intervention_force':
        // 强制干预由 nextQuestion 中 applyInterventions 处理
        break
    }
  }, [director.pendingDirective])

  // 教学阶段自动招呼
  useEffect(() => {
    if (phase === 'teach' && skill) {
      const timer = setTimeout(() => {
        const line = pickLine(effectiveArea, 'teach')
        setMascotSpeech(line)
        setMascotMood('happy')
        speak(line, { rate: 0.85 })
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [phase])

  // ===== 生成新题目 =====
  const nextQuestion = useCallback(() => {
    const { options: interventionOpts, feedback: interventionFeedback } = applyInterventions(errorProfile)

    // 如果开启了 easyWin 模式，强制最低难度
    if (easyWinMode) {
      interventionOpts.difficultyBoost = -2
      interventionOpts.maxItems = 3
      interventionOpts.forceVisual = true
      interventionOpts.stepByStep = true
    }

    const config = getAdaptiveConfig(skillId, skillScores, errorProfile)
    const theme = THEME_CYCLE[visualTheme % THEME_CYCLE.length]
    setVisualTheme(v => v + 1)

    const genOptions = {
      difficulty: interventionOpts.difficultyBoost
        ? Math.max(1, config.difficulty + interventionOpts.difficultyBoost)
        : config.difficulty,
      visualTheme: theme,
      previousErrors: errorProfile,
      ...interventionOpts,
    }

    const q = generateQuestion(skillId, genOptions)
    setQuestion(q)
    setFeedback(null)
    setEasyWinMode(false)

    if (interventionFeedback) {
      setMascotSpeech(interventionFeedback)
      setMascotMood('thinking')
    }
  }, [skillId, skillScores, errorProfile, visualTheme, easyWinMode])

  // ===== 开始游戏 =====
  const startGame = useCallback(() => {
    setPhase('play')
    setQIndex(0)
    setScore(0)
    setMascotMood('idle')
    director.onInput()
    nextQuestion()
  }, [nextQuestion])

  // 新题目自动朗读
  useEffect(() => {
    if (phase === 'play' && question) {
      const text = question.promptNarrative || question.prompt
      const timer = setTimeout(() => speak(text, { rate: 0.85 }), 400)
      return () => clearTimeout(timer)
    }
  }, [qIndex, phase, question])

  // ===== 空闲检测 =====
  // 每次用户交互重置空闲计时器
  const resetIdleTimer = useCallback(() => {
    director.onInput()
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(() => {
      director.onIdle(8)
    }, 8000)
  }, [])

  useEffect(() => {
    if (phase === 'play') {
      resetIdleTimer()
      document.addEventListener('pointerdown', resetIdleTimer)
      return () => {
        document.removeEventListener('pointerdown', resetIdleTimer)
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      }
    }
  }, [phase, qIndex])

  // ===== 处理答案 =====
  const handleAnswer = useCallback((userAnswer) => {
    if (feedback || !question) return
    resetIdleTimer()

    const isCorrect = userAnswer === question.answer
    const updatedProfile = recordAttempt(errorProfile, skillId, question, userAnswer, isCorrect)
    setErrorProfile(updatedProfile)

    if (isCorrect) {
      setScore(s => s + 1)
      setFeedback({ type: 'correct' })
      playSafe(playCorrect)
      // 导演层接管节奏
      director.onCorrect({ streak: (director.context?.streak || 0) + 1 })
    } else {
      setFeedback({ type: 'wrong', correctAnswer: question.answer })
      playSafe(playWrong)
      director.onWrong({ errors: (director.context?.errors || 0) + 1 })
    }
  }, [question, feedback, skillId, errorProfile, speak, resetIdleTimer])

  const handleNext = useCallback(() => {
    stop()
    if (qIndex < totalQ - 1) {
      setQIndex(i => i + 1)
      nextQuestion()
      resetIdleTimer()
    } else {
      setPhase('result')
      setMascotMood('celebrate')
      const line = pickLine(effectiveArea, 'complete')
      setMascotSpeech(line)
      speak(line, { rate: 0.85 })
      setCelebrate('complete')
      playSafe(playLevelComplete)
      setTimeout(() => setCelebrate(null), 2000)
    }
  }, [qIndex, totalQ, nextQuestion, stop, resetIdleTimer])

  if (!skill) {
    return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100dvh',color:'#FF6B6B',fontSize:'1.2rem'}}>技能未找到</div>
  }

  // ===== 教学阶段 =====
  if (phase === 'teach') {
    return (
      <div style={{minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',background: chara.bgGradient}}>
        <div style={{maxWidth:'500px',width:'100%',textAlign:'center'}}>
          <div style={{marginBottom:'16px'}}>
            <CharacterMascot areaId={effectiveArea} mood="happy" size="large" customText={mascotSpeech} showSpeech />
          </div>
          <div style={{fontSize:'0.8rem',color:'#B2BEC3',marginBottom:'12px'}}>状态：{director.stateLabel}</div>
          <h2 style={{fontSize:'1.5rem',fontWeight:700,color:'#2D3436',marginBottom:'8px'}}>{skill.name}</h2>
          <p style={{fontSize:'0.9rem',color:'#636E72',marginBottom:'16px'}}>{chara.name}带你学：{skill.description || skill.name}</p>
          <div style={{background:'white',borderRadius:'20px',padding:'20px',marginBottom:'20px',boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
            <p style={{fontSize:'1.2rem',lineHeight:1.6,color:'#2D3436',fontStyle:'italic'}}>「{pickLine(effectiveArea, 'teach')}」</p>
            <div style={{marginTop:'16px'}}><p style={{fontSize:'1rem',lineHeight:1.5,color:'#636E72'}}>{skill.description}</p></div>
          </div>
          <button style={{background:'linear-gradient(135deg,#4F8CF6,#7AADFF)',color:'white',border:'none',padding:'16px 48px',borderRadius:'50px',fontSize:'1.3rem',fontWeight:700,cursor:'pointer',boxShadow:'0 4px 15px rgba(79,140,246,0.3)'}}
            onClick={() => { stop(); startGame(); playSafe(playClick) }}>和{chara.name}一起学！</button>
          <button style={{display:'block',background:'none',border:'none',color:'#B2BEC3',fontSize:'0.9rem',margin:'16px auto 0',cursor:'pointer'}}
            onClick={() => { stop(); onBack(errorProfile) }}>← 返回</button>
        </div>
      </div>
    )
  }

  // ===== 答题阶段 =====
  if (phase === 'play') {
    return (
      <div style={{minHeight:'100dvh',display:'flex',flexDirection:'column',padding:'16px',maxWidth:'600px',margin:'0 auto'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'4px'}}>
          <CharacterMascot areaId={effectiveArea} mood={mascotMood} size="small" />
          <div style={{flex:1}}>
            <div style={{height:'8px',background:'#E8ECF0',borderRadius:'4px',overflow:'hidden'}}>
              <div style={{height:'100%',borderRadius:'4px',transition:'width 0.3s ease',width:`${((qIndex+1)/totalQ)*100}%`,background:'#4F8CF6'}} />
            </div>
          </div>
          <span style={{fontSize:'0.75rem',fontWeight:600,color:'#B2BEC3',minWidth:'56px'}}>{director.stateLabel}</span>
          <span style={{fontSize:'0.9rem',fontWeight:600,color:'#636E72',minWidth:'40px'}}>{qIndex+1}/{totalQ}</span>
          <button style={{background:'none',border:'none',fontSize:'1.2rem',color:'#B2BEC3',padding:'4px 8px',cursor:'pointer'}}
            onClick={() => { stop(); onBack(errorProfile) }}>✕</button>
        </div>

        {mascotSpeech && (
          <div style={{textAlign:'center',padding:'4px 12px',marginBottom:'4px',fontSize:'0.9rem',color: chara.color,fontWeight:500,fontStyle:'italic',animation:'fadeInUp 0.3s ease-out'}}>
            💬 {mascotSpeech}
          </div>
        )}

        {question && (
          <div style={{display:'flex',alignItems:'flex-start',gap:'10px',marginBottom:'12px'}}>
            <div style={{flex:1,background:'white',borderRadius:'20px',padding:'20px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',textAlign:'center'}}>
              <p style={{fontSize:'1.3rem',fontWeight:600,lineHeight:1.6,color:'#2D3436'}}>{question.promptNarrative || question.prompt}</p>
            </div>
            <SpeakButton text={question.promptNarrative || question.prompt} speaking={speaking} onSpeak={speak} />
          </div>
        )}

        {question && (
          <div style={{flex:1}}>
            {question.manipulative?.mode === 'drag_combine' ? (
              <DragCombine key={qIndex} question={question} onAnswer={handleAnswer} disabled={!!feedback} />
            ) : question.manipulative?.mode === 'count' ? (
              <CountAndTap key={qIndex} question={question} onAnswer={handleAnswer} disabled={!!feedback} />
            ) : (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                {question.choice?.options.map((opt, idx) => {
                  let bg = 'white', border = '2px solid #E8ECF0'
                  if (feedback) {
                    if (opt === question.answer) { bg = '#E8F5E9'; border = '2px solid #4CAF50' }
                    else if (opt === feedback.userAnswer) { bg = '#FFEBEE'; border = '2px solid #FF6B6B' }
                    else { bg = '#F5F5F5'; border = '2px solid #E8ECF0' }
                  }
                  return (
                    <button key={idx} style={{position:'relative',padding:'20px 12px',borderRadius:'16px',fontSize:'1.2rem',fontWeight:600,transition:'all 0.15s ease',textAlign:'center',backgroundColor:bg,border,cursor:feedback?'default':'pointer',transform:feedback&&opt===question.answer?'scale(1.05)':'scale(1)'}}
                      disabled={!!feedback} onClick={() => !feedback && handleAnswer(opt)}>
                      <span style={{fontSize:'1.5rem',color:'#2D3436'}}>{opt}</span>
                      {!feedback && (
                        <span style={{position:'absolute',top:'4px',right:'8px',fontSize:'0.75rem',opacity:0.4}}
                          onClick={(e) => { e.stopPropagation(); speak(String(opt)) }}>🔊</span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {feedback && (
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 20px',borderRadius:'16px',marginTop:'12px',backgroundColor:feedback.type==='correct'?'#E8F5E9':'#FFEBEE',border:feedback.type==='correct'?'2px solid #4CAF50':'2px solid #FF6B6B'}}>
            <span style={{fontSize:'1.1rem',fontWeight:600,color:feedback.type==='correct'?'#2E7D32':'#C62828'}}>
              {feedback.type === 'correct' ? '✓ 答对了！' : `✗ 答案是 ${feedback.correctAnswer}`}
            </span>
            <button style={{background:'#4F8CF6',color:'white',border:'none',padding:'10px 24px',borderRadius:'12px',fontSize:'1rem',fontWeight:600,cursor:'pointer'}}
              onClick={handleNext}>{qIndex < totalQ - 1 ? '下一题 →' : '查看成绩'}</button>
          </div>
        )}

        {celebrate && <CelebrationEffect type={celebrate} duration={celebrate === 'complete' ? 1500 : 800} />}
      </div>
    )
  }

  // ===== 结果阶段 =====
  if (phase === 'result') {
    const ratio = score / totalQ
    const stars = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : ratio >= 0.2 ? 1 : 0
    const msg = stars === 3 ? '太棒了！' : stars === 2 ? '做得不错！' : '再试一次！'
    const mastered = ratio >= 0.8

    return (
      <div style={{minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',background: chara.bgGradient}}>
        <div style={{background:'white',borderRadius:'24px',padding:'32px',maxWidth:'400px',width:'100%',textAlign:'center',boxShadow:'0 8px 30px rgba(0,0,0,0.1)'}}>
          <div style={{marginBottom:'16px'}}>
            <CharacterMascot areaId={effectiveArea} mood="celebrate" size="large" customText={mascotSpeech} showSpeech />
          </div>
          <div style={{display:'flex',justifyContent:'center',gap:'8px',marginBottom:'12px'}}>
            {[1,2,3].map(s => (
              <span key={s} style={{fontSize:'3rem',opacity:s<=stars?1:0.15,transition:'all 0.3s ease'}}>⭐</span>
            ))}
          </div>
          <h2 style={{fontSize:'1.6rem',fontWeight:800,color:'#2D3436',marginBottom:'4px'}}>{skill.name}</h2>
          <p style={{fontSize:'1.1rem',color:'#636E72',marginBottom:'4px'}}>答对 {score} / {totalQ} 题</p>
          <p style={{fontSize:'1rem',color: chara.color, marginBottom:'20px', fontWeight:500}}>{chara.name}说：「{msg}」</p>
          {mastered && (
            <div style={{display:'inline-block',background:'#E8F5E9',color:'#2E7D32',padding:'8px 20px',borderRadius:'14px',fontSize:'1rem',fontWeight:600,marginBottom:'20px'}}>
              🎉 {chara.name}可以教你下一个技能啦！
            </div>
          )}
          <div style={{display:'flex',gap:'12px',justifyContent:'center'}}>
            <button style={{background:'#FFB347',color:'white',border:'none',padding:'12px 24px',borderRadius:'14px',fontSize:'1.1rem',fontWeight:600,cursor:'pointer'}}
              onClick={() => { stop(); setPhase('play'); setQIndex(0); setScore(0); setMascotMood('idle'); nextQuestion() }}>
              再练一次
            </button>
            <button style={{background:'#4F8CF6',color:'white',border:'none',padding:'12px 24px',borderRadius:'14px',fontSize:'1.1rem',fontWeight:600,cursor:'pointer'}}
              onClick={() => { stop(); onMastered(skillId, stars, errorProfile); onBack(errorProfile) }}>
              {mastered ? '学下一个 →' : '返回'}
            </button>
          </div>
        </div>
        {celebrate && <CelebrationEffect type="complete" duration={1500} />}
      </div>
    )
  }
}
