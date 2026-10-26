import { baseElement } from '@/model/factories'
import type { BoardElement } from '@/model/types'

/** 把画布内容导出为 Markdown 大纲：思维导图按层级生成标题，其余文本元素导出为列表。 */
export const elementsToMarkdown = (elements: BoardElement[]): string => {
  const minds = elements.filter((e) => e.kind === 'mindnode')
  const lines: string[] = []
  if (minds.length) {
    const roots = minds.filter((m) => !m.parent)
    const byParent = new Map<string, BoardElement[]>()
    for (const m of minds) {
      const pid = m.parent ?? ''
      if (!byParent.has(pid)) byParent.set(pid, [])
      byParent.get(pid)!.push(m)
    }
    const childrenOf = (id: string) => byParent.get(id) ?? []
    const walk = (node: BoardElement, depth: number) => {
      const text = (node.text ?? '').trim() || '节点'
      lines.push(`${'#'.repeat(Math.min(depth, 6))} ${text}`)
      for (const c of childrenOf(node.id)) walk(c, depth + 1)
    }
    const starts = roots.length ? roots : minds.slice(0, 1)
    for (const r of starts) walk(r, 1)
    lines.push('')
  }
  const others = elements
    .filter((e) => (e.kind === 'sticky' || e.kind === 'text' || e.kind === 'card') && (e.text ?? '').trim())
    .sort((a, b) => a.y - b.y || a.x - b.x)
  for (const el of others) {
    const t = (el.text ?? '').trim()
    if (el.kind === 'card') {
      lines.push(`- [${el.done ? 'x' : ' '}] ${t}${el.status ? ` (${el.status})` : ''}`.trim())
    } else {
      lines.push(`- ${t}`)
    }
  }
  return lines.join('\n')
}

/** 解析 Markdown 为画布元素：标题→文本，任务项→卡片，列表/段落→便签。 */
export const markdownToElements = (md: string): BoardElement[] => {
  const lines = md.split(/\r?\n/)
  const els: BoardElement[] = []
  let y = 40
  const x = 40
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    const task = line.match(/^[-*]\s+\[([ xX])\]\s+(.*)$/)
    const heading = line.match(/^(#{1,6})\s+(.*)$/)
    const listItem = line.match(/^[-*]\s+(.*)$/)
    let el: BoardElement
    if (task) {
      el = baseElement('card', x, y)
      el.text = task[2]
      el.done = task[1].toLowerCase() === 'x'
      el.status = '待办'
    } else if (heading) {
      el = baseElement('text', x, y)
      el.text = heading[2]
      el.fontSize = Math.max(14, 28 - heading[1].length * 3)
      el.bold = true
    } else if (listItem) {
      el = baseElement('sticky', x, y)
      el.text = listItem[1]
    } else {
      el = baseElement('sticky', x, y)
      el.text = line
    }
    els.push(el)
    y += (el.h || 80) + 24
  }
  return els
}
