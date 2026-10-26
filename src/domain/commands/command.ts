/** 命令集合：文档命令、界面命令与状态命令的联合类型，以及各模块 reducer 表的汇总。 */

import type { BoardContentCommand, BoardFileCommand } from './board'
import type { ElementCommand } from './elements'
import type { ArrangeCommand } from './arrange'
import type { GroupCommand } from './group'
import type { TableAction, TableCommand } from './table'
import type { MindmapCommand } from './mindmap'
import type { CollabCommand } from './collab'
import type { SnapshotCommand } from './snapshot'
import type { SettingsCommand, ViewCommand } from './view'
import type { StateCommand, UiCommand } from './ui'

/** 各域命令类型在此汇总转发（路径只在本文件声明一次；`CommandMeta` 统一从 `./meta` 取）。 */
export type {
  BoardContentCommand, BoardFileCommand, ElementCommand, ArrangeCommand,
  GroupCommand, TableAction, TableCommand, MindmapCommand, CollabCommand, SnapshotCommand,
  SettingsCommand, ViewCommand, StateCommand, UiCommand,
}

export { reduceBoardContent, reduceBoards, resetsHistory } from './board'
export { reduceElements } from './elements'
export { reduceArrange } from './arrange'
export { reduceGroup } from './group'
export { reduceTable } from './table'
export { reduceMindmap } from './mindmap'
export { reduceCollab } from './collab'
export { reduceSnapshot } from './snapshot'
export { reduceSettings, reduceView, touchesUpdatedAt } from './view'
export { reduceStateCommand, reduceUi } from './ui'

/** 只改文档、需要进撤销栈的命令。 */
export type DocCommand =
  | BoardFileCommand
  | BoardContentCommand
  | ElementCommand
  | ArrangeCommand
  | GroupCommand
  | TableCommand
  | MindmapCommand
  | CollabCommand
  | SnapshotCommand
  | ViewCommand
  | SettingsCommand

/**
 * `dispatch` 接受的全部命令。
 * `history/push` 供指针状态机在拖拽开始时记录快照（等价于旧 `setState` 里手写 `past`）。
 */
export type HistoryCommand =
  | { type: 'history/undo' }
  | { type: 'history/redo' }
  | { type: 'history/push' }

export type Command = DocCommand | UiCommand | StateCommand | HistoryCommand
