/** 属性检查器里的「工具选项」区：按当前工具与选中元素组合出参数面板。 */

import { palette } from '@/model/constants'
import { tableMetrics } from '@/model/factories'
import type { AppSettings, BoardComment, BoardElement, MindLayout, MindTheme, PenMode, ShapeKind } from '@/model/types'
import type { Favorite } from '@/features/storage/favorites'
import type { UiState } from '@/domain/ui'
import type { TableAction } from '@/domain/commands/command'
import { mindNodesOf } from '@/domain/mindmap/tree'
import { CardPanel } from './CardPanel'
import { CommentPanel } from './CommentPanel'
import { MindmapPanel } from './MindmapPanel'
import { PenModePanel } from './PenModePanel'
import { ShapeLibraryPanel } from './ShapeLibraryPanel'
import { StickySizePanel } from './StickySizePanel'
import { TablePanel } from './TablePanel'
import { VotePanel } from './VotePanel'

export interface ToolOptionsProps {
  doc: { elements: BoardElement[]; comments: BoardComment[]; settings: AppSettings }
  ui: UiState
  derived: {
    selected: BoardElement[]
    selection: string[]
    selectedCard?: BoardElement
    mindLayout: MindLayout
    mindTheme: MindTheme
    votes: BoardElement[]
  }
  actions: {
    board: { updateSettings: (patch: Partial<AppSettings>) => void }
    collab: {
      addComment: (elementId: string | null, text: string) => void
      toggleCommentResolved: (id: string) => void
      removeComment: (id: string) => void
      resetVotes: () => void
    }
    elements: { patchSelection: (patch: Partial<BoardElement>) => void }
    mindmap: {
      setMindLayout: (layout: MindLayout) => void
      applyThemeToMindmap: (theme: MindTheme) => void
      toggleMindCollapse: (id: string) => void
    }
    text: { modifyTable: (action: TableAction) => void }
    ui: {
      setShapeKind: (kind: ShapeKind) => void
      setShapeFill: (color: string) => void
      setStickyColor: (color: string) => void
      setStickyIndex: (index: number) => void
      setPenColor: (color: string) => void
      setPenWidth: (width: number) => void
      setPenMode: (mode: PenMode) => void
      setVoteMode: (value: boolean | ((prev: boolean) => boolean)) => void
    }
  }
  favorites: { list: Favorite[]; toggle: (type: Favorite['type'], id: string) => void }
}

