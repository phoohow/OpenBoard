/** 界面状态：与文档无关的编辑器瞬时数据（纯数据结构，无 React）。 */

import type { Bounds, Point } from '@/geometry/primitives'
import type { Guide } from '@/geometry/arrange'
import { DEFAULT_FILL, inkPalette, palette, penPresets } from '@/model/constants'
import type { BoardElement, DialogKind, PenMode, PresentMode, ShapeKind, Tool } from '@/model/types'

/** 编辑中的文本 / 表格单元格。 */
export interface EditingState {
  id: string
  value: string
  cell?: number
}

/** 拖拽过程中的临时覆盖物。 */
export interface CanvasDraft {
  marquee?: Bounds
  connect?: { fromId: string; to: Point }
}

/** 需要二次确认的破坏性操作。 */
export interface PendingConfirm {
  title: string
  message: string
  confirmLabel: string
  action: () => void
}

/** 导出范围：全部内容 / 当前选区 / 当前视口。 */
export type ExportScope = 'content' | 'selection' | 'view'

/** 演示互动表情。 */
export interface Reaction {
  id: number
  emoji: string
  x: number
  y: number
}

/** 应用界面状态树。 */
export interface UiState {
  /* 工具与绘制参数 */
  tool: Tool
  shapeKind: ShapeKind
  shapeFill: string
  stickyColor: string
  penColor: string
  penWidth: number
  penMode: PenMode

  /* 选择与编辑 */
  selection: string[]
  editing: EditingState | null
  /** 进入编辑态时是否全选文本 */
  selectAll: boolean

  /* 面板与对话框 */
  dialog: DialogKind
  confirm: PendingConfirm | null
  panelOpen: boolean
  commentOpen: boolean
  search: string

  /* 画布交互瞬时值 */
  spaceDown: boolean
  canvasSize: { w: number; h: number }
  draft: CanvasDraft | null
  guides: Guide[]
  clipboard: BoardElement[] | null
  stickyIndex: number

  /* 演示 */
  presenting: boolean
  presentStep: number
  presentMode: PresentMode
  laserOn: boolean
  laserPoint: Point | null
  timerTotal: number
  timerLeft: number
  timerRunning: boolean
  reactions: Reaction[]
  voteMode: boolean

  /* 导出参数 */
  exportScope: ExportScope
  exportScale: number
  exportTransparent: boolean
}

export const createUiState = (): UiState => ({
  tool: 'select',
  shapeKind: 'round',
  shapeFill: DEFAULT_FILL,
  stickyColor: palette[0],
  penColor: inkPalette[0],
  penWidth: penPresets.pen.width,
  penMode: 'pen',

  selection: [],
  editing: null,
  selectAll: false,

  dialog: null,
  confirm: null,
  panelOpen: true,
  commentOpen: false,
  search: '',

  spaceDown: false,
  canvasSize: { w: 1200, h: 800 },
  draft: null,
  guides: [],
  clipboard: null,
  stickyIndex: 0,

  presenting: false,
  presentStep: 0,
  presentMode: 'element',
  laserOn: false,
  laserPoint: null,
  timerTotal: 5 * 60 * 1000,
  timerLeft: 5 * 60 * 1000,
  timerRunning: false,
  reactions: [],
  voteMode: false,

  exportScope: 'content',
  exportScale: 2,
  exportTransparent: false,
})
