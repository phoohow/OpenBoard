/** 纯 reduce：`(state, command) => state`。唯一写入口的实现，不含 IO 与 React。 */

import { activeBoard, withBoard, type BoardDoc, type BoardsFile } from './document'
import { commitFile, pushHistory, redo, undo, type DocState } from './history'
import type { EditorState } from './state'
import type { Command, DocCommand, UiCommand, StateCommand } from './commands/command'
import {
  reduceArrange,
  reduceBoardContent,
  reduceBoards,
  reduceCollab,
  reduceElements,
  reduceGroup,
  reduceMindmap,
  reduceSettings,
  reduceSnapshot,
  reduceStateCommand,
  reduceTable,
  reduceUi,
  reduceView,
  resetsHistory,
  touchesUpdatedAt,
} from './commands/command'

/**
 * 各 reducer 只认领自己那几条命令，其余返回 `null`。
 * 注册表的入参在这里收宽为 `DocCommand`，由各 `switch` 负责真正的收窄。
 */
type FileReducer = (file: BoardsFile, cmd: DocCommand) => BoardsFile | null
type BoardReducer = (board: BoardDoc, cmd: DocCommand) => BoardDoc | null

const fileReducers = [reduceBoards, reduceSettings] as unknown as FileReducer[]
const boardReducers = [
  reduceBoardContent,
  reduceElements,
  reduceArrange,
  reduceGroup,
  reduceTable,
  reduceMindmap,
  reduceCollab,
  reduceSnapshot,
  reduceView,
] as unknown as BoardReducer[]

/** 在 activeId 指向的白板上依次尝试各 reducer，未命中返回 null。 */
const patchActive = (file: BoardsFile, cmd: DocCommand): BoardsFile | null => {
  if (!activeBoard(file)) return null
  const touch = touchesUpdatedAt(cmd.type)
  const next = withBoard(file, (board) => {
    for (const reducer of boardReducers) {
      const patched = reducer(board, cmd)
      if (!patched) continue
      /* 认领了命令但内容没变：保持原引用，不刷新时间戳 */
      if (patched === board) return board
      return touch ? { ...patched, updatedAt: Date.now() } : patched
    }
    return board
  })
  return next === file ? null : next
}

const applyFileChange = (state: DocState, file: BoardsFile, cmd: DocCommand): DocState =>
  resetsHistory(cmd.type) ? { file, past: [], future: [] } : commitFile(state, file, cmd.history)

/**
 * 文档 reduce。`history: false` 的命令（视口、评论、路线图等）不进撤销栈；
 * 切换/新建/复制/删除白板则清空历史。
 */
export const reduceDoc = (state: DocState, cmd: DocCommand): DocState => {
  for (const reducer of fileReducers) {
    const file = reducer(state.file, cmd)
    if (file && file !== state.file) return applyFileChange(state, file, cmd)
  }
  const file = patchActive(state.file, cmd)
  return file ? commitFile(state, file, cmd.history) : state
}

/** 联合 reduce：界面命令走 `ui` 分片，其余走文档。 */
export const reduce = (state: EditorState, cmd: Command): EditorState => {
  if (cmd.type === 'history/undo' || cmd.type === 'history/redo' || cmd.type === 'history/push') {
    const next =
      cmd.type === 'history/push' ? pushHistory(state) : cmd.type === 'history/undo' ? undo(state) : redo(state)
    return next === state ? state : { ...state, ...next }
  }
  if (cmd.type.startsWith('ui/')) {
    return (
      reduceUi(state, cmd as UiCommand) ?? reduceStateCommand(state, cmd as StateCommand) ?? state
    )
  }
  const next = reduceDoc(state, cmd as DocCommand)
  if (next === state) return state
  return { ...state, file: next.file, past: next.past, future: next.future }
}
