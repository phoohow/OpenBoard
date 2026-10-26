/** 视图与设置命令：画布视口（不记历史、不刷新时间戳）与全局设置。 */

import { defaultSettings } from '@/model/factories'
import type { AppSettings, View } from '@/model/types'
import type { BoardDoc, BoardsFile } from '../document'
import type { CommandMeta } from './meta'

export type ViewCommand = ({ type: 'view/set'; view: View } & CommandMeta)

export type SettingsCommand = ({ type: 'settings/patch'; patch: Partial<AppSettings> } & CommandMeta)

export const reduceView = (board: BoardDoc, cmd: ViewCommand): BoardDoc | null => {
  if (cmd.type !== 'view/set') return null
  const { x, y, zoom } = cmd.view
  if (board.view.x === x && board.view.y === y && board.view.zoom === zoom) return null
  return { ...board, view: { x, y, zoom } }
}

export const reduceSettings = (file: BoardsFile, cmd: SettingsCommand): BoardsFile | null => {
  if (cmd.type !== 'settings/patch') return null
  return { ...file, settings: { ...defaultSettings(), ...file.settings, ...cmd.patch } }
}

/** 视口变化不刷新 updatedAt（与旧 `setView` 一致）。 */
export const touchesUpdatedAt = (type: string): boolean => type !== 'view/set'
