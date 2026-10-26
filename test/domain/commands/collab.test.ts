import { describe, expect, it } from 'vitest'
import { reduceCollab } from '@/domain/commands/collab'
import { board, el } from '@/domain/fixtures'
import type { BoardDoc } from '@/domain/document'
import type { BoardComment, RouteStop } from '@/model/types'

const comment = (id: string, resolved = false): BoardComment => ({
  id,
  text: `批注 ${id}`,
  createdAt: 1,
  resolved,
})

const stop = (id: string): RouteStop => ({ id, label: id, x: 0, y: 0, zoom: 1 })

const run = (source: BoardDoc, cmd: Parameters<typeof reduceCollab>[1]) => {
  const next = reduceCollab(source, cmd)
  if (!next) throw new Error('命令未被处理')
  return next
}

describe('comment/…', () => {
  it('新增、切换解决状态与删除', () => {
    const added = run(board([]), { type: 'comment/add', comment: comment('c1') })
    expect(added.comments).toHaveLength(1)

    const toggled = run(added, { type: 'comment/toggle', id: 'c1' })
    expect(toggled.comments?.[0].resolved).toBe(true)

    const removed = run(toggled, { type: 'comment/remove', id: 'c1' })
    expect(removed.comments).toHaveLength(0)
  })
})

describe('vote/…', () => {
  it('投票累加，清零只影响有票数的元素', () => {
    const source = board([el('sticky', { id: 's1' }), el('sticky', { id: 's2', votes: 3 })])
    const once = run(source, { type: 'vote/cast', id: 's1' })
    const twice = run(once, { type: 'vote/cast', id: 's1' })
    expect(twice.elements[0].votes).toBe(2)

    const reset = run(twice, { type: 'vote/reset' })
    expect(reset.elements.map((e) => e.votes)).toEqual([0, 0])
  })
})

describe('route/…', () => {
  it('新增、删除、调整顺序与清空', () => {
    const added = run(board([]), { type: 'route/add', stop: stop('s1') })
    const addedAgain = run(added, { type: 'route/add', stop: stop('s2') })
    expect(addedAgain.route?.map((s) => s.id)).toEqual(['s1', 's2'])

    const moved = run(addedAgain, { type: 'route/move', id: 's2', dir: -1 })
    expect(moved.route?.map((s) => s.id)).toEqual(['s2', 's1'])

    const removed = run(moved, { type: 'route/remove', id: 's2' })
    expect(removed.route?.map((s) => s.id)).toEqual(['s1'])

    expect(run(removed, { type: 'route/clear' }).route).toEqual([])
  })

  it('越界移动返回 null，不产生新状态', () => {
    const source = board([], { route: [stop('s1')] })
    expect(reduceCollab(source, { type: 'route/move', id: 's1', dir: 1 })).toBeNull()
    expect(reduceCollab(source, { type: 'route/move', id: 'nope', dir: 1 })).toBeNull()
  })
})
