/** 分组命令：成组与解组（锁定元素不参与成组，解组不受锁定限制）。 */

import type { BoardDoc } from '../document'
import type { CommandMeta } from './meta'

export type GroupCommand = ({ type: 'elements/group'; ids: string[]; groupId: string | null } & CommandMeta)

export const reduceGroup = (board: BoardDoc, cmd: GroupCommand): BoardDoc | null => {
  if (cmd.type !== 'elements/group') return null
  const set = new Set(cmd.ids)
  if (!set.size) return null
  const groupId = cmd.groupId
  return {
    ...board,
    elements: board.elements.map((el) => {
      if (!set.has(el.id)) return el
      if (groupId && el.locked) return el
      return { ...el, groupId: groupId ?? undefined }
    }),
  }
}
