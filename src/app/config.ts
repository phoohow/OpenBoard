/** 应用层配置：画布网格、缩放边界、持久化与自动快照参数。 */

import { BACKGROUND_MODES, MAX_ZOOM, MIN_ZOOM } from '@/domain/document'
import type { BackgroundMode } from '@/model/types'

export const GRID = 24

/** 缩放上下限归 domain 文档层所有，此处只转出，免得界面到处猜边界。 */
export { MAX_ZOOM, MIN_ZOOM }

/** 背景样式按固定顺序轮转，顺序表就是归一化用的那张。 */
export const nextBackground = (current: BackgroundMode): BackgroundMode =>
  BACKGROUND_MODES[(BACKGROUND_MODES.indexOf(current) + 1) % BACKGROUND_MODES.length]

/** 内容变更后落盘的防抖时长。 */
export const SAVE_DEBOUNCE_MS = 450
/** 自动快照的检查间隔。 */
export const AUTO_SNAPSHOT_CHECK_MS = 120000
/** 自动快照的延迟执行时长。 */
export const AUTO_SNAPSHOT_DELAY_MS = 20000
/** 自动快照保留条数。 */
export const AUTO_SNAPSHOT_MAX = 15
