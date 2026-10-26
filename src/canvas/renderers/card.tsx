/** 卡片元素渲染：状态胶囊、标题、描述与负责人信息。 */

import { clipText, estimateWidth, wrapText } from '@/geometry/text'
import { cardStatusColor } from '@/model/elementMeta'
import type { BoardElement } from '@/model/types'
import { FONT } from '@/model/constants'

export const CardShape = ({ el }: { el: BoardElement }) => {
  const pad = 16
  const maxWidth = Math.max(12, el.w - pad * 2)
  const status = el.status?.trim() ?? ''
  const chip = status ? cardStatusColor(status) : null
  const chipW = chip ? estimateWidth(status, 11) + 18 : 0
  const titleSize = Math.max(13, el.fontSize)
  const titleHeight = titleSize * 1.35
  const titleTop = el.y + pad + (chip ? 30 : 0)
  const titleLines = wrapText(el.text ?? '', maxWidth, titleSize)
  const descSize = 12
  const descLines = (el.desc ?? '').trim() ? wrapText(el.desc ?? '', maxWidth, descSize).slice(0, 3) : []
  const descTop = titleTop + titleLines.length * titleHeight + 10
  const foot = [el.owner?.trim(), el.due?.trim()].filter(Boolean).join(' · ')
  return (
    <g opacity={el.opacity}>
      <rect
        x={el.x}
        y={el.y}
        width={el.w}
        height={el.h}
        rx={14}
        ry={14}
        fill={el.fill}
        stroke={el.stroke}
        strokeWidth={el.strokeWidth}
      />
      {!!el.done && <rect x={el.x} y={el.y} width={el.w} height={el.h} rx={14} ry={14} fill="#F1FAF4" opacity={0.9} />}
      {chip && (
        <>
          <rect x={el.x + pad} y={el.y + pad} width={chipW} height={22} rx={11} fill={chip} />
          <text x={el.x + pad + chipW / 2} y={el.y + pad + 15} fontFamily={FONT} fontSize={11} fill="#FFFFFF" textAnchor="middle">
            {status}
          </text>
        </>
      )}
      {!!el.done && (
        <g>
          <circle cx={el.x + el.w - pad - 10} cy={el.y + pad + 11} r={10} fill="#17A673" />
          <path
            d={`M ${el.x + el.w - pad - 16} ${el.y + pad + 11} l 4 4 l 8 -8`}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
      {titleLines.map((line, i) => (
        <text
          key={`card-title-${i}`}
          x={el.x + pad}
          y={titleTop + i * titleHeight + titleSize}
          fontFamily={FONT}
          fontSize={titleSize}
          fontWeight={700}
          fill={el.done ? '#8C8699' : el.textColor}
          textDecoration={el.done ? 'line-through' : undefined}
        >
          {line}
        </text>
      ))}
      {descLines.map((line, i) => (
        <text
          key={`card-desc-${i}`}
          x={el.x + pad}
          y={descTop + i * (descSize * 1.45) + descSize}
          fontFamily={FONT}
          fontSize={descSize}
          fill="#6F6A7C"
        >
          {line}
        </text>
      ))}
      {!!foot && (
        <text x={el.x + pad} y={el.y + el.h - pad} fontFamily={FONT} fontSize={11} fill="#948E9E">
          {clipText(foot, 11, maxWidth)}
        </text>
      )}
    </g>
  )
}
