/** 已实现的操作教具 mode（须与 ManipulativeRouter / skillGraph 对齐） */
export const MANIPULATIVE_MODES = [
  'drag_combine',
  'drag_split',
  'drag_share',
  'drag_to_target',
  'fill_array',
  'count',
  'compare_count',
  'pick_one',
  'sort',
]

export function hidesQuestionVisual(mode) {
  return mode && MANIPULATIVE_MODES.includes(mode)
}
