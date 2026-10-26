/** 弹层容器：标题、关闭与遮罩点击。 */

import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export const Modal = ({
  title,
  subtitle,
  children,
  onClose,
  width = 460,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  onClose: () => void
  width?: number
}) => (
  <div className="modal-mask" onPointerDown={onClose}>
    <div className="modal" style={{ width }} onPointerDown={(e) => e.stopPropagation()}>
      <div className="modal-head">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭">
          <X size={16} />
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
)
