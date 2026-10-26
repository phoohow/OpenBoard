/** 界面状态写入口：把 `ui` 分片的整键赋值包成命令，保留原 hook 的调用手感。 */

import { dispatch, getState } from '../store'
import type { UiCommand } from '@/domain/commands/command'
import type { UiState } from '@/domain/ui'
import type { BoardElement, DialogKind, PenMode, PresentMode, ShapeKind, Tool } from '@/model/types'
import type { EditingState, PendingConfirm } from '@/domain/ui'

type Updater<T> = T | ((prev: T) => T)

const resolve = <T>(next: Updater<T>, prev: T): T =>
  typeof next === 'function' ? (next as (p: T) => T)(prev) : next

/** 写入 `ui` 分片的任意字段（支持函数式更新）。 */
export const setUi = <K extends keyof UiState>(key: K, next: Updater<UiState[K]>): void => {
  dispatch({ type: `ui/${key}`, value: resolve(next, getState().ui[key]) } as UiCommand)
}

/* ---------------- 轻提示 ---------------- */

const TOAST_MS = 2800

export const toast = (text: string, tone: 'info' | 'error' = 'info'): void => {
  const id = Date.now() + Math.random()
  dispatch({ type: 'ui/toast', toast: { id, text, tone } })
  setTimeout(() => dispatch({ type: 'ui/toastDismiss', id }), TOAST_MS)
}

export const setBusy = (busy: string | null) => dispatch({ type: 'ui/busy', busy })

/* ---------------- 命名快捷方式 ---------------- */

export const setTool = (next: Updater<Tool>) => setUi('tool', next)
export const setShapeKind = (next: Updater<ShapeKind>) => setUi('shapeKind', next)
export const setShapeFill = (next: Updater<string>) => setUi('shapeFill', next)
export const setStickyColor = (next: Updater<string>) => setUi('stickyColor', next)
export const setPenColor = (next: Updater<string>) => setUi('penColor', next)
export const setPenWidth = (next: Updater<number>) => setUi('penWidth', next)
export const setPenMode = (next: Updater<PenMode>) => setUi('penMode', next)
export const setSelection = (next: Updater<string[]>) => setUi('selection', next)
export const setEditing = (next: Updater<EditingState | null>) => setUi('editing', next)
export const setSelectAll = (next: Updater<boolean>) => setUi('selectAll', next)
export const setDialog = (next: Updater<DialogKind>) => setUi('dialog', next)
export const setConfirm = (next: Updater<PendingConfirm | null>) => setUi('confirm', next)
export const setPanelOpen = (next: Updater<boolean>) => setUi('panelOpen', next)
export const setCommentOpen = (next: Updater<boolean>) => setUi('commentOpen', next)
export const setSearch = (next: Updater<string>) => setUi('search', next)
export const setSpaceDown = (next: Updater<boolean>) => setUi('spaceDown', next)
export const setCanvasSize = (next: Updater<{ w: number; h: number }>) => setUi('canvasSize', next)
export const setDraft = (next: Updater<UiState['draft']>) => setUi('draft', next)
export const setGuides = (next: Updater<UiState['guides']>) => setUi('guides', next)
export const setClipboard = (next: Updater<BoardElement[] | null>) => setUi('clipboard', next)
export const setStickyIndex = (next: Updater<number>) => setUi('stickyIndex', next)
export const setPresenting = (next: Updater<boolean>) => setUi('presenting', next)
export const setPresentStep = (next: Updater<number>) => setUi('presentStep', next)
export const setPresentMode = (next: Updater<PresentMode>) => setUi('presentMode', next)
export const setLaserOn = (next: Updater<boolean>) => setUi('laserOn', next)
export const setLaserPoint = (next: Updater<UiState['laserPoint']>) => setUi('laserPoint', next)
export const setTimerLeft = (next: Updater<number>) => setUi('timerLeft', next)
export const setTimerRunning = (next: Updater<boolean>) => setUi('timerRunning', next)
export const setReactions = (next: Updater<UiState['reactions']>) => setUi('reactions', next)
export const setVoteMode = (next: Updater<boolean>) => setUi('voteMode', next)
export const setExportScope = (next: Updater<UiState['exportScope']>) => setUi('exportScope', next)
export const setExportScale = (next: Updater<number>) => setUi('exportScale', next)
export const setExportTransparent = (next: Updater<boolean>) => setUi('exportTransparent', next)
