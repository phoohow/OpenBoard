/** 演示动作：序列聚焦、路线图、激光表情与计时器。 */

import { clamp } from '@/geometry/primitives'
import { elementBounds } from '@/geometry/box'
import type { RouteStop } from '@/model/types'
import { uid } from '@/model/factories'
import { currentBoard, currentElements, presentItems } from '@/domain/selectors'
import { dispatch, getState } from '../store'
import { MAX_ZOOM, MIN_ZOOM } from '../config'
import { setView } from './viewport'
import { setPresentStep, setReactions, toast } from './ui'
import type { PresentMode } from '@/model/types'

/** 聚焦到演示序列的第 index 项。 */
export const focusStep = (index: number): void => {
  const items = presentItems(getState())
  if (!items.length) return
  const item = items[((index % items.length) + items.length) % items.length]
  if (!item) return
  const route = currentBoard(getState())?.route ?? []
  const stop = route.find((s) => s.id === item.id)
  const { w, h } = getState().ui.canvasSize

  if (!item.target && item.point) {
    const zoom = clamp(stop?.zoom ?? 1, MIN_ZOOM, MAX_ZOOM)
    setView(() => ({ zoom, x: w / 2 - item.point!.x * zoom, y: h / 2 - item.point!.y * zoom }))
    return
  }
  const target = item.target
  if (!target) return
  const b = elementBounds(target)
  const pad = target.kind === 'frame' ? 200 : 420
  const zoom =
    stop?.zoom ??
    clamp(Math.min((w - pad) / Math.max(b.w, 1), (h - pad) / Math.max(b.h, 1)), MIN_ZOOM, 1.6)
  setView(() => ({
    zoom,
    x: w / 2 - (b.x + b.w / 2) * zoom,
    y: h / 2 - (b.y + b.h / 2) * zoom,
  }))
}

/** 环形推进演示步骤（键盘与按钮共用）。 */
export const rollPresentStep = (delta: number, total: number): void => {
  const size = Math.max(1, total)
  setPresentStep((step) => (step + delta + size) % size)
}

export const startPresent = (mode: PresentMode): void => {
  const hasFrames = currentElements(getState()).some((el) => el.kind === 'frame')
  dispatch(
    { type: 'ui/presentMode', value: mode === 'slides' && !hasFrames ? 'element' : mode },
    { type: 'ui/presentStep', value: 0 },
    { type: 'ui/presenting', value: true },
    { type: 'ui/selection', value: [] },
    { type: 'ui/editing', value: null },
  )
}

/* ---------------- 路线图 ---------------- */

export const addRouteStop = (targetId?: string): void => {
  const { ui } = getState()
  const elements = currentElements(getState())
  const route = currentBoard(getState())?.route ?? []
  const view = currentBoard(getState())?.view ?? { x: 0, y: 0, zoom: 1 }
  const target = targetId ? elements.find((el) => el.id === targetId) : undefined
  const label = (target?.text ?? '').trim() || (targetId ? '未命名' : '当前视角')
  const stop: RouteStop = { id: uid(), label: `第 ${route.length + 1} 站 · ${label}` }
  if (target) stop.targetId = target.id
  else {
    stop.x = Math.round(ui.canvasSize.w / 2 / view.zoom - view.x / view.zoom)
    stop.y = Math.round(ui.canvasSize.h / 2 / view.zoom - view.y / view.zoom)
    stop.zoom = view.zoom
  }
  dispatch({ type: 'route/add', stop, history: false })
  toast('已加入演示路线图')
}

export const removeRouteStop = (id: string): void => {
  dispatch({ type: 'route/remove', id, history: false })
}

export const moveRouteStop = (id: string, dir: -1 | 1): void => {
  dispatch({ type: 'route/move', id, dir, history: false })
}

export const clearRoute = (): void => {
  dispatch({ type: 'route/clear', history: false })
}

/* ---------------- 演示工具 ---------------- */

const REACTION_MS = 2600

export const emitReaction = (emoji: string): void => {
  const id = Date.now() + Math.random()
  setReactions((prev) => [...prev, { id, emoji, x: 12 + Math.random() * 76, y: 70 + Math.random() * 20 }])
  setTimeout(() => setReactions((prev) => prev.filter((r) => r.id !== id)), REACTION_MS)
}

export const setTimerPreset = (minutes: number): void => {
  const total = minutes * 60 * 1000
  dispatch(
    { type: 'ui/timerTotal', value: total },
    { type: 'ui/timerLeft', value: total },
    { type: 'ui/timerRunning', value: false },
  )
}

export const toggleTimer = (): void => {
  const { timerLeft, timerTotal, timerRunning } = getState().ui
  dispatch(
    { type: 'ui/timerLeft', value: timerLeft <= 0 ? timerTotal : timerLeft },
    { type: 'ui/timerRunning', value: !timerRunning },
  )
}
