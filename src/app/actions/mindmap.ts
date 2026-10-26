/** 思维导图动作：新增节点、折叠、切换布局与主题。 */

import { MIND_NODE_TEXT, uid } from '@/model/factories'
import type { MindLayout, MindTheme } from '@/model/types'
import { mindNodesOf, mindRootIdOf } from '@/domain/mindmap/tree'
import { detectMindTheme } from '@/domain/commands/mindmap'
import { currentElements } from '@/domain/selectors'
import { dispatch, getState } from '../store'
import { toast } from './ui'

export { detectMindTheme }

/** 选中元素所属的导图根 id。 */
const selectedRootId = (): string | null => {
  const { ui } = getState()
  const elements = currentElements(getState())
  for (const id of ui.selection) {
    const rootId = mindRootIdOf(elements, id)
    if (rootId) return rootId
  }
  return null
}

export const addMindNode = (sourceId: string, mode: 'child' | 'sibling'): void => {
  const id = uid()
  dispatch(
    { type: 'mindmap/addNode', sourceId, mode, id },
    { type: 'ui/selection', value: [id] },
    { type: 'ui/editing', value: { id, value: MIND_NODE_TEXT } },
    { type: 'ui/selectAll', value: true },
  )
}

export const toggleMindCollapse = (id: string): void => {
  const target = currentElements(getState()).find((el) => el.id === id)
  if (!target || target.kind !== 'mindnode') return
  if (!mindNodesOf(currentElements(getState())).some((el) => el.parent === id)) {
    toast('该节点还没有子节点', 'error')
    return
  }
  dispatch({ type: 'mindmap/collapse', id })
  toast(target.collapsed ? '已展开子树' : '已折叠子树')
}

export const setMindLayout = (layout: MindLayout): void => {
  const rootId = selectedRootId()
  if (!rootId) return
  dispatch({ type: 'mindmap/layout', rootId, layout })
  toast(`导图布局已切换为${{ right: '向右', left: '向左', both: '两侧', topdown: '树状' }[layout]}`)
}

export const applyThemeToMindmap = (theme: MindTheme): void => {
  const rootId = selectedRootId()
  if (!rootId) return
  dispatch({ type: 'mindmap/theme', rootId, theme })
  toast(`已套用「${{ grape: '葡萄', forest: '森林', sunset: '日落', ocean: '海洋', slate: '岩灰', candy: '糖果' }[theme]}」主题`)
}
