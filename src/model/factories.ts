/** 模型工厂：元素与设置的默认值构造。 */

import { CARD_DEFAULT, DEFAULT_FILL, DEFAULT_INK, DEFAULT_STROKE } from './constants'
import type { AppSettings, BoardElement, ElementKind } from './types'

/** 单元格宽度 / 高度按整体盒子均分，随缩放自动变化。 */
export const tableMetrics = (el: { w: number; h: number; rows?: number; cols?: number }) => {
  const cols = Math.max(1, el.cols ?? 3)
  const rows = Math.max(1, el.rows ?? 3)
  return { cols, rows, cellW: el.w / cols, cellH: el.h / rows }
}

export const defaultSettings = (): AppSettings => ({
  background: 'dots',
  snap: true,
  guides: true,
  autoColor: true,
})

export const uid = () => Math.random().toString(36).slice(2, 10)

/** 导图新节点的默认文案：工厂、尺寸测量与编辑浮标共用。 */
export const MIND_NODE_TEXT = '新节点'

export const baseElement = (kind: ElementKind, x: number, y: number): BoardElement => ({
  id: uid(),
  kind,
  x,
  y,
  w: kind === 'text' ? 240 : kind === 'frame' ? 720 : kind === 'table' ? 480 : kind === 'card' ? CARD_DEFAULT.w : 200,
  h:
    kind === 'text'
      ? 56
      : kind === 'frame'
        ? 480
        : kind === 'table'
          ? 180
          : kind === 'card'
            ? CARD_DEFAULT.h
            : kind === 'mindnode'
              ? 56
              : 160,
  text:
    kind === 'sticky'
      ? '双击输入想法…'
      : kind === 'text'
        ? '添加文本'
        : kind === 'shape'
          ? '流程节点'
          : kind === 'frame'
            ? '未命名容器'
            : kind === 'mindnode'
              ? MIND_NODE_TEXT
              : kind === 'table'
                ? '表格'
                : kind === 'card'
                  ? '任务卡片'
                  : '',
  fill:
    kind === 'sticky'
      ? '#FFF1A8'
      : kind === 'text' || kind === 'frame'
        ? 'transparent'
        : kind === 'mindnode' || kind === 'table' || kind === 'card'
          ? '#FFFFFF'
          : DEFAULT_FILL,
  stroke: kind === 'shape' || kind === 'card' ? DEFAULT_STROKE : 'transparent',
  textColor: DEFAULT_INK,
  strokeWidth: 1.5,
  fontSize: kind === 'sticky' ? 16 : kind === 'text' ? 26 : 16, bold: false, align: 'center', opacity: 1,
  shape: 'round',
  autoSize: kind === 'sticky' ? true : undefined,
  rotation: 0,
  locked: false,
  visible: true,
  dash: false,
  arrowStart: false,
  arrowEnd: kind === 'connector',
  connectorStyle: 'straight',
  rows: kind === 'table' ? 4 : undefined,
  cols: kind === 'table' ? 4 : undefined,
  cells: kind === 'table' ? newCells() : undefined,
  header: kind === 'table' ? true : undefined,
  status: kind === 'card' ? '进行中' : undefined,
  owner: kind === 'card' ? '' : undefined,
  due: kind === 'card' ? '' : undefined,
  desc: kind === 'card' ? '在此记录补充信息' : undefined,
  done: kind === 'card' ? false : undefined,
})

/** 表格默认内容：表头 + 3 行占位。 */
export const newCells = (): string[] => [
  '事项',
  '负责人',
  '优先级',
  '状态',
  '完成原型设计',
  '',
  '高',
  '进行中',
  '补充用户访谈',
  '',
  '中',
  '待开始',
  '准备发布说明',
  '',
  '低',
  '未开始',
]
