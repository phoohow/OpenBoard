/** 表格元素渲染：网格线、表头与单元格文本。 */

import type { ReactNode } from 'react'
import { clipText } from '@/geometry/text'
import { tableMetrics } from '@/model/factories'
import type { BoardElement } from '@/model/types'
import { FONT } from '@/model/constants'

export const TableShape = ({ el }: { el: BoardElement }) => {
  const { cols, rows, cellW, cellH } = tableMetrics(el)
  const cells = el.cells ?? []
  const grid: ReactNode[] = []
  for (let r = 1; r < rows; r += 1) {
    grid.push(
      <line
        key={`hr-${r}`}
        x1={el.x}
        y1={el.y + r * cellH}
        x2={el.x + el.w}
        y2={el.y + r * cellH}
        stroke="#DAD5E6"
        strokeWidth={1}
      />,
    )
  }
  for (let c = 1; c < cols; c += 1) {
    grid.push(
      <line
        key={`vr-${c}`}
        x1={el.x + c * cellW}
        y1={el.y}
        x2={el.x + c * cellW}
        y2={el.y + el.h}
        stroke="#DAD5E6"
        strokeWidth={1}
      />,
    )
  }
  const texts: ReactNode[] = []
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const isHeader = !!el.header && r === 0
      const value = cells[r * cols + c] ?? ''
      texts.push(
        <text
          key={`tc-${r}-${c}`}
          x={el.x + c * cellW + 10}
          y={el.y + r * cellH + cellH / 2 + el.fontSize * 0.36}
          fontFamily={FONT}
          fontSize={el.fontSize}
          fontWeight={isHeader || el.bold ? 700 : 400}
          fill={isHeader ? '#3B2F63' : el.textColor}
        >
          {clipText(value, el.fontSize, cellW - 20)}
        </text>,
      )
    }
  }
  return (
    <g opacity={el.opacity}>
      <rect
        x={el.x}
        y={el.y}
        width={el.w}
        height={el.h}
        rx={10}
        ry={10}
        fill={el.fill}
        stroke={el.stroke}
        strokeWidth={el.strokeWidth}
      />
      {!!el.header && <rect x={el.x} y={el.y} width={el.w} height={cellH} rx={10} fill="#F4F1FA" />}
      {grid}
      {texts}
    </g>
  )
}
