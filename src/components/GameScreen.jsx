
import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { getSkill } from '../engine/skillGraph'
import { generateQuestion, generateUniqueQuestion } from '../engine/questionGenerator'
import { questionFingerprint } from '../engine/generators/_utils'
import { getAdaptiveConfig } from '../engine/adaptive'
import { applyInterventions, resetActiveInterventions } from '../engine/interventionMatrix'
import { recordAttempt } from '../engine/errorProfile'
import { playSafe, playCorrect, playRetryCorrect, playWrong, playLevelComplete, playClick } from '../utils/sound'
import { getCharacter, pickLine } from '../data/characters'
import SpeakButton from './SpeakButton'
import CharacterMascot from './CharacterMascot'
import CelebrationEffect from './CelebrationEffect'
import useSpeech from '../hooks/useSpeech'
import useDirector from '../hooks/useDirector'
import { shouldShowSecretMascot } from '../hooks/useSecretCharacter'
import DragCombine from './manipulative/DragCombine'
import DragSplit from './manipulative/DragSplit'
import DragShare from './manipulative/DragShare'
import FillArray from './manipulative/FillArray'
import CountAndTap from './manipulative/CountAndTap'
import CompareCount from './manipulative/CompareCount'
import PickOne from './manipulative/PickOne'
import QuestionVisual from './QuestionVisual'
import ChoiceGrid from './ChoiceGrid'
import RetryHintBanner from './RetryHintBanner'
import { getRetryHint, upgradeQuestionToInteractive, getVisualFocus } from '../engine/retrySupport'

const THEME_CYCLE = ['fruits', 'animals', 'candies', 'blocks', 'toys']

