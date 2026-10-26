/** 命中测试：支持旋转、锁定跳过、手绘描边与图形实际轮廓。 */

import type { BoardElement } from '@/model/types'
import { rawBox } from './box'
import { connectorGeometry } from './connector'
import { clamp, polylineOf, rotatePoint, type Point } from './primitives'

const distToSegment = (p: Point, a: Point, b: Point): number => {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = dx * dx + dy * dy
  const t = len === 0 ? 0 : clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / len, 0, 1)
  const cx = a.x + dx * t
  const cy = a.y + dy * t
  return Math.hypot(p.x - cx, p.y - cy)
}

/** 把世界坐标反向旋转，得到元素本地坐标。 */
export const localPoint = (el: BoardElement, p: Point): Point => {
  if (!el.rotation) return p
  const b = rawBox(el)
  return rotatePoint(p, { x: b.x + b.w / 2, y: b.y + b.h / 2 }, -(el.rotation as number))
}

/** 命中测试：支持旋转、锁定跳过与图形实际轮廓。 */
export const hitTest = (elements: BoardElement[], p: Point, skipLocked = true): BoardElement | null => {
  for (let i = elements.length - 1; i >= 0; i -= 1) {
    const el = elements[i]
    if (skipLocked && el.locked) continue
    if (el.visible === false) continue
    const local = localPoint(el, p)

    if (el.kind === 'draw' && el.points && el.points.length >= 4) {
      const tol = Math.max(6, el.strokeWidth)
      let hit = false
      for (let j = 0; j + 3 < el.points.length; j += 2) {
        const a = { x: el.x + el.points[j], y: el.y + el.points[j + 1] }
        const c = { x: el.x + el.points[j + 2], y: el.y + el.points[j + 3] }
        if (distToSegment(local, a, c) <= tol) {
          hit = true
          break
        }
      }
      if (hit) return el
      continue
    }

    if (el.kind === 'connector') {
      const geo = connectorGeometry(el, elements)
      if (!geo) continue
      const segments = polylineOf(geo.d)
      let hit = false
      for (let j = 0; j + 1 < segments.length; j += 1) {
        if (distToSegment(local, segments[j], segments[j + 1]) <= Math.max(8, el.strokeWidth * 2)) {
          hit = true
          break
        }
      }
      if (hit) return el
      continue
    }

    const b = rawBox(el)
    const w = Math.max(b.w, el.kind === 'text' && !el.text?.trim() ? 40 : b.w, 12)
    const h = Math.max(b.h, el.kind === 'text' && !el.text?.trim() ? 24 : b.h, 12)
    if (el.kind === 'shape' && el.shape === 'circle') {
      const rx = w / 2
      const ry = h / 2
      const cx = b.x + b.w / 2
      const cy = b.y + b.h / 2
      const nx = (local.x - cx) / Math.max(1, rx)
      const ny = (local.y - cy) / Math.max(1, ry)
      if (nx * nx + ny * ny <= 1.05) return el
      continue
    }
    if (local.x >= b.x && local.x <= b.x + w && local.y >= b.y && local.y <= b.y + h) return el
  }
  return null
}
