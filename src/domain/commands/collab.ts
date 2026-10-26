/** 协作命令：评论批注、便签投票与演示路线图。 */

import type { BoardComment, RouteStop } from '@/model/types'
import type { BoardDoc } from '../document'
import type { CommandMeta } from './meta'

export type CollabCommand =
  | ({ type: 'comment/add'; comment: BoardComment } & CommandMeta)
  | ({ type: 'comment/toggle'; id: string } & CommandMeta)
  | ({ type: 'comment/remove'; id: string } & CommandMeta)
  | ({ type: 'vote/cast'; id: string } & CommandMeta)
  | ({ type: 'vote/reset' } & CommandMeta)
  | ({ type: 'route/add'; stop: RouteStop } & CommandMeta)
  | ({ type: 'route/remove'; id: string } & CommandMeta)
  | ({ type: 'route/move'; id: string; dir: -1 | 1 } & CommandMeta)
  | ({ type: 'route/clear' } & CommandMeta)

export const reduceCollab = (board: BoardDoc, cmd: CollabCommand): BoardDoc | null => {
  switch (cmd.type) {
    case 'comment/add':
      return { ...board, comments: [...(board.comments ?? []), cmd.comment] }

    case 'comment/toggle':
      return {
        ...board,
        comments: (board.comments ?? []).map((c) => (c.id === cmd.id ? { ...c, resolved: !c.resolved } : c)),
      }

    case 'comment/remove':
      return { ...board, comments: (board.comments ?? []).filter((c) => c.id !== cmd.id) }

    case 'vote/cast':
      return {
        ...board,
        elements: board.elements.map((el) => (el.id === cmd.id ? { ...el, votes: (el.votes ?? 0) + 1 } : el)),
      }

    case 'vote/reset':
      return { ...board, elements: board.elements.map((el) => (el.votes ? { ...el, votes: 0 } : el)) }

    case 'route/add':
      return { ...board, route: [...(board.route ?? []), cmd.stop] }

    case 'route/remove':
      return { ...board, route: (board.route ?? []).filter((s) => s.id !== cmd.id) }

    case 'route/move': {
      const list = [...(board.route ?? [])]
      const index = list.findIndex((s) => s.id === cmd.id)
      const next = index + cmd.dir
      if (index < 0 || next < 0 || next >= list.length) return null
      ;[list[index], list[next]] = [list[next], list[index]]
      return { ...board, route: list }
    }

    case 'route/clear':
      return { ...board, route: [] }

    default:
      return null
  }
}
