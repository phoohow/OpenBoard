/** 轻量反馈：全局面条提示与二次确认弹层。 */

import { TriangleAlert } from 'lucide-react'
import type { ToastItem } from '@/model/types'
import { Modal } from './Modal'

export const Toasts = ({ items }: { items: ToastItem[] }) => (
  <div className="toasts">
    {items.map((t) => (
      <div key={t.id} className={`toast ${t.tone}`}>
        {t.tone === 'error' && <TriangleAlert size={14} />}
        {t.text}
      </div>
    ))}
  </div>
)

export const ConfirmDialog = (props: {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}) => (
  <Modal title={props.title} onClose={props.onCancel} width={420}>
    <p className="confirm-text">{props.message}</p>
    <div className="modal-foot">
      <button type="button" className="btn ghost" onClick={props.onCancel}>
        取消
      </button>
      <button type="button" className="btn primary" onClick={props.onConfirm}>
        {props.confirmLabel}
      </button>
    </div>
  </Modal>
)
