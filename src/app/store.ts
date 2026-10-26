/** 应用 store：模块级单例，`dispatch` 是唯一写入口，`subscribe` 供 React 订阅。 */

import { createEditorState, type EditorState } from '@/domain/state'
import { reduce } from '@/domain/reduce'
import type { Command } from '@/domain/commands/command'
import { loadFile } from '@/features/storage/file'

let state: EditorState = createEditorState(loadFile())

const listeners = new Set<() => void>()

export const getState = (): EditorState => state

export const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const notify = () => {
  for (const listener of listeners) listener()
}

/** 唯一写入口：一次可提交多条命令，只通知一次订阅者。 */
export const dispatch = (...cmds: Command[]): void => {
  let next = state
  for (const cmd of cmds) next = reduce(next, cmd)
  if (next === state) return
  state = next
  notify()
}
