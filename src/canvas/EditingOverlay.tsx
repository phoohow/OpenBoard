/** 文字编辑浮层：把「正在编辑的元素」解析成覆盖框，交给 `TextEditorOverlay` 渲染。 */

import type { UiState } from '@/domain/ui'
import type { BoardElement, View } from '@/model/types'
import { TextEditorOverlay, computeEditingBox } from './TextEditorOverlay'

export interface EditingOverlayProps {
  doc: { elements: BoardElement[]; view: View }
  ui: UiState
  actions: {
    text: { commitEdit: () => void; startTableCell: (el: BoardElement, next: number) => void }
    mindmap: { addMindNode: (id: string, mode: 'sibling' | 'child') => void }
    ui: { setEditing: (value: UiState['editing']) => void; setSelectAll: (value: boolean) => void }
  }
}

export const EditingOverlay = ({ doc, ui, actions }: EditingOverlayProps) => {
  const editing = ui.editing
  const el = editing ? doc.elements.find((item) => item.id === editing.id) : undefined
  if (!editing || !el || ui.presenting) return null
  return (
    <TextEditorOverlay
      editing={editing}
      el={el}
      box={computeEditingBox(editing, el)}
      view={doc.view}
      selectAll={ui.selectAll}
      onSelectAllDone={() => actions.ui.setSelectAll(false)}
      onChange={(value) => actions.ui.setEditing({ id: editing.id, value })}
      onCommit={actions.text.commitEdit}
      onTableCellNext={actions.text.startTableCell}
      onMindAdd={actions.mindmap.addMindNode}
    />
  )
}
