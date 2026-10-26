/** 图形轮廓：把形状类型映射为 SVG path/polygon，并提供内部横线。 */

import type { BoardElement, ShapeKind } from '@/model/types'
import { rawBox } from './box'
import { pointsToPath, round } from './primitives'

interface Box { x: number; y: number; w: number; h: number }

const roundedPath = ({ x, y, w, h }: Box, r: number) => {
  const rr = Math.min(r, w / 2, h / 2)
  return [
    `M ${round(x + rr)} ${round(y)}`,
    `L ${round(x + w - rr)} ${round(y)}`,
    `A ${round(rr)} ${round(rr)} 0 0 1 ${round(x + w - rr)} ${round(y + h)}`,
    `L ${round(x + rr)} ${round(y + h)}`,
    `A ${round(rr)} ${round(rr)} 0 0 1 ${round(x + rr)} ${round(y)}`,
    'Z',
  ].join(' ')
}

/** 归一化折线：[x,y] 均在 0~1，渲染时按比例映射到元素盒子。 */
const POLYGONS: Partial<Record<ShapeKind, number[]>> = {
  diamond: [0.5, 0, 1, 0.5, 0.5, 1, 0, 0.5],
  decision: [0.5, 0, 1, 0.5, 0.5, 1, 0, 0.5],
  gateway: [0.5, 0, 1, 0.5, 0.5, 1, 0, 0.5],
  erRelationship: [0.5, 0, 1, 0.5, 0.5, 1, 0, 0.5],
  triangle: [0.5, 0, 1, 1, 0, 1],
  pentagon: [0.5, 0, 1, 0.38, 0.82, 1, 0.18, 1, 0, 0.38],
  offpage: [0, 0, 1, 0, 1, 0.62, 0.5, 1, 0, 0.62],
  hexagon: [0.25, 0, 0.75, 0, 1, 0.5, 0.75, 1, 0.25, 1, 0, 0.5],
  prepare: [0.25, 0, 0.75, 0, 1, 0.5, 0.75, 1, 0.25, 1, 0, 0.5],
  octagon: [0.29, 0, 0.71, 0, 1, 0.29, 1, 0.71, 0.71, 1, 0.29, 1, 0, 0.71, 0, 0.29],
  trapezoid: [0.18, 0, 0.82, 0, 1, 1, 0, 1],
  manualInput: [0, 0, 1, 0, 0.86, 1, 0.14, 1],
  parallelogram: [0.22, 0, 1, 0, 0.78, 1, 0, 1],
  dataIO: [0.22, 0, 1, 0, 0.78, 1, 0, 1],
  display: [0, 0, 1, 0, 0.86, 1, 0.14, 1],
  chevron: [0, 0, 0.66, 0, 1, 0.5, 0.66, 1, 0, 1, 0.33, 0.5],
  arrowDown: [0, 0, 1, 0, 1, 0.55, 0.68, 0.55, 0.68, 1, 0.32, 1, 0.32, 0.55, 0, 0.55],
  cross: [0.36, 0, 0.64, 0, 0.64, 0.36, 1, 0.36, 1, 0.64, 0.64, 0.64, 0.64, 1, 0.36, 1, 0.36, 0.64, 0, 0.64, 0, 0.36],
  banner: [0, 0, 0.88, 0, 1, 0.5, 0.88, 1, 0, 1, 0.12, 0.5],
  tag: [0, 0, 0.78, 0, 1, 0.5, 0.78, 1, 0, 1],
  speech: [0, 0, 1, 0, 1, 0.68, 0.62, 0.68, 0.5, 1, 0.38, 0.68, 0, 0.68],
  documentBox: [0, 0, 1, 0, 1, 0.86, 0.82, 1, 0.62, 0.88, 0.42, 1, 0.22, 0.88, 0, 0.98],
  umlNote: [0, 0, 0.82, 0, 1, 0.22, 1, 1, 0, 1],
  umlPackage: [0, 0.22, 0.34, 0.22, 0.34, 0, 0.66, 0, 0.66, 0.22, 1, 0.22, 1, 1, 0, 1],
  component: [0, 0.16, 0.22, 0.16, 0.22, 0, 0.58, 0, 0.58, 0.16, 1, 0.16, 1, 0.5, 0.9, 0.5, 0.9, 0.66, 0.66, 0.66, 0.66, 0.5, 0, 0.5],
  subprocess: [0, 0, 1, 0, 1, 1, 0, 1],
  activity: [0, 0, 1, 0, 1, 1, 0, 1],
  message: [0, 0, 1, 0, 1, 1, 0, 1],
  annotation: [0, 0, 0.16, 0, 0.16, 1, 0, 1],
  server: [0, 0.12, 0.16, 0.12, 0.16, 0, 0.84, 0, 0.84, 0.12, 1, 0.12, 1, 0.88, 0.84, 0.88, 0.84, 1, 0.16, 1, 0.16, 0.88, 0, 0.88],
  switchNode: [0, 0.18, 0.2, 0.18, 0.2, 0, 0.8, 0, 0.8, 0.18, 1, 0.18, 1, 0.82, 0.8, 0.82, 0.8, 1, 0.2, 1, 0.2, 0.82, 0, 0.82],
  router: [0.18, 0, 0.82, 0, 1, 0.3, 0.88, 1, 0.12, 1, 0, 0.3],
  firewall: [0, 0, 1, 0, 1, 0.62, 0.75, 1, 0.5, 0.62, 0.25, 1, 0, 0.62],
  laptop: [0.05, 0.1, 0.95, 0.1, 0.95, 0.72, 0.05, 0.72, 0.05, 0.1, 0, 0.86, 1, 0.86, 0.95, 0.72],
  classBox: [0, 0, 1, 0, 1, 1, 0, 1],
  erEntity: [0, 0, 1, 0, 1, 1, 0, 1],
  gantt: [0, 0, 1, 0, 1, 1, 0, 1],
}

