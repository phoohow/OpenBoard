/** 导入导出、素材与模板：调用 features 适配器后统一 dispatch。 */

import { contentBounds } from '@/geometry/box'
import type { Bounds } from '@/geometry/primitives'
import { baseElement } from '@/model/factories'
import { DEFAULT_INK } from '@/model/constants'
import { normalizeImported } from '@/model/guards'
import type { TemplateMeta } from '@/model/types'
import type { AssetItem } from '@/features/assets/library'
import { downloadText, exportJSONFile, readFileAsText } from '@/features/export/file'
import { exportPNGFile, exportSVGFile, printBoard } from '@/features/export/svg'
import { elementsToMarkdown, markdownToElements } from '@/features/markdown/convert'
import { TEMPLATES, findTemplate, type TemplateCategory } from '@/features/templates/library'
import { activeBoard } from '@/domain/document'
import { currentBoard, exportTargets } from '@/domain/selectors'
import { dispatch, getState } from '../store'
import { dom } from '../app-dom'
import { addElement, viewportCenter } from './elements'
import { fitToContent } from './viewport'
import { commitEdit } from './text'
import { setBusy, setConfirm, setDialog, toast } from './ui'

/* ---------------- 素材与模板 ---------------- */

/** 打开图片选择框（隐藏 input 由 App 渲染）。 */
export const pickImage = (): void => dom.imageInput?.click()

/** 打开 Markdown 导入选择框。 */
export const pickMarkdown = (): void => dom.markdownInput?.click()

export const insertAsset = (group: 'emoji' | 'symbol' | 'stamp', item: AssetItem): void => {
  const center = viewportCenter()
  const size = group === 'emoji' ? 72 : group === 'symbol' ? 56 : 34
  const el = baseElement('text', Math.round(center.x - 60), Math.round(center.y - 30))
  el.text = item.glyph
  el.w = group === 'stamp' ? 200 : Math.round(size * 1.6)
  el.h = group === 'stamp' ? 56 : Math.round(size * 1.4)
  el.fontSize = size
  el.bold = group !== 'emoji'
  el.textColor = item.color ?? DEFAULT_INK
  el.rotation = group === 'stamp' ? -12 : 0
  addElement(el, true)
  setDialog(null)
  toast(`已插入「${item.label}」`)
}

export const templates: (TemplateMeta & { category: TemplateCategory })[] = TEMPLATES.map((spec) => ({
  id: spec.id,
  name: spec.name,
  desc: spec.desc,
  accent: spec.accent,
  count: spec.id === 'blank' ? 0 : spec.build().elements.length,
  category: spec.category,
}))

export const applyTemplate = (id: string): void => {
  const template = (findTemplate(id) ?? TEMPLATES[0]).build()
  const board = activeBoard(getState().file)
  if (!board) return
  setConfirm({
    title: '套用模板',
    message: `套用「${template.name}」将替换当前白板「${board.name}」的全部内容，此操作可以撤销。是否继续？`,
    confirmLabel: '替换内容',
    action: () => {
      dispatch(
        { type: 'board/rename', id: board.id, name: template.name, history: false },
        { type: 'board/replace', elements: template.elements },
        { type: 'ui/selection', value: [] },
        { type: 'ui/editing', value: null },
        { type: 'ui/confirm', value: null },
        { type: 'ui/dialog', value: null },
      )
      toast(`已套用「${template.name}」`)
      setTimeout(fitToContent, 60)
    },
  })
}

/* ---------------- 导入 ---------------- */

export const importJSON = async (file: File): Promise<void> => {
  try {
    const text = await readFileAsText(file)
    const data = JSON.parse(text) as { name?: string; elements?: unknown }
    const els = normalizeImported(data?.elements ?? (Array.isArray(data) ? data : []))
    if (!els.length) throw new Error('文件中没有可用元素')
    setConfirm({
      title: '导入白板',
      message: `导入将替换当前白板的全部内容，共 ${els.length} 个元素。是否继续？`,
      confirmLabel: '导入并替换',
      action: () => {
        const board = activeBoard(getState().file)
        dispatch(
          ...(data.name && board
            ? [{ type: 'board/rename' as const, id: board.id, name: data.name, history: false }]
            : []),
          { type: 'board/replace', elements: els },
          { type: 'ui/selection', value: [] },
          { type: 'ui/editing', value: null },
          { type: 'ui/confirm', value: null },
        )
        toast('已导入 JSON 文件')
        setTimeout(fitToContent, 60)
      },
    })
  } catch (err) {
    toast(`导入失败：${(err as Error).message}`, 'error')
  }
}

