/** 协作动作：评论批注与便签投票。 */

import type { Point } from '@/geometry/primitives'
import { uid } from '@/model/factories'
import type { BoardComment } from '@/model/types'
import { currentElements } from '@/domain/selectors'
import { dispatch, getState } from '../store'
import { toast } from './ui'

export const addComment = (elementId: string | null, text: string, point?: Point): void => {
  const value = text.trim()
  if (!value) return
  const comment: BoardComment = { id: uid(), text: value, createdAt: Date.now(), resolved: false }
  if (elementId) comment.elementId = elementId
  if (!elementId && point) {
    comment.x = point.x
    comment.y = point.y
  }
  dispatch({ type: 'comment/add', comment, history: false })
  toast('已添加评论')
}

export const toggleCommentResolved = (id: string): void => {
  dispatch({ type: 'comment/toggle', id, history: false })
}

export const removeComment = (id: string): void => {
  dispatch({ type: 'comment/remove', id, history: false })
}

export const castVote = (elementId: string): void => {
  const target = currentElements(getState()).find((el) => el.id === elementId)
  dispatch({ type: 'vote/cast', id: elementId })
  toast(`「${(target?.text ?? '').slice(0, 12) || '便签'}」+1 票`)
}

export const resetVotes = (): void => {
  dispatch({ type: 'vote/reset' })
  toast('票数已清零')
}