const cylinderPath = ({ x, y, w, h }: Box) => {
  const ry = Math.max(6, h * 0.13)
  return [
    `M ${round(x)} ${round(y + ry)}`,
    `A ${round(w / 2)} ${round(ry)} 0 0 1 ${round(x + w)} ${round(y + ry)}`,
    `L ${round(x + w)} ${round(y + h - ry)}`,
    `A ${round(w / 2)} ${round(ry)} 0 0 1 ${round(x)} ${round(y + h - ry)}`,
    'Z',
  ].join(' ')
}

/** 需要曲线或圆角的轮廓。 */
const PATHS: Partial<Record<ShapeKind, (box: Box) => string>> = {
  heart: ({ x, y, w, h }) => {
    const t = h * 0.3
    return [
      `M ${round(x + w / 2)} ${round(y + h)}`,
      `C ${round(x - w * 0.08)} ${round(y + h - t * 1.7)}, ${round(x)} ${round(y + t * 0.9)}, ${round(x + w * 0.28)} ${round(y + t * 0.4)}`,
      `C ${round(x + w * 0.38)} ${round(y + t * 0.24)}, ${round(x + w / 2)} ${round(y + t * 0.55)}, ${round(x + w / 2)} ${round(y + t * 0.62)}`,
      `C ${round(x + w / 2)} ${round(y + t * 0.55)}, ${round(x + w * 0.62)} ${round(y + t * 0.24)}, ${round(x + w * 0.72)} ${round(y + t * 0.4)}`,
      `C ${round(x + w)} ${round(y + t * 0.9)}, ${round(x + w * 1.08)} ${round(y + h - t * 1.7)}, ${round(x + w / 2)} ${round(y + h)}`,
      'Z',
    ].join(' ')
  },
  cloud: ({ x, y, w, h }) =>
    [
      `M ${round(x + w * 0.18)} ${round(y + h * 0.82)}`,
      `C ${round(x - w * 0.02)} ${round(y + h * 0.82)}, ${round(x)} ${round(y + h * 0.5)}, ${round(x + w * 0.22)} ${round(y + h * 0.48)}`,
      `C ${round(x + w * 0.22)} ${round(y + h * 0.16)}, ${round(x + w * 0.62)} ${round(y + h * 0.06)}, ${round(x + w * 0.62)} ${round(y + h * 0.3)}`,
      `C ${round(x + w * 0.78)} ${round(y + h * 0.12)}, ${round(x + w * 1.02)} ${round(y + h * 0.34)}, ${round(x + w * 0.88)} ${round(y + h * 0.6)}`,
      `C ${round(x + w * 1.02)} ${round(y + h * 0.9)}, ${round(x + w * 0.82)} ${round(y + h * 0.9)}, ${round(x + w * 0.64)} ${round(y + h * 0.84)}`,
      'Z',
    ].join(' '),
  database: (box) => cylinderPath(box),
  dataStore: (box) => cylinderPath(box),
  delay: ({ x, y, w, h }) => {
    const r = h / 2
    return [
      `M ${round(x)} ${round(y)}`,
      `L ${round(x + w - r)} ${round(y)}`,
      `A ${round(r)} ${round(r)} 0 0 1 ${round(x + w - r)} ${round(y + h)}`,
      `L ${round(x)} ${round(y + h)}`,
      'Z',
    ].join(' ')
  },
  terminator: (box) => roundedPath(box, Math.min(box.w, box.h) / 2),
  mobile: (box) => roundedPath(box, Math.min(box.w, box.h) * 0.22),
  person: ({ x, y, w, h }) => {
    const cx = x + w / 2
    const headR = Math.min(w, h) * 0.16
    const headCy = y + h * 0.22
    const bodyTop = headCy + headR * 1.05
    const bodyBot = y + h * 0.92
    const bodyW = w * 0.3
    const head = [
      `M ${round(cx - headR)} ${round(headCy)}`,
      `A ${round(headR)} ${round(headR)} 0 1 0 ${round(cx + headR)} ${round(headCy)}`,
      `A ${round(headR)} ${round(headR)} 0 1 0 ${round(cx - headR)} ${round(headCy)}`,
      'Z',
    ].join(' ')
    const body = `${pointsToPath([cx - bodyW / 2, bodyTop, cx + bodyW / 2, bodyTop, cx + bodyW * 0.72, bodyBot, cx - bodyW * 0.72, bodyBot])} Z`
    return `${head} ${body}`
  },
  tree: ({ x, y, w, h }) => {
    const cx = x + w / 2
    const r = w * 0.3
    const cy = y + h * 0.32
    const trunkW = w * 0.14
    const trunkTop = cy + r * 0.6
    const trunkBot = y + h * 0.92
    const crown = [
      `M ${round(cx - r)} ${round(cy)}`,
      `A ${round(r)} ${round(r)} 0 1 0 ${round(cx + r)} ${round(cy)}`,
      `A ${round(r)} ${round(r)} 0 1 0 ${round(cx - r)} ${round(cy)}`,
      'Z',
    ].join(' ')
    const trunk = `${pointsToPath([cx - trunkW / 2, trunkTop, cx + trunkW / 2, trunkTop, cx + trunkW / 2, trunkBot, cx - trunkW / 2, trunkBot])} Z`
    return `${crown} ${trunk}`
  },
}

