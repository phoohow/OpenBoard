/** 文本测量与布局：按中文断字、英文断词换行，并计算绘制锚点。 */

import type { BoardElement } from '@/model/types'

const isWide = (code: number) => code > 0x2e7f

/** 单字符宽度：宽字符（中日韩）按字号计，其余按 0.55 字号估算。 */
const charWidth = (code: number, fontSize: number, narrowRatio = 0.55) =>
  isWide(code) ? fontSize : fontSize * narrowRatio

/** 估算单行文本宽度，用于徽标、卡片与导图节点排布。 */
export const estimateWidth = (text: string, fontSize: number, narrowRatio = 0.55): number =>
  [...text].reduce((sum, ch) => sum + charWidth(ch.codePointAt(0) ?? 32, fontSize, narrowRatio), 0)

/** 按可用宽度截断文本并追加省略号。 */
export const clipText = (text: string, fontSize: number, maxWidth: number): string => {
  let out = ''
  let width = 0
  for (const ch of text) {
    const cw = charWidth(ch.codePointAt(0) ?? 32, fontSize)
    if (width + cw > maxWidth) return `${out}…`
    width += cw
    out += ch
  }
  return out
}

/** 中文按字断行，英文按词断行。 */
export const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
  const out: string[] = []
  for (const paragraph of text.split('\n')) {
    if (!paragraph) {
      out.push('')
      continue
    }
    let line = ''
    let width = 0
    let word = ''
    let wordWidth = 0
    const pushWord = () => {
      if (width + wordWidth > maxWidth && line) {
        out.push(line)
        line = ''
        width = 0
      }
      line += word
      width += wordWidth
      word = ''
      wordWidth = 0
    }
    for (const ch of paragraph) {
      const code = ch.codePointAt(0) ?? 32
      const cw = charWidth(code, fontSize)
      if (ch === ' ') {
        if (word) pushWord()
        if (line) {
          line += ' '
          width += cw
        }
        continue
      }
      if (isWide(code)) {
        if (word) pushWord()
        if (width + cw > maxWidth && line) {
          out.push(line)
          line = ''
          width = 0
        }
        line += ch
        width += cw
        continue
      }
      word += ch
      wordWidth += cw
    }
    if (word) pushWord()
    out.push(line)
  }
  return out
}

export interface TextLayout {
  lines: string[]
  lineHeight: number
  x: number
  anchor: 'start' | 'middle' | 'end'
  firstY: number
}

export const layoutText = (el: BoardElement): TextLayout => {
  const pad = el.kind === 'text' ? 0 : 16
  const maxWidth = Math.max(12, el.w - pad * 2)
  const lines = wrapText(el.text ?? '', maxWidth, el.fontSize)
  const lineHeight = el.fontSize * 1.35
  const total = Math.max(lineHeight, lines.length * lineHeight)
  const top =
    el.kind === 'text'
      ? el.y + lineHeight * 0.25
      : el.y + Math.max(lineHeight * 0.25, (el.h - total) / 2 + lineHeight * 0.25)
  return {
    lines,
    lineHeight,
    x: el.align === 'center' ? el.x + el.w / 2 : el.align === 'right' ? el.x + el.w - pad : el.x + pad,
    anchor: el.align === 'center' ? 'middle' : el.align === 'right' ? 'end' : 'start',
    firstY: el.kind === 'text' ? el.y + el.fontSize : top + el.fontSize,
  }
}

/** 依据文本内容自动增高，避免文字溢出容器。 */
export const autoHeight = (el: BoardElement): number => {
  if (el.kind !== 'sticky' && el.kind !== 'text') return el.h
  const layout = layoutText(el)
  const needed = layout.lines.length * layout.lineHeight + (el.kind === 'sticky' ? 32 : 12)
  return Math.max(el.kind === 'sticky' ? 96 : el.fontSize * 1.6, Math.round(needed))
}
