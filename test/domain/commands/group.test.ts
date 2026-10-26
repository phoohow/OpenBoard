import { describe, expect, it } from 'vitest'
import { reduceGroup } from '@/domain/commands/group'
import { board, el } from '@/domain/fixtures'

const run = (cmd: Parameters<typeof reduceGroup>[1], elements = [el('sticky', { id: 'a' }), el('sticky', { id: 'b' })]) => {
  const next = reduceGroup(board(elements), cmd)
  if (!next) throw new Error('命令未被处理')
  return next.elements
}

describe('elements/group', () => {
  it('成组写入同一个 groupId', () => {
    const next = run({ type: 'elements/group', ids: ['a', 'b'], groupId: 'g1' })
    expect(next.map((e) => e.groupId)).toEqual(['g1', 'g1'])
  })

  it('锁定元素不参与成组', () => {
    const locked = el('sticky', { id: 'b', locked: true })
    const next = run({ type: 'elements/group', ids: ['a', 'b'], groupId: 'g1' }, [el('sticky', { id: 'a' }), locked])
    expect(next[0].groupId).toBe('g1')
    expect(next[1].groupId).toBeUndefined()
  })

  it('解组清空 groupId（不受锁定限制）', () => {
    const list = [el('sticky', { id: 'a', groupId: 'g1' }), el('sticky', { id: 'b', groupId: 'g1', locked: true })]
    const next = run({ type: 'elements/group', ids: ['a', 'b'], groupId: null }, list)
    expect(next.map((e) => e.groupId)).toEqual([undefined, undefined])
  })

  it('空选择不处理', () => {
    expect(reduceGroup(board([]), { type: 'elements/group', ids: [], groupId: 'g1' })).toBeNull()
  })
})
