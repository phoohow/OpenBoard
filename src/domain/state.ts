/** 编辑器状态树：文档 + 历史 + 界面 + 提示。domain 内定义以便 `reduce` 保持纯函数。 */

import type { BoardElement, SaveStatus, ToastItem } from '@/model/types'
import type { BoardsFile } from './document'
import { createUiState, type UiState } from './ui'

export interface EditorState {
  /** 持久化根：多白板文件、当前白板与设置 */
  file: BoardsFile
  /** 撤销栈：语义与旧实现一致，只记录 elements */
  past: BoardElement[][]
  future: BoardElement[][]
  ui: UiState
  toasts: ToastItem[]
  saveStatus: SaveStatus
  busy: string | null
}

export const createEditorState = (file: BoardsFile): EditorState => ({
  file,
  past: [],
  future: [],
  ui: createUiState(),
  toasts: [],
  saveStatus: 'saved',
  busy: null,
})
