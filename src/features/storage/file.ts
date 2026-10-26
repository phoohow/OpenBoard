/** 多白板文件持久化：仅负责 localStorage IO，结构定义与归一化在 `@/domain/document`。 */

import { defaultFile, parseFile, type BoardsFile } from '@/domain/document'

const KEY = 'OpenBoard:v1'

export const loadFile = (): BoardsFile => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultFile()
    return parseFile(JSON.parse(raw))
  } catch {
    return defaultFile()
  }
}

export const saveFile = (file: BoardsFile): void => {
  localStorage.setItem(KEY, JSON.stringify(file))
}
