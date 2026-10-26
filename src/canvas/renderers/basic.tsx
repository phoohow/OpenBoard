/** 基础元素渲染：便签、文本、图形、容器、图片、画笔与连接线。 */

import type { ReactNode } from 'react'
import { arrowHead, connectorGeometry } from '@/geometry/connector'
import { estimateWidth, layoutText } from '@/geometry/text'
import { isElliptical, shapeInnerLines, shapePath, shapePolygon } from '@/geometry/shapes'
import { pointsToPath } from '@/geometry/primitives'
import { rotationTransform } from '@/geometry/box'
import type { BoardElement } from '@/model/types'
import { FONT } from '@/model/constants'

/** 统一包裹元素分组：旋转、层级与命中 id 都挂在这一层。 */
export const wrapNode = (el: BoardElement, inner: ReactNode): ReactNode => {
  const transform = rotationTransform(el)
  return (
    <g key={el.id} data-id={el.id} transform={transform} opacity={transform ? el.opacity : undefined}>
      {inner}
    </g>
  )
}

export const dashArray = (el: BoardElement): string | undefined =>
  el.dash ? `${Math.max(5, el.strokeWidth * 3)} ${Math.max(4, el.strokeWidth * 2)}` : undefined

/** 元素正文：按文本布局输出多行 tspan。 */
export const TextNode = ({ el, editingId }: { el: BoardElement; editingId?: string | null }) => {
  if (!el.text?.trim()) return null
  const layout = layoutText(el)
  return (
    <text
      fontFamily={FONT}
      fontSize={el.fontSize}
      fontWeight={el.bold ? 700 : 400}
      fill={el.textColor}
      textAnchor={layout.anchor}
      className={editingId === el.id ? 'editing-text' : undefined}
    >
      {layout.lines.map((line, i) => (
        <tspan key={`${el.id}-${i}`} x={layout.x} y={Math.round((layout.firstY + i * layout.lineHeight) * 100) / 100}>
          {line}
        </tspan>
      ))}
    </text>
  )
}

export const StickyElement = ({ el, editingId }: { el: BoardElement; editingId?: string | null }) =>
  wrapNode(
    el,
    <>
      <rect
        x={el.x}
        y={el.y}
        width={el.w}
        height={el.h}
        rx={12}
        ry={12}
        fill={el.fill}
        stroke="#00000012"
        strokeWidth={1}
        filter="url(#ob-sticky-shadow)"
        opacity={el.opacity}
      />
      <g opacity={el.opacity}>
        <TextNode el={el} editingId={editingId} />
      </g>
    </>,
  )

export const ShapeElement = ({ el, editingId }: { el: BoardElement; editingId?: string | null }) => {
  const stroke = el.stroke === 'transparent' ? 'none' : el.stroke
  const dash = dashArray(el)
  const common = {
    fill: el.fill,
    stroke,
    strokeWidth: el.strokeWidth,
    strokeDasharray: dash,
    opacity: el.opacity,
  }
  const polygon = shapePolygon(el)
  const path = shapePath(el)
  const innerLines = shapeInnerLines(el)
  let shape: ReactNode
  if (isElliptical(el.shape ?? 'round')) {
    shape = <ellipse cx={el.x + el.w / 2} cy={el.y + el.h / 2} rx={el.w / 2} ry={el.h / 2} {...common} />
  } else if (path) {
    shape = <path d={path} {...common} />
  } else if (polygon) {
    shape = <polygon points={polygon} {...common} />
  } else {
    shape = (
      <rect
        x={el.x}
        y={el.y}
        width={el.w}
        height={el.h}
        rx={el.shape === 'round' ? 16 : 0}
        ry={el.shape === 'round' ? 16 : 0}
        {...common}
      />
    )
  }
  return wrapNode(
    el,
    <>
      {shape}
      {innerLines.length > 0 && (
        <g opacity={el.opacity} stroke={stroke} strokeWidth={el.strokeWidth} strokeDasharray={dash}>
          {innerLines.map((line, i) => (
            <line key={`inner-${i}`} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
          ))}
        </g>
      )}
      <g opacity={el.opacity}>
        <TextNode el={el} editingId={editingId} />
      </g>
    </>,
  )
}

