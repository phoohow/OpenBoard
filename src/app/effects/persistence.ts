/** 持久化与自动备份：订阅 store，把文档变化防抖写入 localStorage。 */

import { saveFile } from '@/features/storage/file'
import { AUTO_SNAPSHOT_CHECK_MS, AUTO_SNAPSHOT_DELAY_MS, AUTO_SNAPSHOT_MAX, SAVE_DEBOUNCE_MS } from '../config'
import { dispatch, getState, subscribe } from '../store'
import { toast } from '../actions/ui'
import { autoSnapshot } from '../actions/snapshot'

let saveTimer: ReturnType<typeof setTimeout> | null = null
let snapshotTimer: ReturnType<typeof setTimeout> | null = null
let lastFile = getState().file
let lastElements = getState().file.boards.map((b) => b.elements).join()
let lastAutoAt = Date.now()

const persist = () => {
  if (saveTimer) clearTimeout(saveTimer)
  dispatch({ type: 'ui/saveStatus', status: 'saving' })
  saveTimer = setTimeout(() => {
    try {
      saveFile(getState().file)
      dispatch({ type: 'ui/saveStatus', status: 'saved' })
    } catch {
      dispatch({ type: 'ui/saveStatus', status: 'error' })
      toast('本机保存失败，请导出 JSON 备份白板内容', 'error')
    }
  }, SAVE_DEBOUNCE_MS)
}

/** 元素连续变动停止 20s 后，若距上次自动备份超过 120s 则存一版。 */
const scheduleSnapshot = () => {
  if (snapshotTimer) clearTimeout(snapshotTimer)
  if (Date.now() - lastAutoAt < AUTO_SNAPSHOT_CHECK_MS) return
  snapshotTimer = setTimeout(() => {
    lastAutoAt = Date.now()
    if (getState().file.boards.every((b) => b.id !== getState().file.activeId || !b.elements.length)) return
    autoSnapshot(AUTO_SNAPSHOT_MAX)
  }, AUTO_SNAPSHOT_DELAY_MS)
}

/** 安装副作用：文档变化 → 防抖落盘 + 自动备份。重复调用不会重复订阅。 */
let installed = false

export const installPersistence = (): void => {
  if (installed) return
  installed = true
  subscribe(() => {
    const state = getState()
    if (state.file !== lastFile) {
      lastFile = state.file
      persist()
    }
    const marker = state.file.boards.map((b) => b.elements).join()
    if (marker !== lastElements) {
      lastElements = marker
      scheduleSnapshot()
    }
  })
}
