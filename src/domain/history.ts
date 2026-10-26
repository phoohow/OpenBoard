/** 文档状态与命令历史：撤销栈只记录 elements（与既有行为一致）。 */

import { activeBoard, type BoardsFile } from './document'
import type { BoardElement } from '@/model/types'

export const HISTORY_LIMIT = 120

export interface DocState {
  file: BoardsFile
  past: BoardElement[][]
  future: BoardElement[][]
}

export const createDocState = (file: BoardsFile): DocState => ({ file, past: [], future: [] })

/** 提交新文件：history=true 时把当前 elements 压入撤销栈并清空重做栈。 */
export const commitFile = (state: DocState, file: BoardsFile, history = true): DocState => {
  if (file === state.file) return state
  if (!history) return { ...state, file }
  const current = activeBoard(state.file)
  return {
    file,
    past: current ? [...state.past, current.elements].slice(-HISTORY_LIMIT) : state.past,
    future: [],
  }
}

/** 把当前 elements 压入撤销栈（拖拽开始前调用），重做栈会被清空。 */
export const pushHistory = (state: DocState): DocState => {
  const current = activeBoard(state.file)
  if (!current) return state
  return { ...state, past: [...state.past, current.elements].slice(-HISTORY_LIMIT), future: [] }
}

export const undo = (state: DocState): DocState => {
  if (!state.past.length) return state
  const current = activeBoard(state.file)
  if (!current) return state
  const prev = state.past[state.past.length - 1]
  return {
    file: {
      ...state.file,
      boards: state.file.boards.map((b) =>
        b.id === state.file.activeId ? { ...b, elements: prev, updatedAt: Date.now() } : b,
      ),
    },
    past: state.past.slice(0, -1),
    future: [current.elements, ...state.future].slice(0, HISTORY_LIMIT),
  }
}

export const redo = (state: DocState): DocState => {
  if (!state.future.length) return state
  const current = activeBoard(state.file)
  if (!current) return state
  const next = state.future[0]
  return {
    file: {
      ...state.file,
      boards: state.file.boards.map((b) =>
        b.id === state.file.activeId ? { ...b, elements: next, updatedAt: Date.now() } : b,
      ),
    },
    past: [...state.past, current.elements].slice(-HISTORY_LIMIT),
    future: state.future.slice(1),
  }
}
