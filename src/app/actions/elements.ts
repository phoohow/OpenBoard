/** 元素动作：把「元素命令 + 伴随的界面变化」组合成单次 dispatch。 */

import type { AlignKind, DistributeKind } from '@/geometry/arrange'
import type { Point } from '@/geometry/primitives'
import { elementBounds } from '@/geometry/box'
import { unionBounds } from '@/geometry/primitives'
import { baseElement, uid } from '@/model/factories'
import { DEFAULT_STROKE, palette, penPresets, shapeDefaultSize } from '@/model/constants'
import type { BoardElement, ElementKind } from '@/model/types'
import { expandToMindTrees, mindSubtreeIds } from '@/domain/mindmap/tree'
import { mindNodeSize } from '@/domain/mindmap/layout'
import { mindThemes } from '@/domain/mindmap/themes'
import { activeBoard } from '@/domain/document'
import { currentElements } from '@/domain/selectors'
import { readFileAsDataURL } from '@/features/export/file'
import { dispatch, getState } from '../store'
import { setBusy, setClipboard, toast } from './ui'

/** 视口中心的世界坐标。 */
export const viewportCenter = (): Point => {
  const { file, ui } = getState()
  const view = activeBoard(file)?.view ?? { x: 0, y: 0, zoom: 1 }
  return { x: (ui.canvasSize.w / 2 - view.x) / view.zoom, y: (ui.canvasSize.h / 2 - view.y) / view.zoom }
}

/** 「入档 + 选中 + 按需进入编辑」的命令组，addElement 与 createElement 共用。 */
const addCmds = (el: BoardElement, edit: boolean): Parameters<typeof dispatch>[number][] => [
  { type: 'elements/add', elements: [el] },
  { type: 'ui/selection', value: [el.id] },
  { type: 'ui/selectAll', value: edit },
  ...(edit ? [{ type: 'ui/editing', value: { id: el.id, value: el.text ?? '' } } as const] : []),
]

export const addElement = (el: BoardElement, edit = false): BoardElement => {
  dispatch(...addCmds(el, edit))
  return el
}

export const createElement = (kind: ElementKind, at?: Point, edit = false): BoardElement => {
  const { file, ui } = getState()
  const p = at ?? viewportCenter()
  const el = baseElement(kind, Math.round(p.x), Math.round(p.y))
  const settings = file.settings
  const extra: Parameters<typeof dispatch>[number][] = []

  // 尺寸 / 文本 / 单元格等默认值由 baseElement 给出，此处只写与工厂不同的部分
  if (kind === 'sticky') {
    el.fill = settings.autoColor ? palette[ui.stickyIndex % palette.length] : ui.stickyColor
    if (settings.autoColor) extra.push({ type: 'ui/stickyIndex', value: ui.stickyIndex + 1 })
  }
  if (kind === 'frame') {
    el.stroke = '#9B93B8'
    el.align = 'left'
  }
  if (kind === 'table') {
    el.stroke = DEFAULT_STROKE
    el.w = 520
  }
  if (kind === 'mindnode') {
    const spec = mindThemes.grape.levels[0]
    el.rootId = el.id
    el.text = '中心主题'
    el.fontSize = 22
    el.bold = true
    el.fill = spec.fill
    el.stroke = spec.stroke
    el.textColor = spec.textColor
    const size = mindNodeSize(el)
    el.w = size.w
    el.h = size.h
  }
  if (kind === 'text') {
    el.w = 280
    el.h = Math.round(el.fontSize * 1.6)
    el.align = 'left'
  }
  if (kind === 'shape') {
    el.shape = ui.shapeKind
    el.fill = ui.shapeFill
    const size = shapeDefaultSize(ui.shapeKind)
    el.w = size.w
    el.h = size.h
  }
  if (kind === 'draw') {
    el.points = [0, 0]
    el.stroke = ui.penColor
    el.strokeWidth = ui.penMode === 'pen' ? ui.penWidth : penPresets[ui.penMode].width
    el.opacity = penPresets[ui.penMode].opacity
    el.w = 0
    el.h = 0
  }

  dispatch(...addCmds(el, edit), ...extra)
  return el
}

/** 删除指定元素（含导图子树与连接线），record 控制是否入撤销栈。 */
export const removeIds = (ids: string[], record = true): void => {
  const { ui } = getState()
  const pool = currentElements(getState())
  const doomed = new Set(ids)
  for (const id of ids) for (const extra of mindSubtreeIds(pool, id)) doomed.add(extra)
  dispatch(
    { type: 'elements/remove', ids, history: record },
    { type: 'ui/selection', value: ui.selection.filter((id) => !doomed.has(id)) },
  )
}

export const deleteSelection = (): void => {
  const { ui } = getState()
  const elements = currentElements(getState())
  if (!ui.selection.length) return
  const removable = ui.selection.filter((id) => !elements.find((el) => el.id === id)?.locked)
  if (!removable.length) {
    toast('所选元素已锁定，请先解锁再删除', 'error')
    return
  }
  removeIds(removable, true)
}

export const duplicateSelection = (): void => {
  const { ui } = getState()
  const elements = currentElements(getState())
  if (!ui.selection.length) return
  const ids = new Set(expandToMindTrees(elements, ui.selection))
  const map = new Map<string, string>()
  const copies: BoardElement[] = []
  for (const el of elements) {
    if (!ids.has(el.id)) continue
    const id = uid()
    map.set(el.id, id)
    copies.push({ ...el, id, x: el.x + 28, y: el.y + 28 })
  }
  const remapped = copies.map((el) =>
    el.kind === 'mindnode' && el.parent && map.has(el.parent) ? { ...el, parent: map.get(el.parent) } : el,
  )
  const links: BoardElement[] = elements
    .filter((el) => el.kind === 'connector' && !!el.from && !!el.to && map.has(el.from) && map.has(el.to))
    .map((el) => ({ ...el, id: uid(), from: map.get(el.from!), to: map.get(el.to!) }))

  dispatch(
    { type: 'elements/add', elements: [...remapped, ...links] },
    { type: 'ui/selection', value: copies.map((el) => el.id) },
  )
}

