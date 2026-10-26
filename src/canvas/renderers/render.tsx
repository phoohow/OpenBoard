/** 元素渲染入口：按类型分发到各渲染器，并决定绘制顺序。 */

import type { ReactNode } from 'react'
import type { BoardElement } from '@/model/types'
import {
  ConnectorElement,
  DrawElement,
  FrameElement,
  ImageElement,
  ShapeElement,
  StickyElement,
  TextElement,
} from './basic'
import { CardShape } from './card'
import { MindNodeShape } from './mindnode'
import { TableShape } from './table'

export interface RenderContext {
  elements: BoardElement[]
  editingId?: string | null
}

export const renderElement = (el: BoardElement, ctx: RenderContext): ReactNode => {
  switch (el.kind) {
    case 'mindnode':
      return <MindNodeShape el={el} elements={ctx.elements} editingId={ctx.editingId} />
    case 'table':
      return <TableShape el={el} />
    case 'card':
      return <CardShape el={el} />
    case 'sticky':
      return <StickyElement el={el} editingId={ctx.editingId} />
    case 'shape':
      return <ShapeElement el={el} editingId={ctx.editingId} />
    case 'text':
      return <TextElement el={el} editingId={ctx.editingId} />
    case 'draw':
      return <DrawElement el={el} />
    case 'frame':
      return <FrameElement el={el} />
    case 'image':
      return <ImageElement el={el} />
    case 'connector':
      return <ConnectorElement el={el} elements={ctx.elements} />
    default:
      return null
  }
}

/** 容器始终渲染在最底层，避免遮挡内部内容。 */
export const orderedElements = (elements: BoardElement[]): BoardElement[] => {
  const frames = elements.filter((el) => el.kind === 'frame' && el.visible !== false)
  if (!frames.length) return elements.filter((el) => el.visible !== false)
  return [...frames, ...elements.filter((el) => el.kind !== 'frame' && el.visible !== false)]
}
