/** 画布指针状态机：平移、拖动、缩放、旋转、连线、画笔、框选与双击进入编辑。 */

import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'
import { computeSnap, snapToGrid } from '@/geometry/arrange'
import { elementBounds, elementsToMoveWithFrame, groupMembers, rawBox } from '@/geometry/box'
import { hitTest, localPoint } from '@/geometry/hitTest'
import { intersects, unionBounds, type Bounds, type Point } from '@/geometry/primitives'
import { baseElement } from '@/model/factories'
import { CONNECTOR_STROKE, CONNECTOR_STROKE_WIDTH } from '@/model/constants'
import type { BoardElement, ElementKind, Tool } from '@/model/types'
import { canEditText } from '@/model/elementMeta'
import { mindNodesOf, mindSubtreeIds } from '@/domain/mindmap/tree'
import { activeBoard } from '@/domain/document'
import { currentElements } from '@/domain/selectors'
import { GRID } from '../config'
import { dom } from '../app-dom'
import { dispatch, getState } from '../store'
import { setSelection, setTool, setDraft, setGuides, setCommentOpen, toast } from '../actions/ui'
import { addElement, createElement, removeIds } from '../actions/elements'
import { toggleMindCollapse } from '../actions/mindmap'
import { castVote } from '../actions/collab'
import { tableCellAt, startEdit, startTableCell, commitEdit } from '../actions/text'
import { setView } from '../actions/viewport'

/** 拖拽中：不记历史、不刷新 updatedAt。 */
const writeElements = (fn: (els: BoardElement[]) => BoardElement[]): void => {
  const els = currentElements(getState())
  const next = fn(els)
  if (next === els) return
  dispatch({ type: 'elements/set', elements: next, history: false })
}

const viewOf = () => activeBoard(getState().file)?.view ?? { x: 0, y: 0, zoom: 1 }

const toWorld = (clientX: number, clientY: number): Point => {
  const rect = dom.svg?.getBoundingClientRect()
  const left = rect?.left ?? 0
  const top = rect?.top ?? 0
  const view = viewOf()
  return { x: (clientX - left - view.x) / view.zoom, y: (clientY - top - view.y) / view.zoom }
}

/** 开始平移：记录起点与起始视口。 */
const startPan = (clientX: number, clientY: number): void => {
  const view = viewOf()
  drag = { kind: 'pan', startX: clientX, startY: clientY, origin: { x: view.x, y: view.y } }
}

type Drag =
  | { kind: 'pan'; startX: number; startY: number; origin: Point }
  | { kind: 'move'; start: Point; origin: Record<string, Point> }
  | { kind: 'resize'; id: string; start: Point; origin: BoardElement }
  | { kind: 'marquee'; start: Point }
  | { kind: 'pen'; id: string }
  | { kind: 'frame'; id: string; start: Point; origin: BoardElement }
  | { kind: 'connect'; fromId: string }
  | { kind: 'erase' }

/** 拖拽态：只在交互层内部流转，不影响渲染。 */
let drag: Drag | null = null

/** 落点即创建的点击工具：是否立即进入编辑、创建后的提示。 */
const CLICK_TOOLS: { tool: Tool; kind: ElementKind; edit?: boolean; hint?: string }[] = [
  { tool: 'sticky', kind: 'sticky', edit: true },
  { tool: 'text', kind: 'text', edit: true },
  { tool: 'shape', kind: 'shape', edit: true },
  { tool: 'card', kind: 'card', hint: '已创建卡片，双击可直接改标题' },
  { tool: 'table', kind: 'table', hint: '已插入表格，双击单元格即可输入' },
  { tool: 'mind', kind: 'mindnode', edit: true, hint: '已创建中心主题：Tab 添加子节点，Enter 添加同级节点' },
]

