/** 派生选择器：只读计算，不产生副作用，可脱离 React 测试。 */

import type { BoardElement, BoardMeta, MindLayout, MindTheme, PresentItem } from '@/model/types'
import { mindRootIdOf } from './mindmap/tree'
import { detectMindTheme } from './commands/mindmap'
import { activeBoard } from './document'
import type { EditorState } from './state'

/** 当前白板。 */
export const currentBoard = (state: EditorState) => activeBoard(state.file)

/** 当前白板的元素数组（无白板时为空数组）。 */
export const currentElements = (state: EditorState): BoardElement[] => activeBoard(state.file)?.elements ?? []

/** 按从上到下、从左到右的视觉顺序排序的元素（演示与朗读顺序）。 */
export const orderedElements = (elements: BoardElement[]): BoardElement[] =>
  [...elements].sort((a, b) => Math.round(a.y - b.y) || Math.round(a.x - b.x))

/** 选中的元素，保持元素本身的层级顺序。 */
export const selectedElements = (state: EditorState): BoardElement[] => {
  const ids = new Set(state.ui.selection)
  return currentElements(state).filter((el) => ids.has(el.id))
}

/** 画布指针样式。 */
export const cursorOf = (state: EditorState): string => {
  const { presenting, tool, spaceDown } = state.ui
  if (presenting || tool === 'hand' || spaceDown) return 'grab'
  if (tool === 'select') return 'default'
  if (tool === 'eraser') return 'cell'
  return 'crosshair'
}

/** 投票结果：票数降序取前 8 名。 */
export const voteResults = (state: EditorState): BoardElement[] =>
  currentElements(state)
    .filter((el) => (el.votes ?? 0) > 0)
    .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))
    .slice(0, 8)

/** 演示序列：按模式取自「元素 / 容器分页 / 路线图」。 */
export const presentItems = (state: EditorState): PresentItem[] => {
  const elements = currentElements(state)
  const ordered = orderedElements(elements)
  if (state.ui.presentMode === 'route') {
    return (currentBoard(state)?.route ?? []).map((stop) => ({
      id: stop.id,
      label: stop.label,
      target: stop.targetId ? elements.find((el) => el.id === stop.targetId) : undefined,
      point: stop.x != null && stop.y != null ? { x: stop.x, y: stop.y } : undefined,
    }))
  }
  if (state.ui.presentMode === 'slides') {
    const frames = ordered.filter((el) => el.kind === 'frame')
    const list = frames.length ? frames : ordered
    return list.map((el) => ({ id: el.id, label: (el.text ?? '').trim() || '未命名页', target: el }))
  }
  return ordered.map((el) => ({ id: el.id, label: (el.text ?? '').trim() || '未命名', target: el }))
}

/** 侧边栏白板列表。 */
export const boardsMeta = (state: EditorState): BoardMeta[] =>
  state.file.boards.map((b) => ({ id: b.id, name: b.name, updatedAt: b.updatedAt, count: b.elements.length }))

/** 选中元素所属导图的根节点。 */
export const mindRootOf = (state: EditorState): BoardElement | undefined => {
  const elements = currentElements(state)
  const anchor = selectedElements(state).find((el) => el.kind === 'mindnode')
  const rootId = mindRootIdOf(elements, anchor?.id ?? '')
  return rootId ? elements.find((el) => el.id === rootId) : undefined
}

/** 选中元素中的卡片（属性面板用）。 */
export const selectedCard = (state: EditorState): BoardElement | undefined =>
  selectedElements(state).find((el) => el.kind === 'card')

export const mindLayoutOfSelection = (state: EditorState): MindLayout => mindRootOf(state)?.mindLayout ?? 'right'

export const mindThemeOfSelection = (state: EditorState): MindTheme => {
  const root = mindRootOf(state)
  return root ? detectMindTheme(root) : 'grape'
}

/** 导出目标：全部元素或当前选区。 */
export const exportTargets = (state: EditorState): BoardElement[] =>
  state.ui.exportScope === 'selection' ? selectedElements(state) : currentElements(state)
