/** 表格命令：增删行列与表头开关。 */

import type { BoardDoc } from '../document'
import type { CommandMeta } from './meta'

export type TableAction = 'row+' | 'row-' | 'col+' | 'col-' | 'header'

export type TableCommand = ({ type: 'elements/table'; id: string; action: TableAction } & CommandMeta)

export const reduceTable = (board: BoardDoc, cmd: TableCommand): BoardDoc | null => {
  if (cmd.type !== 'elements/table') return null
  const target = board.elements.find((el) => el.id === cmd.id && el.kind === 'table')
  if (!target) return null
  return {
    ...board,
    elements: board.elements.map((el) => {
      if (el.id !== cmd.id || el.kind !== 'table') return el
      let rows = el.rows ?? 3
      let cols = el.cols ?? 4
      let cells = [...(el.cells ?? [])]
      if (cmd.action === 'row+') {
        rows += 1
        for (let i = 0; i < cols; i += 1) cells.push('')
      }
      if (cmd.action === 'row-' && rows > 1) {
        rows -= 1
        cells = cells.slice(0, rows * cols)
      }
      if (cmd.action === 'col+') {
        const next: string[] = []
        for (let r = 0; r < rows; r += 1) {
          for (let c = 0; c < cols; c += 1) next.push(cells[r * cols + c] ?? '')
          next.push('')
        }
        cols += 1
        cells = next
      }
      if (cmd.action === 'col-' && cols > 1) {
        const next: string[] = []
        for (let r = 0; r < rows; r += 1) {
          for (let c = 0; c < cols - 1; c += 1) next.push(cells[r * cols + c] ?? '')
        }
        cols -= 1
        cells = next
      }
      return {
        ...el,
        rows,
        cols,
        cells,
        header: cmd.action === 'header' ? !el.header : el.header,
      }
    }),
  }
}
