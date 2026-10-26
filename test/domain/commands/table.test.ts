import { describe, expect, it } from 'vitest'
import { reduceTable, type TableAction } from '@/domain/commands/table'
import { board, el } from '@/domain/fixtures'
import type { BoardDoc } from '@/domain/document'

const table = () => el('table', { id: 't', rows: 4, cols: 4, cells: Array.from({ length: 16 }, (_, i) => `c${i}`) })

const run = (action: TableAction, source: BoardDoc = board([table()])) => {
  const next = reduceTable(source, { type: 'elements/table', id: 't', action })
  if (!next) throw new Error('命令未被处理')
  return next.elements[0]
}

describe('elements/table', () => {
  it('row+ 追加一行空单元格', () => {
    const next = run('row+')
    expect(next.rows).toBe(5)
    expect(next.cells).toHaveLength(20)
    expect(next.cells?.slice(16)).toEqual(['', '', '', ''])
  })

  it('row- 截断到剩余行数，且不会减到 0 行', () => {
    expect(run('row-').cells).toHaveLength(12)
    expect(run('row-', board([el('table', { id: 't', rows: 1, cols: 2, cells: ['a', 'b'] })])).rows).toBe(1)
  })

  it('col+ 每行末尾插入空单元格', () => {
    const next = run('col+')
    expect(next.cols).toBe(5)
    expect(next.cells?.slice(0, 5)).toEqual(['c0', 'c1', 'c2', 'c3', ''])
    expect(next.cells?.slice(5, 10)).toEqual(['c4', 'c5', 'c6', 'c7', ''])
  })

  it('col- 删除每行最后一列', () => {
    const next = run('col-')
    expect(next.cols).toBe(3)
    expect(next.cells).toEqual(['c0', 'c1', 'c2', 'c4', 'c5', 'c6', 'c8', 'c9', 'c10', 'c12', 'c13', 'c14'])
  })

  it('header 切换表头样式', () => {
    expect(run('header').header).toBe(false)
    expect(run('header').header).toBe(false)
    const withHeader = run('header', board([el('table', { id: 't', header: false })]))
    expect(withHeader.header).toBe(true)
  })

  it('目标不是表格或不存在时不处理', () => {
    expect(reduceTable(board([el('sticky', { id: 't' })]), { type: 'elements/table', id: 't', action: 'row+' })).toBeNull()
    expect(reduceTable(board([]), { type: 'elements/table', id: 't', action: 'row+' })).toBeNull()
  })
})
