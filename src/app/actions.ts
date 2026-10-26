/** 动作出口：按领域分组的模块级对象，引用恒定，视图可直接作为 props 传入。 */

import * as board from './actions/board'
import * as elements from './actions/elements'
import * as mindmap from './actions/mindmap'
import * as collab from './actions/collab'
import * as present from './actions/present'
import * as io from './actions/io'
import * as snapshot from './actions/snapshot'
import * as text from './actions/text'
import * as ui from './actions/ui'
import * as viewport from './actions/viewport'

export const actions = { board, collab, elements, io, mindmap, present, snapshot, text, ui, viewport }

export type EditorActions = typeof actions
