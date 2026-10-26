/** 领域模型：工具、元素、白板与视图的类型定义。本层不依赖任何其他层。 */

export type Tool =
  | 'select' | 'hand' | 'sticky' | 'text' | 'shape' | 'connector' | 'pen' | 'eraser' | 'frame' | 'mind' | 'table' | 'card' | 'comment'
export type ElementKind =
  | 'sticky' | 'text' | 'shape' | 'connector' | 'draw' | 'image' | 'frame' | 'mindnode' | 'table' | 'card'
export type PenMode = 'pen' | 'marker' | 'highlighter'

export interface PenPreset {
  width: number
  opacity: number
}

export type ShapeKind =
  /* 基础形状 */
  | 'rect' | 'round' | 'circle' | 'ellipse' | 'triangle' | 'diamond' | 'pentagon' | 'hexagon' | 'octagon'
  | 'trapezoid' | 'parallelogram' | 'star' | 'chevron' | 'cross' | 'heart' | 'arrowDown' | 'banner' | 'speech' | 'cloud' | 'tag'
  /* 流程图 */
  | 'terminator' | 'dataIO' | 'documentBox' | 'decision' | 'display' | 'manualInput' | 'offpage' | 'subprocess' | 'delay' | 'prepare'
  /* BPMN */
  | 'activity' | 'dataStore' | 'message' | 'annotation' | 'gateway'
  /* UML */
  | 'classBox' | 'umlNote' | 'umlPackage' | 'component'
  /* ER */
  | 'erEntity' | 'erAttribute' | 'erRelationship'
  /* 网络拓扑 */
  | 'server' | 'database' | 'router' | 'firewall' | 'laptop' | 'mobile' | 'switchNode'
  /* 其他低频符号 */
  | 'person' | 'gantt' | 'tree'

export type ShapeCategory = 'basic' | 'flow' | 'bpmn' | 'uml' | 'er' | 'network' | 'extra'

export interface ShapeGroup {
  id: ShapeCategory
  label: string
  items: { id: ShapeKind; label: string; size?: { w: number; h: number } }[]
}

export type ConnectorStyle = 'straight' | 'elbow' | 'curve'
export type BackgroundMode = 'dots' | 'grid' | 'lines' | 'plain'
export type MindLayout = 'right' | 'left' | 'both' | 'topdown'
export type MindTheme = 'grape' | 'forest' | 'sunset' | 'ocean' | 'slate' | 'candy'

export interface BoardComment {
  id: string
  /** 关联元素 id；为空表示钉在画布某个位置 */
  elementId?: string
  x?: number
  y?: number
  text: string
  createdAt: number
  resolved: boolean
}

export interface RouteStop {
  id: string
  label: string
  /** 聚焦点：优先使用关联元素，其次使用坐标 */
  targetId?: string
  x?: number
  y?: number
  zoom?: number
}

export interface BoardElement {
  id: string
  kind: ElementKind
  x: number
  y: number
  w: number
  h: number
  text?: string
  fill: string
  stroke: string
  textColor: string
  strokeWidth: number
  fontSize: number
  bold: boolean
  align: 'left' | 'center' | 'right'
  opacity: number
  shape?: ShapeKind
  from?: string
  to?: string
  points?: number[]
  src?: string
  rotation?: number
  locked?: boolean
  visible?: boolean
  dash?: boolean
  arrowStart?: boolean
  arrowEnd?: boolean
  connectorStyle?: ConnectorStyle
  /** 群组标识，同一 groupId 的元素作为整体选中与联动 */
  groupId?: string
  /** 便签是否随文字量自动撑高 */
  autoSize?: boolean
  /** 思维导：父节点 id（根节点为空） */
  parent?: string
  /** 思维导：所属导图的根节点 id */
  rootId?: string
  /** 思维导：折叠子树 */
  collapsed?: boolean
  /** 思维导：仅在根节点上生效的布局方式 */
  mindLayout?: MindLayout
  /** 表格：行数 / 列数 / 单元格文本（行优先） */
  rows?: number
  cols?: number
  cells?: string[]
  /** 表格：首行作为表头强调 */
  header?: boolean
  /** 卡片：状态标签 */
  status?: string
  /** 卡片：负责人 */
  owner?: string
  /** 卡片：截止时间 */
  due?: string
  /** 卡片：描述正文 */
  desc?: string
  /** 卡片：已完成标记 */
  done?: boolean
  /** 便签投票：累计票数 */
  votes?: number
}

export interface AppSettings {
  background: BackgroundMode
  snap: boolean
  guides: boolean
  autoColor: boolean
}

export interface Board {
  name: string
  elements: BoardElement[]
  updatedAt: number
}

export interface View { x: number; y: number; zoom: number }

/** 保存状态：顶栏提示用。 */
export type SaveStatus = 'saved' | 'saving' | 'error'

/** 轻提示条目。 */
export interface ToastItem {
  id: number
  text: string
  tone: 'info' | 'error'
}

/** 侧边栏白板条目。 */
export interface BoardMeta {
  id: string
  name: string
  updatedAt: number
  count: number
}

/** 模板卡片元信息。 */
export interface TemplateMeta {
  id: string
  name: string
  desc: string
  accent: string
  count: number
  category: string
}

/** 可打开的对话框。 */
export type DialogKind =
  | null
  | 'templates'
  | 'assets'
  | 'route'
  | 'export'
  | 'share'
  | 'shortcuts'
  | 'history'
  | 'stats'

/** 演示模式：单元素 / 容器分页 / 路线图。 */
export type PresentMode = 'element' | 'slides' | 'route'

/** 演示序列的一项。 */
export interface PresentItem {
  id: string
  label: string
  target?: BoardElement
  point?: { x: number; y: number }
}
