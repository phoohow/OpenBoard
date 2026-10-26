/** 导图树结构：父子关系、子树遍历与选中扩展。 */

import type { BoardElement } from '@/model/types'

export interface MindNode {
  el: BoardElement
  children: MindNode[]
}

export const mindNodesOf = (elements: BoardElement[]): BoardElement[] => elements.filter((el) => el.kind === 'mindnode')

export const buildMindTree = (elements: BoardElement[], rootId: string): MindNode | null => {
  const nodes = mindNodesOf(elements)
  const map = new Map<string, MindNode>()
  for (const el of nodes) map.set(el.id, { el, children: [] })
  let root: MindNode | null = null
  for (const el of nodes) {
    const current = map.get(el.id) as MindNode
    const parentId = el.parent && map.has(el.parent) && el.parent !== el.id ? el.parent : undefined
    if (!parentId) {
      if (el.id === rootId) root = current
      continue
    }
    ;(map.get(parentId) as MindNode).children.push(current)
  }
  return root
}

export const flattenTree = (node: MindNode): MindNode[] => [node, ...node.children.flatMap(flattenTree)]

/** 向上查找所属导图的根节点 id。 */
export const mindRootIdOf = (elements: BoardElement[], id: string): string | null => {
  const byId = new Map(mindNodesOf(elements).map((el) => [el.id, el]))
  let cursor = byId.get(id)
  const guard = new Set<string>()
  while (cursor && !guard.has(cursor.id)) {
    guard.add(cursor.id)
    const parentId = cursor.parent ? byId.get(cursor.parent)?.id : undefined
    if (!parentId) return cursor.id
    cursor = byId.get(parentId)
  }
  return null
}

/** 节点及其全部后代 id。 */
export const mindSubtreeIds = (elements: BoardElement[], id: string): string[] => {
  const byId = new Map(mindNodesOf(elements).map((el) => [el.id, el]))
  if (!byId.has(id)) return []
  const childrenMap = new Map<string, string[]>()
  for (const el of byId.values()) {
    if (!el.parent) continue
    const list = childrenMap.get(el.parent) ?? []
    list.push(el.id)
    childrenMap.set(el.parent, list)
  }
  const out: string[] = []
  const stack = [id]
  while (stack.length) {
    const current = stack.pop() as string
    out.push(current)
    stack.push(...(childrenMap.get(current) ?? []))
  }
  return out
}

/** 选中节点时扩展为整棵导图，便于整体复制 / 移动。 */
export const expandToMindTrees = (elements: BoardElement[], ids: string[]): string[] => {
  const roots = new Set<string>()
  for (const id of ids) {
    const rootId = mindRootIdOf(elements, id)
    if (rootId) roots.add(rootId)
  }
  if (!roots.size) return ids
  const expanded = new Set(ids)
  for (const rootId of roots) for (const id of mindSubtreeIds(elements, rootId)) expanded.add(id)
  return [...expanded]
}

export const visibleKids = (node: MindNode): MindNode[] => (node.el.collapsed ? [] : node.children)
