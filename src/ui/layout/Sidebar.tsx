/** 左侧边栏：白板列表、模板与素材入口、历史与统计等面板切换。 */

import { memo, useEffect, useState } from 'react'
import {
  BarChart3,
  ClipboardList,
  FileImage,
  Files,
  History,
  Keyboard,
  LayoutGrid,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  Replace,
  Route,
  Search,
  Smile,
  Square,
  StickyNote,
  Trash2,
  Type,
  Vote,
  X,
} from 'lucide-react'
import type { BoardMeta, DialogKind, ElementKind } from '@/model/types'
import type { UiState } from '@/domain/ui'

export interface SidebarProps {
  doc: { board: { id: string } }
  ui: UiState
  derived: { boards: BoardMeta[] }
  actions: {
    board: {
      createBoard: () => void
      selectBoard: (id: string) => void
      renameBoardById: (id: string, name: string) => void
      duplicateBoard: (id: string) => void
      deleteBoard: (id: string) => void
    }
    elements: { createElement: (kind: ElementKind, at?: undefined, edit?: boolean) => unknown }
    io: { replaceAll: (find: string, replace: string) => void; pickImage: () => void }
    present: { startPresent: (mode: 'element' | 'slides' | 'route') => void }
    ui: {
      setDialog: (value: DialogKind) => void
      setVoteMode: (value: boolean | ((prev: boolean) => boolean)) => void
    }
    viewport: { runSearch: (term: string) => void }
  }
}

