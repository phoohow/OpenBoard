/** 拖拽草稿覆盖层：框选矩形与连线预览。 */

import { edgeAnchor } from '@/geometry/connector'
import type { Bounds, Point } from '@/geometry/primitives'
import type { BoardElement } from '@/model/types'

export interface DraftShape {
  marquee?: Bounds
  connect?: { fromId: string; to: Point }
}

export const Draft = ({
  draft,
  elements,
  presenting,
}: {
  draft: DraftShape | null
  elements: BoardElement[]
  presenting: boolean
}) => {
  if (presenting) return null
  if (draft?.marquee) {
    return (
      <rect
        data-ui="1"
        x={draft.marquee.x}
        y={draft.marquee.y}
        width={draft.marquee.w}
        height={draft.marquee.h}
        fill="#7357E8"
        fillOpacity={0.08}
        stroke="#7357E8"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
    )
  }
  if (draft?.connect) {
    const from = elements.find((el) => el.id === draft.connect?.fromId)
    if (!from) return null
    const anchor = edgeAnchor(from, draft.connect.to)
    return (
      <g data-ui="1">
        <line
          x1={anchor.x}
          y1={anchor.y}
          x2={draft.connect.to.x}
          y2={draft.connect.to.y}
          stroke="#7357E8"
          strokeWidth={2}
          strokeDasharray="6 4"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={draft.connect.to.x} cy={draft.connect.to.y} r={4} fill="#7357E8" />
      </g>
    )
  }
  return null
}