const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>): void => {
  const node = e.currentTarget
  node.setPointerCapture(e.pointerId)
  const { ui } = getState()
  if (ui.editing) commitEdit()

  // 思维导图折叠 / 展开按钮
  const toggleId = (e.target as Element | null)?.getAttribute?.('data-mind-toggle')
  if (toggleId) {
    e.preventDefault()
    toggleMindCollapse(toggleId)
    return
  }

  if (ui.presenting || ui.tool === 'hand' || e.button === 1 || ui.spaceDown) {
    startPan(e.clientX, e.clientY)
    return
  }
  if (e.button !== 0) return

  const elements = currentElements(getState())
  const p = toWorld(e.clientX, e.clientY)

  if (ui.voteMode) {
    const target = hitTest(elements, p)
    if (target && (target.kind === 'sticky' || target.kind === 'card')) {
      castVote(target.id)
      return
    }
    toast('请点击便签或卡片投票', 'error')
    return
  }

  if (ui.tool === 'comment') {
    const target = hitTest(elements, p, false)
    if (target) {
      setSelection([target.id])
      setCommentOpen(true)
      setTool('select')
    } else {
      setCommentOpen(true)
    }
    return
  }

  if (ui.tool === 'eraser') {
    dispatch({ type: 'history/push' })
    drag = { kind: 'erase' }
    const target = hitTest(elements, p)
    if (target) removeIds([target.id], false)
    return
  }

  const clickTool = CLICK_TOOLS.find((t) => t.tool === ui.tool)
  if (clickTool) {
    createElement(clickTool.kind, p, !!clickTool.edit)
    setTool('select')
    if (clickTool.hint) toast(clickTool.hint)
    return
  }

  if (ui.tool === 'frame') {
    const el = createElement('frame', p)
    drag = { kind: 'frame', id: el.id, start: p, origin: el }
    return
  }

  if (ui.tool === 'pen') {
    dispatch({ type: 'history/push' })
    const el = createElement('draw', p)
    drag = { kind: 'pen', id: el.id }
    return
  }

  if (ui.tool === 'connector') {
    const target = hitTest(elements, p)
    if (!target || target.kind === 'connector') {
      toast('请从一个便签、图形或文本开始拖拽连接线')
      return
    }
    drag = { kind: 'connect', fromId: target.id }
    setDraft({ connect: { fromId: target.id, to: p } })
    return
  }

  // 选择工具
  const selection = ui.selection
  const single = selection.length === 1 ? elements.find((el) => el.id === selection[0]) : undefined
  if (single && single.kind !== 'connector' && !single.locked) {
    const b = rawBox(single)
    const local = localPoint(single, p)
    if (Math.hypot(local.x - (b.x + b.w), local.y - (b.y + b.h)) <= 12 / viewOf().zoom) {
      dispatch({ type: 'history/push' })
      drag = { kind: 'resize', id: single.id, start: p, origin: single }
      return
    }
  }

  // 优先命中内容元素，点空白处才选中容器本身
  const hit = hitTest(elements.filter((el) => el.kind !== 'frame'), p) ?? hitTest(elements, p)
  if (!hit) {
    if (!e.shiftKey) setSelection([])
    drag = { kind: 'marquee', start: p }
    setDraft({ marquee: { x: p.x, y: p.y, w: 0, h: 0 } })
    return
  }

  // 群组：点选任一成员即选中整组
  const hitIds = hit.groupId ? [hit.id, ...groupMembers(elements, hit.groupId).map((el) => el.id)] : [hit.id]
  let ids = selection
  if (e.shiftKey) {
    const allSelected = hitIds.every((id) => ids.includes(id))
    ids = allSelected
      ? ids.filter((id) => !hitIds.includes(id))
      : [...ids, ...hitIds.filter((id) => !ids.includes(id))]
  } else if (!hitIds.every((id) => ids.includes(id))) {
    ids = hitIds
  }
  setSelection(ids)

  if (hit.kind === 'connector') {
    drag = null
    return
  }

  const picked = ids.filter((id) => {
    const el = elements.find((x) => x.id === id)
    return !!el && el.kind !== 'connector' && !el.locked
  })
  // 拖动容器时带动内部元素
  const carried = new Set<string>()
  for (const frame of elements.filter((el) => picked.includes(el.id) && el.kind === 'frame')) {
    for (const child of elementsToMoveWithFrame(frame, elements)) {
      if (!child.locked && child.kind !== 'connector') carried.add(child.id)
    }
  }
  // 拖动带子节点的导图节点时联动整棵子树
  for (const node of elements.filter((el) => picked.includes(el.id) && el.kind === 'mindnode')) {
    if (!mindNodesOf(elements).some((child) => child.parent === node.id)) continue
    for (const id of mindSubtreeIds(elements, node.id)) carried.add(id)
  }
  const idsToMove = [...new Set([...picked, ...carried])]
  const origin: Record<string, Point> = {}
  for (const el of elements) {
    if (idsToMove.includes(el.id)) origin[el.id] = { x: el.x, y: el.y }
  }
  dispatch({ type: 'history/push' })
  drag = { kind: 'move', start: p, origin }
}

