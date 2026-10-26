import { describe, expect, it } from 'vitest'
import { reduce, reduceDoc } from '@/domain/reduce'
import type { Command } from '@/domain/commands/command'
import { createDocState } from '@/domain/history'
import { board, el, file, state } from '@/domain/fixtures'

const unknown = { type: 'nothing/here' } as unknown as Command

describe('reduce 基础性质', () => {
  it('未知命令原样返回同一状态对象', () => {
    const before = state([el('sticky', { id: 'a' })])
    expect(reduce(before, unknown)).toBe(before)
  })

  it('不可变：原状态与其中的数组都不被修改', () => {
    const before = state([el('sticky', { id: 'a' })])
    const snapshotElements = before.file.boards[0].elements
    const snapshotBoards = before.file.boards

    reduce(before, { type: 'elements/add', elements: [el('sticky', { id: 'b' })] })

    expect(before.file.boards).toBe(snapshotBoards)
    expect(before.file.boards[0].elements).toBe(snapshotElements)
    expect(before.file.boards[0].elements).toHaveLength(1)
  })

  it('文档命令刷新 updatedAt；view/set 不刷新', () => {
    const before = state([el('sticky', { id: 'a' })])
    const added = reduce(before, { type: 'elements/add', elements: [el('sticky', { id: 'b' })] })
    expect(added.file.boards[0].updatedAt).toBeGreaterThan(1)

    const moved = reduce(added, { type: 'view/set', view: { x: 10, y: 20, zoom: 2 }, history: false })
    expect(moved.file.boards[0].updatedAt).toBe(added.file.boards[0].updatedAt)
    expect(moved.file.boards[0].view).toEqual({ x: 10, y: 20, zoom: 2 })
  })

  it('界面命令只改 ui 分片，不透支文档引用', () => {
    const before = state([el('sticky', { id: 'a' })])
    const next = reduce(before, { type: 'ui/selection', value: ['a'] })
    expect(next.ui.selection).toEqual(['a'])
    expect(next.file).toBe(before.file)
  })

  it('界面命令写入同值时返回同一状态', () => {
    const before = state([])
    expect(reduce(before, { type: 'ui/tool', value: before.ui.tool })).toBe(before)
  })

  it('提示与保存状态走状态命令', () => {
    const before = state([])
    const withToast = reduce(before, { type: 'ui/toast', toast: { id: 1, text: 'hi', tone: 'info' } })
    expect(withToast.toasts).toHaveLength(1)
    const dismissed = reduce(withToast, { type: 'ui/toastDismiss', id: 1 })
    expect(dismissed.toasts).toHaveLength(0)
    expect(reduce(before, { type: 'ui/saveStatus', status: 'saving' }).saveStatus).toBe('saving')
    expect(reduce(before, { type: 'ui/busy', busy: '导出中' }).busy).toBe('导出中')
  })
})

describe('reduceDoc 历史语义', () => {
  it('默认入栈，history:false 的命令不入栈', () => {
    const base = createDocState(file([board([el('sticky', { id: 'a' })])]))
    const withElement = reduceDoc(base, { type: 'elements/add', elements: [el('sticky', { id: 'b' })] })
    expect(withElement.past).toHaveLength(1)

    const comment = reduceDoc(withElement, {
      type: 'comment/add',
      comment: { id: 'c1', text: '看看这里', createdAt: 1, resolved: false },
      history: false,
    })
    expect(comment.past).toHaveLength(1)
    expect(comment.file.boards[0].comments).toHaveLength(1)
  })

  it('切换白板清空撤销栈与重做栈', () => {
    const first = board([el('sticky', { id: 'a' })])
    const second = board([], { id: 'board-2', name: '第二块' })
    const base = { ...createDocState(file([first, second])), past: [first.elements], future: [first.elements] }

    const next = reduceDoc(base, { type: 'board/select', id: 'board-2' })
    expect(next.file.activeId).toBe('board-2')
    expect(next.past).toHaveLength(0)
    expect(next.future).toHaveLength(0)
  })

  it('空命令不改变状态引用', () => {
    const base = createDocState(file([board([el('sticky', { id: 'a' })])]))
    const withElement = reduceDoc(base, { type: 'elements/add', elements: [el('sticky', { id: 'b' })] })
    const undone = reduceDoc(withElement, { type: 'elements/add', elements: [], history: false })
    expect(undone).toBe(withElement)
  })
})
