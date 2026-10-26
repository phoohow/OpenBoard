/** 文档模型：多白板文件结构、结构归一化与纯操作助手（无 IO、无 React）。 */

import { defaultSettings, uid } from '@/model/factories'
import { isValidElement } from '@/model/guards'
import { launchBoard } from '@/model/presets'
import { clamp } from '@/geometry/primitives'
import type { AppSettings, BackgroundMode, BoardComment, BoardElement, RouteStop, View } from '@/model/types'

export interface Snapshot {
  id: string
  name: string
  createdAt: number
  auto: boolean
  elements: BoardElement[]
  view: View
}

export interface BoardDoc {
  id: string
  name: string
  elements: BoardElement[]
  view: View
  updatedAt: number
  comments?: BoardComment[]
  route?: RouteStop[]
  snapshots?: Snapshot[]
}

export interface BoardsFile {
  version: 1
  activeId: string
  boards: BoardDoc[]
  settings: AppSettings
}

/** 背景样式全集：归一化与界面轮转共用这一张表。 */
export const BACKGROUND_MODES: BackgroundMode[] = ['dots', 'grid', 'lines', 'plain']

/** 缩放上下限：文档层是缩放事实的唯一来源，`app/config.ts` 只转出给界面。 */
export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 3

/** 非法或缺失的缩放一律回到 1，再夹到上下限内。 */
export const clampZoom = (z: unknown): number => {
  const n = typeof z === 'number' && Number.isFinite(z) ? z : 1
  return clamp(n, MIN_ZOOM, MAX_ZOOM)
}

const normalizeSettings = (raw: unknown): AppSettings => {
  const input = (raw ?? {}) as Partial<AppSettings>
  return {
    background: BACKGROUND_MODES.includes(input.background as BackgroundMode)
      ? (input.background as BackgroundMode)
      : 'dots',
    snap: input.snap !== false,
    guides: input.guides !== false,
    autoColor: input.autoColor !== false,
  }
}

const normalizeComments = (raw: unknown): BoardComment[] => {
  if (!Array.isArray(raw)) return []
  return raw
    .map((c) => c as Partial<BoardComment>)
    .filter((c) => !!c && typeof c.id === 'string' && typeof c.text === 'string')
    .map((c) => ({
      id: c.id as string,
      elementId: typeof c.elementId === 'string' ? c.elementId : undefined,
      x: Number.isFinite(c.x) ? (c.x as number) : undefined,
      y: Number.isFinite(c.y) ? (c.y as number) : undefined,
      text: c.text as string,
      createdAt: Number.isFinite(c.createdAt) ? (c.createdAt as number) : Date.now(),
      resolved: c.resolved === true,
    }))
}

const normalizeRoute = (raw: unknown): RouteStop[] => {
  if (!Array.isArray(raw)) return []
  return raw
    .map((s) => s as Partial<RouteStop>)
    .filter((s) => !!s && typeof s.id === 'string')
    .map((s) => ({
      id: s.id as string,
      label: typeof s.label === 'string' ? s.label : '未命名',
      targetId: typeof s.targetId === 'string' ? s.targetId : undefined,
      x: Number.isFinite(s.x) ? (s.x as number) : undefined,
      y: Number.isFinite(s.y) ? (s.y as number) : undefined,
      zoom: Number.isFinite(s.zoom) ? (s.zoom as number) : undefined,
    }))
}

const normalizeView = (v: unknown): View => {
  const raw = (v ?? {}) as Partial<View>
  return {
    x: Number.isFinite(raw.x) ? (raw.x as number) : 40,
    y: Number.isFinite(raw.y) ? (raw.y as number) : 30,
    zoom: clampZoom(raw.zoom),
  }
}

export const defaultFile = (): BoardsFile => {
  const first = launchBoard()
  return {
    version: 1,
    activeId: 'board-1',
    boards: [
      {
        id: 'board-1',
        name: first.name,
        elements: first.elements,
        view: { x: 40, y: 24, zoom: 0.8 },
        updatedAt: Date.now(),
      },
    ],
    settings: defaultSettings(),
  }
}

/** 反序列化外部数据（localStorage / 导入文件），非法内容静默丢弃。 */
export const parseFile = (raw: unknown): BoardsFile => {
  const data = (raw ?? {}) as Partial<BoardsFile>
  const boards = (Array.isArray(data.boards) ? data.boards : [])
    .filter((b): b is BoardDoc => !!b && Array.isArray(b.elements))
    .map((b) => ({
      id: typeof b.id === 'string' && b.id ? b.id : uid(),
      name: typeof b.name === 'string' && b.name ? b.name : '未命名白板',
      elements: b.elements.filter(isValidElement),
      view: normalizeView(b.view),
      updatedAt: Number.isFinite(b.updatedAt) ? (b.updatedAt as number) : Date.now(),
      comments: normalizeComments(b.comments),
      route: normalizeRoute(b.route),
      snapshots: Array.isArray(b.snapshots) ? (b.snapshots as Snapshot[]) : [],
    }))

  if (!boards.length) return defaultFile()
  const activeId = boards.some((b) => b.id === data.activeId) ? (data.activeId as string) : boards[0].id
  return { version: 1, activeId, boards, settings: normalizeSettings(data.settings) }
}

export const activeBoard = (file: BoardsFile): BoardDoc | undefined =>
  file.boards.find((b) => b.id === file.activeId)

/** 以 activeId 定位并替换当前白板；返回 new 表示结构未变。 */
export const withBoard = (file: BoardsFile, fn: (board: BoardDoc) => BoardDoc): BoardsFile => {
  const current = activeBoard(file)
  if (!current) return file
  const next = fn(current)
  if (next === current) return file
  return { ...file, boards: file.boards.map((b) => (b.id === file.activeId ? next : b)) }
}

export const createBoardDoc = (name: string, elements: BoardElement[] = [], view?: View): BoardDoc => ({
  id: uid(),
  name,
  elements,
  view: view ?? { x: 40, y: 40, zoom: 1 },
  updatedAt: Date.now(),
})
