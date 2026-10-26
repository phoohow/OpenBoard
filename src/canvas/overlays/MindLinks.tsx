/** 导图连线覆盖层：渲染在节点下层。 */

import { mindLinks } from '@/domain/mindmap/layout'
import type { BoardElement } from '@/model/types'

export const MindLinkLines = ({ elements }: { elements: BoardElement[] }) => {
  const links = mindLinks(elements)
  if (!links.length) return null
  return (
    <g>
      {links.map((link, i) => (
        <path key={`mindlink-${i}`} d={link.d} fill="none" stroke={link.color} strokeWidth={link.width} />
      ))}
    </g>
  )
}
