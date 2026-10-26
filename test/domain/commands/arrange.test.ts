import { describe, expect, it } from 'vitest'
import { reduceArrange } from '@/domain/commands/arrange'
import { board, el } from '@/domain/fixtures'
import type { BoardElement } from '@/model/types'

const run = (elements: BoardElement[], cmd: Parameters<typeof reduceArrange>[1]) => {
  const next = reduceArrange(board(elements), cmd)
  if (!next) throw new Error('命令未被处理')
  return next.elements
}

const box = (id: string, x: number, y: number) => el('sticky', { id, x, y, w: 100, h: 100 })

describe('elements/align', () => {
  it('六向对齐都以选区包围盒为基准', () => {
    const list = [box('a', 0, 0), box('b', 50, 80)]
    expect(run(list, { type: 'elements/align', ids: ['a', 'b'], kind: 'left' }).map((e) => e.x)).toEqual([0, 0])
    expect(run(list, { type: 'elements/align', ids: ['a', 'b'], kind: 'right' }).map((e) => e.x)).toEqual([50, 50])
    expect(run(list, { type: 'elements/align', ids: ['a', 'b'], kind: 'hcenter' }).map((e) => e.x)).toEqual([25, 25])
    expect(run(list, { type: 'elements/align', ids: ['a', 'b'], kind: 'top' }).map((e) => e.y)).toEqual([0, 0])
    expect(run(list, { type: 'elements/align', ids: ['a', 'b'], kind: 'bottom' }).map((e) => e.y)).toEqual([80, 80])
    expect(run(list, { type: 'elements/align', ids: ['a', 'b'], kind: 'vcenter' }).map((e) => e.y)).toEqual([40, 40])
  })

  it('少于两个可对齐目标时不处理', () => {
    const locked = el('sticky', { id: 'b', locked: true })
    const cmd = { type: 'elements/align' as const, ids: ['a', 'b'], kind: 'left' as const }
    expect(reduceArrange(board([box('a', 0, 0), locked]), cmd)).toBeNull()
    expect(reduceArrange(board([box('a', 0, 0)]), cmd)).toBeNull()
  })

  it('连接线不参与对齐', () => {
    const line = el('connector', { id: 'l', x: 10, y: 10, w: 40, h: 0 })
    const next = run([box('a', 0, 0), box('b', 50, 0), line], {
      type: 'elements/align',
      ids: ['a', 'b', 'l'],
      kind: 'left',
    })
    expect(next.find((e) => e.id === 'l')?.x).toBe(10)
  })
})

describe('elements/distribute', () => {
  it('水平等距：保持首尾位置，中间补间距', () => {
    const list = [box('a', 0, 0), box('b', 30, 0), box('c', 200, 0)]
    const next = run(list, { type: 'elements/distribute', ids: ['a', 'b', 'c'], kind: 'horizontal' })
    expect(next.map((e) => e.x)).toEqual([0, 100, 200])
  })

  it('垂直等距：按 y 排序后重排', () => {
    /* 元素顺序为 c / a / b，坐标按 y 值重新分配 */
    const list = [box('c', 0, 200), box('a', 0, 0), box('b', 0, 30)]
    const next = run(list, { type: 'elements/distribute', ids: ['a', 'b', 'c'], kind: 'vertical' })
    expect(next.map((e) => e.y)).toEqual([200, 0, 100])
  })

  it('含旋转元素时使用旋转后的包围盒，且坐标有限', () => {
    const list = [
      el('sticky', { id: 'a', x: 0, y: 0, w: 100, h: 100 }),
      el('sticky', { id: 'b', x: 40, y: 0, w: 100, h: 40, rotation: 90 }),
      el('sticky', { id: 'c', x: 300, y: 0, w: 100, h: 100 }),
    ]
    const next = run(list, { type: 'elements/distribute', ids: ['a', 'b', 'c'], kind: 'horizontal' })
    const xs = next.map((e) => e.x)
    expect(xs.every((x) => Number.isFinite(x))).toBe(true)
    expect(xs[0]).toBeLessThan(xs[1])
    expect(xs[1]).toBeLessThan(xs[2])
  })

  it('少于三个目标时不处理', () => {
    const cmd = { type: 'elements/distribute' as const, ids: ['a', 'b'], kind: 'horizontal' as const }
    expect(reduceArrange(board([box('a', 0, 0), box('b', 100, 0)]), cmd)).toBeNull()
  })
})
