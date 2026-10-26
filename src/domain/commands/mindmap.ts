/** 思维导图命令：加节点、折叠、换布局与换主题（整体重排由 `normalizeMindmaps` 在各命令内完成）。 */

import { MIND_NODE_TEXT, baseElement } from '@/model/factories'
import type { BoardElement, MindLayout, MindTheme } from '@/model/types'
import { MIND_THEMES, applyMindTheme, mindThemes } from '@/domain/mindmap/themes'
import { mindLevelOf, mindNodeSize, normalizeMindmaps } from '@/domain/mindmap/layout'
import { mindNodesOf, mindRootIdOf } from '@/domain/mindmap/tree'
import type { BoardDoc } from '../document'
import type { CommandMeta } from './meta'

export type MindmapCommand =
  | ({ type: 'mindmap/addNode'; sourceId: string; mode: 'child' | 'sibling'; id: string } & CommandMeta)
  | ({ type: 'mindmap/layout'; rootId: string; layout: MindLayout } & CommandMeta)
  | ({ type: 'mindmap/theme'; rootId: string; theme: MindTheme } & CommandMeta)
  | ({ type: 'mindmap/collapse'; id: string } & CommandMeta)

/** 依据节点填充色反查主题，查不到时回落到「葡萄」。 */
export const detectMindTheme = (node: BoardElement): MindTheme => {
  for (const theme of MIND_THEMES) {
    if (mindThemes[theme].levels.some((level) => level.fill.toLowerCase() === (node.fill ?? '').toLowerCase())) {
      return theme
    }
  }
  return 'grape'
}

export const reduceMindmap = (board: BoardDoc, cmd: MindmapCommand): BoardDoc | null => {
  switch (cmd.type) {
    case 'mindmap/addNode': {
      const source = board.elements.find((el) => el.id === cmd.sourceId)
      if (!source || source.kind !== 'mindnode') return null
      const rootId = mindRootIdOf(board.elements, cmd.sourceId)
      if (!rootId) return null
      const parentId = cmd.mode === 'child' || !source.parent ? source.id : source.parent
      const level = mindLevelOf(board.elements, parentId) + 1
      const spec = mindThemes[detectMindTheme(source)].levels[Math.min(level, 2)]
      const fontSize = level === 1 ? 17 : 15
      const node: BoardElement = {
        ...baseElement('mindnode', source.x, source.y),
        id: cmd.id,
        parent: parentId,
        rootId,
        text: MIND_NODE_TEXT,
        fontSize,
        bold: false,
        fill: spec.fill,
        stroke: spec.stroke,
        textColor: spec.textColor,
        ...mindNodeSize({ ...baseElement('mindnode', 0, 0), text: MIND_NODE_TEXT, fontSize }),
      }
      return {
        ...board,
        elements: normalizeMindmaps([
          ...board.elements.map((el) =>
            el.id === parentId && parentId === source.id && el.collapsed ? { ...el, collapsed: false } : el,
          ),
          node,
        ]),
      }
    }

    case 'mindmap/collapse': {
      const target = board.elements.find((el) => el.id === cmd.id)
      if (!target || target.kind !== 'mindnode') return null
      if (!mindNodesOf(board.elements).some((el) => el.parent === cmd.id)) return null
      return {
        ...board,
        elements: normalizeMindmaps(
          board.elements.map((el) => (el.id === cmd.id ? { ...el, collapsed: !el.collapsed } : el)),
        ),
      }
    }

    case 'mindmap/layout':
      return {
        ...board,
        elements: normalizeMindmaps(
          board.elements.map((el) =>
            el.kind === 'mindnode' && (el.id === cmd.rootId || el.rootId === cmd.rootId)
              ? { ...el, mindLayout: cmd.layout, rootId: el.rootId ?? cmd.rootId }
              : el,
          ),
        ),
      }

    case 'mindmap/theme':
      return { ...board, elements: normalizeMindmaps(applyMindTheme(board.elements, cmd.rootId, cmd.theme)) }

    default:
      return null
  }
}
