import { useState, useCallback, useEffect } from 'react'
import { getLevel } from '../data/worlds'
import { playSafe, playCorrect, playWrong, playLevelComplete, playClick } from '../utils/sound'
import SpeakButton from './SpeakButton'
import useSpeech from '../hooks/useSpeech'

export default function LevelView({ worldId, levelId, progress, onComplete, onBack }) {
  const level = getLevel(worldId, levelId)
  const [phase, setPhase] = useState('teach')
  const [qIndex, setQIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [score, setScore] = useState(0)
  const { speak, stop, speaking } = useSpeech()

  if (!level) {
    return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100dvh',fontSize:'1.2rem',color:'#FF6B6B'}}>关卡未找到</div>
  }

  const question = level.questions[qIndex]
  const isLastQ = qIndex === level.questions.length - 1
  const totalQ = level.questions.length

  // 进入教学阶段时自动朗读
  useEffect(() => {
    if (phase === 'teach') {
      const timer = setTimeout(() => speak(level.teachText, { rate: 0.8 }), 500)
      return () => clearTimeout(timer)
    }
  }, [phase])

  // 新题目时自动朗读
  useEffect(() => {
    if (phase === 'play' && question) {
      const text = question.prompt
      const timer = setTimeout(() => speak(text, { rate: 0.85 }), 300)
      return () => clearTimeout(timer)
    }
  }, [qIndex, phase])

  const checkAnswer = useCallback((optIdx) => {
    if (feedback) return
    setSelectedAnswer(optIdx)
    const correct = optIdx === question.answer
    if (correct) {
      setFeedback('correct')
      setScore(s => s + 1)
      playSafe(playCorrect)
      speak('答对了！真棒！', { rate: 0.9, pitch: 1.2 })
    } else {
      setFeedback('wrong')
      playSafe(playWrong)
      speak('不对哦，再想想', { rate: 0.85, pitch: 0.9 })
    }
  }, [feedback, question, speak])

  const handleNext = useCallback(() => {
    stop()
    if (!isLastQ) {
      setQIndex(i => i + 1)
      setSelectedAnswer(null)
      setFeedback(null)
    } else {
      setPhase('result')
      playSafe(playLevelComplete)
    }
  }, [isLastQ, stop])

  function calcStars(s, total) {
    const ratio = s / total
    if (ratio >= 0.9) return 3
    if (ratio >= 0.6) return 2
    if (ratio >= 0.2) return 1
    return 0
  }
  const stars = calcStars(score, totalQ)

  // 选择答案为文本时能朗读
  function getOptionText(opt) {
    return String(opt)
  }

  const wl = { display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontSize:'0.9rem', color:'#636E72', marginBottom:'8px' }
  const labelRow = { display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', marginBottom:'8px' }

  if (phase === 'teach') {
    return (
      <div style={{minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',background:'linear-gradient(135deg,#E3F2FD,#F3E5F5)'}}>
        <div style={{maxWidth:'500px',width:'100%',textAlign:'center'}}>
          <div style={wl}><span>{level.worldIcon}</span><span>{level.worldTitle}</span></div>
          <div style={labelRow}>
            <h2 style={{fontSize:'1.5rem',fontWeight:700,color:'#2D3436',margin:0}}>{level.title}</h2>
            <SpeakButton text={level.teachText} speaking={speaking} onSpeak={speak} />
          </div>
          <div style={{background:'white',borderRadius:'20px',padding:'24px',marginBottom:'20px',boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
            <p style={{fontSize:'1.3rem',lineHeight:1.6,color:'#2D3436'}}>{level.teachText}</p>
          </div>
          <button
            style={{background:'linear-gradient(135deg,#4F8CF6,#7AADFF)',color:'white',border:'none',padding:'16px 48px',borderRadius:'50px',fontSize:'1.3rem',fontWeight:700,cursor:'pointer',boxShadow:'0 4px 15px rgba(79,140,246,0.3)'}}
            onClick={() => { stop(); setPhase('play'); playSafe(playClick) }}
          >开始闯关！</button>
        </div>
      </div>
    )
  }

  if (phase === 'play') {
    return (
      <div style={{minHeight:'100dvh',display:'flex',flexDirection:'column',padding:'16px',maxWidth:'600px',margin:'0 auto'}}>
        {/* 进度条 */}
        <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'20px'}}>
          <div style={{flex:1,height:'8px',background:'#E8ECF0',borderRadius:'4px',overflow:'hidden'}}>
            <div style={{height:'100%',borderRadius:'4px',transition:'width 0.3s ease',width:`${((qIndex+1)/totalQ)*100}%`,backgroundColor:level.worldColor}} />
          </div>
          <span style={{fontSize:'0.9rem',fontWeight:600,color:'#636E72',minWidth:'40px'}}>{qIndex+1}/{totalQ}</span>
          <button style={{background:'none',border:'none',fontSize:'1.2rem',color:'#B2BEC3',padding:'4px 8px'}} onClick={onBack}>✕</button>
        </div>

        <div style={{flex:1,display:'flex',flexDirection:'column',gap:'16px'}}>
          <div style={wl}><span>{level.worldIcon}</span><span>{level.worldTitle}</span></div>

          {/* 题目行 + 朗读按钮 */}
          <div style={{display:'flex',alignItems:'flex-start',gap:'10px'}}>
            <div style={{flex:1,background:'white',borderRadius:'20px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',textAlign:'center'}}>
              <p style={{fontSize:'1.4rem',fontWeight:600,lineHeight:1.6,color:'#2D3436'}}>{question.prompt}</p>
            </div>
            <div style={{paddingTop:'12px'}}>
              <SpeakButton
                text={question.prompt}
                speaking={speaking}
                onSpeak={speak}
              />
            </div>
          </div>

          {/* 选项按钮 */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
            {question.options.map((opt, idx) => {
              let bg = 'white'
              let border = '2px solid #E8ECF0'
              let scale = 1
              if (feedback && idx === question.answer) { bg = '#E8F5E9'; border = '2px solid #4CAF50'; scale = 1.05 }
              else if (feedback && idx === selectedAnswer && idx !== question.answer) { bg = '#FFEBEE'; border = '2px solid #FF6B6B' }
              else if (feedback) { bg = '#F5F5F5'; border = '2px solid #E8ECF0' }
              return (
                <button key={idx}
                  style={{
                    padding:'20px 12px',borderRadius:'16px',fontSize:'1.2rem',fontWeight:600,
                    transition:'all 0.15s ease',textAlign:'center',
                    backgroundColor:bg, border:border,
                    cursor:feedback?'default':'pointer',
                    transform:`scale(${scale})`,
                    position:'relative',
                  }}
                  disabled={!!feedback}
                  onClick={() => {
                    if (!feedback) {
                      checkAnswer(idx)
                    }
                  }}
                >
                  <span style={{fontSize:'1.4rem',color:'#2D3436'}}>{getOptionText(opt)}</span>
                  {/* 选项小喇叭 */}
                  {!feedback && (
                    <span
                      style={{
                        position:'absolute',top:'4px',right:'6px',
                        fontSize:'0.8rem',opacity:0.5,
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        speak(getOptionText(opt))
                      }}
                    >🔊</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* 反馈 */}
          {feedback && (
            <div style={{
              display:'flex',alignItems:'center',justifyContent:'space-between',
              padding:'12px 20px',borderRadius:'16px',marginTop:'auto',
              backgroundColor:feedback==='correct'?'#E8F5E9':'#FFEBEE',
              border:feedback==='correct'?'2px solid #4CAF50':'2px solid #FF6B6B',
            }}>
              <span style={{fontSize:'1.2rem',fontWeight:600,color:feedback==='correct'?'#2E7D32':'#C62828'}}>
                {feedback === 'correct' ? '✓ 答对了！' : '✗ 不对哦'}
              </span>
              <button style={{background:'#4F8CF6',color:'white',border:'none',padding:'10px 24px',borderRadius:'12px',fontSize:'1rem',fontWeight:600,cursor:'pointer'}}
                onClick={handleNext}>
                {isLastQ ? '查看成绩' : '下一题 →'}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (phase === 'result') {
    const msg = stars===3 ? '太棒了，全部答对！' : stars===2 ? '做得不错，继续加油！' : '再试一次会更好！'
    return (
      <div style={{minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',background:'linear-gradient(135deg,#FFF8E1,#E8F5E9)'}}>
        <div style={{background:'white',borderRadius:'24px',padding:'32px',maxWidth:'400px',width:'100%',textAlign:'center',boxShadow:'0 8px 30px rgba(0,0,0,0.1)'}}>
          <div style={{display:'flex',justifyContent:'center',gap:'8px',marginBottom:'16px'}}>
            {[1,2,3].map(s => (
              <span key={s} style={{fontSize:'3rem',opacity:s<=stars?1:0.15,transition:'all 0.3s ease'}}>⭐</span>
            ))}
          </div>
          <h2 style={{fontSize:'1.8rem',fontWeight:800,color:'#2D3436',marginBottom:'8px'}}>闯关完成！</h2>
          <p style={{fontSize:'1.2rem',color:'#636E72',marginBottom:'8px'}}>答对 {score} / {totalQ} 题</p>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',marginBottom:'24px'}}>
            <span style={{fontSize:'1rem',color:'#636E72'}}>{msg}</span>
            <SpeakButton text={msg} speaking={speaking} onSpeak={speak} size="small" />
          </div>
          <div style={{display:'flex',gap:'12px',justifyContent:'center'}}>
            <button style={{background:'#FFB347',color:'white',border:'none',padding:'12px 24px',borderRadius:'14px',fontSize:'1.1rem',fontWeight:600,cursor:'pointer'}}
              onClick={() => { stop(); setPhase('play'); setQIndex(0); setSelectedAnswer(null); setFeedback(null); setScore(0) }}>
              再闯一次
            </button>
            <button style={{background:'#4F8CF6',color:'white',border:'none',padding:'12px 24px',borderRadius:'14px',fontSize:'1.1rem',fontWeight:600,cursor:'pointer'}}
              onClick={() => { stop(); onComplete(worldId, levelId, stars); onBack() }}>
              返回地图
            </button>
          </div>
        </div>
      </div>
    )
  }
}