/** 类图等值含义的内部横线。 */
export const shapeInnerLines = (el: BoardElement): { x1: number; y1: number; x2: number; y2: number }[] => {
  const { x, y, w, h } = rawBox(el)
  const kind = el.shape ?? 'round'
  if (kind === 'classBox') return [1, 2].map((i) => ({ x1: x, y1: y + (h / 3) * i, x2: x + w, y2: y + (h / 3) * i }))
  if (kind === 'erEntity') return [{ x1: x, y1: y + h * 0.28, x2: x + w, y2: y + h * 0.28 }]
  if (kind === 'gantt') return [{ x1: x + w * 0.55, y1: y, x2: x + w * 0.55, y2: y + h }]
  return []
}

export const isElliptical = (kind: ShapeKind) => kind === 'circle' || kind === 'ellipse' || kind === 'erAttribute'

/** 需要走 path 渲染（含曲线与圆角）的图形。 */
export const shapePath = (el: BoardElement): string | null => {
  const build = PATHS[el.shape ?? 'round']
  return build ? build(rawBox(el)) : null
}

export const shapePolygon = (el: BoardElement): string | null => {
  const kind = el.shape ?? 'round'
  const points = POLYGONS[kind]
  if (points) {
    const { x, y, w, h } = rawBox(el)
    const out: string[] = []
    for (let i = 0; i + 1 < points.length; i += 2) out.push(`${round(x + points[i] * w)},${round(y + points[i + 1] * h)}`)
    return out.join(' ')
  }
  const { x, y, w, h } = rawBox(el)
  const cx = x + w / 2
  const cy = y + h / 2
  switch (kind) {
    case 'triangle':
      return `${cx},${y} ${x + w},${y + h} ${x},${y + h}`
    case 'star': {
      const outer = Math.min(w, h) / 2
      const inner = outer * 0.45
      const pts: string[] = []
      for (let i = 0; i < 10; i += 1) {
        const r = i % 2 === 0 ? outer : inner
        const a = (Math.PI / 5) * i - Math.PI / 2
        pts.push(`${round(cx + Math.cos(a) * r * (w / Math.min(w, h) || 1))},${round(cy + Math.sin(a) * r * (h / Math.min(w, h) || 1))}`)
      }
      return pts.join(' ')
    }
    default:
      return null
  }
}
