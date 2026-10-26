/** 画布舞台：SVG 骨架、图层顺序与浮动控件挂载点。 */

import { Fragment, memo, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import type { Guide } from '@/geometry/arrange'
import type { BackgroundMode, BoardComment, BoardElement, Tool, View } from '@/model/types'
import { Badges } from './overlays/Badge'
import { Draft, type DraftShape } from './overlays/Draft'
import { Guides } from './overlays/Guides'
import { MindLinkLines } from './overlays/MindLinks'
import { Selection } from './overlays/Selection'
import { orderedElements, renderElement } from './renderers/render'

/** 画布渲染所需的文档切片。 */
export interface CanvasScene {
  view: View
  grid: number
  background: BackgroundMode
  cursor: string
  elements: BoardElement[]
  selected: BoardElement[]
  editingId: string | null
  guides: Guide[]
  draft: DraftShape | null
  comments: BoardComment[]
}

/** 画布的瞬时界面态。 */
export interface CanvasUi {
  presenting: boolean
  laserOn: boolean
  laserPoint: { x: number; y: number } | null
  reactions: { id: number; emoji: string; x: number; y: number }[]
  voteMode: boolean
  tool: Tool
}

export interface CanvasStageProps {
  scene: CanvasScene
  ui: CanvasUi
  refs: {
    wrap: { current: HTMLDivElement | null }
    svg: { current: SVGSVGElement | null }
    content: { current: SVGGElement | null }
    defs: { current: SVGDefsElement | null }
  }
  handlers: {
    onPointerDown: (e: ReactPointerEvent<SVGSVGElement>) => void
    onPointerMove: (e: ReactPointerEvent<SVGSVGElement>) => void
    onPointerUp: (e: ReactPointerEvent<SVGSVGElement>) => void
    onDoubleClick: (e: ReactMouseEvent<SVGSVGElement>) => void
    onLaserMove: (point: { x: number; y: number } | null) => void
  }
  editor?: ReactNode
  children?: ReactNode
}

const CanvasStageView = ({ scene, ui, refs, handlers, editor, children }: CanvasStageProps) => {
  const { view } = scene
  const ordered = orderedElements(scene.elements)
  return (
    <div
      className={`canvas-wrap bg-${scene.background}${ui.presenting && ui.laserOn ? ' laser' : ''}`}
      ref={refs.wrap}
      onPointerMove={(e) => {
        if (!ui.presenting || !ui.laserOn) return
        const rect = e.currentTarget.getBoundingClientRect()
        handlers.onLaserMove({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      }}
      onPointerLeave={() => handlers.onLaserMove(null)}
      style={
        scene.background === 'plain'
          ? undefined
          : {
              backgroundSize: `${scene.grid * view.zoom}px ${scene.grid * view.zoom}px`,
              backgroundPosition: `${view.x}px ${view.y}px`,
            }
      }
    >
      <svg
        ref={refs.svg}
        className="canvas"
        width="100%"
        height="100%"
        style={{ cursor: scene.cursor }}
        onPointerDown={handlers.onPointerDown}
        onPointerMove={handlers.onPointerMove}
        onPointerUp={handlers.onPointerUp}
        onPointerCancel={handlers.onPointerUp}
        onDoubleClick={handlers.onDoubleClick}
      >
        <defs ref={refs.defs}>
          <filter id="ob-sticky-shadow" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#2B2733" floodOpacity="0.18" />
          </filter>
        </defs>
        <g ref={refs.content} transform={`translate(${view.x} ${view.y}) scale(${view.zoom})`}>
          <MindLinkLines elements={scene.elements} />
          {ordered.map((el) => (
            <Fragment key={el.id}>{renderElement(el, { elements: scene.elements, editingId: scene.editingId })}</Fragment>
          ))}
          <Guides guides={scene.guides} />
          <Draft draft={scene.draft} elements={scene.elements} presenting={ui.presenting} />
          <Badges comments={scene.comments} elements={scene.elements} voteMode={ui.voteMode} presenting={ui.presenting} />
          <Selection selected={scene.selected} tool={ui.tool} presenting={ui.presenting} />
        </g>
      </svg>

      {ui.presenting && ui.laserOn && ui.laserPoint && (
        <div className="laser-dot" style={{ left: ui.laserPoint.x, top: ui.laserPoint.y }} />
      )}
      {ui.reactions.map((r) => (
        <span key={r.id} className="reaction" style={{ left: `${r.x}%`, top: `${r.y}%` }}>
          {r.emoji}
        </span>
      ))}

      {editor}
      {children}
    </div>
  )
}

/** 画布是重渲染热点，props 身份稳定（scene/refs/handlers 均已 memo）时不重绘。 */
export const CanvasStage = memo(CanvasStageView)
