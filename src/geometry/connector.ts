/** 连接线几何：端点吸附、三种走线（直线/正交/曲线）与箭头。 */

import type { BoardElement } from '@/model/types'
import { center, elementBounds } from './box'
import { round, type Point } from './primitives'

/** 从元素中心朝目标点方向取边框交点。 */
export const edgeAnchor = (el: BoardElement, target: Point): Point => {
  const c = center(el)
  const b = elementBounds(el)
  const dx = target.x - c.x
  const dy = target.y - c.y
  if (!dx && !dy) return c
  const hw = Math.max(1, b.w / 2)
  const hh = Math.max(1, b.h / 2)
  const sx = dx === 0 ? Infinity : hw / Math.abs(dx)
  const sy = dy === 0 ? Infinity : hh / Math.abs(dy)
  const s = Math.min(sx, sy)
  return { x: c.x + dx * s, y: c.y + dy * s }
}

const connectorEnds = (
  el: BoardElement,
  elements: BoardElement[],
): { a: Point; b: Point } | null => {
  if (!el.from || !el.to) return null
  const from = elements.find((e) => e.id === el.from)
  const to = elements.find((e) => e.id === el.to)
  if (!from || !to) return null
  const cFrom = center(from)
  const cTo = center(to)
  return { a: edgeAnchor(from, cTo), b: edgeAnchor(to, cFrom) }
}

const arrowPolygon = (tip: Point, tail: Point, size: number): string => {
  const angle = Math.atan2(tip.y - tail.y, tip.x - tail.x)
  const spread = 0.42
  const p1 = { x: tip.x - size * Math.cos(angle - spread), y: tip.y - size * Math.sin(angle - spread) }
  const p2 = { x: tip.x - size * Math.cos(angle + spread), y: tip.y - size * Math.sin(angle + spread) }
  return `${round(tip.x)},${round(tip.y)} ${round(p1.x)},${round(p1.y)} ${round(p2.x)},${round(p2.y)}`
}

export interface ConnectorGeometry {
  d: string
  start: Point
  end: Point
  startDir: Point
  endDir: Point
  label: Point
}

export const connectorGeometry = (el: BoardElement, elements: BoardElement[]): ConnectorGeometry | null => {
  const ends = connectorEnds(el, elements)
  if (!ends) return null
  const a = ends.a
  const b = ends.b
  const style = el.connectorStyle ?? 'straight'
  const dx = b.x - a.x
  const dy = b.y - a.y

  if (style === 'elbow') {
    if (Math.abs(dx) >= Math.abs(dy)) {
      const mid = a.x + dx / 2
      return {
        d: `M ${round(a.x)} ${round(a.y)} L ${round(mid)} ${round(a.y)} L ${round(mid)} ${round(b.y)} L ${round(b.x)} ${round(b.y)}`,
        start: a,
        end: b,
        startDir: { x: Math.sign(dx) || 1, y: 0 },
        endDir: { x: -Math.sign(dx) || -1, y: 0 },
        label: { x: mid, y: (a.y + b.y) / 2 },
      }
    }
    const mid = a.y + dy / 2
    return {
      d: `M ${round(a.x)} ${round(a.y)} L ${round(a.x)} ${round(mid)} L ${round(b.x)} ${round(mid)} L ${round(b.x)} ${round(b.y)}`,
      start: a,
      end: b,
      startDir: { x: 0, y: Math.sign(dy) || 1 },
      endDir: { x: 0, y: -Math.sign(dy) || -1 },
      label: { x: (a.x + b.x) / 2, y: mid },
    }
  }

  if (style === 'curve') {
    const len = Math.max(40, Math.hypot(dx, dy))
    const k = Math.min(120, len * 0.45)
    const horizontal = Math.abs(dx) >= Math.abs(dy)
    const c1 = horizontal ? { x: a.x + Math.sign(dx || 1) * k, y: a.y } : { x: a.x, y: a.y + Math.sign(dy || 1) * k }
    const c2 = horizontal ? { x: b.x - Math.sign(dx || 1) * k, y: b.y } : { x: b.x, y: b.y - Math.sign(dy || 1) * k }
    const label = {
      x: (a.x + 3 * c1.x + 3 * c2.x + b.x) / 8,
      y: (a.y + 3 * c1.y + 3 * c2.y + b.y) / 8,
    }
    return {
      d: `M ${round(a.x)} ${round(a.y)} C ${round(c1.x)} ${round(c1.y)} ${round(c2.x)} ${round(c2.y)} ${round(b.x)} ${round(b.y)}`,
      start: a,
      end: b,
      startDir: horizontal ? { x: Math.sign(dx || 1), y: 0 } : { x: 0, y: Math.sign(dy || 1) },
      endDir: horizontal ? { x: -Math.sign(dx || 1), y: 0 } : { x: 0, y: -Math.sign(dy || 1) },
      label,
    }
  }

  return {
    d: `M ${round(a.x)} ${round(a.y)} L ${round(b.x)} ${round(b.y)}`,
    start: a,
    end: b,
    startDir: { x: dx, y: dy },
    endDir: { x: -dx, y: -dy },
    label: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
  }
}

export const arrowHead = (tip: Point, dir: Point, size: number): string =>
  arrowPolygon(tip, { x: tip.x + dir.x * size, y: tip.y + dir.y * size }, size)
