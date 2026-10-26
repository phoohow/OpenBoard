/** 左侧工具条：选择、抓手、便签、文本、图形、连线、画笔等创作工具。 */

import type { ReactNode } from 'react'
import {
  ArrowRight,
  Brain,
  ClipboardList,
  Eraser,
  Frame,
  Hand,
  MessageSquare,
  MousePointer2,
  Pencil,
  Square,
  StickyNote,
  Table,
  Type,
} from 'lucide-react'

export const ToolRail = (props: {
  tool: string
  onTool: (tool: string) => void
  disabled?: boolean
}) => {
  const tools: { id: string; label: string; icon: ReactNode; key: string }[] = [
    { id: 'select', label: '选择', icon: <MousePointer2 size={18} />, key: 'V' },
    { id: 'hand', label: '抓手', icon: <Hand size={18} />, key: 'H' },
    { id: 'sticky', label: '便签', icon: <StickyNote size={18} />, key: 'N' },
    { id: 'text', label: '文本', icon: <Type size={18} />, key: 'T' },
    { id: 'shape', label: '图形', icon: <Square size={18} />, key: 'S' },
    { id: 'connector', label: '连接线', icon: <ArrowRight size={18} />, key: 'C' },
    { id: 'pen', label: '画笔', icon: <Pencil size={18} />, key: 'P' },
    { id: 'eraser', label: '橡皮', icon: <Eraser size={18} />, key: 'E' },
    { id: 'table', label: '表格', icon: <Table size={18} />, key: 'R' },
    { id: 'card', label: '卡片', icon: <ClipboardList size={18} />, key: 'K' },
    { id: 'comment', label: '评论', icon: <MessageSquare size={18} />, key: 'D' },
    { id: 'mind', label: '思维导图', icon: <Brain size={18} />, key: 'M' },
    { id: 'frame', label: '容器', icon: <Frame size={18} />, key: 'F' },
  ]
  return (
    <div className="tool-rail" role="toolbar" aria-label="创作工具">
      {tools.map((t) => (
        <button
          key={t.id}
          type="button"
          className={props.tool === t.id ? 'tool-btn active' : 'tool-btn'}
          disabled={props.disabled}
          onClick={() => props.onTool(t.id)}
          title={`${t.label} (${t.key})`}
        >
          {t.icon}
          <span className="tool-tip">
            {t.label} · {t.key}
          </span>
        </button>
      ))}
    </div>
  )
}
