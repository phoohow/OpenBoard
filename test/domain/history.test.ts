import { describe, expect, it } from 'vitest'
import { HISTORY_LIMIT, commitFile, createDocState, redo, undo } from '@/domain/history'
import { board, el, file } from '@/domain/fixtures'

const withElements = (ids: string[]) => file([board(ids.map((id) => el('sticky', { id })))])

describe('history', () => {
  it('history 为 false 时不入栈、也不清空 redo', () => {
    const base = createDocState(withElements(['a']))
    const withRedo = { ...base, future: [withElements(['x']).boards[0].elements] }
    const next = commitFile(withRedo, withElements(['a', 'b']), false)

    expect(next.past).toHaveLength(0)
    expect(next.future).toBe(withRedo.future)
    expect(next.file.boards[0].elements).toHaveLength(2)
  })

  it('文件引用未变时原样返回', () => {
    const base = createDocState(withElements(['a']))
    expect(commitFile(base, base.file)).toBe(base)
  })

  it(`撤销栈超过 ${HISTORY_LIMIT} 条时截断最旧记录`, () => {
    const oldest = Array.from({ length: HISTORY_LIMIT }, (_, i) => [el('sticky', { id: `p${i}` })])
    const state = { ...createDocState(withElements(['a'])), past: oldest }
    const next = commitFile(state, withElements(['a', 'b']))

    expect(next.past).toHaveLength(HISTORY_LIMIT)
    expect(next.past[0]).toBe(oldest[1])
  })

  it('undo / redo 对称还原元素并搬运栈', () => {
    const before = withElements(['a'])
    const after = withElements(['a', 'b'])
    const committed = commitFile(createDocState(before), after)

    const undone = undo(committed)
    expect(undone.file.boards[0].elements.map((e) => e.id)).toEqual(['a'])
    expect(undone.past).toHaveLength(0)
    expect(undone.future).toHaveLength(1)

    const redone = redo(undone)
    expect(redone.file.boards[0].elements.map((e) => e.id)).toEqual(['a', 'b'])
    expect(redone.past).toHaveLength(1)
    expect(redone.future).toHaveLength(0)
  })

  it('栈空时 undo / redo 返回原状态', () => {
    const state = createDocState(withElements(['a']))
    expect(undo(state)).toBe(state)
    expect(redo(state)).toBe(state)
  })
})
