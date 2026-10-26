/** 历史版本与画布统计弹层。 */

import { useState } from 'react'
import type { Snapshot } from '@/domain/document'
import type { BoardComment, BoardElement, ElementKind } from '@/model/types'
import { KIND_LABEL } from '@/model/elementMeta'
import { Modal } from '../common/Modal'

export const HistoryDialog = (props: {
  snapshots: Snapshot[]
  onSave: (name: string) => void
  onRestore: (id: string) => void
  onDelete: (id: string) => void
  onClose: () => void
}) => {
  const [name, setName] = useState('')
  const sorted = [...props.snapshots].sort((a, b) => b.createdAt - a.createdAt)
  return (
    <Modal title="历史版本" onClose={props.onClose} width={520}>
      <div className="preset-block">
        <div className="save-version-row">
          <input
            className="text-input"
            placeholder="版本名称（可选）"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                props.onSave(name)
                setName('')
              }
            }}
          />
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              props.onSave(name)
              setName('')
            }}
          >
            保存当前版本
          </button>
        </div>
        <p>编辑过程中系统会每两分钟自动备份一次，可随时恢复（恢复操作本身可撤销）。</p>
      </div>
      {sorted.length === 0 ? (
        <p className="panel-hint">还没有任何版本。点击上方按钮保存当前进度，或继续编辑等待自动备份。</p>
      ) : (
        <ul className="version-list">
          {sorted.map((s) => (
            <li key={s.id}>
              <div className="version-meta">
                <strong>{s.name}</strong>
                <span>
                  {s.auto ? '自动' : '手动'} · {new Date(s.createdAt).toLocaleString('zh-CN', { hour12: false })} · {s.elements.length} 个元素
                </span>
              </div>
              <div className="btn-row">
                <button type="button" className="btn" onClick={() => props.onRestore(s.id)}>
                  恢复
                </button>
                <button type="button" className="btn danger" onClick={() => props.onDelete(s.id)}>
                  删除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}

export const StatisticsDialog = (props: {
  elements: BoardElement[]
  comments: BoardComment[]
  onClose: () => void
}) => {
  const counts: Partial<Record<ElementKind, number>> = {}
  let locked = 0
  let hidden = 0
  let votes = 0
  for (const el of props.elements) {
    counts[el.kind] = (counts[el.kind] ?? 0) + 1
    if (el.locked) locked += 1
    if (el.visible === false) hidden += 1
    votes += el.votes ?? 0
  }
  const order: ElementKind[] = ['sticky', 'text', 'shape', 'connector', 'frame', 'mindnode', 'table', 'card', 'draw', 'image']
  return (
    <Modal title="画布统计" onClose={props.onClose} width={460}>
      <div className="stat-grid">
        <div className="stat-cell">
          <strong>{props.elements.length}</strong>
          <span>元素总数</span>
        </div>
        <div className="stat-cell">
          <strong>{props.comments.length}</strong>
          <span>评论</span>
        </div>
        <div className="stat-cell">
          <strong>{votes}</strong>
          <span>便签投票</span>
        </div>
        <div className="stat-cell">
          <strong>{locked}</strong>
          <span>已锁定</span>
        </div>
        <div className="stat-cell">
          <strong>{hidden}</strong>
          <span>已隐藏</span>
        </div>
        <div className="stat-cell">
          <strong>{counts.frame ?? 0}</strong>
          <span>容器</span>
        </div>
      </div>
      <h4 className="stat-title">按类型分布</h4>
      <ul className="stat-list">
        {order.filter((k) => counts[k]).map((k) => (
          <li key={k}>
            <span>{KIND_LABEL[k]}</span>
            <strong>{counts[k]}</strong>
          </li>
        ))}
      </ul>
    </Modal>
  )
}
