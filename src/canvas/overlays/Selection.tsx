/** 选中框覆盖层：单元素选框、多选外框与缩放手柄。 */

import { rawBox, rotationTransform, selectionBounds } from '@/geometry/box'
import type { BoardElement, Tool } from '@/model/types'

export const Selection = ({
  selected,
  tool,
  presenting,
}: {
  selected: BoardElement[]
  tool: Tool
  presenting: boolean
}) => {
  if (presenting || !selected.length) return null
  const outer = selectionBounds(selected)
  const singleEl = selected.length === 1 ? selected[0] : undefined
  return (
    <g data-ui="1">
      {selected.map((el) => {
        const b = rawBox(el)
        const transform = rotationTransform(el)
        return (
          <g key={`sel-${el.id}`} transform={transform}>
            <rect
              x={b.x - 4}
              y={b.y - 4}
              width={b.w + 8}
              height={b.h + 8}
              fill="none"
              stroke="#7357E8"
              strokeWidth={1.5}
              strokeOpacity={0.85}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        )
      })}
      {selected.length > 1 && outer && (
        <rect
          x={outer.x - 8}
          y={outer.y - 8}
          width={outer.w + 16}
          height={outer.h + 16}
          fill="none"
          stroke="#7357E8"
          strokeWidth={1}
          strokeDasharray="4 4"
          vectorEffect="non-scaling-stroke"
        />
      )}
      {singleEl && tool === 'select' && singleEl.kind !== 'connector' && (
        <g transform={rotationTransform(singleEl)}>
          <rect
            x={singleEl.x + singleEl.w - 5}
            y={singleEl.y + singleEl.h - 5}
            width={10}
            height={10}
            rx={2}
            fill="#FFFFFF"
            stroke="#7357E8"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
            style={{ cursor: 'nwse-resize' }}
          />
        </g>
      )}
    </g>
  )
}
