/** 文本编辑覆盖层：把 textarea 精确叠在元素（或表格单元格 / 卡片标题）上。 */

import { DEFAULT_INK } from '@/model/constants'
import { tableMetrics } from '@/model/factories'
import type { BoardElement, View } from '@/model/types'

export interface EditingBox {
  mode: 'cell' | 'card'
  x: number
  y: number
  w: number
  h: number
}

/** 表格单元格与卡片标题的编辑框覆盖默认的元素框。 */
export const computeEditingBox = (editing: { id: string; cell?: number }, el: BoardElement): EditingBox | null => {
  if (el.kind === 'table' && editing.cell != null) {
    const { cols, cellW, cellH } = tableMetrics(el)
    const row = Math.floor(editing.cell / cols)
    const col = editing.cell % cols
    return {
      mode: 'cell',
      x: el.x + col * cellW,
      y: el.y + row * cellH,
      w: cellW,
      h: cellH,
    }
  }
  if (el.kind === 'card') {
    const pad = 16
    const titleSize = Math.max(13, el.fontSize)
    return {
      mode: 'card',
      x: el.x + pad,
      y: el.y + pad + (el.status?.trim() ? 30 : 0),
      w: Math.max(60, el.w - pad * 2),
      h: titleSize * 1.35,
    }
  }
  return null
}

export const TextEditorOverlay = (props: {
  editing: { id: string; value: string; cell?: number }
  el: BoardElement
  box: EditingBox | null
  view: View
  /** 进入编辑时是否全选（一次性，消费后由调用方复位）。 */
  selectAll: boolean
  onSelectAllDone: () => void
  onChange: (value: string) => void
  onCommit: () => void
  onTableCellNext: (el: BoardElement, next: number) => void
  onMindAdd: (id: string, mode: 'sibling' | 'child') => void
}) => {
  const { editing, el, box, view } = props
  return (
    <textarea
      className="text-editor"
      autoFocus
      value={editing.value}
      spellCheck={false}
      onFocus={(e) => {
        if (props.selectAll) {
          e.currentTarget.select()
          props.onSelectAllDone()
        }
      }}
      onChange={(e) => props.onChange(e.target.value)}
      onKeyDown={(e) => {
        if (el.kind === 'table' && editing.cell != null) {
          const { cols, rows } = tableMetrics(el)
          const total = Math.max(1, rows * cols)
          if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault()
            const next = (editing.cell + (e.key === 'Tab' ? 1 : cols)) % total
            props.onCommit()
            props.onTableCellNext(el, next)
          }
          return
        }
        if (el.kind !== 'mindnode') return
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          props.onCommit()
          props.onMindAdd(editing.id, 'sibling')
        } else if (e.key === 'Tab') {
          e.preventDefault()
          props.onCommit()
          props.onMindAdd(editing.id, 'child')
        }
      }}
      onBlur={props.onCommit}
      style={{
        left: view.x + (box?.x ?? el.x) * view.zoom,
        top: el.kind === 'frame' ? view.y + el.y * view.zoom - 28 : view.y + (box?.y ?? el.y) * view.zoom,
        width: el.kind === 'frame' ? 240 : (box?.w ?? el.w) * view.zoom,
        height: 'auto',
        minHeight: el.kind === 'frame' || box ? undefined : el.h * view.zoom,
        transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
        transformOrigin: 'center center',
        fontSize: el.fontSize * view.zoom,
        lineHeight: `${el.fontSize * 1.35 * view.zoom}px`,
        color: box?.mode === 'cell' ? DEFAULT_INK : el.textColor,
        fontWeight: box?.mode === 'card' ? 700 : box ? 400 : el.bold ? 700 : 400,
        textAlign: box ? 'left' : el.align,
        background:
          box?.mode === 'cell' ? '#FFFBEB' : box?.mode === 'card' ? 'transparent' : el.kind === 'text' ? 'transparent' : el.fill,
        padding: el.kind === 'text' ? 0 : box?.mode === 'cell' ? 8 * view.zoom : box ? 0 : 16 * view.zoom,
        borderRadius: el.kind === 'text' ? 0 : box ? 4 : 12 * view.zoom,
      }}
    />
  )
}
