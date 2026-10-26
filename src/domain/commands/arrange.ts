/** 排列命令：六向对齐与等距分布（纯几何计算，不记历史以外的副作用）。 */

import { alignTargets, distributeTargets } from '@/geometry/arrange'
import { elementBounds, rawBox } from '@/geometry/box'
import { unionBounds } from '@/geometry/primitives'
import type { AlignKind, DistributeKind } from '@/geometry/arrange'
import type { BoardElement } from '@/model/types'
import type { BoardDoc } from '../document'
import type { CommandMeta } from './meta'

export type ArrangeCommand =
  | ({ type: 'elements/align'; ids: string[]; kind: AlignKind } & CommandMeta)
  | ({ type: 'elements/distribute'; ids: string[]; kind: DistributeKind } & CommandMeta)

/** 参与排列的目标：选中、未锁定、且不是连接线。 */
const arrangeTargets = (board: BoardDoc, ids: string[]): BoardElement[] => {
  const set = new Set(ids)
  return board.elements.filter((el) => set.has(el.id) && !el.locked && el.kind !== 'connector')
}

const applyBoxes = (
  board: BoardDoc,
  targets: BoardElement[],
  boxes: { x: number; y: number }[],
): BoardDoc => {
  const next = new Map(targets.map((el, i) => [el.id, boxes[i]]))
  return {
    ...board,
    elements: board.elements.map((el) => {
      const box = next.get(el.id)
      return box ? { ...el, x: box.x, y: box.y } : el
    }),
  }
}

export const reduceArrange = (board: BoardDoc, cmd: ArrangeCommand): BoardDoc | null => {
  switch (cmd.type) {
    case 'elements/align': {
      if (cmd.ids.length < 2) return null
      const targets = arrangeTargets(board, cmd.ids)
      if (targets.length < 2) return null
      const anchor = targets.map(elementBounds).reduce(unionBounds)
      const boxes = alignTargets(targets.map(rawBox), anchor, cmd.kind)
      return applyBoxes(board, targets, boxes)
    }

    case 'elements/distribute': {
      if (cmd.ids.length < 3) return null
      const targets = arrangeTargets(board, cmd.ids)
      if (targets.length < 3) return null
      const boxes = distributeTargets(targets.map(rawBox), cmd.kind)
      return applyBoxes(board, targets, boxes)
    }

    default:
      return null
  }
}
