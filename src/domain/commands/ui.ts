/** 界面命令：状态树 `ui` 分片的整键替换，外加提示、保存状态与忙碌标记。 */

import type { SaveStatus, ToastItem } from '@/model/types'
import type { EditorState } from '../state'
import type { UiState } from '../ui'
import type { CommandMeta } from './meta'

/**
 * 每个 `UiState` 字段对应一条命令，命令名即字段名（`ui/selection` → `selection`）。
 * 这样调用侧仍有完整的类型检查，新增字段无需再补样板。
 */
export type UiCommand = {
  [K in keyof UiState]: { type: `ui/${K & string}`; value: UiState[K] } & CommandMeta
}[keyof UiState]

/** 状态树顶层的三项目标不属于 `ui` 分片，单独列出。 */
export type StateCommand =
  | ({ type: 'ui/toast'; toast: ToastItem } & CommandMeta)
  | ({ type: 'ui/toastDismiss'; id: number } & CommandMeta)
  | ({ type: 'ui/saveStatus'; status: SaveStatus } & CommandMeta)
  | ({ type: 'ui/busy'; busy: string | null } & CommandMeta)

const isUiKey = (key: string): key is keyof UiState =>
  key !== 'toast' && key !== 'toastDismiss' && key !== 'saveStatus' && key !== 'busy'

export const reduceUi = (state: EditorState, cmd: UiCommand): EditorState | null => {
  const key = cmd.type.slice(3)
  if (!isUiKey(key)) return null
  /* 同值不产生新对象，避免无意义重渲染 */
  if (Object.is(state.ui[key], cmd.value)) return null
  return { ...state, ui: { ...state.ui, [key]: cmd.value } as UiState }
}

export const reduceStateCommand = (state: EditorState, cmd: StateCommand): EditorState | null => {
  switch (cmd.type) {
    case 'ui/toast':
      return { ...state, toasts: [...state.toasts, cmd.toast] }

    case 'ui/toastDismiss':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== cmd.id) }

    case 'ui/saveStatus':
      return state.saveStatus === cmd.status ? null : { ...state, saveStatus: cmd.status }

    case 'ui/busy':
      return state.busy === cmd.busy ? null : { ...state, busy: cmd.busy }

    default:
      return null
  }
}
