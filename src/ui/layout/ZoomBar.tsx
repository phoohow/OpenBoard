/** 底部缩放条：缩放比例、适配画布、背景样式与网格吸附。 */

import { Grid2x2, Grid3x3, LayoutGrid, Magnet, Maximize2, Rows3, ZoomIn, ZoomOut } from 'lucide-react'
import type { BackgroundMode } from '@/model/types'

const BACKGROUND_LABEL: Record<BackgroundMode, string> = {
  dots: '点阵画布',
  grid: '网格画布',
  lines: '横线画布',
  plain: '空白画布',
}

export const ZoomBar = (props: {
  zoom: number
  background: BackgroundMode
  snap: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
  onReset: () => void
  onCycleBackground: () => void
  onToggleSnap: () => void
}) => (
  <div className="zoom-bar">
    <button type="button" className="icon-btn" title="缩小" onClick={props.onZoomOut}>
      <ZoomOut size={16} />
    </button>
    <button type="button" className="zoom-value" title="恢复 100%" onClick={props.onReset}>
      {Math.round(props.zoom * 100)}%
    </button>
    <button type="button" className="icon-btn" title="放大" onClick={props.onZoomIn}>
      <ZoomIn size={16} />
    </button>
    <span className="divider" />
    <button type="button" className="icon-btn" title="适配内容 (Shift + 1)" onClick={props.onFit}>
      <Maximize2 size={16} />
    </button>
    <span className="divider" />
    <button
      type="button"
      className={props.snap ? 'icon-btn active' : 'icon-btn'}
      title={props.snap ? '对齐吸附：已开启' : '对齐吸附：已关闭'}
      onClick={props.onToggleSnap}
    >
      <Magnet size={16} />
    </button>
    <button
      type="button"
      className="icon-btn wide"
      title={`${BACKGROUND_LABEL[props.background]}（点击切换）`}
      onClick={props.onCycleBackground}
    >
      {props.background === 'dots' ? <Grid2x2 size={16} /> : props.background === 'grid' ? <Grid3x3 size={16} /> : props.background === 'lines' ? <Rows3 size={16} /> : <LayoutGrid size={16} />}
      <span>{BACKGROUND_LABEL[props.background]}</span>
    </button>
  </div>
)
