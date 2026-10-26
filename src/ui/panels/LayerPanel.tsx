/** 图层面板：元素顺序、锁定与显隐。 */

import { ChevronDown, ChevronUp, Eye, EyeOff, Lock, Unlock } from 'lucide-react'
import type { BoardElement } from '@/model/types'
import { KIND_LABEL } from '@/model/elementMeta'

export const LayerPanel = (props: {
  layers: BoardElement[]
  selection: BoardElement[]
  onSelect: (id: string) => void
  onToggleLock: (id?: string) => void
  onToggleVisible: (id: string) => void
  onMoveLayer: (dir: 'up' | 'down', id: string) => void
}) => {
  if (!props.layers.length) return null
  return (
    <section>
      <h4>图层（{props.layers.length}）</h4>
      <div className="layer-list">
        {props.layers.map((el) => {
          const active = props.selection.some((s) => s.id === el.id)
          const hidden = el.visible === false
          const label = (el.text ?? '').trim() ? (el.text as string).trim().slice(0, 18) : KIND_LABEL[el.kind]
          return (
            <div
              key={el.id}
              className={active ? 'layer-item active' : 'layer-item'}
              onClick={() => props.onSelect(el.id)}
            >
              <span className="layer-tag">{KIND_LABEL[el.kind]}</span>
              <span className={hidden ? 'layer-name muted' : 'layer-name'}>{label}</span>
              <div className="layer-actions">
                <button
                  type="button"
                  className="icon-btn sm"
                  title="上移一层"
                  onClick={(e) => {
                    e.stopPropagation()
                    props.onSelect(el.id)
                    props.onMoveLayer('up', el.id)
                  }}
                >
                  <ChevronUp size={13} />
                </button>
                <button
                  type="button"
                  className="icon-btn sm"
                  title="下移一层"
                  onClick={(e) => {
                    e.stopPropagation()
                    props.onSelect(el.id)
                    props.onMoveLayer('down', el.id)
                  }}
                >
                  <ChevronDown size={13} />
                </button>
                <button
                  type="button"
                  className={el.locked ? 'icon-btn sm active' : 'icon-btn sm'}
                  title={el.locked ? '解锁' : '锁定'}
                  onClick={(e) => {
                    e.stopPropagation()
                    props.onSelect(el.id)
                    props.onToggleLock(el.id)
                  }}
                >
                  {el.locked ? <Lock size={13} /> : <Unlock size={13} />}
                </button>
                <button
                  type="button"
                  className={hidden ? 'icon-btn sm' : 'icon-btn sm active'}
                  title={hidden ? '显示' : '隐藏'}
                  onClick={(e) => {
                    e.stopPropagation()
                    props.onSelect(el.id)
                    props.onToggleVisible(el.id)
                  }}
                >
                  {hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