export const importMarkdownFile = async (file: File): Promise<void> => {
  try {
    const text = await readFileAsText(file)
    const els = markdownToElements(text)
    if (!els.length) throw new Error('文件中没有可识别的内容')
    dispatch(
      { type: 'elements/add', elements: els },
      { type: 'ui/selection', value: els.map((e) => e.id) },
    )
    toast(`已导入 ${els.length} 个元素`)
    setTimeout(fitToContent, 60)
  } catch (err) {
    toast(`导入失败：${(err as Error).message}`, 'error')
  }
}

/* ---------------- 导出 ---------------- */

export const exportBoard = async (kind: 'png' | 'svg' | 'json'): Promise<void> => {
  commitEdit()
  const { ui } = getState()
  const list = exportTargets(getState())
  const board = currentBoard(getState())
  if (!board) return
  if (!list.length) {
    toast(ui.exportScope === 'selection' ? '请先选择要导出的元素' : '白板还没有内容可以导出', 'error')
    return
  }
  if (kind === 'json') {
    exportJSONFile(board.name, list, Date.now())
    setDialog(null)
    toast('已导出 JSON 源文件')
    return
  }
  const content = dom.content
  if (!content) {
    toast('画布尚未准备好，请稍后重试', 'error')
    return
  }
  const keepIds = ui.exportScope === 'selection' ? list.map((el) => el.id) : null
  const background = ui.exportTransparent ? null : '#FFFFFF'
  const bounds: Bounds =
    ui.exportScope === 'view'
      ? {
          x: -board.view.x / board.view.zoom,
          y: -board.view.y / board.view.zoom,
          w: ui.canvasSize.w / board.view.zoom,
          h: ui.canvasSize.h / board.view.zoom,
        }
      : (contentBounds(list) ?? { x: 0, y: 0, w: 800, h: 600 })
  try {
    setBusy(kind === 'png' ? `正在生成 ${ui.exportScale}x PNG，请稍候…` : '正在生成 SVG，请稍候…')
    if (kind === 'png') {
      await exportPNGFile(content, dom.defs, bounds, board.name, ui.exportScale, background, keepIds)
    } else {
      exportSVGFile(content, dom.defs, bounds, board.name, background, keepIds)
    }
    setDialog(null)
    toast(`已导出 ${kind.toUpperCase()}`)
  } catch (err) {
    toast(`导出失败：${(err as Error).message}`, 'error')
  } finally {
    setBusy(null)
  }
}

export const exportPDF = async (): Promise<void> => {
  commitEdit()
  const { ui } = getState()
  const list = exportTargets(getState())
  const board = currentBoard(getState())
  if (!board) return
  if (!list.length) {
    toast(ui.exportScope === 'selection' ? '请先选择要导出的元素' : '白板还没有内容可以导出', 'error')
    return
  }
  const content = dom.content
  if (!content) {
    toast('画布尚未准备好，请稍后重试', 'error')
    return
  }
  const keepIds = ui.exportScope === 'selection' ? list.map((el) => el.id) : null
  const bounds: Bounds =
    ui.exportScope === 'view'
      ? {
          x: -board.view.x / board.view.zoom,
          y: -board.view.y / board.view.zoom,
          w: ui.canvasSize.w / board.view.zoom,
          h: ui.canvasSize.h / board.view.zoom,
        }
      : (contentBounds(list) ?? { x: 0, y: 0, w: 800, h: 600 })
  try {
    printBoard(content, dom.defs, bounds, board.name, '#FFFFFF', keepIds)
    setDialog(null)
    toast('已打开打印窗口，可选择「另存为 PDF」')
  } catch (err) {
    toast(`导出失败：${(err as Error).message}`, 'error')
  }
}

export const exportMarkdown = (): void => {
  const board = currentBoard(getState())
  if (!board) return
  if (!board.elements.length) {
    toast('白板还没有内容可以导出', 'error')
    return
  }
  downloadText(`${board.name}.md`, elementsToMarkdown(board.elements), 'text/markdown;charset=utf-8')
  toast('已导出 Markdown 大纲')
}

/* ---------------- 全局替换 ---------------- */

export const replaceAll = (find: string, replace: string): void => {
  if (!find) {
    toast('请先在上方输入查找内容', 'error')
    return
  }
  const board = currentBoard(getState())
  if (!board) return
  const count = board.elements.filter((el) => typeof el.text === 'string' && el.text.includes(find)).length
  dispatch({
    type: 'elements/set',
    elements: board.elements.map((el) => {
      const t = el.text
      return typeof t === 'string' && t.includes(find) ? { ...el, text: t.split(find).join(replace) } : el
    }),
  })
  toast(count ? `已替换 ${count} 处` : '没有找到匹配的内容')
}
