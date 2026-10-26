/** 装配层：把门面派生出的 `doc / ui / derived / actions` 分发给视图，本身不含业务逻辑。 */

import { useMemo } from 'react'
import { CanvasStage, type CanvasScene } from '@/canvas/CanvasStage'
import { EditingOverlay } from '@/canvas/EditingOverlay'
import { CanvasOverlay } from '@/ui/layout/CanvasOverlay'
import { DialogHost } from '@/ui/dialogs/DialogHost'
import { FileInputs } from '@/ui/common/FileInputs'
import { Toasts } from '@/ui/common/feedback'
import { PropertyPanel } from '@/ui/layout/PropertyPanel'
import { Sidebar } from '@/ui/layout/Sidebar'
import { TopBar } from '@/ui/layout/TopBar'
import { useEditor } from '@/app/hooks/useEditor'
import { useCanvasRefs } from '@/app/hooks/useCanvasView'
import { useEditorEffects } from '@/app/effects/lifecycle'
import { useFavorites } from '@/app/hooks/useFavorites'
import { dom } from '@/app/app-dom'
import { GRID } from '@/app/config'
import { pointerHandlers } from '@/app/interaction/pointer'

export default function App() {
  const { state, doc, ui, derived, actions } = useEditor()
  const favorites = useFavorites()
  const refs = useCanvasRefs()
  const scene = useMemo<CanvasScene>(
    () => ({
      view: doc.view,
      grid: GRID,
      background: doc.settings.background,
      cursor: derived.cursor,
      elements: doc.elements,
      selected: derived.selected,
      editingId: ui.editing?.id ?? null,
      guides: ui.guides,
      draft: ui.draft,
      comments: doc.comments,
    }),
    [doc, ui, derived],
  )
  const handlers = useMemo(() => ({ ...pointerHandlers, onLaserMove: actions.ui.setLaserPoint }), [actions])
  const editor = useMemo(() => <EditingOverlay doc={doc} ui={ui} actions={actions} />, [doc, ui, actions])
  const overlay = useMemo(
    () => <CanvasOverlay doc={doc} ui={ui} derived={{ total: derived.ordered.length }} actions={actions} />,
    [doc, ui, derived, actions],
  )
  const favProps = useMemo(
    () => ({ list: favorites.favorites, toggle: favorites.toggleFavorite }),
    [favorites.favorites, favorites.toggleFavorite],
  )
  useEditorEffects(state)

  return (
    <div className={`app ${ui.presenting ? 'presenting' : ''}`}>
      <TopBar doc={doc} ui={ui} derived={derived} status={state.saveStatus} actions={actions} />
      <div className="body">
        <Sidebar doc={doc} ui={ui} derived={derived} actions={actions} />
        <CanvasStage scene={scene} ui={ui} refs={refs} handlers={handlers} editor={editor}>
          {overlay}
        </CanvasStage>
        {ui.panelOpen && !ui.presenting && (
          <PropertyPanel doc={doc} ui={ui} derived={derived} actions={actions} favorites={favProps} />
        )}
      </div>
      <FileInputs
        imageRef={(node) => {
          dom.imageInput = node
        }}
        markdownRef={(node) => {
          dom.markdownInput = node
        }}
        onImage={(file) => void actions.elements.addImage(file)}
        onMarkdown={(file) => void actions.io.importMarkdownFile(file)}
      />
      <Toasts items={state.toasts} />
      <DialogHost doc={doc} ui={ui} state={state} derived={derived} favorites={favProps} actions={actions} />
    </div>
  )
}
