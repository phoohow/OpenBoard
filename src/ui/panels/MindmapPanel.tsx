/** 导图面板：布局方向与主题切换。 */

import { MIND_THEMES, mindThemes } from '@/domain/mindmap/themes'
import type { MindLayout, MindTheme } from '@/model/types'

export const MindmapPanel = ({
  layout,
  theme,
  collapsed,
  hasChildren,
  onLayout,
  onTheme,
  onToggleCollapse,
}: {
  layout: MindLayout
  theme: MindTheme
  collapsed: boolean
  hasChildren: boolean
  onLayout: (layout: MindLayout) => void
  onTheme: (theme: MindTheme) => void
  onToggleCollapse: () => void
}) => (
  <>
    <span className="preset-note">布局方式</span>
    <div className="btn-row wrap">
      {([
        ['right', '向右', '向右'],
        ['left', '向左', '向左'],
        ['both', '两侧', '两侧'],
        ['topdown', '树状', '树状'],
      ] as [MindLayout, string, string][]).map(([id, label]) => (
        <button key={id} type="button" className={layout === id ? 'chip wide active' : 'chip wide'} onClick={() => onLayout(id)}>
          {label}
        </button>
      ))}
    </div>
    <span className="preset-note">主题配色</span>
    <div className="btn-row wrap">
      {MIND_THEMES.map((id) => (
        <button key={id} type="button" className={theme === id ? 'chip wide active' : 'chip wide'} onClick={() => onTheme(id)}>
          <span
            className="theme-dot"
            style={{ background: mindThemes[id].levels[0].fill, borderColor: mindThemes[id].levels[1].fill }}
          />
          {mindThemes[id].name}
        </button>
      ))}
    </div>
    <div className="btn-row wrap">
      <button type="button" className="chip wide" disabled={!hasChildren} onClick={onToggleCollapse}>
        {collapsed ? '展开子树' : '折叠子树'}
      </button>
    </div>
    <span className="preset-note">选中节点后按 Tab 添加子节点、Enter 添加同级节点、F2 重命名。</span>
  </>
)
