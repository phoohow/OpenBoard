/** 视口动作：滚轮缩放、居中缩放、适配内容、跳转与全局搜索定位。 */

import { clamp } from '@/geometry/primitives'
import { contentBounds, selectionBounds } from '@/geometry/box'
import type { Point } from '@/geometry/primitives'
import type { View } from '@/model/types'
import { activeBoard } from '@/domain/document'
import { currentElements } from '@/domain/selectors'
import { dispatch, getState } from '../store'
import { dom } from '../app-dom'
import { setSearch, setSelection, toast } from './ui'
import { MIN_ZOOM, MAX_ZOOM } from '../config'

const currentView = (): View => activeBoard(getState().file)?.view ?? { x: 0, y: 0, zoom: 1 }

/** 写入视口：不记历史、不刷新 updatedAt。 */
export const setView = (next: View | ((prev: View) => View)): void => {
  const prev = currentView()
  const view = typeof next === 'function' ? next(prev) : next
  dispatch({ type: 'view/set', view, history: false })
}

export const zoomAt = (clientX: number, clientY: number, factor: number): void => {
  const node = dom.svg
  if (!node) return
  const rect = node.getBoundingClientRect()
  setView((v) => {
    const zoom = clamp(v.zoom * factor, MIN_ZOOM, MAX_ZOOM)
    const cx = clientX - rect.left
    const cy = clientY - rect.top
    const wx = (cx - v.x) / v.zoom
    const wy = (cy - v.y) / v.zoom
    return { zoom, x: cx - wx * zoom, y: cy - wy * zoom }
  })
}

export const zoomCenter = (factor: number): void => {
  const { w, h } = getState().ui.canvasSize
  setView((v) => {
    const zoom = clamp(v.zoom * factor, MIN_ZOOM, MAX_ZOOM)
    const cx = w / 2
    const cy = h / 2
    const wx = (cx - v.x) / v.zoom
    const wy = (cy - v.y) / v.zoom
    return { zoom, x: cx - wx * zoom, y: cy - wy * zoom }
  })
}

export const fitToContent = (): void => {
  const { ui } = getState()
  const bounds = contentBounds(currentElements(getState()))
  if (!bounds) {
    setView((v) => ({ ...v, zoom: 1 }))
    return
  }
  const width = ui.canvasSize.w - 200
  const height = ui.canvasSize.h - 200
  const zoom = clamp(Math.min(width / Math.max(bounds.w, 1), height / Math.max(bounds.h, 1)), MIN_ZOOM, 1.4)
  setView(() => ({
    zoom,
    x: ui.canvasSize.w / 2 - (bounds.x + bounds.w / 2) * zoom,
    y: ui.canvasSize.h / 2 - (bounds.y + bounds.h / 2) * zoom,
  }))
  toast('已适配全部内容')
}

export const jumpTo = (point: Point): void => {
  const { w, h } = getState().ui.canvasSize
  setView((v) => ({ ...v, x: w / 2 - point.x * v.zoom, y: h / 2 - point.y * v.zoom }))
}

export const runSearch = (term: string): void => {
  setSearch(term)
  const elements = currentElements(getState())
  const key = term.trim().toLowerCase()
  if (!key) {
    setSelection([])
    return
  }
  const matches = elements.filter((el) => (el.text ?? '').toLowerCase().includes(key))
  if (!matches.length) {
    toast(`没有找到包含「${key}」的内容`, 'error')
    setSelection([])
    return
  }
  setSelection(matches.map((el) => el.id))
  const b = selectionBounds(matches)
  if (b) {
    const { w, h } = getState().ui.canvasSize
    const zoom = clamp(Math.min((w - 260) / Math.max(b.w, 1), (h - 260) / Math.max(b.h, 1)), MIN_ZOOM, 1.2)
    setView(() => ({
      zoom,
      x: w / 2 - (b.x + b.w / 2) * zoom,
      y: h / 2 - (b.y + b.h / 2) * zoom,
    }))
  }
  toast(`找到 ${matches.length} 个匹配的内容`)
}
