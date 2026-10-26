/** 导图布局：节点自适应尺寸、四种排布方向与父子贝塞尔连线。 */

import { DEFAULT_STROKE } from '@/model/constants'
import { MIND_NODE_TEXT } from '@/model/factories'
import { estimateWidth, layoutText } from '@/geometry/text'
import { clamp, type Point } from '@/geometry/primitives'
import type { BoardElement, MindLayout } from '@/model/types'
import {
  buildMindTree,
  flattenTree,
  mindNodesOf,
  mindRootIdOf,
  visibleKids,
  type MindNode,
} from './tree'

const MAX_W = 232
const MIN_W = 112
const PAD_X = 18
const PAD_Y = 12
const H_GAP = 80
const V_GAP = 26
const V_LEVEL_GAP = 74

/** 导图节点宽度估算：窄字比例沿用 0.56，与画布正文的 0.55 区分。 */
const measure = (text: string, fontSize: number): number => estimateWidth(text, fontSize, 0.56)

/** 导图节点的自适应尺寸：宽度随文字量伸缩，高度随换行行数增长。 */
export const mindNodeSize = (el: BoardElement): { w: number; h: number } => {
  const single = measure(el.text ?? MIND_NODE_TEXT, el.fontSize)
  const target = clamp(Math.ceil(single + PAD_X * 2), MIN_W, MAX_W)
  const probe = layoutText({ ...el, w: target })
  const widest = Math.max(single, ...probe.lines.map((line) => measure(line, el.fontSize)))
  const w = clamp(Math.ceil(widest + PAD_X * 2), MIN_W, target)
  const h = Math.max(
    Math.round(el.fontSize * 2.3),
    Math.round(probe.lines.length * probe.lineHeight + PAD_Y * 2),
  )
  return { w, h }
}

/* ---------------- 布局 ---------------- */

const extentSide = (node: MindNode, sizes: Map<string, { w: number; h: number }>): number => {
  const kids = visibleKids(node)
  const size = sizes.get(node.el.id) as { w: number; h: number }
  if (!kids.length) return size.h
  const total = kids.reduce((sum, kid) => sum + extentSide(kid, sizes), 0) + V_GAP * (kids.length - 1)
  return Math.max(size.h, total)
}

const extentDown = (node: MindNode, sizes: Map<string, { w: number; h: number }>): number => {
  const kids = visibleKids(node)
  const size = sizes.get(node.el.id) as { w: number; h: number }
  if (!kids.length) return size.w
  const total = kids.reduce((sum, kid) => sum + extentDown(kid, sizes), 0) + V_GAP * (kids.length - 1)
  return Math.max(size.w, total)
}

const placeSide = (
  node: MindNode,
  x: number,
  top: number,
  dir: 1 | -1,
  sizes: Map<string, { w: number; h: number }>,
  out: Record<string, Point>,
): void => {
  const size = sizes.get(node.el.id) as { w: number; h: number }
  const band = extentSide(node, sizes)
  out[node.el.id] = { x, y: top + band / 2 - size.h / 2 }
  const kids = visibleKids(node)
  if (!kids.length) return
  const total = kids.reduce((sum, kid) => sum + extentSide(kid, sizes), 0) + V_GAP * (kids.length - 1)
  let cursor = top + (band - total) / 2
  for (const kid of kids) {
    const kidSize = sizes.get(kid.el.id) as { w: number; h: number }
    const kidX = dir === 1 ? x + size.w + H_GAP : x - H_GAP - kidSize.w
    placeSide(kid, kidX, cursor, dir, sizes, out)
    cursor += extentSide(kid, sizes) + V_GAP
  }
}

const placeDown = (
  node: MindNode,
  left: number,
  y: number,
  sizes: Map<string, { w: number; h: number }>,
  out: Record<string, Point>,
): void => {
  const size = sizes.get(node.el.id) as { w: number; h: number }
  const band = extentDown(node, sizes)
  out[node.el.id] = { x: left + band / 2 - size.w / 2, y }
  const kids = visibleKids(node)
  if (!kids.length) return
  const total = kids.reduce((sum, kid) => sum + extentDown(kid, sizes), 0) + V_GAP * (kids.length - 1)
  let cursor = left + (band - total) / 2
  for (const kid of kids) {
    placeDown(kid, cursor, y + size.h + V_LEVEL_GAP, sizes, out)
    cursor += extentDown(kid, sizes) + V_GAP
  }
}

