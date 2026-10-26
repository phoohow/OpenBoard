/** 白板动作：新建 / 切换 / 重命名 / 复制 / 删除 / 清空，以及设置与撤销重做。 */

import { uid } from '@/model/factories'
import type { AppSettings } from '@/model/types'
import { createBoardDoc } from '@/domain/document'
import { activeBoard } from '@/domain/document'
import { dispatch, getState } from '../store'
import { nextBackground } from '../config'
import { setConfirm, toast } from './ui'

export const renameBoard = (name: string): void => {
  const board = activeBoard(getState().file)
  if (!board || board.name === name) return
  dispatch({ type: 'board/rename', id: board.id, name, history: false })
}

export const renameBoardById = (id: string, name: string): void => {
  const trimmed = name.trim()
  if (!trimmed) {
    toast('白板名称不能为空', 'error')
    return
  }
  dispatch({ type: 'board/rename', id, name: trimmed, history: false })
  toast('已重命名白板')
}

export const createBoard = (): void => {
  dispatch(
    { type: 'board/create', board: createBoardDoc('未命名白板') },
    { type: 'ui/selection', value: [] },
    { type: 'ui/editing', value: null },
  )
  toast('已新建白板')
}

export const selectBoard = (id: string): void => {
  dispatch(
    { type: 'board/select', id },
    { type: 'ui/selection', value: [] },
    { type: 'ui/editing', value: null },
  )
}

export const duplicateBoard = (id: string): void => {
  const source = getState().file.boards.find((b) => b.id === id)
  if (!source) return
  dispatch(
    { type: 'board/duplicate', id, newId: uid() },
    { type: 'ui/selection', value: [] },
    { type: 'ui/editing', value: null },
  )
  toast(`已创建「${source.name} 副本」`)
}

export const deleteBoard = (id: string): void => {
  const target = getState().file.boards.find((b) => b.id === id)
  if (!target) return
  const last = getState().file.boards.length <= 1
  setConfirm({
    title: '删除白板',
    message: last
      ? `「${target.name}」是最后一个白板，删除后会新建一个空白白板，其中 ${target.elements.length} 个元素将被永久移除。是否继续？`
      : `删除「${target.name}」将永久移除其中 ${target.elements.length} 个元素，此操作不可撤销。是否继续？`,
    confirmLabel: '删除白板',
    action: () => {
      dispatch(
        { type: 'board/delete', id },
        { type: 'ui/selection', value: [] },
        { type: 'ui/editing', value: null },
        { type: 'ui/confirm', value: null },
      )
      toast(`已删除「${target.name}」`)
    },
  })
}

export const clearBoard = (): void => {
  const board = activeBoard(getState().file)
  if (!board) return
  if (!board.elements.length) {
    toast('当前白板已经是空的', 'error')
    return
  }
  setConfirm({
    title: '清空内容',
    message: `将删除当前白板「${board.name}」的全部 ${board.elements.length} 个元素，此操作可以撤销。是否继续？`,
    confirmLabel: '清空内容',
    action: () => {
      dispatch(
        { type: 'board/clear' },
        { type: 'ui/selection', value: [] },
        { type: 'ui/editing', value: null },
        { type: 'ui/confirm', value: null },
      )
      toast('已清空当前白板')
    },
  })
}

export const updateSettings = (patch: Partial<AppSettings>): void => {
  dispatch({ type: 'settings/patch', patch, history: false })
}

/** 背景样式按缩放条的固定顺序轮转。 */
export const cycleBackground = (): void => {
  const current = getState().file.settings
  updateSettings({ background: nextBackground(current.background) })
}

export const undo = (): void => {
  dispatch({ type: 'history/undo' })
}

export const redo = (): void => {
  dispatch({ type: 'history/redo' })
}
