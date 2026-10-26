/** 卡片面板：标题、状态与描述编辑。 */

import { Check, CircleCheck } from 'lucide-react'
import type { BoardElement } from '@/model/types'
import { Field } from '../common/fields'

export const CardPanel = ({
  card,
  onPatch,
}: {
  card: BoardElement
  onPatch: (patch: Partial<BoardElement>) => void
}) => (
  <>
    <Field label="标题" value={card.text ?? ''} placeholder="任务或文档标题" onCommit={(text) => onPatch({ text })} />
    <Field label="描述" value={card.desc ?? ''} placeholder="补充信息" onCommit={(desc) => onPatch({ desc })} />
    <Field label="负责人" value={card.owner ?? ''} placeholder="未指定" onCommit={(owner) => onPatch({ owner })} />
    <Field label="截止" value={card.due ?? ''} placeholder="例如 11-03" onCommit={(due) => onPatch({ due })} />
    <span className="preset-note">状态</span>
    <div className="btn-row wrap">
      {['待开始', '进行中', '评审中', '已阻塞', '已完成'].map((label) => (
        <button
          key={label}
          type="button"
          className={card.status === label ? 'chip wide active' : 'chip wide'}
          onClick={() => onPatch({ status: label })}
        >
          {label}
        </button>
      ))}
    </div>
    <button
      type="button"
      className={card.done ? 'chip wide active' : 'chip wide'}
      onClick={() => onPatch({ done: !card.done })}
    >
      {card.done ? <CircleCheck size={14} /> : <Check size={14} />}
      {card.done ? '标记为已完成' : '标记为未完成'}
    </button>
    <span className="preset-note">双击画布上的卡片可直接编辑标题。</span>
  </>
)