export default function GameScreen({ skillId, errorProfile, setErrorProfile, onBack, onMastered }) {
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
  const [visualTheme, setVisualTheme] = useState(0)
  const [mascotMood, setMascotMood] = useState('idle')
  const [mascotSpeech, setMascotSpeech] = useState('')
  const [celebrate, setCelebrate] = useState(null)
  const [easyWinMode, setEasyWinMode] = useState(false)
  const [questionAttempt, setQuestionAttempt] = useState(0)
  const [retryHint, setRetryHint] = useState(null)
  const [retryUpgraded, setRetryUpgraded] = useState(false)

  const skillScores = errorProfile?.skillScores || {}
  const idleTimerRef = useRef(null)
  const sessionSeenRef = useRef(new Set())
  const recoveryBoostRef = useRef({ difficultyDrop: 0, roundsLeft: 0 })
  const retriedRef = useRef(false)

  const manipMode = question?.manipulative?.mode
  const hideVisual = manipMode && ['drag_combine', 'drag_split', 'drag_share', 'fill_array', 'count', 'compare_count', 'pick_one'].includes(manipMode)
  const visualFocus = useMemo(() => getVisualFocus(retryHint), [retryHint])
  const attemptKey = `${qIndex}-${questionAttempt}`

  useEffect(() => {
    resetActiveInterventions()
  }, [skillId])

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
        recoveryBoostRef.current = {
          difficultyDrop: Math.min(3, recoveryBoostRef.current.difficultyDrop + 1),
          roundsLeft: Math.max(2, recoveryBoostRef.current.roundsLeft || 0),
        }
        setMascotSpeech('换一种方法试试～')
        setMascotMood('thinking')
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

    const recovery = recoveryBoostRef.current
    let effectiveDifficulty = interventionOpts.difficultyBoost
      ? Math.max(1, config.difficulty + interventionOpts.difficultyBoost)
      : config.difficulty

    if (recovery.roundsLeft > 0) {
      effectiveDifficulty = Math.max(1, effectiveDifficulty - recovery.difficultyDrop)
      interventionOpts.forceInteractive = true
      interventionOpts.stepByStep = true
    }

    const genOptions = {
      difficulty: effectiveDifficulty,
      visualTheme: theme,
      previousErrors: errorProfile,
      forceInteractive: interventionOpts.forceInteractive || recovery.roundsLeft > 0 || config.preferInteractive,
      ...interventionOpts,
    }

    const q = generateUniqueQuestion(skillId, genOptions, sessionSeenRef.current)
    sessionSeenRef.current.add(questionFingerprint(q))
    setQuestion(q)
    setFeedback(null)
    setEasyWinMode(false)
    retriedRef.current = false
    setRetryHint(null)
    setRetryUpgraded(false)

    if (interventionFeedback) {
      setMascotSpeech(interventionFeedback)
      setMascotMood('thinking')
    }
  }, [skillId, skillScores, errorProfile, visualTheme, easyWinMode])

  // ===== 开始游戏 =====
  const startGame = useCallback(() => {
    sessionSeenRef.current = new Set()
    recoveryBoostRef.current = { difficultyDrop: 0, roundsLeft: 0 }
    setPhase('play')
    setQIndex(0)
    setScore(0)
    setQuestionAttempt(0)
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
  const handleRetry = useCallback(() => {
    if (!question) return
    retriedRef.current = true
    setFeedback(null)

    const lastWrong = feedback?.userAnswer
    const hint = getRetryHint(question, lastWrong)
    setRetryHint(hint)

    const upgraded = upgradeQuestionToInteractive(question)
    const didUpgrade = !!upgraded.manipulative && !question.manipulative
    if (didUpgrade) {
      setQuestion(upgraded)
      setRetryUpgraded(true)
      setMascotSpeech('用手试一试，更容易哦～')
      speak('用手试一试，更容易哦', { rate: 0.85 })
    } else {
      setMascotSpeech(hint.text)
      speak(hint.text, { rate: 0.85 })
    }

    setQuestionAttempt(a => a + 1)
    setMascotMood('encourage')
    resetIdleTimer()
  }, [question, feedback, speak, resetIdleTimer])

  const handleAnswer = useCallback((userAnswer) => {
    if (feedback || !question) return
    resetIdleTimer()

    const isCorrect = userAnswer === question.answer
    const updatedProfile = recordAttempt(errorProfile, skillId, question, userAnswer, isCorrect)
    setErrorProfile(updatedProfile)

    if (isCorrect) {
      const wasRetry = retriedRef.current
      setScore(s => s + 1)
      setFeedback({ type: 'correct', retrySuccess: wasRetry })
      playSafe(wasRetry ? playRetryCorrect : playCorrect)

      director.onCorrect({
        streak: (director.context?.streak || 0) + 1,
        retried: wasRetry,
      })

      const line = pickLine(effectiveArea, wasRetry ? 'retry_correct' : 'correct')
      setMascotMood(wasRetry ? 'encourage' : 'happy')
      setMascotSpeech(line)
      speak(line, { rate: wasRetry ? 0.88 : 0.85 })

      if (wasRetry) {
        setCelebrate('retry_correct')
        setTimeout(() => setCelebrate(null), 900)
      }

      const r = recoveryBoostRef.current
      if (r.roundsLeft > 0) {
        recoveryBoostRef.current = {
          difficultyDrop: Math.max(0, r.difficultyDrop - 1),
          roundsLeft: r.roundsLeft - 1,
        }
      }
    } else if (!retriedRef.current) {
      setFeedback({
        type: 'wrong',
        correctAnswer: question.answer,
        userAnswer,
        canRetry: true,
      })
      playSafe(playWrong)
      setMascotSpeech('不对哦，再想一想～')
      setMascotMood('thinking')
    } else {
      setFeedback({ type: 'wrong', correctAnswer: question.answer, userAnswer, canRetry: false })
      playSafe(playWrong)
      director.onWrong({ errors: (director.context?.errors || 0) + 1 })
      recoveryBoostRef.current = {
        difficultyDrop: Math.min(3, recoveryBoostRef.current.difficultyDrop + 1),
        roundsLeft: 2,
      }
      setMascotSpeech('没关系，下一题我们用手来试一试～')
      setMascotMood('thinking')
    }
  }, [question, feedback, skillId, errorProfile, resetIdleTimer, speak, director, effectiveArea])

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
              <p style={{fontSize:'1.3rem',fontWeight:600,lineHeight:1.6,color:'#2D3436'}}>{question.prompt}</p>
            </div>
            <SpeakButton text={question.promptNarrative || question.prompt} speaking={speaking} onSpeak={speak} />
          </div>
        )}

        {retryHint && !feedback && <RetryHintBanner hint={retryHint} upgraded={retryUpgraded} />}

        {question?.visual && !hideVisual && <QuestionVisual visual={question.visual} visualFocus={visualFocus} />}

        {question && (
          <div style={{flex:1}}>
            {question.manipulative?.mode === 'drag_combine' ? (
              <DragCombine key={attemptKey} question={question} onAnswer={handleAnswer} disabled={!!feedback} />
            ) : question.manipulative?.mode === 'drag_split' ? (
              <DragSplit key={attemptKey} question={question} onAnswer={handleAnswer} disabled={!!feedback} />
            ) : question.manipulative?.mode === 'drag_share' ? (
              <DragShare key={attemptKey} question={question} onAnswer={handleAnswer} disabled={!!feedback} />
            ) : question.manipulative?.mode === 'fill_array' ? (
              <FillArray key={attemptKey} question={question} onAnswer={handleAnswer} disabled={!!feedback} />
            ) : question.manipulative?.mode === 'count' ? (
              <CountAndTap key={attemptKey} question={question} onAnswer={handleAnswer} disabled={!!feedback} speak={speak} />
            ) : question.manipulative?.mode === 'compare_count' ? (
              <CompareCount key={attemptKey} question={question} onAnswer={handleAnswer} disabled={!!feedback} />
            ) : question.manipulative?.mode === 'pick_one' ? (
              <PickOne key={attemptKey} question={question} onAnswer={handleAnswer} disabled={!!feedback} />
            ) : (
              <ChoiceGrid
                key={attemptKey}
                question={question}
                feedback={feedback}
                retryHint={retryHint}
                disabled={!!feedback}
                onAnswer={handleAnswer}
                onSpeak={speak}
              />
            )}
          </div>
        )}

        {feedback && (
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 20px',borderRadius:'16px',marginTop:'12px',backgroundColor:feedback.type==='correct'?'#E8F5E9':'#FFEBEE',border:feedback.type==='correct'?'2px solid #4CAF50':'2px solid #FF6B6B'}}>
            <span style={{fontSize:'1.1rem',fontWeight:600,color:feedback.type==='correct'?'#2E7D32':'#C62828'}}>
              {feedback.type === 'correct'
                ? (feedback.retrySuccess ? '✓ 坚持对了！💪' : '✓ 答对了！')
                : feedback.canRetry
                  ? '✗ 不对哦，再想想？'
                  : `✗ 答案是 ${feedback.correctAnswer}`}
            </span>
            {feedback.type === 'correct' || !feedback.canRetry ? (
              <button style={{background:'#4F8CF6',color:'white',border:'none',padding:'10px 24px',borderRadius:'12px',fontSize:'1rem',fontWeight:600,cursor:'pointer'}}
                onClick={handleNext}>{qIndex < totalQ - 1 ? '下一题 →' : '查看成绩'}</button>
            ) : (
              <button style={{background:'#FFB347',color:'white',border:'none',padding:'10px 24px',borderRadius:'12px',fontSize:'1rem',fontWeight:600,cursor:'pointer'}}
                onClick={() => { playSafe(playClick); handleRetry() }}>再试一次</button>
            )}
          </div>
        )}

        {celebrate && (
          <CelebrationEffect
            type={celebrate}
            duration={celebrate === 'complete' ? 1500 : celebrate === 'retry_correct' ? 900 : 800}
          />
        )}
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
              onClick={() => { stop(); sessionSeenRef.current = new Set(); recoveryBoostRef.current = { difficultyDrop: 0, roundsLeft: 0 }; setPhase('play'); setQIndex(0); setScore(0); setMascotMood('idle'); nextQuestion() }}>
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
