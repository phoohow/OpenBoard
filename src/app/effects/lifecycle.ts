/** 生命周期副作用：容器尺寸、滚轮缩放、导图归一化、演示聚焦与计时器。 */

import { useEffect } from 'react'
import { mindNodesOf } from '@/domain/mindmap/tree'
import { normalizeMindmaps } from '@/domain/mindmap/layout'
import type { EditorState } from '@/domain/state'
import { activeBoard } from '@/domain/document'
import { dom } from '../app-dom'
import { dispatch } from '../store'
import { installKeyboard } from '../interaction/keyboard'
import { installPersistence } from './persistence'
import { zoomAt } from '../actions/viewport'
import { focusStep } from '../actions/present'
import { setCanvasSize, setEditing, setLaserOn, setLaserPoint, setSelection, setTimerLeft, setTimerRunning } from '../actions/ui'

/** 滚动缩放系数：滚一格约 1.17 倍。 */
const WHEEL_FACTOR = 0.0016
/** 计时器刷新间隔。 */
const TIMER_TICK_MS = 250

/**
 * 挂载全局副作用（持久化、键盘）并对状态变化做响应式处理。
 * 只在 `App` 调用一次。
 */
export const useEditorEffects = (state: EditorState): void => {
  const { presenting, presentStep, timerRunning } = state.ui
  const boardId = state.file.activeId

  /* 持久化订阅与键盘监听只安装一次 */
  useEffect(() => {
    installPersistence()
    return installKeyboard()
  }, [])

  /* 画布容器尺寸 */
  useEffect(() => {
    const node = dom.wrap
    if (!node) return
    const sync = () => setCanvasSize({ w: Math.max(1, node.clientWidth), h: Math.max(1, node.clientHeight) })
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  /* 滚轮缩放（必须非 passive 才能 preventDefault） */
  useEffect(() => {
    const node = dom.svg
    if (!node) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * WHEEL_FACTOR))
    }
    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  }, [])

  /* 演示：步进变化 → 聚焦到对应元素 */
  useEffect(() => {
    if (!presenting) return
    focusStep(presentStep)
  }, [presenting, presentStep])

  /* 演示：进入时清空选择与编辑态 */
  useEffect(() => {
    if (!presenting) return
    setSelection([])
    setEditing(null)
  }, [presenting])

  /* 演示：退出时收起激光笔与计时器 */
  useEffect(() => {
    if (presenting) return
    setLaserOn(false)
    setLaserPoint(null)
    setTimerRunning(false)
  }, [presenting])

  /* 计时器：运行中每 250ms 递减（以真实时间为准，避免累积误差） */
  useEffect(() => {
    if (!timerRunning) return
    const startedAt = Date.now()
    const from = state.ui.timerLeft
    const id = window.setInterval(() => {
      const left = Math.max(0, from - (Date.now() - startedAt))
      setTimerLeft(left)
      if (left <= 0) setTimerRunning(false)
    }, TIMER_TICK_MS)
    return () => window.clearInterval(id)
    // 只在开始/暂停时重建，暂停后的剩余时间由 from 捕获
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerRunning])

  /* 切换白板时归一化一次导图布局（兼容导入的历史数据） */
  useEffect(() => {
    const elements = activeBoard(state.file)?.elements ?? []
    if (!mindNodesOf(elements).length) return
    const next = normalizeMindmaps(elements)
    if (next !== elements) dispatch({ type: 'elements/set', elements: next, history: false })
    // 仅在切换白板时执行
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId])
}