/** 计算整棵导图的位置（key 为节点 id）；根节点保持在既有坐标上，其余节点围绕它排布。 */
export const layoutMindTree = (elements: BoardElement[], rootId: string): Record<string, Point> => {
  const tree = buildMindTree(elements, rootId)
  if (!tree) return {}
  const sizes = new Map<string, { w: number; h: number }>()
  for (const node of flattenTree(tree)) sizes.set(node.el.id, mindNodeSize(node.el))
  const layout: MindLayout = tree.el.mindLayout ?? 'right'
  const out: Record<string, Point> = {}

  if (layout === 'topdown') {
    placeDown(tree, tree.el.x, tree.el.y, sizes, out)
    return out
  }

  const rootSize = sizes.get(tree.el.id) as { w: number; h: number }
  out[tree.el.id] = { x: tree.el.x, y: tree.el.y }
  const kids = visibleKids(tree)

  if (layout === 'both') {
    const rightKids = kids.filter((_, i) => i % 2 === 0)
    const leftKids = kids.filter((_, i) => i % 2 === 1)
    const sideTotal = (list: MindNode[]) =>
      list.length ? list.reduce((sum, kid) => sum + extentSide(kid, sizes), 0) + V_GAP * (list.length - 1) : 0
    let cursor = tree.el.y + rootSize.h / 2 - sideTotal(rightKids) / 2
    for (const kid of rightKids) {
      placeSide(kid, tree.el.x + rootSize.w + H_GAP, cursor, 1, sizes, out)
      cursor += extentSide(kid, sizes) + V_GAP
    }
    cursor = tree.el.y + rootSize.h / 2 - sideTotal(leftKids) / 2
    for (const kid of leftKids) {
      const kidSize = sizes.get(kid.el.id) as { w: number; h: number }
      placeSide(kid, tree.el.x - H_GAP - kidSize.w, cursor, -1, sizes, out)
      cursor += extentSide(kid, sizes) + V_GAP
    }
    return out
  }

  const dir: 1 | -1 = layout === 'left' ? -1 : 1
  const band = extentSide(tree, sizes)
  const kidsTotal = kids.length
    ? kids.reduce((sum, kid) => sum + extentSide(kid, sizes), 0) + V_GAP * (kids.length - 1)
    : 0
  let cursor = tree.el.y + (band - kidsTotal) / 2
  for (const kid of kids) {
    const kidSize = sizes.get(kid.el.id) as { w: number; h: number }
    const kidX = dir === 1 ? tree.el.x + rootSize.w + H_GAP : tree.el.x - H_GAP - kidSize.w
    placeSide(kid, kidX, cursor, dir, sizes, out)
    cursor += extentSide(kid, sizes) + V_GAP
  }
  return out
}

/** 归一化：刷新所有导图节点的尺寸与位置。 */
export const normalizeMindmaps = (elements: BoardElement[]): BoardElement[] => {
  const nodes = mindNodesOf(elements)
  if (!nodes.length) return elements
  let next = elements.map((el) => {
    if (el.kind !== 'mindnode') return el
    const size = mindNodeSize(el)
    const rootId = el.rootId ?? el.parent ?? el.id
    const same = el.w === size.w && el.h === size.h && el.rootId === rootId
    return same ? el : { ...el, w: size.w, h: size.h, rootId }
  })
  const rootIds = Array.from(new Set(mindNodesOf(next).filter((el) => !el.parent).map((el) => el.id)))
  for (const rootId of rootIds) {
    const positions = layoutMindTree(next, rootId)
    next = next.map((el) => (positions[el.id] ? { ...el, x: positions[el.id].x, y: positions[el.id].y } : el))
  }
  return next
}

/* ---------------- 连线 ---------------- */

export interface MindLink {
  d: string
  color: string
  width: number
}

const branchVisible = (elements: BoardElement[], nodeId: string): boolean => {
  const byId = new Map(mindNodesOf(elements).map((el) => [el.id, el]))
  let cursor = byId.get(nodeId)
  const guard = new Set<string>()
  while (cursor?.parent && !guard.has(cursor.id)) {
    guard.add(cursor.id)
    if (byId.get(cursor.parent)?.collapsed) return false
    cursor = byId.get(cursor.parent)
  }
  return true
}

/** 生成父子节点之间的贝塞尔连线（渲染在节点下层）。 */
export const mindLinks = (elements: BoardElement[]): MindLink[] => {
  const nodes = mindNodesOf(elements)
  const byId = new Map(nodes.map((el) => [el.id, el]))
  const links: MindLink[] = []
  for (const child of nodes) {
    const parent = child.parent ? byId.get(child.parent) : undefined
    if (!parent || parent.collapsed) continue
    if (!branchVisible(elements, child.id)) continue
    const rootId = mindRootIdOf(elements, child.id) ?? ''
    const layout: MindLayout = byId.get(rootId)?.mindLayout ?? 'right'
    const down = layout === 'topdown'
    const toRight = !down && child.x >= parent.x + parent.w / 2
    const a = down
      ? { x: parent.x + parent.w / 2, y: parent.y + parent.h }
      : toRight
        ? { x: parent.x + parent.w, y: parent.y + parent.h / 2 }
        : { x: parent.x, y: parent.y + parent.h / 2 }
    const b = down
      ? { x: child.x + child.w / 2, y: child.y }
      : toRight
        ? { x: child.x, y: child.y + child.h / 2 }
        : { x: child.x + child.w, y: child.y + child.h / 2 }
    const mx = (a.x + b.x) / 2
    const my = (a.y + b.y) / 2
    const d = down
      ? `M ${a.x} ${a.y} C ${a.x} ${my} ${b.x} ${my} ${b.x} ${b.y}`
      : `M ${a.x} ${a.y} C ${mx} ${a.y} ${mx} ${b.y} ${b.x} ${b.y}`
    links.push({ d, color: child.stroke && child.stroke !== 'transparent' ? child.stroke : DEFAULT_STROKE, width: 2 })
  }
  return links
}

/** 节点层级（根为 0）。 */
export const mindLevelOf = (elements: BoardElement[], id: string): number => {
  const byId = new Map(mindNodesOf(elements).map((el) => [el.id, el]))
  let level = 0
  let cursor = byId.get(id)
  const guard = new Set<string>()
  while (cursor?.parent && !guard.has(cursor.id)) {
    guard.add(cursor.id)
    cursor = byId.get(cursor.parent)
    level += 1
  }
  return level
}
