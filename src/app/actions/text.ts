/** 文本与表格动作：编辑态提交、单元格命中与表格结构变更。 */

import { clamp, type Point } from '@/geometry/primitives'
import type { BoardElement } from '@/model/types'
import { tableMetrics } from '@/model/factories'
import { dispatch, getState } from '../store'
import { selectedElements } from '@/domain/selectors'
import type { TableAction } from '@/domain/commands/command'

/** 命中表格中的单元格序号。 */
export const tableCellAt = (el: BoardElement, p: Point): number => {
  const { cols, rows } = tableMetrics(el)
  const col = clamp(Math.floor((p.x - el.x) / (el.w / cols)), 0, cols - 1)
  const row = clamp(Math.floor((p.y - el.y) / (el.h / rows)), 0, rows - 1)
  return row * cols + col
}

export const startTableCell = (el: BoardElement, index: number): void => {
  dispatch(
    { type: 'ui/selectAll', value: true },
    { type: 'ui/selection', value: [el.id] },
    { type: 'ui/editing', value: { id: el.id, value: el.cells?.[index] ?? '', cell: index } },
  )
}

export const startEdit = (el: BoardElement): void => {
  dispatch(
    { type: 'ui/selectAll', value: false },
    { type: 'ui/selection', value: [el.id] },
    { type: 'ui/editing', value: { id: el.id, value: el.text ?? '' } },
  )
}

/** 提交编辑态：写回文本或单元格，并按内容重算自动高度（由 domain 完成）。 */
export const commitEdit = (): void => {
  const editing = getState().ui.editing
  if (!editing) return
  dispatch(
    { type: 'elements/replaceText', id: editing.id, value: editing.value, cell: editing.cell },
    { type: 'ui/editing', value: null },
  )
}

export const modifyTable = (action: TableAction): void => {
  const target = selectedElements(getState()).find((el) => el.kind === 'table')
  if (!target) return
  dispatch({ type: 'elements/table', id: target.id, action })
}
