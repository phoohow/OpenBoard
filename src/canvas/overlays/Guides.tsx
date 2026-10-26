/** 对齐参考线覆盖层。 */

import type { Guide } from '@/geometry/arrange'

export const Guides = ({ guides }: { guides: Guide[] }) => {
  if (!guides.length) return null
  return (
    <g data-ui="1">
      {guides.map((g, i) => (
        <line
          key={`guide-${i}`}
          x1={g.orientation === 'v' ? g.pos : g.start}
          y1={g.orientation === 'v' ? g.start : g.pos}
          x2={g.orientation === 'v' ? g.pos : g.end}
          y2={g.orientation === 'v' ? g.end : g.pos}
          stroke="#FF4D8D"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </g>
  )
}