const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>): void => {
  const current = drag
  if (!current) return
  const state = getState()
  const view = viewOf()
  const elements = currentElements(state)
  switch (current.kind) {
    case 'pan': {
      const dx = e.clientX - current.startX
      const dy = e.clientY - current.startY
      const origin = current.origin
      setView(() => ({ zoom: view.zoom, x: origin.x + dx, y: origin.y + dy }))
      break
    }
    case 'move': {
      const p = toWorld(e.clientX, e.clientY)
      let dx = p.x - current.start.x
      let dy = p.y - current.start.y
      const ids = Object.keys(current.origin)
      const targets = elements.filter((el) => ids.includes(el.id))
      const staticBoxes = elements
        .filter((el) => !ids.includes(el.id) && el.kind !== 'connector' && !el.locked)
        .map(elementBounds)

      if (state.file.settings.guides && !e.altKey && targets.length) {
        const moved = targets.map(elementBounds).map((b) => ({ x: b.x + dx, y: b.y + dy, w: b.w, h: b.h }))
        const snap = computeSnap(moved, staticBoxes, 6 / view.zoom)
        dx += snap.dx
        dy += snap.dy
        setGuides(snap.guides)
      } else if (state.ui.guides.length) {
        setGuides([])
      }

      if (state.file.settings.snap && !e.altKey && targets.length) {
        const movedUnion = targets
          .map(elementBounds)
          .map((b) => ({ x: b.x + dx, y: b.y + dy, w: b.w, h: b.h }))
          .reduce(unionBounds)
        dx += snapToGrid(movedUnion.x, GRID / 2) - movedUnion.x
        dy += snapToGrid(movedUnion.y, GRID / 2) - movedUnion.y
      }

      const origin = current.origin
      writeElements((els) =>
        els.map((el) => (origin[el.id] ? { ...el, x: origin[el.id].x + dx, y: origin[el.id].y + dy } : el)),
      )
      break
    }
    case 'resize': {
      const p = toWorld(e.clientX, e.clientY)
      const w = Math.max(30, current.origin.w + (p.x - current.start.x))
      const h = Math.max(24, current.origin.h + (p.y - current.start.y))
      const id = current.id
      writeElements((els) => els.map((el) => (el.id === id ? { ...el, w, h } : el)))
      break
    }
    case 'frame': {
      const p = toWorld(e.clientX, e.clientY)
      const x = Math.min(current.start.x, p.x)
      const y = Math.min(current.start.y, p.y)
      const w = Math.max(160, Math.abs(p.x - current.start.x))
      const h = Math.max(120, Math.abs(p.y - current.start.y))
      const id = current.id
      writeElements((els) => els.map((el) => (el.id === id ? { ...el, x, y, w, h } : el)))
      break
    }
    case 'marquee': {
      const p = toWorld(e.clientX, e.clientY)
      const start = current.start
      setDraft({
        marquee: {
          x: Math.min(start.x, p.x),
          y: Math.min(start.y, p.y),
          w: Math.abs(p.x - start.x),
          h: Math.abs(p.y - start.y),
        },
      })
      break
    }
    case 'pen': {
      const p = toWorld(e.clientX, e.clientY)
      const id = current.id
      writeElements((els) =>
        els.map((el) => {
          if (el.id !== id) return el
          const points = el.points ?? []
          const x = p.x - el.x
          const y = p.y - el.y
          const lastX = points.length >= 2 ? points[points.length - 2] : 0
          const lastY = points.length >= 2 ? points[points.length - 1] : 0
          if (Math.hypot(x - lastX, y - lastY) < 2 / view.zoom) return el
          return { ...el, points: [...points, x, y] }
        }),
      )
      break
    }
    case 'connect': {
      const p = toWorld(e.clientX, e.clientY)
      setDraft({ connect: { fromId: current.fromId, to: p } })
      break
    }
    case 'erase': {
      const p = toWorld(e.clientX, e.clientY)
      const target = hitTest(elements, p)
      if (target) removeIds([target.id], false)
      break
    }
    default:
      break
  }
}

