/** 领域常量：调色板、图形库分组、便签与画笔预设、默认尺寸。 */

import type { PenMode, PenPreset, ShapeGroup, ShapeKind } from './types'

/** 画布字体栈：SVG 文本统一使用，避免各渲染器各写一份。 */
export const FONT = "Inter, system-ui, -apple-system, 'Segoe UI', 'Microsoft YaHei', sans-serif"

export const penPresets: Record<PenMode, PenPreset> = {
  pen: { width: 3, opacity: 1 },
  marker: { width: 14, opacity: 0.55 },
  highlighter: { width: 26, opacity: 0.32 },
}

export const stickySizes: { label: string; w: number; h: number }[] = [
  { label: '小', w: 150, h: 120 },
  { label: '中', w: 200, h: 160 },
  { label: '大', w: 280, h: 220 },
]

/** 图形库：按用途分组，共 40+ 种轮廓。 */
export const SHAPE_GROUPS: ShapeGroup[] = [
  {
    id: 'basic',
    label: '基础形状',
    items: [
      { id: 'rect', label: '矩形' },
      { id: 'round', label: '圆角矩形' },
      { id: 'circle', label: '圆形' },
      { id: 'ellipse', label: '椭圆', size: { w: 160, h: 110 } },
      { id: 'triangle', label: '三角形' },
      { id: 'diamond', label: '菱形' },
      { id: 'pentagon', label: '五边形' },
      { id: 'hexagon', label: '六边形' },
      { id: 'octagon', label: '八边形' },
      { id: 'trapezoid', label: '梯形' },
      { id: 'parallelogram', label: '平行四边形' },
      { id: 'star', label: '星形' },
      { id: 'chevron', label: '右箭头' },
      { id: 'arrowDown', label: '下箭头' },
      { id: 'cross', label: '十字' },
      { id: 'heart', label: '心形' },
      { id: 'banner', label: '横幅' },
      { id: 'speech', label: '对话气泡' },
      { id: 'cloud', label: '云形', size: { w: 220, h: 140 } },
      { id: 'tag', label: '标签' },
    ],
  },
  {
    id: 'flow',
    label: '流程图',
    items: [
      { id: 'terminator', label: '开始 / 结束' },
      { id: 'decision', label: '判断' },
      { id: 'dataIO', label: '数据输入' },
      { id: 'documentBox', label: '文档' },
      { id: 'display', label: '显示' },
      { id: 'manualInput', label: '手动输入' },
      { id: 'offpage', label: '跨页引用' },
      { id: 'subprocess', label: '子流程' },
      { id: 'delay', label: '延迟' },
      { id: 'prepare', label: '准备' },
    ],
  },
  {
    id: 'bpmn',
    label: 'BPMN',
    items: [
      { id: 'activity', label: '活动 / 任务' },
      { id: 'gateway', label: '网关' },
      { id: 'dataStore', label: '数据存储', size: { w: 150, h: 160 } },
      { id: 'message', label: '消息事件' },
      { id: 'annotation', label: '批注' },
    ],
  },
  {
    id: 'uml',
    label: 'UML',
    items: [
      { id: 'classBox', label: '类', size: { w: 220, h: 150 } },
      { id: 'umlPackage', label: '包' },
      { id: 'component', label: '组件' },
      { id: 'umlNote', label: '注释' },
    ],
  },
  {
    id: 'er',
    label: 'ER 图',
    items: [
      { id: 'erEntity', label: '实体' },
      { id: 'erAttribute', label: '属性', size: { w: 160, h: 110 } },
      { id: 'erRelationship', label: '联系' },
    ],
  },
  {
    id: 'network',
    label: '网络拓扑',
    items: [
      { id: 'server', label: '服务器', size: { w: 180, h: 120 } },
      { id: 'database', label: '数据库', size: { w: 150, h: 160 } },
      { id: 'router', label: '路由器', size: { w: 180, h: 120 } },
      { id: 'switchNode', label: '交换机', size: { w: 180, h: 120 } },
      { id: 'firewall', label: '防火墙', size: { w: 180, h: 120 } },
      { id: 'laptop', label: '终端' },
      { id: 'mobile', label: '移动设备', size: { w: 110, h: 180 } },
    ],
  },
  {
    id: 'extra',
    label: '其他符号',
    items: [
      { id: 'person', label: '人物' },
      { id: 'gantt', label: '甘特条' },
      { id: 'tree', label: '树形' },
    ],
  },
]

const SHAPE_SIZES = new Map(SHAPE_GROUPS.flatMap((g) => g.items.map((i) => [i.id, i.size] as const)))

const DEFAULT_SHAPE_SIZE = { w: 180, h: 88 }

/** 默认尺寸与图形表同源：条目上声明 `size`，未声明则用通用尺寸。 */
export const shapeDefaultSize = (kind: ShapeKind): { w: number; h: number } => SHAPE_SIZES.get(kind) ?? DEFAULT_SHAPE_SIZE

/** 卡片尺寸的像素规模，resize 手柄仍以整体缩放为准。 */
export const CARD_DEFAULT = { w: 260, h: 152 }

/** 新建元素的默认配色：工厂、初始界面状态、动作补字段与缩略图共用，避免各处再写一份硬编码。 */
export const DEFAULT_FILL = '#E9E0FF'
export const DEFAULT_STROKE = '#B9A8EA'
export const DEFAULT_INK = '#292630'

/** 连接线默认描边与粗细：指针新建、预设画布与模板构件三处入口共用。 */
export const CONNECTOR_STROKE = '#9A91AE'
export const CONNECTOR_STROKE_WIDTH = 2

/** 容器描边：预设看板与模板里的框体同一色。 */
export const FRAME_STROKE = '#C9C2E0'

export const palette = [
  '#FFF1A8', '#FFD8E5', '#D8EEFF', '#DDF3DF', '#E9E0FF', '#FFFFFF',
  '#FFD9B8', '#CFEBE4', '#F2D8FF', '#E3E8EF', '#FFE0C2', '#D9FFE8',
]
export const inkPalette = [
  '#25232D', '#6E56CF', '#2979A8', '#E16B5B', '#56A477', '#F2B94B',
  '#8A54A1', '#4A7BD6', '#C94F26', '#7C8AA0',
]
