/** 评论面板：评论列表、回复与已解决标记。 */

import { useEffect, useRef, useState } from 'react'
import { Check, MessageSquare, Trash2 } from 'lucide-react'
import type { BoardComment } from '@/model/types'

export const CommentPanel = (props: {
  items: BoardComment[]
  hasSelection: boolean
  autoFocus: boolean
  onSubmit: (text: string) => void
  onToggleResolved: (id: string) => void
  onRemove: (id: string) => void
}) => {
  const [draft, setDraft] = useState('')
  const ref = useRef<HTMLTextAreaElement | null>(null)
  useEffect(() => {
    if (props.autoFocus) ref.current?.focus()
  }, [props.autoFocus])
  const submit = () => {
    if (!draft.trim()) return
    props.onSubmit(draft)
    setDraft('')
  }
  return (
    <section>
      <h4>评论批注</h4>
      <textarea
        ref={ref}
        className="comment-input"
        value={draft}
        placeholder={props.hasSelection ? '写下对选中元素的评论…' : '先选中一个元素再写评论'}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
          }
        }}
      />
      <div className="btn-row">
        <button type="button" className="chip wide" onClick={submit} disabled={!draft.trim() || !props.hasSelection}>
          <MessageSquare size={13} /> 添加评论
        </button>
      </div>
      <ul className="comment-list">
        {props.items.map((c) => (
          <li key={c.id} className={c.resolved ? 'resolved' : undefined}>
            <p>{c.text}</p>
            <em>{new Date(c.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</em>
            <button type="button" className="icon-btn sm" title={c.resolved ? '重新打开' : '标记已解决'} onClick={() => props.onToggleResolved(c.id)}>
              <Check size={13} />
            </button>
            <button type="button" className="icon-btn sm danger" title="删除" onClick={() => props.onRemove(c.id)}>
              <Trash2 size={13} />
            </button>
          </li>
        ))}
      </ul>
      {!props.items.length && <span className="preset-note">还没有评论。用 D 键切换到评论工具，点击元素即可批注。</span>}
    </section>
  )
}
