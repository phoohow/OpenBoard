/** 右侧属性面板：选中元素的通用属性、形状库、图层与对齐分布。 */

import { memo } from 'react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpDown,
  ArrowUpToLine,
  Bold,
  ChevronLeft,
  ChevronRight,
  Copy,
  Lock,
  RotateCw,
  Rows3,
  Spline,
  Trash2,
  Unlock,
} from 'lucide-react'
import type { AlignKind, DistributeKind } from '@/geometry/arrange'
import { inkPalette, palette } from '@/model/constants'
import type { UiState } from '@/domain/ui'
import { ColorRow, NumberField } from '../common/fields'
import { LayerPanel } from '../panels/LayerPanel'
import { ShapeLibraryPanel } from '../panels/ShapeLibraryPanel'
import { ToolOptions, type ToolOptionsProps } from '../panels/ToolOptions'

export interface PropertyPanelProps {
  doc: ToolOptionsProps['doc']
  ui: UiState
  derived: ToolOptionsProps['derived']
  favorites: ToolOptionsProps['favorites']
  actions: Omit<ToolOptionsProps['actions'], 'elements'> & {
    elements: ToolOptionsProps['actions']['elements'] & {
      deleteSelection: () => void
      duplicateSelection: () => void
      reorderSelection: (direction: 'front' | 'back') => void
      toggleLock: (id?: string) => void
      toggleVisible: (ids: string[]) => void
      moveLayer: (dir: 'up' | 'down', ids: string[]) => void
      rotateSelection: (deg: number) => void
      alignSelection: (kind: AlignKind) => void
      distributeSelected: (kind: DistributeKind) => void
    }
    ui: ToolOptionsProps['actions']['ui'] & { setSelection: (ids: string[]) => void }
  }
}

