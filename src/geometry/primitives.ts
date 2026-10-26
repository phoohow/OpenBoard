/** 几何基础：坐标、包围盒与路径工具，供其余几何模块共享。 */

export interface Point {
  x: number
  y: number
}

export interface Bounds {
  x: number
  y: number
  w: number
  h: number
}

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

/** 统一保留两位小数，避免 SVG 输出冗余精度。 */
export const round = (n: number) => Math.round(n * 100) / 100

export const rotatePoint = (p: Point, c: Point, deg: number): Point => {
  if (!deg) return p
  const rad = (deg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const dx = p.x - c.x
  const dy = p.y - c.y
  return { x: c.x + dx * cos - dy * sin, y: c.y + dx * sin + dy * cos }
}

export const unionBounds = (a: Bounds, b: Bounds): Bounds => {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y }
}

export const intersects = (a: Bounds, b: Bounds): boolean =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

export const pointsToPath = (points: number[]): string => {
  if (points.length < 4) return ''
  let d = `M ${round(points[0])} ${round(points[1])}`
  for (let i = 2; i + 1 < points.length; i += 2) d += ` L ${round(points[i])} ${round(points[i + 1])}`
  return d
}

/** 把 path 描述解析成折线点列，用于连接线命中测试。 */
export const polylineOf = (d: string): Point[] => {
  const points: Point[] = []
  for (const token of d.split(/(?=[MLCQ])/)) {
    const nums = token
      .slice(1)
      .split(/[\s,]+/)
      .map(Number)
      .filter((n) => Number.isFinite(n))
    if (token.startsWith('M') || token.startsWith('L')) {
      for (let i = 0; i + 1 < nums.length; i += 2) points.push({ x: nums[i], y: nums[i + 1] })
    }
    if (token.startsWith('C') && nums.length >= 6) {
      for (let i = 0; i + 1 < nums.length; i += 2) points.push({ x: nums[i], y: nums[i + 1] })
    }
  }
  return points
}
