/** SVG / PNG / PDF 导出：以画布真实渲染结果为源，保证导出与视觉一致。 */

import type { Bounds } from '@/geometry/primitives'
import { downloadBlob, downloadText } from './file'

const PAD = 40

const round = (n: number) => Math.round(n * 100) / 100

export const cloneContent = (content: SVGGElement, keepIds?: string[] | null): SVGGElement => {
  const clone = content.cloneNode(true) as SVGGElement
  clone.querySelectorAll('[data-ui]').forEach((node) => node.remove())
  if (keepIds) {
    const keep = new Set(keepIds)
    Array.from(clone.children).forEach((child) => {
      const id = child.getAttribute('data-id')
      if (id && !keep.has(id)) child.remove()
    })
  }
  clone.removeAttribute('transform')
  return clone
}

/** 以画布真实渲染结果为源，序列化出与视觉一致的独立 SVG。 */
export const buildExportSVG = (
  content: SVGGElement,
  defs: Element | null,
  bounds: Bounds,
  scale = 1,
  background: string | null = '#FFFFFF',
  keepIds?: string[] | null,
): string => {
  const clone = cloneContent(content, keepIds)

  const x = round(bounds.x - PAD)
  const y = round(bounds.y - PAD)
  const w = Math.max(1, round(bounds.w + PAD * 2))
  const h = Math.max(1, round(bounds.h + PAD * 2))
  const defsHtml = defs ? defs.outerHTML : ''
  const backgroundHtml = background
    ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${background}"/>`
    : ''

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${round(w * scale)}" height="${round(h * scale)}" viewBox="${x} ${y} ${w} ${h}">`,
    defsHtml,
    backgroundHtml,
    clone.outerHTML,
    '</svg>',
  ].join('')
}

export const exportSVGFile = (
  content: SVGGElement,
  defs: Element | null,
  bounds: Bounds,
  name: string,
  background: string | null = '#FFFFFF',
  keepIds?: string[] | null,
): void => {
  downloadText(`${name}.svg`, buildExportSVG(content, defs, bounds, 1, background, keepIds), 'image/svg+xml;charset=utf-8')
}

export const exportPNGFile = async (
  content: SVGGElement,
  defs: Element | null,
  bounds: Bounds,
  name: string,
  scale = 2,
  background: string | null = '#FFFFFF',
  keepIds?: string[] | null,
): Promise<void> => {
  const svg = buildExportSVG(content, defs, bounds, scale, background, keepIds)
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('图片渲染失败'))
    img.src = url
  })

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round((bounds.w + PAD * 2) * scale))
  canvas.height = Math.max(1, Math.round((bounds.h + PAD * 2) * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建导出画布')
  if (background) {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('PNG 导出失败')
  downloadBlob(`${name}.png`, blob)
}

/** 把画布内容在新窗口中打印，用户可在打印对话框选择「另存为 PDF」。 */
export const printBoard = (
  content: SVGGElement,
  defs: Element | null,
  bounds: Bounds,
  name: string,
  background: string | null = '#FFFFFF',
  keepIds?: string[] | null,
): void => {
  const svg = buildExportSVG(content, defs, bounds, 1, background, keepIds)
  const win = window.open('', '_blank')
  if (!win) throw new Error('浏览器拦截了弹出窗口，请允许后重试')
  const safe = name.replace(/[<>:"/\\|?*]+/g, '_').slice(0, 60) || 'OpenBoard'
  win.document.write(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${safe}</title>` +
      `<style>@page{margin:8mm}html,body{margin:0;padding:0}svg{display:block;width:100%;height:auto}</style>` +
      `</head><body>${svg}</body></html>`,
  )
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 350)
}
