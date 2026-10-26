/** 评论批注与投票结果的画布标记。 */

import { elementBounds } from '@/geometry/box'
import type { BoardComment, BoardElement } from '@/model/types'
import { FONT } from '@/model/constants'

export const Badges = ({
  comments,
  elements,
  voteMode,
  presenting,
}: {
  comments: BoardComment[]
  elements: BoardElement[]
  voteMode: boolean
  presenting: boolean
}) => {
  if (presenting) return null
  const open = comments.filter((c) => !c.resolved)
  const pins: { key: string; x: number; y: number; label: string; tone: string; id?: string }[] = []
  open.forEach((c) => {
    const target = c.elementId ? elements.find((el) => el.id === c.elementId) : undefined
    if (c.elementId && !target) return
    const b = target ? elementBounds(target) : { x: c.x ?? 0, y: c.y ?? 0, w: 0, h: 0 }
    pins.push({
      key: `c-${c.id}`,
      x: target ? b.x + b.w - 6 : b.x,
      y: target ? b.y + 6 : b.y,
      label: c.text.slice(0, 1) || '💬',
      tone: '#FF8A3D',
      id: c.elementId,
    })
  })
  if (voteMode) {
    elements
      .filter((el) => (el.votes ?? 0) > 0)
      .forEach((el) => {
        const b = elementBounds(el)
        pins.push({ key: `v-${el.id}`, x: b.x + b.w - 6, y: b.y + 6, label: `${el.votes}`, tone: '#7357E8', id: el.id })
      })
  }
  if (!pins.length) return null
  return (
    <g data-ui="1" pointerEvents="none">
      {pins.map((pin) => (
        <g key={pin.key}>
          <circle cx={pin.x} cy={pin.y} r={11} fill={pin.tone} stroke="#fff" strokeWidth={2} />
          <text x={pin.x} y={pin.y + 4} textAnchor="middle" fontFamily={FONT} fontSize={11} fill="#fff">
            {pin.label}
          </text>
        </g>
      ))}
    </g>
  )
}
