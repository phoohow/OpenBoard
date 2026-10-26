/** 导图节点渲染：节点框、正文与折叠切换按钮。 */

import { mindNodesOf, mindRootIdOf } from '@/domain/mindmap/tree'
import type { BoardElement, MindLayout } from '@/model/types'
import { FONT } from '@/model/constants'
import { TextNode } from './basic'

export const MindNodeShape = ({
  el,
  elements,
  editingId,
}: {
  el: BoardElement
  elements: BoardElement[]
  editingId?: string | null
}) => {
  const kids = mindNodesOf(elements).filter((node) => node.parent === el.id)
  const layout: MindLayout =
    mindNodesOf(elements).find((node) => node.id === (mindRootIdOf(elements, el.id) ?? ''))?.mindLayout ?? 'right'
  const down = layout === 'topdown'
  const cx = down ? el.x + el.w / 2 : kids.some((k) => k.x > el.x) || layout !== 'left' ? el.x + el.w + 14 : el.x - 14
  const cy = down ? el.y + el.h + 14 : el.y + el.h / 2
  return (
    <g opacity={el.opacity}>
      <rect
        x={el.x}
        y={el.y}
        width={el.w}
        height={el.h}
        rx={12}
        ry={12}
        fill={el.fill}
        stroke={el.stroke}
        strokeWidth={el.strokeWidth}
      />
      <TextNode el={el} editingId={editingId} />
      {!!kids.length && (
        <g data-mind-toggle={el.id} style={{ cursor: 'pointer' }}>
          <circle cx={cx} cy={cy} r={11} fill="#FFFFFF" stroke={el.stroke} strokeWidth={1.5} />
          <line x1={cx - 5} y1={cy} x2={cx + 5} y2={cy} stroke={el.stroke} strokeWidth={1.6} strokeLinecap="round" />
          {el.collapsed && (
            <>
              <line x1={cx} y1={cy - 5} x2={cx} y2={cy + 5} stroke={el.stroke} strokeWidth={1.6} strokeLinecap="round" />
              <text x={cx} y={cy + 24} fontFamily={FONT} fontSize={11} fill="#8C8699" textAnchor="middle">
                {kids.length}
              </text>
            </>
          )}
        </g>
      )}
    </g>
  )
}
