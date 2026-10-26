/** 对话框与演示浮层编排：按 `dialog` / `presenting` 挂载对应弹窗。 */

import type { BoardComment, BoardElement, PresentItem, RouteStop, TemplateMeta } from '@/model/types'
import type { Favorite } from '@/features/storage/favorites'
import type { Snapshot } from '@/domain/document'
import type { UiState } from '@/domain/ui'
import type { TemplateCategory } from '@/features/templates/library'
import type { AssetItem } from '@/features/assets/library'
import { AssetsDialog, TemplatesDialog } from './LibraryDialogs'
import { ExportDialog, ShareDialog } from './ExportDialogs'
import { HistoryDialog, StatisticsDialog } from './DataDialogs'
import { RouteDialog } from './RouteDialog'
import { ShortcutsDialog } from './ShortcutsDialog'
import { PresentBar } from '../panels/PresentBar'
import { ConfirmDialog } from '../common/feedback'

export interface DialogHostProps {
  doc: {
    board: { name: string; snapshots?: Snapshot[] }
    elements: BoardElement[]
    comments: BoardComment[]
    route: RouteStop[]
  }
  ui: UiState
  /** 忙碌提示同属 store 顶层，不进界面交互态。 */
  state: { busy: string | null }
  derived: { presentItems: PresentItem[]; exportTargets: BoardElement[] }
  favorites: { list: Favorite[]; toggle: (type: Favorite['type'], id: string) => void }
  actions: {
    io: {
      templates: (TemplateMeta & { category: TemplateCategory })[]
      applyTemplate: (id: string) => void
      insertAsset: (group: 'emoji' | 'symbol' | 'stamp', item: AssetItem) => void
      importMarkdownFile: (file: File) => Promise<void>
      exportBoard: (kind: 'png' | 'svg' | 'json') => Promise<void>
      exportPDF: () => Promise<void>
      exportMarkdown: () => void
      pickMarkdown: () => void
    }
    present: {
      addRouteStop: (targetId?: string) => void
      removeRouteStop: (id: string) => void
      moveRouteStop: (id: string, dir: -1 | 1) => void
      clearRoute: () => void
      startPresent: (mode: 'element' | 'slides' | 'route') => void
      toggleTimer: () => void
      setTimerPreset: (minutes: number) => void
      emitReaction: (emoji: string) => void
    }
    snapshot: {
      saveVersion: (name: string) => void
      restoreSnapshot: (id: string) => void
      deleteSnapshot: (id: string) => void
    }
    ui: {
      setDialog: (value: UiState['dialog']) => void
      setConfirm: (value: UiState['confirm']) => void
      setPresenting: (value: boolean | ((prev: boolean) => boolean)) => void
      setPresentMode: (value: UiState['presentMode']) => void
      setPresentStep: (value: number | ((prev: number) => number)) => void
      setLaserOn: (value: boolean | ((prev: boolean) => boolean)) => void
      setExportScope: (value: UiState['exportScope']) => void
      setExportScale: (value: number) => void
      setExportTransparent: (value: boolean) => void
    }
  }
}

export const DialogHost = ({ doc, ui, state, derived, favorites: favHook, actions }: DialogHostProps) => {
  const { board, comments, elements, route } = doc
  const {
    confirm,
    dialog,
    exportScale,
    exportScope,
    exportTransparent,
    laserOn,
    presenting,
    presentMode,
    presentStep,
    timerLeft,
    timerRunning,
  } = ui
  const { presentItems, exportTargets } = derived
  const { list: favorites, toggle: toggleFavorite } = favHook
  const busy = state.busy
  const {
    templates,
    applyTemplate,
    insertAsset,
    exportBoard,
    exportPDF,
    exportMarkdown,
    pickMarkdown,
  } = actions.io
  const {
    addRouteStop,
    removeRouteStop,
    moveRouteStop,
    clearRoute,
    startPresent,
    toggleTimer,
    setTimerPreset,
    emitReaction,
  } = actions.present
  const { saveVersion, restoreSnapshot, deleteSnapshot } = actions.snapshot
  const {
    setDialog,
    setConfirm,
    setPresenting,
    setPresentMode,
    setPresentStep,
    setLaserOn,
    setExportScope,
    setExportScale,
    setExportTransparent,
  } = actions.ui

  return (
    <>
      {dialog === 'templates' && (
        <TemplatesDialog
          templates={templates}
          favorites={favorites}
          onApply={applyTemplate}
          onToggleFavorite={(id) => toggleFavorite('template', id)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'assets' && <AssetsDialog onPick={insertAsset} onClose={() => setDialog(null)} />}
      {dialog === 'route' && (
        <RouteDialog
          stops={route}
          frames={elements
            .filter((el) => el.kind === 'frame')
            .map((el) => ({ id: el.id, name: (el.text ?? '').trim() || '未命名容器' }))}
          onAddFrame={(id) => addRouteStop(id)}
          onAddView={() => addRouteStop()}
          onMove={moveRouteStop}
          onRemove={removeRouteStop}
          onClear={clearRoute}
          onPresent={() => {
            setDialog(null)
            startPresent('route')
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {presenting && (
        <PresentBar
          mode={presentMode}
          step={presentStep}
          total={presentItems.length}
          title={presentItems[presentStep]?.label ?? ''}
          laser={laserOn}
          timerLeft={timerLeft}
          timerRunning={timerRunning}
          onMode={(mode) => {
            setPresentMode(mode)
            setPresentStep(0)
          }}
          onPrev={() => setPresentStep((s) => (s - 1 + Math.max(1, presentItems.length)) % Math.max(1, presentItems.length))}
          onNext={() => setPresentStep((s) => (s + 1) % Math.max(1, presentItems.length))}
          onExit={() => setPresenting(false)}
          onLaser={() => setLaserOn((v) => !v)}
          onTimer={toggleTimer}
          onTimerPreset={setTimerPreset}
          onReaction={emitReaction}
          onRoute={() => setDialog('route')}
        />
      )}
      {dialog === 'export' && (
        <ExportDialog
          name={board.name}
          busy={busy}
          count={exportTargets.length}
          scope={exportScope}
          scale={exportScale}
          transparent={exportTransparent}
          onScope={(scope) => setExportScope(scope)}
          onScale={(scale) => setExportScale(scale)}
          onTransparent={(value) => setExportTransparent(value)}
          onPNG={() => void exportBoard('png')}
          onSVG={() => void exportBoard('svg')}
          onJSON={() => void exportBoard('json')}
          onPDF={() => void exportPDF()}
          onMarkdown={() => exportMarkdown()}
          onImportMarkdown={() => pickMarkdown()}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'share' && (
        <ShareDialog name={board.name} onExportJSON={() => void exportBoard('json')} onClose={() => setDialog(null)} />
      )}
      {dialog === 'shortcuts' && <ShortcutsDialog onClose={() => setDialog(null)} />}
      {dialog === 'history' && (
        <HistoryDialog
          snapshots={board.snapshots ?? []}
          onSave={saveVersion}
          onRestore={restoreSnapshot}
          onDelete={deleteSnapshot}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'stats' && (
        <StatisticsDialog elements={elements} comments={comments} onClose={() => setDialog(null)} />
      )}
      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          onConfirm={confirm.action}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  )
}