export const TextElement = ({ el, editingId }: { el: BoardElement; editingId?: string | null }) =>
  wrapNode(
    el,
    <g opacity={el.opacity}>
      {el.fill && el.fill !== 'transparent' && <rect x={el.x} y={el.y} width={el.w} height={el.h} fill={el.fill} stroke="none" />}
      <TextNode el={el} editingId={editingId} />
    </g>,
  )

export const DrawElement = ({ el }: { el: BoardElement }) =>
  wrapNode(
    el,
    <path
      transform={`translate(${el.x} ${el.y})`}
      d={pointsToPath(el.points ?? [])}
      fill="none"
      stroke={el.stroke}
      strokeWidth={el.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dashArray(el)}
      opacity={el.opacity}
    />,
  )

export const FrameElement = ({ el }: { el: BoardElement }) =>
  wrapNode(
    el,
    <g opacity={el.opacity}>
      <rect
        x={el.x}
        y={el.y}
        width={el.w}
        height={el.h}
        rx={12}
        ry={12}
        fill={el.fill === 'transparent' ? '#F7F5FC' : el.fill}
        stroke={el.stroke}
        strokeWidth={el.strokeWidth}
        strokeDasharray="8 6"
      />
      <text x={el.x} y={el.y - 10} fontFamily={FONT} fontSize={15} fontWeight={600} fill="#6C6480">
        {el.text || '未命名容器'}
      </text>
    </g>,
  )

export const ImageElement = ({ el }: { el: BoardElement }) =>
  wrapNode(
    el,
    el.src ? (
      <image href={el.src} x={el.x} y={el.y} width={el.w} height={el.h} preserveAspectRatio="none" opacity={el.opacity} />
    ) : (
      <rect
        x={el.x}
        y={el.y}
        width={el.w}
        height={el.h}
        fill="#F4F2F8"
        stroke="#D8D3E2"
        strokeWidth={1}
        strokeDasharray="6 4"
        opacity={el.opacity}
      />
    ),
  )

export const ConnectorElement = ({ el, elements }: { el: BoardElement; elements: BoardElement[] }) => {
  const geo = connectorGeometry(el, elements)
  if (!geo) return null
  const size = Math.max(9, el.strokeWidth * 3.4)
  const label = el.text?.trim()
  const labelWidth = label ? estimateWidth(label, el.fontSize) + 20 : 0
  const labelHeight = label ? el.fontSize + 12 : 0
  return wrapNode(
    el,
    <g opacity={el.opacity}>
      <path
        d={geo.d}
        fill="none"
        stroke={el.stroke}
        strokeWidth={el.strokeWidth}
        strokeLinecap="round"
        strokeDasharray={dashArray(el)}
      />
      {el.arrowStart && <polygon points={arrowHead(geo.start, geo.startDir, size)} fill={el.stroke} />}
      {el.arrowEnd !== false && <polygon points={arrowHead(geo.end, geo.endDir, size)} fill={el.stroke} />}
      {label && (
        <>
          <rect
            x={geo.label.x - labelWidth / 2}
            y={geo.label.y - labelHeight / 2}
            width={labelWidth}
            height={labelHeight}
            rx={6}
            fill="#FFFFFF"
            fillOpacity={0.94}
            stroke={el.stroke}
            strokeWidth={1}
          />
          <text
            x={geo.label.x}
            y={geo.label.y + el.fontSize * 0.36}
            fontFamily={FONT}
            fontSize={el.fontSize}
            fill={el.stroke}
            textAnchor="middle"
          >
            {label}
          </text>
        </>
      )}
    </g>,
  )
}
