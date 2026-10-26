/** 缩略图：用简化渲染器画出模板 / 白板预览。 */

import { isElliptical, shapeInnerLines, shapePath, shapePolygon } from '@/geometry/shapes'
import { DEFAULT_FILL } from '@/model/constants'
import type { BoardElement } from '@/model/types'

const MiniElement = ({ el }: { el: BoardElement }) => {
  const opacity = el.opacity ?? 1
  switch (el.kind) {
    case 'shape': {
      const stroke = el.stroke === 'transparent' ? 'none' : el.stroke
      const sw = el.strokeWidth ?? 2
      const inner = shapeInnerLines(el)
      const path = shapePath(el)
      const poly = shapePolygon(el)
      const isEllipse = isElliptical(el.shape ?? 'round')
      return (
        <g opacity={opacity}>
          {isEllipse ? (
            <ellipse cx={el.x + el.w / 2} cy={el.y + el.h / 2} rx={el.w / 2} ry={el.h / 2} fill={el.fill} stroke={stroke} strokeWidth={sw} />
          ) : path ? (
            <path d={path} fill={el.fill} stroke={stroke} strokeWidth={sw} />
          ) : poly ? (
            <polygon points={poly} fill={el.fill} stroke={stroke} strokeWidth={sw} />
          ) : (
            <rect x={el.x} y={el.y} width={el.w} height={el.h} rx={el.shape === 'round' ? 16 : 0} fill={el.fill} stroke={stroke} strokeWidth={sw} />
          )}
          {inner.length > 0 && (
            <g stroke={stroke} strokeWidth={sw}>
              {inner.map((l, i) => (
                <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
              ))}
            </g>
          )}
          {el.text ? (
            <text x={el.x + el.w / 2} y={el.y + el.h / 2} fontSize={Math.min(el.fontSize ?? 14, 16)} fill={el.textColor} textAnchor="middle" dominantBaseline="middle">
              {(el.text || '').slice(0, 8)}
            </text>
          ) : null}
        </g>
      )
    }
    case 'sticky':
      return (
        <g opacity={opacity}>
          <rect x={el.x} y={el.y} width={el.w} height={el.h} rx={6} fill={el.fill} />
          {el.text ? <text x={el.x + 8} y={el.y + 20} fontSize={13} fill={el.textColor}>{(el.text || '').slice(0, 10)}</text> : null}
        </g>
      )
    case 'text':
      return (
        <text opacity={opacity} x={el.x} y={el.y + Math.min(el.fontSize ?? 16, 18)} fontSize={Math.min(el.fontSize ?? 16, 18)} fill={el.textColor} fontWeight={el.bold ? 700 : 400}>
          {(el.text || '').slice(0, 16)}
        </text>
      )
    case 'frame':
      return (
        <g opacity={opacity}>
          <rect x={el.x} y={el.y} width={el.w} height={el.h} rx={10} fill={el.fill === 'transparent' ? '#F7F5FC' : el.fill} stroke={el.stroke} strokeWidth={el.strokeWidth ?? 2} strokeDasharray="8 6" />
          {el.text ? <text x={el.x + 8} y={el.y - 4} fontSize={13} fill="#6C6480">{(el.text || '').slice(0, 14)}</text> : null}
        </g>
      )
    default:
      return <rect opacity={opacity} x={el.x} y={el.y} width={el.w} height={el.h} rx={6} fill={(el as { fill?: string }).fill ?? DEFAULT_FILL} stroke="#CFC9E4" strokeWidth={1} />
  }
}

export const MiniBoard = ({ elements }: { elements: BoardElement[] }) => {
  if (!elements.length) return <span className="template-empty">空画布</span>
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const e of elements) {
    minX = Math.min(minX, e.x)
    minY = Math.min(minY, e.y)
    maxX = Math.max(maxX, e.x + e.w)
    maxY = Math.max(maxY, e.y + e.h)
  }
  const bw = Math.max(1, maxX - minX)
  const bh = Math.max(1, maxY - minY)
  const VW = 240
  const VH = 140
  const PAD = 14
  const scale = Math.min((VW - 2 * PAD) / bw, (VH - 2 * PAD) / bh, 1.2)
  const ox = PAD + (VW - 2 * PAD - bw * scale) / 2
  const oy = PAD + (VH - 2 * PAD - bh * scale) / 2
  return (
    <svg className="template-thumb" viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
      <g transform={`translate(${ox} ${oy}) scale(${scale})`}>
        {elements.map((e) => (
          <MiniElement key={e.id} el={e} />
        ))}
      </g>
    </svg>
  )
}
