/** 测试夹具：构造元素、白板与状态树。仅测试使用，不参与打包。 */

import { baseElement, defaultSettings } from '@/model/factories'
import type { BoardElement, ElementKind } from '@/model/types'
import type { BoardDoc, BoardsFile } from './document'
import { createEditorState, type EditorState } from './state'

export const el = (kind: ElementKind, patch: Partial<BoardElement> = {}): BoardElement => ({
  ...baseElement(kind, patch.x ?? 0, patch.y ?? 0),
  ...patch,
})

export const board = (elements: BoardElement[] = [], patch: Partial<BoardDoc> = {}): BoardDoc => ({
  id: 'board-1',
  name: '测试白板',
  elements,
  view: { x: 0, y: 0, zoom: 1 },
  updatedAt: 1,
  ...patch,
})

export const file = (boards: BoardDoc[]): BoardsFile => ({
  version: 1,
  activeId: boards[0].id,
  boards,
  settings: defaultSettings(),
})

export const state = (elements: BoardElement[] = []): EditorState => createEditorState(file([board(elements)]))
