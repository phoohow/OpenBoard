/** 白板命令：文件级（新建/切换/复制/删除/重命名）与当前白板内容级（清空/整体替换）。 */

import { uid } from '@/model/factories'
import type { BoardElement, View } from '@/model/types'
import { createBoardDoc, type BoardDoc, type BoardsFile } from '../document'
import type { CommandMeta } from './meta'

export type BoardFileCommand =
  | ({ type: 'board/rename'; id: string; name: string } & CommandMeta)
  | ({ type: 'board/create'; board: BoardDoc } & CommandMeta)
  | ({ type: 'board/select'; id: string } & CommandMeta)
  | ({ type: 'board/duplicate'; id: string; newId: string } & CommandMeta)
  | ({ type: 'board/delete'; id: string } & CommandMeta)

export type BoardContentCommand =
  | ({ type: 'board/clear' } & CommandMeta)
  | ({ type: 'board/replace'; elements: BoardElement[]; view?: View } & CommandMeta)

/** 切换当前白板后需要重置历史栈的命令。 */
export const resetsHistory = (type: string): boolean =>
  type === 'board/create' || type === 'board/select' || type === 'board/duplicate' || type === 'board/delete'

export const reduceBoards = (file: BoardsFile, cmd: BoardFileCommand): BoardsFile | null => {
  switch (cmd.type) {
    case 'board/rename': {
      const target = file.boards.find((b) => b.id === cmd.id)
      if (!target || target.name === cmd.name) return null
      return {
        ...file,
        boards: file.boards.map((b) => (b.id === cmd.id ? { ...b, name: cmd.name } : b)),
      }
    }

    case 'board/create':
      return { ...file, activeId: cmd.board.id, boards: [...file.boards, cmd.board] }

    case 'board/select':
      if (!file.boards.some((b) => b.id === cmd.id) || file.activeId === cmd.id) return null
      return { ...file, activeId: cmd.id }

    case 'board/duplicate': {
      const source = file.boards.find((b) => b.id === cmd.id)
      if (!source) return null
      const map = new Map<string, string>()
      const cloned = source.elements.map((el) => {
        const nextId = uid()
        map.set(el.id, nextId)
        return { ...el, id: nextId }
      })
      const elements = cloned.map((el) => ({
        ...el,
        from: el.from ? map.get(el.from) : undefined,
        to: el.to ? map.get(el.to) : undefined,
        parent: el.parent ? map.get(el.parent) : undefined,
        rootId: el.rootId ? map.get(el.rootId) : undefined,
        groupId: el.groupId ? map.get(el.groupId) : undefined,
      }))
      const copy: BoardDoc = {
        id: cmd.newId,
        name: `${source.name} 副本`,
        elements,
        view: { ...source.view },
        updatedAt: Date.now(),
        comments: (source.comments ?? []).map((c) => ({ ...c })),
        route: (source.route ?? []).map((s) => ({ ...s })),
      }
      return { ...file, activeId: cmd.newId, boards: [...file.boards, copy] }
    }

    case 'board/delete': {
      if (!file.boards.some((b) => b.id === cmd.id)) return null
      const boards = file.boards.filter((b) => b.id !== cmd.id)
      const next = boards.length ? boards : [createBoardDoc('未命名白板')]
      return { ...file, boards: next, activeId: file.activeId === cmd.id ? next[0].id : file.activeId }
    }

    default:
      return null
  }
}

export const reduceBoardContent = (board: BoardDoc, cmd: BoardContentCommand): BoardDoc | null => {
  switch (cmd.type) {
    case 'board/clear':
      return board.elements.length ? { ...board, elements: [] } : null

    case 'board/replace':
      return { ...board, elements: cmd.elements, view: cmd.view ? { ...cmd.view } : board.view }

    default:
      return null
  }
}
