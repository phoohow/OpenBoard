/** 顶部工具栏：白板切换、撤销重做、导入导出、分享与演示入口。 */

import { memo, useEffect, useRef, useState } from 'react'
import {
  Check,
  Download,
  Eraser,
  Files,
  FolderPlus,
  PanelRightClose,
  PanelRightOpen,
  Play,
  Redo2,
  Route,
  Share2,
  Trash2,
  TriangleAlert,
  Undo2,
  Upload,
} from 'lucide-react'
import type { DialogKind, SaveStatus } from '@/model/types'
import type { UiState } from '@/domain/ui'

const STATUS_TEXT: Record<SaveStatus, string> = {
  saved: '已保存到本机',
  saving: '保存中…',
  error: '保存失败',
}

export interface TopBarProps {
  doc: { board: { id: string; name: string } }
  ui: UiState
  derived: { canUndo: boolean; canRedo: boolean }
  /** 保存状态不属于界面交互态，由 store 顶层传入。 */
  status: SaveStatus
  actions: {
    board: {
      renameBoard: (name: string) => void
      createBoard: () => void
      duplicateBoard: (id: string) => void
      deleteBoard: (id: string) => void
      clearBoard: () => void
      undo: () => void
      redo: () => void
    }
    io: { importJSON: (file: File) => Promise<void> }
    present: { startPresent: (mode: 'element' | 'slides' | 'route') => void }
    ui: { setDialog: (value: DialogKind) => void; setPanelOpen: (value: boolean | ((prev: boolean) => boolean)) => void }
  }
}

const TopBarView = ({ doc, ui, derived, status, actions }: TopBarProps) => {
  const name = doc.board.name
  const onNameChange = actions.board.renameBoard
  const canUndo = derived.canUndo
  const canRedo = derived.canRedo
  const panelOpen = ui.panelOpen
  const presenting = ui.presenting
  const onUndo = actions.board.undo
  const onRedo = actions.board.redo
  const onTogglePanel = () => actions.ui.setPanelOpen((v) => !v)
  const onPresent = () => actions.present.startPresent('slides')
  const onRoute = () => actions.ui.setDialog('route')
  const onExport = () => actions.ui.setDialog('export')
  const onShare = () => actions.ui.setDialog('share')
  const onNewBoard = actions.board.createBoard
  const onImportJSON = (file: File) => void actions.io.importJSON(file)
  const onDuplicateBoard = () => actions.board.duplicateBoard(doc.board.id)
  const onClearBoard = actions.board.clearBoard
  const onDeleteBoard = () => actions.board.deleteBoard(doc.board.id)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [menuOpen])

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">OB</span>
        <div className="brand-text">
          <strong>OpenBoard</strong>
          <span>本地优先的白板</span>
        </div>
      </div>

      <div className="topbar-file" ref={menuRef}>
        <button type="button" className="btn ghost" onClick={() => setMenuOpen((v) => !v)}>
          文件
        </button>
        {menuOpen && (
          <div className="dropdown">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                onNewBoard()
              }}
            >
              <FolderPlus size={15} /> 新建白板
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                fileRef.current?.click()
              }}
            >
              <Upload size={15} /> 导入 JSON
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                onDuplicateBoard()
              }}
            >
              <Files size={15} /> 创建副本
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                onClearBoard()
              }}
            >
              <Eraser size={15} /> 清空内容
            </button>
            <button
              type="button"
              className="danger"
              onClick={() => {
                setMenuOpen(false)
                onDeleteBoard()
              }}
            >
              <Trash2 size={15} /> 删除白板
            </button>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onImportJSON(file)
            e.target.value = ''
          }}
        />
      </div>

      <input
        className="board-name"
        value={name}
        spellCheck={false}
        onChange={(e) => onNameChange(e.target.value)}
        aria-label="白板名称"
      />

      <span className={`save-status ${status}`}>
        {status === 'saved' && <Check size={13} />}
        {status === 'error' && <TriangleAlert size={13} />}
        {STATUS_TEXT[status]}
      </span>

      <div className="topbar-actions">
        <button type="button" className="icon-btn" title="撤销 (Ctrl/⌘ + Z)" disabled={!canUndo} onClick={onUndo}>
          <Undo2 size={17} />
        </button>
        <button type="button" className="icon-btn" title="重做 (Ctrl/⌘ + Shift + Z)" disabled={!canRedo} onClick={onRedo}>
          <Redo2 size={17} />
        </button>
        <span className="divider" />
        <button type="button" className="btn ghost" onClick={onPresent} disabled={presenting}>
          <Play size={15} /> 演示
        </button>
        <button type="button" className="btn ghost" onClick={onRoute} disabled={presenting}>
          <Route size={15} /> 路线图
        </button>
        <button type="button" className="btn ghost" onClick={onShare}>
          <Share2 size={15} /> 分享
        </button>
        <button type="button" className="btn primary" onClick={onExport}>
          <Download size={15} /> 导出
        </button>
        <button
          type="button"
          className="icon-btn"
          title={panelOpen ? '隐藏属性面板' : '显示属性面板'}
          onClick={onTogglePanel}
        >
          {panelOpen ? <PanelRightClose size={17} /> : <PanelRightOpen size={17} />}
        </button>
      </div>
    </header>
  )
}

/** 只在 doc/ui/derived 变化时重绘，父层局部状态（收藏等）不触发整块重渲染。 */
export const TopBar = memo(TopBarView)
