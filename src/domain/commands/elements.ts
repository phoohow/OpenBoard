/** 元素命令：批量增删、属性补丁、层级与文本落笔（纯函数）。 */

import { autoHeight } from '@/geometry/text'
import type { BoardElement } from '@/model/types'
import { mindSubtreeIds } from '@/domain/mindmap/tree'
import { normalizeMindmaps } from '@/domain/mindmap/layout'
import type { BoardDoc } from '../document'
import type { CommandMeta } from './meta'

export type ElementCommand =
  | ({ type: 'elements/set'; elements: BoardElement[] } & CommandMeta)
  | ({ type: 'elements/add'; elements: BoardElement[] } & CommandMeta)
  | ({ type: 'elements/patch'; ids: string[]; patch: Partial<BoardElement>; skipLocked?: boolean } & CommandMeta)
  | ({
      type: 'elements/remove'
      ids: string[]
      /** 删除导图节点时连带删除整棵子树（默认 true） */
      cascadeMind?: boolean
      /** 连带删除挂在这些元素上的连接线（默认 true） */
      dropConnectors?: boolean
    } & CommandMeta)
  | ({ type: 'elements/reorder'; ids: string[]; direction: 'front' | 'back' } & CommandMeta)
  | ({ type: 'elements/moveLayer'; ids: string[]; dir: 'up' | 'down' } & CommandMeta)
  | ({ type: 'elements/rotate'; ids: string[]; deg: number } & CommandMeta)
  | ({ type: 'elements/replaceText'; id: string; value: string; cell?: number } & CommandMeta)

const matches = (ids: string[]) => {
  const set = new Set(ids)
  return (el: BoardElement) => set.has(el.id)
}

/** 批量替换元素数组；内容未变时返回原白板以跳过历史与渲染。 */
const rewrite = (
  board: BoardDoc,
  fn: (els: BoardElement[]) => BoardElement[],
): BoardDoc => {
  const next = fn(board.elements)
  return next === board.elements ? board : { ...board, elements: next }
}

export const reduceElements = (board: BoardDoc, cmd: ElementCommand): BoardDoc | null => {
  switch (cmd.type) {
    case 'elements/set':
      return rewrite(board, () => cmd.elements)

    case 'elements/add':
      return cmd.elements.length ? rewrite(board, (els) => [...els, ...cmd.elements]) : board

    case 'elements/patch': {
      const hit = matches(cmd.ids)
      return rewrite(board, (els) =>
        els.map((el) => (hit(el) && !(cmd.skipLocked && el.locked) ? { ...el, ...cmd.patch } : el)),
      )
    }

    case 'elements/remove': {
      const ids = new Set(cmd.ids)
      if (cmd.cascadeMind !== false) {
        const pool = board.elements
        for (const id of cmd.ids) for (const extra of mindSubtreeIds(pool, id)) ids.add(extra)
      }
      if (!ids.size) return board
      return rewrite(board, (els) =>
        els.filter((el) => {
          if (ids.has(el.id)) return false
          if (cmd.dropConnectors !== false && el.kind === 'connector') {
            if (el.from && ids.has(el.from)) return false
            if (el.to && ids.has(el.to)) return false
          }
          return true
        }),
      )
    }

    case 'elements/reorder': {
      const hit = matches(cmd.ids)
      if (!cmd.ids.length) return board
      return rewrite(board, (els) => {
        const picked = els.filter(hit)
        const rest = els.filter((el) => !hit(el))
        return cmd.direction === 'front' ? [...rest, ...picked] : [...picked, ...rest]
      })
    }

    case 'elements/moveLayer': {
      const picked = new Set(cmd.ids)
      if (!picked.size) return board
      return rewrite(board, (els) => {
        const idxs = els.map((el, i) => (picked.has(el.id) ? i : -1)).filter((i) => i >= 0)
        if (!idxs.length) return els
        const next = els.slice()
        if (cmd.dir === 'up') {
          for (let k = idxs.length - 1; k >= 0; k -= 1) {
            const i = idxs[k]
            const j = i + 1
            if (j < next.length && !picked.has(next[j].id)) [next[i], next[j]] = [next[j], next[i]]
          }
        } else {
          for (let k = 0; k < idxs.length; k += 1) {
            const i = idxs[k]
            const j = i - 1
            if (j >= 0 && !picked.has(next[j].id)) [next[i], next[j]] = [next[j], next[i]]
          }
        }
        return next
      })
    }

    case 'elements/rotate': {
      const hit = matches(cmd.ids)
      /* 归一化到 -180 ~ 180 */
      const wrapped = (((cmd.deg + 180) % 360) + 360) % 360 - 180
      return rewrite(board, (els) => els.map((el) => (hit(el) && !el.locked ? { ...el, rotation: wrapped } : el)))
    }

    case 'elements/replaceText':
      return rewrite(board, (els) =>
        normalizeMindmaps(
          els.map((el) => {
            if (el.id !== cmd.id) return el
            if (cmd.cell != null && el.kind === 'table') {
              const cells = [...(el.cells ?? [])]
              cells[cmd.cell] = cmd.value
              return { ...el, cells }
            }
            const withText: BoardElement = { ...el, text: cmd.value }
            const autosize = el.autoSize !== false && (el.kind === 'sticky' || el.kind === 'text')
            return { ...withText, h: autosize ? autoHeight(withText) : el.h }
          }),
        ),
      )

    default:
      return null
  }
}