const SidebarView = ({ doc, ui, derived, actions }: SidebarProps) => {
  const [menuId, setMenuId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [replaceText, setReplaceText] = useState('')

  const search = ui.search
  const voteMode = ui.voteMode
  const boards = derived.boards
  const activeId = doc.board.id
  const onSearch = actions.viewport.runSearch
  const onSelectBoard = actions.board.selectBoard
  const onNewBoard = actions.board.createBoard
  const onRenameBoard = actions.board.renameBoardById
  const onDuplicateBoard = actions.board.duplicateBoard
  const onDeleteBoard = actions.board.deleteBoard
  const onReplaceAll = actions.io.replaceAll
  const onTemplates = () => actions.ui.setDialog('templates')
  const onAssets = () => actions.ui.setDialog('assets')
  const onPresent = () => actions.present.startPresent('slides')
  const onRoute = () => actions.ui.setDialog('route')
  const onToggleVote = () => actions.ui.setVoteMode((v) => !v)
  const onShortcuts = () => actions.ui.setDialog('shortcuts')
  const onHistory = () => actions.ui.setDialog('history')
  const onStats = () => actions.ui.setDialog('stats')
  const onInsert = (kind: ElementKind) => {
    if (kind === 'image') actions.io.pickImage()
    else actions.elements.createElement(kind, undefined, true)
  }

  useEffect(() => {
    if (!menuId) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest('.board-menu') || target?.closest('.board-more')) return
      setMenuId(null)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [menuId])

  const startRename = (b: BoardMeta) => {
    setMenuId(null)
    setDraftName(b.name)
    setRenamingId(b.id)
  }

  const commitRename = () => {
    if (!renamingId) return
    const next = draftName.trim()
    if (next) onRenameBoard(renamingId, next)
    setRenamingId(null)
  }

  return (
    <aside className="sidebar">
      <section>
        <label className="search-field">
        <Search size={14} />
        <input
          value={search}
          placeholder="搜索白板内容"
          onChange={(e) => onSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
        />
        {search && (
          <button type="button" className="icon-btn sm" onClick={() => onSearch('')} aria-label="清除搜索">
            <X size={13} />
          </button>
        )}
      </label>
      <div className="replace-row">
        <label className="search-field">
          <Replace size={14} />
          <input
            value={replaceText}
            placeholder="替换为…"
            onChange={(e) => setReplaceText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onReplaceAll(search, replaceText)
            }}
          />
          <button
            type="button"
            className="btn sm"
            onClick={() => onReplaceAll(search, replaceText)}
          >
            替换全部
          </button>
        </label>
      </div>
    </section>

    <section>
      <div className="sidebar-title">
        <span>白板</span>
        <button type="button" className="icon-btn sm" title="新建白板" onClick={onNewBoard}>
          <Plus size={15} />
        </button>
      </div>
      <ul className="board-list">
        {boards.map((b) => (
          <li key={b.id} className="board-row">
            {renamingId === b.id ? (
              <input
                className="board-rename"
                autoFocus
                value={draftName}
                spellCheck={false}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    commitRename()
                  } else if (e.key === 'Escape') {
                    e.preventDefault()
                    setRenamingId(null)
                  }
                }}
              />
            ) : (
              <>
                <button
                  type="button"
                  className={b.id === activeId ? 'board-item active' : 'board-item'}
                  onClick={() => onSelectBoard(b.id)}
                  onDoubleClick={() => startRename(b)}
                  title="单击切换，双击重命名"
                >
                  <LayoutGrid size={15} />
                  <span className="board-item-name">{b.name}</span>
                  <span className="board-item-count">{b.count}</span>
                </button>
                <button
                  type="button"
                  className="icon-btn sm board-more"
                  title="白板操作"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuId((prev) => (prev === b.id ? null : b.id))
                  }}
                >
                  <MoreHorizontal size={14} />
                </button>
                {menuId === b.id && (
                  <div className="board-menu">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuId(null)
                        startRename(b)
                      }}
                    >
                      <Pencil size={14} /> 重命名
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuId(null)
                        onDuplicateBoard(b.id)
                      }}
                    >
                      <Files size={14} /> 创建副本
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => {
                        setMenuId(null)
                        onDeleteBoard(b.id)
                      }}
                    >
                      <Trash2 size={14} /> 删除
                    </button>
                  </div>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </section>

    <section>
      <div className="sidebar-title">
        <span>模板</span>
      </div>
      <button type="button" className="wide-btn" onClick={onTemplates}>
        <LayoutGrid size={15} /> 模板库
      </button>
    </section>

    <section>
      <div className="sidebar-title">
        <span>素材</span>
      </div>
      <button type="button" className="wide-btn" onClick={onAssets}>
        <Smile size={15} /> 素材库
      </button>
      <div className="asset-grid">
        <button type="button" onClick={() => onInsert('sticky')}>
          <StickyNote size={15} /> 便签
        </button>
        <button type="button" onClick={() => onInsert('text')}>
          <Type size={15} /> 文本
        </button>
        <button type="button" onClick={() => onInsert('shape')}>
          <Square size={15} /> 图形
        </button>
        <button type="button" onClick={() => onInsert('image')}>
          <FileImage size={15} /> 图片
        </button>
        <button type="button" onClick={() => onInsert('card')}>
          <ClipboardList size={15} /> 卡片
        </button>
      </div>
    </section>

    <section>
      <div className="sidebar-title">
        <span>演示与互动</span>
      </div>
      <button type="button" className="wide-btn" onClick={onPresent}>
        <Play size={15} /> 开始演示
      </button>
      <button type="button" className="wide-btn" onClick={onRoute}>
        <Route size={15} /> 演示路线图
      </button>
      <button type="button" className={voteMode ? 'wide-btn active' : 'wide-btn'} onClick={onToggleVote}>
        <Vote size={15} /> {voteMode ? '投票进行中' : '便签投票'}
      </button>
    </section>

    <section className="sidebar-foot">
      <button type="button" className="wide-btn ghost" onClick={onHistory}>
        <History size={15} /> 历史版本
      </button>
      <button type="button" className="wide-btn ghost" onClick={onStats}>
        <BarChart3 size={15} /> 画布统计
      </button>
      <button type="button" className="wide-btn ghost" onClick={onShortcuts}>
        <Keyboard size={15} /> 快捷键
      </button>
    </section>
  </aside>
  )
}

/** 白板列表只在 doc/ui/derived 变化时重绘。 */
export const Sidebar = memo(SidebarView)