export const reorderSelection = (direction: 'front' | 'back'): void => {
  const { ui } = getState()
  if (!ui.selection.length) return
  dispatch({ type: 'elements/reorder', ids: ui.selection, direction })
}

export const patchSelection = (patch: Partial<BoardElement>): void => {
  const { ui } = getState()
  if (!ui.selection.length) return
  dispatch({ type: 'elements/patch', ids: ui.selection, patch, skipLocked: true })
}

export const toggleLock = (id?: string): void => {
  const { ui } = getState()
  const ids = id ? [id] : ui.selection
  if (!ids.length) return
  const target = currentElements(getState()).filter((el) => ids.includes(el.id))
  const lock = target.some((el) => !el.locked)
  dispatch({ type: 'elements/patch', ids, patch: { locked: lock } })
  toast(lock ? '所选元素已锁定，不能移动或编辑' : '所选元素已解锁')
}

export const moveLayer = (dir: 'up' | 'down', ids: string[]): void => {
  if (!ids.length) return
  dispatch({ type: 'elements/moveLayer', ids, dir })
}

export const toggleVisible = (ids: string[]): void => {
  if (!ids.length) return
  const set = new Set(ids)
  const target = currentElements(getState()).filter((el) => set.has(el.id))
  const hide = target.some((el) => el.visible !== false)
  dispatch({ type: 'elements/patch', ids, patch: { visible: !hide } })
  toast(hide ? '已隐藏所选元素' : '已显示所选元素')
}

export const rotateSelection = (deg: number): void => {
  const { ui } = getState()
  if (!ui.selection.length) return
  dispatch({ type: 'elements/rotate', ids: ui.selection, deg })
}

export const alignSelection = (kind: AlignKind): void => {
  const { ui } = getState()
  if (ui.selection.length < 2) return
  dispatch({ type: 'elements/align', ids: ui.selection, kind })
}

export const distributeSelected = (kind: DistributeKind): void => {
  const { ui } = getState()
  if (ui.selection.length < 3) return
  dispatch({ type: 'elements/distribute', ids: ui.selection, kind })
}

export const groupSelection = (forceUngroup: boolean): void => {
  const { ui } = getState()
  const elements = currentElements(getState())
  const targets = elements.filter((el) => ui.selection.includes(el.id) && !el.locked)
  const groupIds = Array.from(new Set(targets.map((el) => el.groupId).filter(Boolean) as string[]))
  const sameGroup =
    targets.length > 1 && groupIds.length === 1 && targets.every((el) => el.groupId === groupIds[0])

  if (sameGroup || forceUngroup) {
    if (!groupIds.length) return
    dispatch({ type: 'elements/group', ids: ui.selection, groupId: null })
    toast('已解组')
    return
  }
  if (ui.selection.length < 2) {
    toast('请选择至少两个元素再成组', 'error')
    return
  }
  const groupId = uid()
  dispatch({ type: 'elements/group', ids: ui.selection, groupId })
  toast(`已成组（${ui.selection.length} 个元素）· Ctrl/Cmd + G 可解组`)
}

export const copySelection = (cut: boolean): void => {
  const { ui } = getState()
  const elements = currentElements(getState())
  if (!ui.selection.length) return
  const ids = expandToMindTrees(elements, ui.selection)
  setClipboard(elements.filter((el) => ids.includes(el.id)))
  if (cut) removeIds(ui.selection, true)
  else toast(`已复制 ${ui.selection.length} 个元素`)
}

export const pasteClipboard = (): void => {
  const { ui } = getState()
  const clipboard = ui.clipboard
  if (!clipboard?.length) return
  const centerBox = clipboard.map(elementBounds).reduce(unionBounds)
  const c = viewportCenter()
  const dx = c.x - (centerBox.x + centerBox.w / 2)
  const dy = c.y - (centerBox.y + centerBox.h / 2)
  const idMap = new Map<string, string>()
  const copies = clipboard.map((el) => {
    const id = uid()
    idMap.set(el.id, id)
    return { ...el, id, x: el.x + dx, y: el.y + dy }
  })
  const finalCopies = copies.map((el) =>
    el.kind === 'connector' && !!el.from && !!el.to && idMap.has(el.from) && idMap.has(el.to)
      ? { ...el, from: idMap.get(el.from), to: idMap.get(el.to) }
      : el,
  )
  dispatch(
    { type: 'elements/add', elements: finalCopies },
    { type: 'ui/selection', value: finalCopies.map((el) => el.id) },
  )
  toast('已粘贴到视图中心')
}

export const addImage = async (file: File): Promise<void> => {
  try {
    setBusy('正在读取图片…')
    const src = await readFileAsDataURL(file)
    const size = await new Promise<{ w: number; h: number }>((resolve) => {
      const img = new Image()
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
      img.onerror = () => resolve({ w: 4, h: 3 })
      img.src = src
    })
    const width = 360
    const height = Math.round((width * size.h) / Math.max(1, size.w))
    const c = viewportCenter()
    const el: BoardElement = {
      ...baseElement('image', Math.round(c.x - width / 2), Math.round(c.y - height / 2)),
      src,
      w: width,
      h: height,
    }
    addElement(el, false)
    toast('图片已插入白板')
  } catch (err) {
    toast(`图片插入失败：${(err as Error).message}`, 'error')
  } finally {
    setBusy(null)
  }
}