const PropertyPanelView = (props: PropertyPanelProps) => {
  const { doc, ui, derived, favorites, actions } = props
  const sel = derived.selected
  const patch = actions.elements.patchSelection
  const rotate = actions.elements.rotateSelection
  const onDelete = actions.elements.deleteSelection
  const onDuplicate = actions.elements.duplicateSelection
  const onBringFront = () => actions.elements.reorderSelection('front')
  const onSendBack = () => actions.elements.reorderSelection('back')
  const onToggleLock = actions.elements.toggleLock
  const onToggleVisible = (id: string) => actions.elements.toggleVisible([id])
  const onMoveLayer = (dir: 'up' | 'down', id: string) => actions.elements.moveLayer(dir, [id])
  const onSelectLayer = (id: string) => actions.ui.setSelection([id])
  const onAlign = actions.elements.alignSelection
  const onDistribute = actions.elements.distributeSelected
  const layers = doc.elements.slice().reverse()
  const one = sel.length === 1 ? sel[0] : undefined
  const textual = sel.length
    ? sel.every((e) => e.kind === 'sticky' || e.kind === 'text' || e.kind === 'shape' || e.kind === 'mindnode')
    : false
  const shapeOnly = sel.length ? sel.every((e) => e.kind === 'shape') : false
  const fillable = sel.length ? sel.every((e) => e.kind !== 'connector' && e.kind !== 'draw' && e.kind !== 'image') : false
  const stroked = sel.length ? sel.every((e) => e.kind !== 'image') : false
  const multi = sel.length > 1
  const connectorOnly = sel.length ? sel.every((e) => e.kind === 'connector') : false
  const oneConnector = one?.kind === 'connector' ? one : undefined
  const alignItems: { kind: AlignKind; label: string }[] = [
    { kind: 'left', label: '左对齐' },
    { kind: 'hcenter', label: '水平居中' },
    { kind: 'right', label: '右对齐' },
    { kind: 'top', label: '顶部对齐' },
    { kind: 'vcenter', label: '垂直居中' },
    { kind: 'bottom', label: '底部对齐' },
  ]

  return (
    <aside className="property-panel">
      <div className="panel-head">
        <span>{sel.length ? `已选中 ${sel.length} 个元素` : '属性'}</span>
      </div>

      {!sel.length && <p className="panel-hint">选择一个元素以调整外观、文字与图层。当前工具的新建样式可在下方预设。</p>}

      {!!sel.length && fillable && (
        <section>
          <h4>填充</h4>
          <ColorRow colors={palette} value={one?.fill ?? ''} onChange={(fill) => patch({ fill })} />
        </section>
      )}

      {!!sel.length && stroked && (
        <section>
          <h4>描边</h4>
          <ColorRow colors={inkPalette} extra={['transparent']} value={one?.stroke ?? ''} onChange={(stroke) => patch({ stroke })} />
          <div className="slider-row">
            <span>粗细</span>
            <input
              type="range"
              min={0}
              max={12}
              step={0.5}
              value={one?.strokeWidth ?? 1.5}
              onChange={(e) => patch({ strokeWidth: Number(e.target.value) })}
            />
            <em>{one?.strokeWidth ?? 1.5}</em>
          </div>
          <div className="btn-row wrap">
            <button
              type="button"
              className={one?.dash ? 'chip wide active' : 'chip wide'}
              onClick={() => patch({ dash: !one?.dash })}
            >
              <Rows3 size={14} /> 虚线描边
            </button>
          </div>
        </section>
      )}

      {shapeOnly && (
        <ShapeLibraryPanel value={one?.shape ?? 'round'} onChange={(shape) => patch({ shape })} />
      )}

      {connectorOnly && (
        <section>
          <h4>连接线</h4>
          <div className="btn-row wrap">
            {(['straight', 'elbow', 'curve'] as const).map((style) => (
              <button
                key={style}
                type="button"
                className={oneConnector?.connectorStyle === style ? 'chip wide active' : 'chip wide'}
                onClick={() => patch({ connectorStyle: style })}
              >
                {style === 'straight' ? <ArrowRight size={14} /> : style === 'elbow' ? <Rows3 size={14} /> : <Spline size={14} />}
                {style === 'straight' ? '直线' : style === 'elbow' ? '折线' : '曲线'}
              </button>
            ))}
            <button
              type="button"
              className={oneConnector?.arrowStart ? 'chip wide active' : 'chip wide'}
              onClick={() => patch({ arrowStart: !oneConnector?.arrowStart })}
            >
              <ChevronLeft size={14} /> 起点箭头
            </button>
            <button
              type="button"
              className={oneConnector?.arrowEnd ? 'chip wide active' : 'chip wide'}
              onClick={() => patch({ arrowEnd: !oneConnector?.arrowEnd })}
            >
              <ChevronRight size={14} /> 终点箭头
            </button>
          </div>
          <div className="preset-block">
            <span>连接线标注</span>
            <input
              className="text-input"
              value={oneConnector?.text ?? ''}
              placeholder="例如：需要先确认"
              onChange={(e) => patch({ text: e.target.value })}
            />
          </div>
        </section>
      )}

      {textual && (
        <section>
          <h4>文字</h4>
          <ColorRow colors={inkPalette} value={one?.textColor ?? ''} onChange={(textColor) => patch({ textColor })} />
          <div className="slider-row">
            <span>字号</span>
            <input
              type="range"
              min={10}
              max={64}
              step={1}
              value={one?.fontSize ?? 16}
              onChange={(e) => patch({ fontSize: Number(e.target.value) })}
            />
            <em>{one?.fontSize ?? 16}</em>
          </div>
          <div className="btn-row">
            <button
              type="button"
              className={one?.bold ? 'chip active' : 'chip'}
              onClick={() => patch({ bold: !one?.bold })}
              title="加粗"
            >
              <Bold size={14} />
            </button>
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                type="button"
                className={one?.align === align ? 'chip active' : 'chip'}
                onClick={() => patch({ align })}
              >
                {align === 'left' ? <AlignLeft size={14} /> : align === 'center' ? <AlignCenter size={14} /> : <AlignRight size={14} />}
              </button>
            ))}
          </div>
        </section>
      )}

      {!!sel.length && (
        <section>
          <h4>外观与位置</h4>
          <div className="slider-row">
            <span>透明度</span>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={Math.round((one?.opacity ?? 1) * 100)}
              onChange={(e) => patch({ opacity: Number(e.target.value) / 100 })}
            />
            <em>{Math.round((one?.opacity ?? 1) * 100)}%</em>
          </div>
          <div className="slider-row">
            <span>旋转</span>
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={Math.round(one?.rotation ?? 0)}
              onChange={(e) => rotate(Number(e.target.value))}
            />
            <em>{Math.round(one?.rotation ?? 0)}°</em>
          </div>
          <div className="btn-row wrap">
            <button type="button" className="chip" title="逆时针 90°" onClick={() => rotate(Math.round((one?.rotation ?? 0) - 90))}>
              <RotateCw size={14} style={{ transform: 'scaleX(-1)' }} />
            </button>
            <button type="button" className="chip" title="顺时针 90°" onClick={() => rotate(Math.round((one?.rotation ?? 0) + 90))}>
              <RotateCw size={14} />
            </button>
            <button type="button" className="chip wide" onClick={() => rotate(0)}>
              归零
            </button>
          </div>
          {one && one.kind !== 'connector' && (
            <div className="grid-2">
              <NumberField label="X" value={one.x} onChange={(v) => patch({ x: v })} />
              <NumberField label="Y" value={one.y} onChange={(v) => patch({ y: v })} />
              <NumberField label="宽" value={one.w} min={20} onChange={(v) => patch({ w: Math.max(20, v) })} />
              <NumberField label="高" value={one.h} min={20} onChange={(v) => patch({ h: Math.max(20, v) })} />
            </div>
          )}
        </section>
      )}

      {!!sel.length && (
        <section>
          <h4>图层与操作</h4>
          <div className="btn-row wrap">
            <button type="button" className={one?.locked ? 'chip wide active' : 'chip wide'} onClick={() => onToggleLock()}>
              {one?.locked ? <Lock size={14} /> : <Unlock size={14} />} {one?.locked ? '已锁定' : '锁定'}
            </button>
            <button type="button" className="chip wide" onClick={onBringFront}>
              <ArrowUpToLine size={14} /> 置顶
            </button>
            <button type="button" className="chip wide" onClick={onSendBack}>
              <ArrowDownToLine size={14} /> 置底
            </button>
            <button type="button" className="chip wide" onClick={onDuplicate}>
              <Copy size={14} /> 复制
            </button>
            <button type="button" className="chip wide danger" onClick={onDelete}>
              <Trash2 size={14} /> 删除
            </button>
          </div>
        </section>
      )}

      {multi && (
        <section>
          <h4>对齐与分布</h4>
          <div className="btn-row wrap">
            {alignItems.map((item) => (
              <button key={item.kind} type="button" className="chip wide" onClick={() => onAlign(item.kind)}>
                {item.label}
              </button>
            ))}
          </div>
          <div className="btn-row wrap">
            <button type="button" className="chip wide" disabled={sel.length < 3} onClick={() => onDistribute('horizontal')}>
              <ArrowLeftRight size={14} /> 水平分布
            </button>
            <button type="button" className="chip wide" disabled={sel.length < 3} onClick={() => onDistribute('vertical')}>
              <ArrowUpDown size={14} /> 垂直分布
            </button>
          </div>
        </section>
      )}

      <LayerPanel
        layers={layers}
        selection={sel}
        onSelect={onSelectLayer}
        onToggleLock={onToggleLock}
        onToggleVisible={onToggleVisible}
        onMoveLayer={onMoveLayer}
      />

      <section className="tool-defaults">
        <h4>工具预设</h4>
        <ToolOptions doc={doc} ui={ui} derived={derived} actions={actions} favorites={favorites} />
      </section>
    </aside>
  )
}

/** 属性面板只在选中/工具/文档变化时重绘。 */
export const PropertyPanel = memo(PropertyPanelView)