export const ToolOptions = (props: ToolOptionsProps) => {
  const { doc, ui, derived, actions } = props
  const { comments, elements, settings } = doc
  const { list: favorites, toggle: toggleFavorite } = props.favorites
  const {
    commentOpen,
    penColor,
    penMode,
    penWidth,
    presenting,
    shapeFill,
    shapeKind,
    stickyColor,
    tool,
    voteMode,
  } = ui
  const {
    selected,
    selection,
    selectedCard,
    mindLayout: mindLayoutOfSelection,
    mindTheme: mindThemeOfSelection,
    votes: voteResults,
  } = derived
  const {
    addComment,
    applyThemeToMindmap,
    modifyTable,
    patchSelection,
    removeComment,
    resetVotes,
    setMindLayout,
    setPenColor,
    setPenMode,
    setPenWidth,
    setShapeFill,
    setShapeKind,
    setStickyColor,
    setStickyIndex,
    setVoteMode,
    toggleCommentResolved,
    toggleMindCollapse,
    updateSettings,
  } = {
    ...actions.board,
    ...actions.collab,
    ...actions.elements,
    ...actions.mindmap,
    ...actions.text,
    ...actions.ui,
  }

  return (
      <>
        {tool === 'sticky' && (
          <div className="preset-block">
            <span>便签颜色</span>
            <div className="swatches">
              {palette.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={stickyColor === c ? 'swatch active' : 'swatch'}
                  style={{ background: c }}
                  onClick={() => {
                    setStickyColor(c)
                    setStickyIndex(palette.indexOf(c) + 1)
                    if (settings.autoColor) updateSettings({ autoColor: false })
                    if (selected.some((el) => el.kind === 'sticky')) patchSelection({ fill: c })
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              className={settings.autoColor ? 'chip wide active' : 'chip wide'}
              onClick={() => updateSettings({ autoColor: !settings.autoColor })}
            >
              {settings.autoColor ? '彩虹换色：开' : '彩虹换色：关'}
            </button>
            <span className="preset-note">便签尺寸</span>
            <StickySizePanel
              autoSize={selected.filter((el) => el.kind === 'sticky').every((el) => el.autoSize !== false)}
              onSize={(w, h) => patchSelection({ w, h, autoSize: false })}
              onAutoSize={(value) => patchSelection({ autoSize: value })}
            />
          </div>
        )}
        {selectedCard && (
          <div className="preset-block">
            <span>卡片</span>
            <CardPanel card={selectedCard} onPatch={patchSelection} />
          </div>
        )}
        {selected.some((el) => el.kind === 'table') && (
          <div className="preset-block">
            <span>表格</span>
            <TablePanel
              rows={tableMetrics(selected.find((el) => el.kind === 'table') ?? { w: 0, h: 0 }).rows}
              cols={tableMetrics(selected.find((el) => el.kind === 'table') ?? { w: 0, h: 0 }).cols}
              header={!!selected.find((el) => el.kind === 'table')?.header}
              onAction={modifyTable}
            />
          </div>
        )}
        {selected.some((el) => el.kind === 'mindnode') && (
          <div className="preset-block">
            <span>思维导图</span>
            <MindmapPanel
              layout={mindLayoutOfSelection}
              theme={mindThemeOfSelection}
              collapsed={selected.some((el) => el.kind === 'mindnode' && el.collapsed)}
              hasChildren={mindNodesOf(elements).some((el) => !!el.parent && selected.some((s) => s.id === el.parent))}
              onLayout={setMindLayout}
              onTheme={applyThemeToMindmap}
              onToggleCollapse={() => {
                const target = selected.find((el) => el.kind === 'mindnode')
                if (target) toggleMindCollapse(target.id)
              }}
            />
          </div>
        )}
        {tool === 'frame' && (
          <div className="preset-block">
            <span>容器</span>
            <span className="preset-note">在画布上拖拽即可划定容器区域，容器可作为演示页与导出范围。</span>
          </div>
        )}
        {tool === 'comment' && (
          <div className="preset-block">
            <span>评论</span>
            <span className="preset-note">点击元素添加批注；点空白处则把评论钉在该位置。</span>
          </div>
        )}
        {!presenting && (
          <VotePanel
            active={voteMode}
            results={voteResults.map((el) => ({ id: el.id, name: (el.text ?? '').slice(0, 14) || '未命名', votes: el.votes ?? 0 }))}
            onToggle={() => setVoteMode((v) => !v)}
            onReset={resetVotes}
          />
        )}
        {!presenting &&
          (tool === 'comment' ||
            commentOpen ||
            selected.some((el) => comments.some((c) => c.elementId === el.id && !c.resolved))) && (
          <CommentPanel
            items={comments.filter((c) => c.elementId && selection.includes(c.elementId))}
            hasSelection={selected.length > 0}
            autoFocus={commentOpen}
            onSubmit={(text) => addComment(selection[0] ?? null, text)}
            onToggleResolved={toggleCommentResolved}
            onRemove={removeComment}
          />
        )}
        {tool === 'shape' && (
          <div className="preset-block">
            <ShapeLibraryPanel
              value={shapeKind}
              onChange={(k) => {
                setShapeKind(k)
                if (selected.some((el) => el.kind === 'shape')) patchSelection({ shape: k })
              }}
              favorites={favorites}
              onToggleFavorite={(id) => toggleFavorite('shape', id)}
            />
            <span>填充颜色</span>
            <div className="swatches">
              {palette.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={shapeFill === c ? 'swatch active' : 'swatch'}
                  style={{ background: c }}
                  onClick={() => {
                    setShapeFill(c)
                    if (selected.some((el) => el.kind === 'shape')) patchSelection({ fill: c })
                  }}
                />
              ))}
            </div>
          </div>
        )}
        {tool === 'pen' && (
          <div className="preset-block">
            <span>笔型与颜色</span>
            <PenModePanel
              mode={penMode}
              color={penColor}
              width={penWidth}
              onMode={setPenMode}
              onColor={(c) => {
                setPenColor(c)
                if (selected.some((el) => el.kind === 'draw')) patchSelection({ stroke: c })
              }}
              onWidth={(w) => {
                setPenWidth(w)
                if (selected.some((el) => el.kind === 'draw')) patchSelection({ strokeWidth: w })
              }}
            />
          </div>
        )}
        {tool === 'eraser' && <p className="panel-hint">橡皮：点击或拖过元素即可删除，可用撤销恢复。</p>}
        {tool === 'connector' && <p className="panel-hint">连接线：从一个元素拖到另一个元素即可建立关联。</p>}
        {(tool === 'select' || tool === 'hand' || tool === 'text') && (
          <p className="panel-hint">按 V 选择、H 平移；双击画布空白处可快速添加文本。</p>
        )}
      </>
  )
}
