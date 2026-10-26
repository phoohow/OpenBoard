/** 快照动作：手动存档、恢复与删除（自动快照由 effects 触发）。 */

import { uid } from '@/model/factories'
import { activeBoard, type Snapshot } from '@/domain/document'
import { dispatch, getState } from '../store'
import { toast } from './ui'

const snapshotOf = (name: string, auto: boolean): Snapshot | null => {
  const board = activeBoard(getState().file)
  if (!board) return null
  return {
    id: uid(),
    name,
    createdAt: Date.now(),
    auto,
    elements: board.elements.map((e) => ({ ...e })),
    view: { ...board.view },
  }
}

export const saveVersion = (name: string): void => {
  const snap = snapshotOf(name.trim() || '手动版本', false)
  if (!snap) return
  dispatch({ type: 'snapshot/save', snapshot: snap })
  toast('已保存版本')
}

export const restoreSnapshot = (id: string): void => {
  const board = activeBoard(getState().file)
  if (!board || !(board.snapshots ?? []).some((s) => s.id === id)) return
  dispatch(
    { type: 'snapshot/restore', id },
    { type: 'ui/selection', value: [] },
    { type: 'ui/editing', value: null },
  )
  toast('已恢复到该版本（可撤销）')
}

export const deleteSnapshot = (id: string): void => {
  dispatch({ type: 'snapshot/delete', id, history: false })
}

/** 自动备份：保留最近 max 条 auto 快照，放在手动快照之前。 */
export const autoSnapshot = (max: number): void => {
  const snap = snapshotOf('自动备份', true)
  if (!snap) return
  dispatch({ type: 'snapshot/auto', snapshot: snap, max, history: false })
}