const onPointerUp = (e: ReactPointerEvent<SVGSVGElement>): void => {
  const current = drag
  drag = null
  if (getState().ui.guides.length) setGuides([])
  if (!current) return
  const elements = currentElements(getState())

  if (current.kind === 'marquee') {
    const end = toWorld(e.clientX, e.clientY)
    const area: Bounds = {
      x: Math.min(current.start.x, end.x),
      y: Math.min(current.start.y, end.y),
      w: Math.abs(end.x - current.start.x),
      h: Math.abs(end.y - current.start.y),
    }
    if (area.w > 3 || area.h > 3) {
      const ids = elements
        .filter((el) => !el.locked && el.visible !== false && intersects(elementBounds(el), area))
        .map((el) => el.id)
      setSelection(ids)
    }
    setDraft(null)
    return
  }

  if (current.kind === 'frame') {
    setSelection([current.id])
    setTool('select')
    setDraft(null)
    return
  }

  if (current.kind === 'pen') {
    const id = current.id
    writeElements((els) =>
      els
        .map((el) => {
          if (el.id !== id) return el
          const abs: number[] = []
          for (let i = 0; i + 1 < (el.points?.length ?? 0); i += 2) {
            abs.push((el.points as number[])[i] + el.x, (el.points as number[])[i + 1] + el.y)
          }
          if (abs.length < 4) return null as unknown as BoardElement
          let minX = Infinity
          let minY = Infinity
          let maxX = -Infinity
          let maxY = -Infinity
          for (let i = 0; i + 1 < abs.length; i += 2) {
            minX = Math.min(minX, abs[i])
            minY = Math.min(minY, abs[i + 1])
            maxX = Math.max(maxX, abs[i])
            maxY = Math.max(maxY, abs[i + 1])
          }
          const rel: number[] = []
          for (let i = 0; i + 1 < abs.length; i += 2) rel.push(abs[i] - minX, abs[i + 1] - minY)
          return { ...el, x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY), points: rel }
        })
        .filter(Boolean) as BoardElement[],
    )
    return
  }

  if (current.kind === 'connect') {
    const p = toWorld(e.clientX, e.clientY)
    const target = hitTest(elements, p)
    setDraft(null)
    if (target && target.id !== current.fromId && target.kind !== 'connector') {
      const el = baseElement('connector', 0, 0)
      el.from = current.fromId
      el.to = target.id
      el.w = 0
      el.h = 0
      el.stroke = CONNECTOR_STROKE
      el.strokeWidth = CONNECTOR_STROKE_WIDTH
      addElement(el, false)
      toast('已创建连接线，移动节点会自动跟随')
    }
    return
  }

  setDraft(null)
}

const onDoubleClick = (e: ReactMouseEvent<SVGSVGElement>): void => {
  const { ui } = getState()
  if (ui.presenting || ui.tool !== 'select') return
  const elements = currentElements(getState())
  const p = toWorld(e.clientX, e.clientY)
  const hit = hitTest(elements, p)
  if (hit?.kind === 'table') {
    startTableCell(hit, tableCellAt(hit, p))
    return
  }
  if (hit && canEditText(hit)) {
    startEdit(hit)
    return
  }
  if (!hit) startEdit(createElement('text', p))
}

/** 供视图层：把四个指针入口一次性挂到 SVG 上。 */
export const pointerHandlers = {
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onDoubleClick,
}
