/** 画布装配辅助：把 DOM ref 直接接到 `dom` 模块对象，交互层与导出适配器无需 props 穿透。 */

import { useMemo } from 'react'
import { dom } from '../app-dom'

/** React ref 对象包装：写入即落到 `dom`。 */
const bind = <T,>(read: () => T | null, write: (node: T | null) => void) => ({
  get current() {
    return read()
  },
  set current(node: T | null) {
    write(node)
  },
})

export const useCanvasRefs = () =>
  useMemo(
    () => ({
      wrap: bind(() => dom.wrap, (node) => void (dom.wrap = node)),
      svg: bind(() => dom.svg, (node) => void (dom.svg = node)),
      content: bind(() => dom.content, (node) => void (dom.content = node)),
      defs: bind(() => dom.defs, (node) => void (dom.defs = node)),
    }),
    [],
  )
