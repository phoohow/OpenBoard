/** 盒子与包围盒：元素的原始/旋转/合集/选区包裹盒，以及容器与群组关系。 */

import type { BoardElement } from '@/model/types'
import { rotatePoint, unionBounds, type Bounds, type Point } from './primitives'

const includedKinds = (el: BoardElement) => el.kind !== 'connector'

export const elementBounds = (el: BoardElement): Bounds => rotatedBounds(el)

/** 未旋转时的原始盒子（用于绘制选中框与本地坐标命中判断）。 */
export const rawBox = (el: BoardElement): Bounds => {
  if (el.kind === 'draw' && el.points?.length) {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (let i = 0; i < el.points.length; i += 2) {
      minX = Math.min(minX, el.points[i])
      minY = Math.min(minY, el.points[i + 1])
      maxX = Math.max(maxX, el.points[i])
      maxY = Math.max(maxY, el.points[i + 1])
    }
    const pad = Math.max(1, el.strokeWidth)
    return { x: el.x + minX - pad, y: el.y + minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 }
  }
  return { x: el.x, y: el.y, w: el.w, h: el.h }
}

/** 计入旋转后的轴对齐包围盒。 */
const rotatedBounds = (el: BoardElement): Bounds => {
  const box = rawBox(el)
  if (!el.rotation) return box
  const c = { x: box.x + box.w / 2, y: box.y + box.h / 2 }
  const corners = [
    { x: box.x, y: box.y },
    { x: box.x + box.w, y: box.y },
    { x: box.x + box.w, y: box.y + box.h },
    { x: box.x, y: box.y + box.h },
  ].map((p) => rotatePoint(p, c, el.rotation as number))
  const xs = corners.map((p) => p.x)
  const ys = corners.map((p) => p.y)
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y }
}

export const rotationTransform = (el: BoardElement): string | undefined => {
  if (!el.rotation) return undefined
  const box = rawBox(el)
  return `rotate(${el.rotation} ${box.x + box.w / 2} ${box.y + box.h / 2})`
}

export const contentBounds = (elements: BoardElement[], includeAll = true): Bounds | null => {
  const list = includeAll ? elements : elements.filter(includedKinds)
  if (!list.length) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const el of list) {
    const b = elementBounds(el)
    minX = Math.min(minX, b.x)
    minY = Math.min(minY, b.y)
    maxX = Math.max(maxX, b.x + b.w)
    maxY = Math.max(maxY, b.y + b.h)
  }
  return { x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) }
}

export const selectionBounds = (elements: BoardElement[]): Bounds | null => {
  if (!elements.length) return null
  return elements.map(elementBounds).reduce(unionBounds)
}

export const center = (el: BoardElement): Point => {
  const b = elementBounds(el)
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 }
}

/* ---------------- 容器与群组 ---------------- */

/** 元素中心是否落在容器范围内（容器自身排除在外）。 */
const isInsideFrame = (el: BoardElement, frame: BoardElement): boolean => {
  if (el.id === frame.id) return false
  const b = rotatedBounds(frame)
  const c = center(el)
  return c.x >= b.x && c.x <= b.x + b.w && c.y >= b.y && c.y <= b.y + b.h
}

/** 容器内的直接成员（不含嵌套容器自身再次递归）。 */
const frameChildren = (frame: BoardElement, elements: BoardElement[]): BoardElement[] =>
  elements.filter((el) => el.kind !== 'frame' && isInsideFrame(el, frame))

/** 随容器一起移动的元素集合：容器内元素，以及两端都在容器内的连接线。 */
export const elementsToMoveWithFrame = (frame: BoardElement, elements: BoardElement[]): BoardElement[] => {
  const children = frameChildren(frame, elements)
  const childIds = new Set(children.map((el) => el.id))
  const innerLinks = elements.filter(
    (el) =>
      el.kind === 'connector' &&
      !!el.from &&
      !!el.to &&
      childIds.has(el.from) &&
      childIds.has(el.to) &&
      !childIds.has(el.id),
  )
  return [...children, ...innerLinks]
}

/** 同组成员。 */
export const groupMembers = (elements: BoardElement[], groupId?: string): BoardElement[] =>
  groupId ? elements.filter((el) => el.groupId === groupId) : []
