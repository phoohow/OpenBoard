import { describe, expect, it } from 'vitest'
import { reduceElements } from '@/domain/commands/elements'
import { board, el } from '@/domain/fixtures'
import type { BoardElement } from '@/model/types'

const apply = (elements: BoardElement[], cmd: Parameters<typeof reduceElements>[1]) => {
  const next = reduceElements(board(elements), cmd)
  if (!next) throw new Error('命令未被处理')
  return next.elements
}

const ids = (elements: BoardElement[]) => elements.map((e) => e.id)

describe('elements/…', () => {
  it('add 追加到末尾', () => {
    const a = el('sticky', { id: 'a' })
    const b = el('sticky', { id: 'b' })
    expect(ids(apply([a], { type: 'elements/add', elements: [b] }))).toEqual(['a', 'b'])
  })

  it('set 整体替换', () => {
    const next = apply([el('sticky', { id: 'a' })], { type: 'elements/set', elements: [el('text', { id: 'z' })] })
    expect(ids(next)).toEqual(['z'])
  })

  it('patch 默认跳过锁定元素，传 false 时一并修改', () => {
    const a = el('sticky', { id: 'a', locked: true })
    const b = el('sticky', { id: 'b' })
    const kept = apply([a, b], { type: 'elements/patch', ids: ['a', 'b'], patch: { fill: '#000' }, skipLocked: true })
    expect(kept.map((e) => e.fill)).toEqual([a.fill, '#000'])

    const forced = apply([a, b], { type: 'elements/patch', ids: ['a'], patch: { fill: '#111' } })
    expect(forced[0].fill).toBe('#111')
  })

  it('remove 连带删除导图子树与相关连接线', () => {
    const root = el('mindnode', { id: 'r', rootId: 'r' })
    const child = el('mindnode', { id: 'c', parent: 'r', rootId: 'r' })
    const grand = el('mindnode', { id: 'g', parent: 'c', rootId: 'r' })
    const line = el('connector', { id: 'l', from: 'r', to: 'c' })
    const other = el('sticky', { id: 'o' })

    expect(ids(apply([root, child, grand, line, other], { type: 'elements/remove', ids: ['r'] }))).toEqual(['o'])
  })

  it('remove 关闭 cascade 时只删自身', () => {
    const root = el('mindnode', { id: 'r', rootId: 'r' })
    const child = el('mindnode', { id: 'c', parent: 'r', rootId: 'r' })
    const next = apply([root, child], { type: 'elements/remove', ids: ['r'], cascadeMind: false })
    expect(ids(next)).toEqual(['c'])
  })

  it('reorder 置顶与置底', () => {
    const list = ['a', 'b', 'c'].map((id) => el('sticky', { id }))
    expect(ids(apply(list, { type: 'elements/reorder', ids: ['b'], direction: 'front' }))).toEqual(['a', 'c', 'b'])
    expect(ids(apply(list, { type: 'elements/reorder', ids: ['b'], direction: 'back' }))).toEqual(['b', 'a', 'c'])
  })

  it('moveLayer 越过相邻的非选中元素', () => {
    const list = ['a', 'b', 'c'].map((id) => el('sticky', { id }))
    expect(ids(apply(list, { type: 'elements/moveLayer', ids: ['a'], dir: 'up' }))).toEqual(['b', 'a', 'c'])
    expect(ids(apply(list, { type: 'elements/moveLayer', ids: ['c'], dir: 'down' }))).toEqual(['a', 'c', 'b'])
    /* 已在顶层时不越界 */
    expect(ids(apply(list, { type: 'elements/moveLayer', ids: ['c'], dir: 'up' }))).toEqual(['a', 'b', 'c'])
  })

  it('rotate 归一化角度到 -180 ~ 180 并跳过锁定元素', () => {
    const a = el('sticky', { id: 'a' })
    const b = el('sticky', { id: 'b', locked: true })
    const next = apply([a, b], { type: 'elements/rotate', ids: ['a', 'b'], deg: 270 })
    expect(next[0].rotation).toBe(-90)
    expect(next[1].rotation).toBe(b.rotation)
  })

  it('replaceText 写入便签文本并按内容撑高', () => {
    const sticky = el('sticky', { id: 'a', w: 200, h: 160, text: '' })
    const next = apply([sticky], { type: 'elements/replaceText', id: 'a', value: '很长的便签内容'.repeat(20) })
    expect(next[0].text).toHaveLength(140)
    expect(next[0].h).toBeGreaterThan(160)
  })

  it('replaceText 命中表格单元格', () => {
    const table = el('table', { id: 't', cells: Array.from({ length: 16 }, (_, i) => `c${i}`) })
    const next = apply([table], { type: 'elements/replaceText', id: 't', value: '新值', cell: 5 })
    expect(next[0].cells?.[5]).toBe('新值')
    expect(next[0].cells?.[4]).toBe('c4')
  })

  it('未知命令返回 null，交由下一个 reducer 认领', () => {
    const cmd = { type: 'elements/nope' } as unknown as Parameters<typeof reduceElements>[1]
    expect(reduceElements(board([]), cmd)).toBeNull()
  })
})
