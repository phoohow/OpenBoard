/** 吸附与排布：对齐参考线、网格吸附、多选对齐与等距分布。 */

import { unionBounds, type Bounds } from './primitives'

export interface Guide {
  orientation: 'v' | 'h'
  pos: number
  start: number
  end: number
}

const edgesOf = (b: Bounds) => ({
  xs: [b.x, b.x + b.w / 2, b.x + b.w],
  ys: [b.y, b.y + b.h / 2, b.y + b.h],
})

export interface SnapResult {
  dx: number
  dy: number
  guides: Guide[]
}

/** 拖拽时计算与其它元素的对齐吸附，返回位移修正与参考线。 */
export const computeSnap = (
  moving: Bounds[],
  others: Bounds[],
  tolerance: number,
): SnapResult => {
  const target = moving.reduce(unionBounds)
  const targetEdges = edgesOf(target)
  let bestX: { delta: number; pos: number } | null = null
  let bestY: { delta: number; pos: number } | null = null
  const vertical: Guide[] = []
  const horizontal: Guide[] = []

  for (const other of others) {
    const edges = edgesOf(other)
    for (const tx of targetEdges.xs) {
      for (const ox of edges.xs) {
        const delta = ox - tx
        if (Math.abs(delta) > tolerance) continue
        if (!bestX || Math.abs(delta) < Math.abs(bestX.delta)) bestX = { delta, pos: ox }
      }
    }
    for (const ty of targetEdges.ys) {
      for (const oy of edges.ys) {
        const delta = oy - ty
        if (Math.abs(delta) > tolerance) continue
        if (!bestY || Math.abs(delta) < Math.abs(bestY.delta)) bestY = { delta, pos: oy }
      }
    }
  }

  const dx = bestX?.delta ?? 0
  const dy = bestY?.delta ?? 0
  const shifted: Bounds = { x: target.x + dx, y: target.y + dy, w: target.w, h: target.h }

  if (bestX) {
    for (const other of others) {
      const edges = edgesOf(other)
      if (!edges.xs.some((v) => Math.abs(v - bestX!.pos) < 0.6)) continue
      const start = Math.min(other.y, shifted.y)
      const end = Math.max(other.y + other.h, shifted.y + shifted.h)
      vertical.push({ orientation: 'v', pos: bestX.pos, start, end })
    }
  }
  if (bestY) {
    for (const other of others) {
      const edges = edgesOf(other)
      if (!edges.ys.some((v) => Math.abs(v - bestY!.pos) < 0.6)) continue
      const start = Math.min(other.x, shifted.x)
      const end = Math.max(other.x + other.w, shifted.x + shifted.w)
      horizontal.push({ orientation: 'h', pos: bestY.pos, start, end })
    }
  }
  return { dx, dy, guides: [...vertical, ...horizontal] }
}

/** 网格吸附。 */
export const snapToGrid = (value: number, grid: number): number => Math.round(value / grid) * grid

/* ---------------- 多选对齐与分布 ---------------- */

export type AlignKind = 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom'
export type DistributeKind = 'horizontal' | 'vertical'

export const alignTargets = (boxes: Bounds[], anchor: Bounds, kind: AlignKind): Bounds[] =>
  boxes.map((b) => {
    switch (kind) {
      case 'left':
        return { ...b, x: anchor.x }
      case 'hcenter':
        return { ...b, x: anchor.x + anchor.w / 2 - b.w / 2 }
      case 'right':
        return { ...b, x: anchor.x + anchor.w - b.w }
      case 'top':
        return { ...b, y: anchor.y }
      case 'vcenter':
        return { ...b, y: anchor.y + anchor.h / 2 - b.h / 2 }
      case 'bottom':
        return { ...b, y: anchor.y + anchor.h - b.h }
      default:
        return b
    }
  })

export const distributeTargets = (boxes: Bounds[], kind: DistributeKind): Bounds[] => {
  if (boxes.length < 3) return boxes
  const sorted = [...boxes].sort((a, b) => (kind === 'horizontal' ? a.x - b.x : a.y - b.y))
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const total = kind === 'horizontal' ? last.x + last.w - first.x : last.y + last.h - first.y
  const used = sorted.reduce((sum, b) => sum + (kind === 'horizontal' ? b.w : b.h), 0)
  const gap = (total - used) / (sorted.length - 1)
  let cursor = kind === 'horizontal' ? first.x : first.y
  const map = new Map<Bounds, number>()
  for (const b of sorted) {
    map.set(b, cursor)
    cursor += (kind === 'horizontal' ? b.w : b.h) + gap
  }
  return boxes.map((b) => {
    const pos = map.get(b)
    if (pos === undefined) return b
    return kind === 'horizontal' ? { ...b, x: pos } : { ...b, y: pos }
  })
}
