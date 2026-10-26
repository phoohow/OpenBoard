/** 画布快捷键：全局键盘事件直接映射到动作，不依赖 React 渲染闭包。 */

import type { Tool } from '@/model/types'
import { currentElements, presentItems, selectedElements } from '@/domain/selectors'
import { dispatch, getState } from '../store'
import {
  setDialog,
  setLaserOn,
  setPresenting,
  setSelection,
  setSpaceDown,
  setTool,
} from '../actions/ui'
import { commitEdit, startEdit } from '../actions/text'
import { addMindNode } from '../actions/mindmap'
import { copySelection, deleteSelection, duplicateSelection, groupSelection, pasteClipboard, toggleLock } from '../actions/elements'
import { fitToContent, zoomCenter } from '../actions/viewport'
import { rollPresentStep } from '../actions/present'

const TOOL_KEYS: Record<string, Tool> = {
  v: 'select',
  h: 'hand',
  n: 'sticky',
  t: 'text',
  s: 'shape',
  c: 'connector',
  d: 'comment',
  f: 'frame',
  p: 'pen',
  e: 'eraser',
  m: 'mind',
  r: 'table',
  k: 'card',
}

const isTyping = (target: EventTarget | null): boolean => {
  const node = target as HTMLElement | null
  return !!node && (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA' || node.isContentEditable)
}

const onKeyDown = (e: KeyboardEvent): void => {
  const { ui } = getState()
  const typing = isTyping(e.target)

  if (e.key === 'Escape') {
    if (ui.editing) {
      e.preventDefault()
      commitEdit()
      return
    }
    if (ui.dialog) setDialog(null)
    else if (ui.confirm) dispatch({ type: 'ui/confirm', value: null })
    else if (ui.presenting) setPresenting(false)
    else setSelection([])
    return
  }

  if (e.code === 'Space' && !typing) {
    if (!ui.spaceDown) setSpaceDown(true)
    e.preventDefault()
    return
  }

  if (typing) return

  const mod = e.ctrlKey || e.metaKey
  if (mod) {
    const key = e.key.toLowerCase()
    if (key === 'z') {
      e.preventDefault()
      dispatch({ type: e.shiftKey ? 'history/redo' : 'history/undo' })
    } else if (key === 'y') {
      e.preventDefault()
      dispatch({ type: 'history/redo' })
    } else if (key === 'd') {
      e.preventDefault()
      duplicateSelection()
    } else if (key === 'a') {
      e.preventDefault()
      setSelection(currentElements(getState()).filter((el) => !el.locked).map((el) => el.id))
    } else if (key === 'c') {
      e.preventDefault()
      copySelection(false)
    } else if (key === 'x') {
      e.preventDefault()
      copySelection(true)
    } else if (key === 'v') {
      e.preventDefault()
      pasteClipboard()
    } else if (key === 'l') {
      e.preventDefault()
      toggleLock()
    } else if (key === 'g') {
      e.preventDefault()
      groupSelection(e.shiftKey)
    } else if (e.key === '=' || e.key === '+') {
      e.preventDefault()
      zoomCenter(1.2)
    } else if (e.key === '-') {
      e.preventDefault()
      zoomCenter(1 / 1.2)
    }
    return
  }

  if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault()
    deleteSelection()
    return
  }

  // 思维导：Tab 建子节点、Enter 建同级节点
  if (e.key === 'Tab' || e.key === 'Enter') {
    const picked = selectedElements(getState())
    const node = picked.length === 1 && picked[0].kind === 'mindnode' ? picked[0] : null
    if (node) {
      e.preventDefault()
      addMindNode(node.id, e.key === 'Tab' ? 'child' : 'sibling')
      return
    }
  }

  const picked = selectedElements(getState())
  if (picked.length === 1 && picked[0].kind === 'mindnode' && e.key === 'F2') {
    e.preventDefault()
    startEdit(picked[0])
    return
  }

  if (e.key.startsWith('Arrow')) {
    const step = e.shiftKey ? 10 : 1
    const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
    const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
    if (!ui.selection.length) return
    e.preventDefault()
    dispatch({
      type: 'elements/set',
      elements: currentElements(getState()).map((el) =>
        ui.selection.includes(el.id) && el.kind !== 'connector' ? { ...el, x: el.x + dx, y: el.y + dy } : el,
      ),
    })
    return
  }

  if (e.shiftKey && (e.key === '!' || e.key === '1')) {
    e.preventDefault()
    fitToContent()
    return
  }

  if (ui.presenting) {
    const total = presentItems(getState()).length
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault()
      rollPresentStep(1, total)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      rollPresentStep(-1, total)
    } else if (e.key.toLowerCase() === 'l') {
      e.preventDefault()
      setLaserOn(!ui.laserOn)
    }
    return
  }

  const next = TOOL_KEYS[e.key.toLowerCase()]
  if (next) setTool(next)
}

const onKeyUp = (e: KeyboardEvent): void => {
  if (e.code === 'Space') setSpaceDown(false)
}

/** 安装全局键盘监听，返回卸载函数。 */
export const installKeyboard = (): (() => void) => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  return () => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
  }
}
