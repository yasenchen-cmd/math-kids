import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import PayWall from '../../src/components/PayWall.jsx'
import FractionParts from '../../src/components/manipulative/FractionParts.jsx'
import PickOne from '../../src/components/manipulative/PickOne.jsx'
import { generateUnlockCode } from '../../src/utils/unlockCode.js'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('PayWall', () => {
  const deviceId = 'mn_component_test_device'

  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('rejects invalid unlock code', () => {
    const onUnlock = vi.fn()
    render(<PayWall deviceId={deviceId} onUnlock={onUnlock} />)
    fireEvent.change(screen.getByLabelText('解锁码'), { target: { value: 'bad-code-xx' } })
    fireEvent.click(screen.getByRole('button', { name: '解锁' }))
    expect(screen.getByText(/解锁码错误/)).toBeTruthy()
    expect(onUnlock).not.toHaveBeenCalled()
  })

  it('accepts valid unlock code and calls onUnlock', () => {
    const onUnlock = vi.fn()
    const code = generateUnlockCode(deviceId)
    render(<PayWall deviceId={deviceId} onUnlock={onUnlock} />)
    fireEvent.change(screen.getByLabelText('解锁码'), { target: { value: code } })
    fireEvent.click(screen.getByRole('button', { name: '解锁' }))
    act(() => {
      vi.advanceTimersByTime(900)
    })
    expect(onUnlock).toHaveBeenCalledWith(code)
  })
})

describe('FractionParts', () => {
  it('submits correct answer when takeParts selected', () => {
    const onAnswer = vi.fn()
    const question = {
      answer: '一半',
      manipulative: {
        mode: 'fraction_parts',
        emoji: '🍕',
        totalParts: 2,
        takeParts: 1,
        answer: '一半',
      },
    }
    render(<FractionParts question={question} onAnswer={onAnswer} />)
    const parts = screen.getAllByRole('button', { name: /第 \d+ 份/ })
    fireEvent.click(parts[0])
    fireEvent.click(screen.getByRole('button', { name: /确认选了/ }))
    expect(onAnswer).toHaveBeenCalledWith('一半')
  })
})

describe('PickOne', () => {
  it('reports selected option', () => {
    const onAnswer = vi.fn()
    const question = {
      answer: '3点',
      manipulative: {
        mode: 'pick_one',
        variant: 'time',
        options: ['2点', '3点', '4点'],
        answer: '3点',
        hint: '点一点',
        style: 'text',
      },
    }
    render(<PickOne question={question} onAnswer={onAnswer} />)
    fireEvent.click(screen.getByRole('button', { name: '选项 3点' }))
    expect(onAnswer).toHaveBeenCalledWith('3点')
  })
})
