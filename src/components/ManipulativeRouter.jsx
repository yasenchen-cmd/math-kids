/**
 * 按 question.manipulative.mode 分发教具组件
 */

import DragCombine from './manipulative/DragCombine'
import DragSplit from './manipulative/DragSplit'
import DragShare from './manipulative/DragShare'
import DragToTarget from './manipulative/DragToTarget'
import FillArray from './manipulative/FillArray'
import CountAndTap from './manipulative/CountAndTap'
import CompareCount from './manipulative/CompareCount'
import PickOne from './manipulative/PickOne'
import SortOrder from './manipulative/SortOrder'
import FractionParts from './manipulative/FractionParts'
import ChoiceGrid from './ChoiceGrid'

export default function ManipulativeRouter({
  question,
  feedback,
  retryHint,
  attemptKey,
  onAnswer,
  speak,
  speaking,
}) {
  const mode = question?.manipulative?.mode
  const disabled = !!feedback
  const common = { key: attemptKey, question, onAnswer, disabled }

  switch (mode) {
    case 'drag_combine':
      return <DragCombine {...common} />
    case 'drag_split':
      return <DragSplit {...common} />
    case 'drag_share':
      return <DragShare {...common} />
    case 'drag_to_target':
      return <DragToTarget {...common} />
    case 'fill_array':
      return <FillArray {...common} />
    case 'count':
      return <CountAndTap {...common} speak={speak} speaking={speaking} />
    case 'compare_count':
      return <CompareCount {...common} />
    case 'pick_one':
      return <PickOne {...common} />
    case 'sort':
      return <SortOrder {...common} />
    case 'fraction_parts':
      return <FractionParts {...common} />
    default:
      return (
        <ChoiceGrid
          key={attemptKey}
          question={question}
          feedback={feedback}
          retryHint={retryHint}
          disabled={disabled}
          onAnswer={onAnswer}
          onSpeak={speak}
        />
      )
  }
}
