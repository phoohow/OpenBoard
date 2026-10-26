/** 快照命令：手动/自动备份的新增、恢复与删除。 */

import type { BoardDoc, Snapshot } from '../document'
import type { CommandMeta } from './meta'

export type SnapshotCommand =
  | ({ type: 'snapshot/save'; snapshot: Snapshot } & CommandMeta)
  | ({ type: 'snapshot/restore'; id: string } & CommandMeta)
  | ({ type: 'snapshot/delete'; id: string } & CommandMeta)
  | ({ type: 'snapshot/auto'; snapshot: Snapshot; max: number } & CommandMeta)

export const reduceSnapshot = (board: BoardDoc, cmd: SnapshotCommand): BoardDoc | null => {
  switch (cmd.type) {
    case 'snapshot/save':
      return { ...board, snapshots: [cmd.snapshot, ...(board.snapshots ?? [])] }

    case 'snapshot/restore': {
      const snap = (board.snapshots ?? []).find((s) => s.id === cmd.id)
      if (!snap) return null
      return {
        ...board,
        elements: snap.elements.map((e) => ({ ...e })),
        view: { ...snap.view },
      }
    }

    case 'snapshot/delete':
      return { ...board, snapshots: (board.snapshots ?? []).filter((s) => s.id !== cmd.id) }

    case 'snapshot/auto': {
      const manual = (board.snapshots ?? []).filter((s) => !s.auto)
      const autoOnes = [cmd.snapshot, ...(board.snapshots ?? []).filter((s) => s.auto)].slice(0, cmd.max)
      return { ...board, snapshots: [...autoOnes, ...manual] }
    }

    default:
      return null
  }
}
