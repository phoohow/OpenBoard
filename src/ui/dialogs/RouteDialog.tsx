/** 演示路线弹层：按顺序组织容器与视角站点。 */

import { ArrowDownToLine, ArrowUpToLine, Frame, Play, Plus, Trash2 } from 'lucide-react'
import type { RouteStop } from '@/model/types'
import { Modal } from '../common/Modal'

export const RouteDialog = (props: {
  stops: RouteStop[]
  frames: { id: string; name: string }[]
  onAddFrame: (id: string) => void
  onAddView: () => void
  onMove: (id: string, dir: -1 | 1) => void
  onRemove: (id: string) => void
  onClear: () => void
  onPresent: () => void
  onClose: () => void
}) => (
  <Modal title="演示路线图" subtitle="按顺序把容器或当前视角加入路线，演示时逐站聚焦" onClose={props.onClose} width={560}>
    <div className="option-row">
      <span>加入</span>
      <div className="btn-row wrap">
        <button type="button" className="chip wide" onClick={props.onAddView}>
          <Plus size={13} /> 当前视角
        </button>
        {props.frames.map((f) => (
          <button key={f.id} type="button" className="chip wide" onClick={() => props.onAddFrame(f.id)}>
            <Frame size={13} /> {f.name}
          </button>
        ))}
      </div>
    </div>
    <ol className="route-list">
      {props.stops.map((stop, i) => (
        <li key={stop.id}>
          <span className="route-index">{i + 1}</span>
          <span className="route-name">{stop.label}</span>
          <button type="button" className="icon-btn sm" title="上移" onClick={() => props.onMove(stop.id, -1)} disabled={i === 0}>
            <ArrowUpToLine size={13} />
          </button>
          <button
            type="button"
            className="icon-btn sm"
            title="下移"
            onClick={() => props.onMove(stop.id, 1)}
            disabled={i === props.stops.length - 1}
          >
            <ArrowDownToLine size={13} />
          </button>
          <button type="button" className="icon-btn sm danger" title="移除" onClick={() => props.onRemove(stop.id)}>
            <Trash2 size={13} />
          </button>
        </li>
      ))}
    </ol>
    {!props.stops.length && <p className="confirm-text">还没有站点：添加容器页可讲述主线，添加当前视角可补充细节。</p>}
    <div className="modal-foot">
      <button type="button" className="btn ghost" onClick={props.onClear} disabled={!props.stops.length}>
        清空路线
      </button>
      <button type="button" className="btn primary" onClick={props.onPresent} disabled={!props.stops.length}>
        <Play size={15} /> 按路线演示
      </button>
    </div>
  </Modal>
)
