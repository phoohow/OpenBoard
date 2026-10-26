/** 编辑器门面：`useSyncExternalStore` 订阅单例 store，派生 `{ doc, ui, derived, actions }`。 */

import { useMemo, useSyncExternalStore } from 'react'
import type { EditorState } from '@/domain/state'
import type { UiState } from '@/domain/ui'
import { activeBoard, type BoardDoc, type Snapshot } from '@/domain/document'
import type { AppSettings, BoardComment, BoardElement, BoardMeta, MindLayout, MindTheme, PresentItem, RouteStop, View } from '@/model/types'
import {
  boardsMeta,
  cursorOf,
  currentElements,
  exportTargets,
  mindLayoutOfSelection,
  mindRootOf,
  mindThemeOfSelection,
  orderedElements,
  presentItems,
  selectedCard,
  selectedElements,
  voteResults,
} from '@/domain/selectors'
import { actions, type EditorActions } from '../actions'
import { getState, subscribe } from '../store'

/** 文档视图模型：持久化根上的当前白板与全局设置。 */
export interface EditorDoc {
  board: BoardDoc
  elements: BoardElement[]
  view: View
  settings: AppSettings
  comments: BoardComment[]
  route: RouteStop[]
  snapshots: Snapshot[]
}

/** 派生视图模型：由状态纯计算得到，视图只读。 */
export interface EditorDerived {
  selection: string[]
  selected: BoardElement[]
  ordered: BoardElement[]
  boards: BoardMeta[]
  cursor: string
  selectedCard?: BoardElement
  mindRoot?: BoardElement
  mindLayout: MindLayout
  mindTheme: MindTheme
  votes: BoardElement[]
  presentItems: PresentItem[]
  exportTargets: BoardElement[]
  canUndo: boolean
  canRedo: boolean
}

export interface Editor {
  state: EditorState
  doc: EditorDoc
  ui: UiState
  derived: EditorDerived
  actions: EditorActions
}

const boardOf = (state: EditorState): BoardDoc => activeBoard(state.file) ?? state.file.boards[0]

const docOf = (state: EditorState): EditorDoc => {
  const board = boardOf(state)
  return {
    board,
    elements: board.elements,
    view: board.view,
    settings: state.file.settings,
    comments: board.comments ?? [],
    route: board.route ?? [],
    snapshots: board.snapshots ?? [],
  }
}

const derivedOf = (state: EditorState): EditorDerived => ({
  selection: state.ui.selection,
  selected: selectedElements(state),
  ordered: orderedElements(currentElements(state)),
  boards: boardsMeta(state),
  cursor: cursorOf(state),
  selectedCard: selectedCard(state),
  mindRoot: mindRootOf(state),
  mindLayout: mindLayoutOfSelection(state),
  mindTheme: mindThemeOfSelection(state),
  votes: voteResults(state),
  presentItems: presentItems(state),
  exportTargets: exportTargets(state),
  canUndo: state.past.length > 0,
  canRedo: state.future.length > 0,
})

/** 视图层唯一入口：状态变化时重新派生一次。 */
export const useEditor = (): Editor => {
  const state = useSyncExternalStore(subscribe, getState)
  return useMemo(() => ({ state, doc: docOf(state), ui: state.ui, derived: derivedOf(state), actions }), [state])
}
