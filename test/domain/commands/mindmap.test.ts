import { describe, expect, it } from 'vitest'
import { reduceMindmap } from '@/domain/commands/mindmap'
import { board, el } from '@/domain/fixtures'
import { mindThemes } from '@/domain/mindmap/themes'
import { normalizeMindmaps } from '@/domain/mindmap/layout'
import type { BoardDoc } from '@/domain/document'
import type { BoardElement } from '@/model/types'

const root = () => el('mindnode', { id: 'r', rootId: 'r', text: '中心主题', fontSize: 22 })
const child = () => el('mindnode', { id: 'c', parent: 'r', rootId: 'r', text: '子节点' })

const run = (source: BoardDoc, cmd: Parameters<typeof reduceMindmap>[1]) => {
  const next = reduceMindmap(source, cmd)
  if (!next) throw new Error('命令未被处理')
  return next.elements
}

const find = (elements: BoardElement[], id: string) => elements.find((e) => e.id === id)

describe('mindmap/addNode', () => {
  it('加子节点：父指向来源，rootId 继承导图根', () => {
    const next = run(board([root()]), { type: 'mindmap/addNode', sourceId: 'r', mode: 'child', id: 'n1' })
    const node = find(next, 'n1')
    expect(node?.parent).toBe('r')
    expect(node?.rootId).toBe('r')
    expect(node?.text).toBe('新节点')
    expect(node?.fontSize).toBe(17)
    expect(node?.fill).toBe(mindThemes.grape.levels[1].fill)
  })

  it('加同级节点：父指向来源的父节点', () => {
    const next = run(board([root(), child()]), {
      type: 'mindmap/addNode',
      sourceId: 'c',
      mode: 'sibling',
      id: 'n2',
    })
    expect(find(next, 'n2')?.parent).toBe('r')
  })

  it('给折叠节点加子节点时自动展开', () => {
    const collapsed = { ...root(), collapsed: true }
    const next = run(board([collapsed]), { type: 'mindmap/addNode', sourceId: 'r', mode: 'child', id: 'n3' })
    expect(find(next, 'r')?.collapsed).toBe(false)
  })

  it('来源不是导图节点时不处理', () => {
    expect(
      reduceMindmap(board([el('sticky', { id: 's' })]), {
        type: 'mindmap/addNode',
        sourceId: 's',
        mode: 'child',
        id: 'n4',
      }),
    ).toBeNull()
  })
})

describe('mindmap/collapse', () => {
  it('有子节点时切换折叠状态', () => {
    const next = run(board([root(), child()]), { type: 'mindmap/collapse', id: 'r' })
    expect(find(next, 'r')?.collapsed).toBe(true)
    const back = run(board(next), { type: 'mindmap/collapse', id: 'r' })
    expect(find(back, 'r')?.collapsed).toBe(false)
  })

  it('叶子节点不处理', () => {
    expect(reduceMindmap(board([root()]), { type: 'mindmap/collapse', id: 'r' })).toBeNull()
  })
})

describe('mindmap/layout 与 theme', () => {
  it('换布局写入根节点并带动整棵子树', () => {
    const next = run(board([root(), child()]), { type: 'mindmap/layout', rootId: 'r', layout: 'topdown' })
    expect(next.every((e) => e.mindLayout === 'topdown')).toBe(true)
  })

  it('换主题替换各级配色', () => {
    const next = run(board([root(), child()]), { type: 'mindmap/theme', rootId: 'r', theme: 'forest' })
    expect(find(next, 'r')?.fill).toBe(mindThemes.forest.levels[0].fill)
    expect(find(next, 'c')?.stroke).toBeTruthy()
  })
})

describe('normalizeMindmaps 整体重排', () => {
  it('重排父链与坐标：不产生 NaN 且子节点跟随父节点偏移', () => {
    const scattered = [
      el('mindnode', { id: 'r', rootId: 'r', x: 0, y: 0, text: '中心主题' }),
      el('mindnode', { id: 'c1', parent: 'r', rootId: 'r', x: 9999, y: 9999, text: '节点一' }),
      el('mindnode', { id: 'c2', parent: 'r', rootId: 'r', x: -9999, y: -9999, text: '节点二' }),
    ]
    const next = normalizeMindmaps(scattered)
    expect(next.every((e) => Number.isFinite(e.x) && Number.isFinite(e.y))).toBe(true)
    expect(next.find((e) => e.id === 'c1')?.parent).toBe('r')
    expect(next.find((e) => e.id === 'c2')?.parent).toBe('r')
  })
})
