/** 元素元信息：类型中文名、可编辑判定与卡片状态色。 */

import type { BoardElement, ElementKind } from './types'

/** 文本可编辑的元素类型（表格走单元格编辑，不在其列）。 */
const EDITABLE_KINDS: ElementKind[] = ['sticky', 'text', 'shape', 'frame', 'mindnode', 'card']

export const canEditText = (el: BoardElement) => EDITABLE_KINDS.includes(el.kind)

/** 元素类型中文名：图层面板与画布统计共用同一份叫法。 */
export const KIND_LABEL: Record<ElementKind, string> = {
  sticky: '便签',
  text: '文本',
  shape: '图形',
  connector: '连接线',
  draw: '画笔',
  image: '图片',
  frame: '容器',
  mindnode: '导图',
  table: '表格',
  card: '卡片',
}

const CARD_STATUS_COLOR: Record<string, string> = {
  待开始: '#8C8699',
  进行中: '#2F6BFF',
  评审中: '#C2860A',
  已阻塞: '#E0493B',
  已完成: '#17A673',
}

export const cardStatusColor = (status?: string) => CARD_STATUS_COLOR[(status ?? '').trim()] ?? '#7357E8'
