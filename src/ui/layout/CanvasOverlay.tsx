/** 画布浮层组合：工具栏、小地图、缩放条与演示提示，统一挂在画布之上。 */

import type { UiState } from '@/domain/ui'
import type { AppSettings, BoardElement, Tool, View } from '@/model/types'
import { ToolRail } from './ToolRail'
import { Minimap } from './Minimap'
import { ZoomBar } from './ZoomBar'
import { PresentHint } from '../panels/PresentHint'

export interface CanvasOverlayProps {
  doc: { board: { name: string }; elements: BoardElement[]; view: View; settings: AppSettings }
  ui: Pick<UiState, 'presenting' | 'tool' | 'presentStep' | 'canvasSize'>
  derived: { total: number }
  actions: {
    board: { updateSettings: (patch: Partial<AppSettings>) => void; cycleBackground: () => void }
    ui: { setTool: (value: Tool) => void }
    viewport: {
      jumpTo: (point: { x: number; y: number }) => void
      zoomCenter: (factor: number) => void
      fitToContent: () => void
      setView: (value: View | ((prev: View) => View)) => void
    }
  }
}

export const CanvasOverlay = ({ doc, ui, derived, actions }: CanvasOverlayProps) => {
  if (ui.presenting) return <PresentHint name={doc.board.name} step={ui.presentStep} total={derived.total} />
  return (
    <>
      <ToolRail tool={ui.tool} onTool={(tool) => actions.ui.setTool(tool as Tool)} />
      <Minimap elements={doc.elements} viewport={doc.view} canvas={ui.canvasSize} onJump={actions.viewport.jumpTo} />
      <ZoomBar
        zoom={doc.view.zoom}
        background={doc.settings.background}
        snap={doc.settings.snap}
        onZoomIn={() => actions.viewport.zoomCenter(1.2)}
        onZoomOut={() => actions.viewport.zoomCenter(1 / 1.2)}
        onFit={actions.viewport.fitToContent}
        onReset={() => actions.viewport.setView((v) => ({ ...v, zoom: 1 }))}
        onCycleBackground={actions.board.cycleBackground}
        onToggleSnap={() => actions.board.updateSettings({ snap: !doc.settings.snap })}
      />
    </>
  )
}
