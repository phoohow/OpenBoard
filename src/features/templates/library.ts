import { baseElement, newCells, uid } from '@/model/factories'
import { CONNECTOR_STROKE, CONNECTOR_STROKE_WIDTH, FRAME_STROKE } from '@/model/constants'
import { journeyBoard, launchBoard, brainstormBoard, blankBoard, kanbanBoard } from '@/model/presets'
import type { Board, BoardElement } from '@/model/types'
import { mindmapBoard } from '@/domain/mindmap/themes'

export type TemplateCategory = 'blank' | 'strategy' | 'analysis' | 'facilitate' | 'diagram'

export const TEMPLATE_CATEGORIES: { id: TemplateCategory; label: string }[] = [
  { id: 'blank', label: '空白' },
  { id: 'strategy', label: '战略分析' },
  { id: 'analysis', label: '研究与归因' },
  { id: 'facilitate', label: '共创会议' },
  { id: 'diagram', label: '图表与流程' },
]

export interface TemplateSpec {
  id: string
  name: string
  desc: string
  category: TemplateCategory
  accent: string
  build: () => Board
}

/* ---------------- 通用构件 ---------------- */

/** 按序号循环取色：便签用浅黄/粉/蓝/绿，色块用蓝/绿/黄/粉，多处复用同一份定义。 */
const noteFills = ['#FFF1A8', '#FFD8E5', '#D8EEFF', '#DDF3DF']
const blockFills = ['#E5F2FF', '#E7F4E9', '#FFF4D8', '#FFD8E5']

const uidPrefix = (prefix: string) => `${prefix}-${uid()}`

const heading = (text: string, x: number, y: number, w = 620, size = 32): BoardElement => ({
  ...baseElement('text', x, y),
  id: uidPrefix('h'),
  text,
  w,
  h: Math.round(size * 1.6),
  fontSize: size,
  bold: true,
  align: 'left',
})

const caption = (text: string, x: number, y: number, w = 620): BoardElement => ({
  ...baseElement('text', x, y),
  id: uidPrefix('c'),
  text,
  w,
  h: 28,
  fontSize: 13,
  textColor: '#8C8699',
  align: 'left',
})

const block = (
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  shape: BoardElement['shape'] = 'round',
  fontSize = 15,
): BoardElement => ({
  ...baseElement('shape', x, y),
  id: uidPrefix('b'),
  text,
  w,
  h,
  fill,
  shape,
  stroke: '#CFC9E4',
  fontSize,
  align: 'left',
})

const note = (text: string, x: number, y: number, fill: string, w = 176, h = 144): BoardElement => ({
  ...baseElement('sticky', x, y),
  id: uidPrefix('s'),
  text,
  w,
  h,
  fill,
  fontSize: 14,
  align: 'left',
})

const frame = (text: string, x: number, y: number, w: number, h: number): BoardElement => ({
  ...baseElement('frame', x, y),
  id: uidPrefix('f'),
  text,
  w,
  h,
  stroke: FRAME_STROKE,
})

const connect = (from: string, to: string): BoardElement => ({
  ...baseElement('connector', 0, 0),
  id: uidPrefix('l'),
  from,
  to,
  w: 0,
  h: 0,
  stroke: CONNECTOR_STROKE,
  strokeWidth: CONNECTOR_STROKE_WIDTH,
})

/** 四/九宫格类的网格布局。 */
const grid = (
  labels: string[],
  x: number,
  y: number,
  cols: number,
  cellW: number,
  cellH: number,
  fills: string[],
): { boxes: BoardElement[]; ids: string[] } => {
  const boxes: BoardElement[] = []
  const ids: string[] = []
  labels.forEach((label, i) => {
    const cx = x + (i % cols) * cellW
    const cy = y + Math.floor(i / cols) * cellH
    const id = uidPrefix('g')
    ids.push(id)
    boxes.push({
      ...baseElement('shape', cx, cy),
      id,
      text: label,
      w: cellW - 16,
      h: cellH - 16,
      fill: fills[i % fills.length],
      shape: 'round',
      stroke: '#D8D3E2',
      fontSize: 15,
      align: 'left',
    })
  })
  return { boxes, ids }
}

/* ---------------- 模板工厂 ---------------- */

const swotBoard = (): Board => {
  const { boxes } = grid(['优势 S', '劣势 W', '机会 O', '威胁 T'], 80, 140, 2, 420, 300, ['#E7F4E9', '#FDECEA', '#E5F2FF', '#FFF4D8'])
  return {
    name: 'SWOT 分析',
    updatedAt: Date.now(),
    elements: [
      heading('SWOT 分析', 80, 30, 520),
      caption('把内部能力（S / W）与外部环境（O / T）分格写满，再交叉推导策略。', 82, 96, 640),
      ...boxes,
      note('双击写下具体优势\n例：交付速度快', 96, 200, '#FFF1A8', 200, 120),
      note('例：品牌认知不足', 516, 200, '#FFF1A8', 200, 120),
    ],
  }
}

const businessCanvasBoard = (): Board => {
  const cols = [80, 320, 560, 800, 1040]
  const row1 = ['重要伙伴', '关键业务', '价值主张', '客户关系', '客户细分']
  const mid = ['核心资源', '渠道通路']
  const bottom = ['成本结构', '收入来源']
  const elements: BoardElement[] = [heading('商业模式画布', 80, 30, 620), caption('从左至右梳理「如何创造价值并把它变成收入」。', 82, 96, 620)]
  row1.forEach((label, i) =>
    elements.push(block(label, cols[i] - 80 + 80, 140, 220, i === 2 ? 300 : 240, ['#E9E0FF', '#E5F2FF', '#FFF4D8', '#E7F4E9', '#FFD8E5'][i])),
  )
  elements.push(block(mid[0], cols[1] - 80 + 80, 400, 220, 180, '#F0ECFF'), block(mid[1], cols[3] - 80 + 80, 400, 220, 180, '#F0ECFF'))
  elements.push(block(bottom[0], 80, 600, 460, 160, '#FDECEA'), block(bottom[1], 560, 600, 460, 160, '#E7F4E9'))
  return { name: '商业模式画布', updatedAt: Date.now(), elements }
}

const okrBoard = (): Board => {
  const o = uidPrefix('o')
  const k1 = uidPrefix('k')
  const k2 = uidPrefix('k')
  const k3 = uidPrefix('k')
  return {
    name: 'OKR 目标对齐',
    updatedAt: Date.now(),
    elements: [
      heading('OKR 目标对齐', 80, 30, 620),
      caption('一个 Objective 配 2–4 个可衡量的 Key Result，右侧记录推进到哪一步。', 82, 96, 660),
      { ...block('O：让用户第一次使用就感受到价值', 80, 150, 760, 100, '#E9E0FF', 'round', 20), id: o, bold: true },
      ...[
        ['KR1 新手完成第一块白板的比例提升到 60%', '#FFF1A8'],
        ['KR2 首日邀请协作者的比例提升到 35%', '#FFD8E5'],
        ['KR3 首周回访率提升到 45%', '#D8EEFF'],
      ].flatMap(([text, fill], i) => {
        const id = [k1, k2, k3][i]
        return [
          { ...block(text as string, 120 + (i % 1) * 0, 280 + i * 120, 520, 96, fill as string), id },
          note(i === 2 ? '负责人：增长组\n进度：进行中' : '负责人：待认领\n进度：待开始', 680, 280 + i * 120, i === 0 ? '#DDF3DF' : '#E3E8EF', 220, 96),
        ]
      }),
    ],
  }
}

const cornellBoard = (): Board => ({
  name: '康奈尔笔记',
  updatedAt: Date.now(),
  elements: [
    heading('康奈尔笔记', 80, 30, 520),
    caption('右侧记要点，左侧写关键词或问题，底部三句话总结。', 82, 96, 640),
    frame('记录区', 380, 130, 560, 560),
    frame('线索区', 80, 130, 280, 560),
    frame('总结区', 80, 710, 860, 160),
    note('要点 1：\n...', 400, 170, '#FFF1A8', 240, 120),
    note('要点 2：\n...', 660, 170, '#D8EEFF', 240, 120),
    note('关键词 / 疑问写在左侧，复习时可遮住右栏自测。', 96, 170, '#E9E0FF', 240, 160),
    note('三句话总结：\n...', 96, 750, '#DDF3DF', 820, 100),
  ],
})

const matrix4QBoard = (): Board => {
  const { boxes } = grid(['重要且紧急\n立即做', '重要不紧急\n计划做', '紧急不重要\n委托或简化', '不重要不紧急\n少做'], 80, 140, 2, 420, 300, ['#FDECEA', '#E7F4E9', '#FFF4D8', '#E3E8EF'])
  return {
    name: '时间管理四象限',
    updatedAt: Date.now(),
    elements: [
      heading('时间管理四象限', 80, 30, 560),
      caption('把待办按「重要 / 紧急」两轴归类，优先投资第二象限。', 82, 96, 660),
      ...boxes,
      note('线上故障响应', 96, 260, '#FFF1A8', 180, 96),
      note('下季度规划\n能力成长', 516, 260, '#FFF1A8', 180, 96),
    ],
  }
}

const personaBoard = (): Board => ({
  name: '用户画像 Persona',
  updatedAt: Date.now(),
  elements: [
    heading('用户画像 Persona', 80, 30, 560),
    caption('一个 persona 只代表一类核心用户，写清动机、痛点与验收标准。', 82, 96, 680),
    block('👩‍💻 效率导向的产品经理 · Ada', 80, 150, 420, 90, '#E9E0FF', 'round', 20),
    note('目标：让团队用一块白板完成讨论到落地\n场景：每周远程评审会', 80, 260, '#FFF1A8', 200, 150),
    note('痛点：工具之间来回切换\n信息同步成本高', 300, 260, '#FFD8E5', 200, 150),
    note('动机：快速对齐 + 可追溯的决策记录', 80, 430, '#D8EEFF', 200, 150),
    note('验收：3 分钟上手\n导出即可分享给相关方', 300, 430, '#DDF3DF', 200, 150),
    { ...block('决策标准', 540, 150, 300, 120, '#F0ECFF'), align: 'left' },
    note('先看模板是否丰富\n再看是否支持离线使用', 560, 280, '#E3E8EF', 260, 140),
  ],
})

const aarrrBoard = (): Board => {
  const stages = ['获客 Acquisition', '激活 Activation', '留存 Retention', '收入 Revenue', '推荐 Referral']
  const ids = stages.map(() => uidPrefix('a'))
  const elements: BoardElement[] = [heading('AARRR 增长模型', 80, 30, 560), caption('逐环节写指标、漏斗数据与下一步实验。', 82, 96, 620)]
  stages.forEach((s, i) => {
    elements.push({
      ...block(s, 80 + i * 220, 150, 190, 90, ['#E9E0FF', '#E5F2FF', '#D8EEFF', '#E7F4E9', '#FFF4D8'][i], 'round', 15),
      id: ids[i],
    })
    elements.push(note(`核心指标：\n...\n下一步实验：\n...`, 80 + i * 220, 260, ['#FFF1A8', '#FFD8E5', '#DDF3DF', '#E9E0FF', '#FFE0C2'][i], 190, 200))
  })
  return { name: 'AARRR 增长模型', updatedAt: Date.now(), elements }
}

const porterBoard = (): Board => {
  const core = uidPrefix('p')
  const rivals = ['供应商议价能力', '买家议价能力', '潜在进入者威胁', '替代品威胁']
  const ids = rivals.map(() => uidPrefix('r'))
  return {
    name: '波特五力模型',
    updatedAt: Date.now(),
    elements: [
      heading('波特五力模型', 80, 30, 560),
      caption('先写核心力量，再评估每一股力量的强弱与应对策略。', 82, 96, 660),
      { ...block('现有竞争者\n的竞争强度', 500, 300, 260, 160, '#FFF4D8', 'round', 18), id: core },
      ...rivals.flatMap((text, i) => [
        { ...block(text, [80, 1060, 240, 580][i], [220, 220, 520, 520][i], 220, 110, ['#E5F2FF', '#E7F4E9', '#FFD8E5', '#E9E0FF'][i], 'round', 15), id: ids[i] },
        i < 2 ? connect(ids[i], core) : connect(core, ids[i]),
      ]),
      note('例：头部产品功能趋同\n差异化空间在协作体验', 80, 680, '#FFF1A8', 240, 140),
    ],
  }
}

const bcgBoard = (): Board => {
  const { boxes } = grid(['明星 ⭐\n高增长 · 高份额', '现金牛 🐄\n低增长 · 高份额', '问题 ❓\n高增长 · 低份额', '瘦狗 🐶\n低增长 · 低份额'], 120, 160, 2, 420, 300, ['#E7F4E9', '#D8EEFF', '#FFF4D8', '#E3E8EF'])
  return {
    name: '波士顿矩阵',
    updatedAt: Date.now(),
    elements: [
      heading('波士顿矩阵', 80, 30, 520),
      caption('横轴为相对市场份额，纵轴为市场增长率；据此决定投入与取舍。', 82, 100, 700),
      ...boxes,
      caption('← 低份额                    高份额 →', 120, 780, 700),
      note('加大投入 / 优先资源', 136, 320, '#FFF1A8', 180, 90),
      note('维持现金流 / 收割', 556, 320, '#FFF1A8', 180, 90),
    ],
  }
}

const ansoffBoard = (): Board => {
  const { boxes } = grid(['市场渗透\n现有 · 现有', '市场开发\n现有 → 新市场', '产品开发\n新产品 → 现有市场', '多元化\n新产品 · 新市场'], 120, 160, 2, 420, 300, blockFills)
  return {
    name: '安索夫矩阵',
    updatedAt: Date.now(),
    elements: [
      heading('安索夫增长矩阵', 80, 30, 560),
      caption('按「产品 × 市场」两个维度选择增长路径，风险由低到高。', 82, 100, 700),
      ...boxes,
      note('例：提升老用户使用频次', 136, 300, '#FFF1A8', 200, 96),
      note('例：进入新的行业场景', 556, 300, '#FFF1A8', 200, 96),
    ],
  }
}

const growBoard = (): Board => {
  const steps = ['Goal 目标', 'Reality 现状', 'Options 方案', 'Will 行动']
  const ids = steps.map(() => uidPrefix('w'))
  const elements: BoardElement[] = [heading('GROW 教练模型', 80, 30, 560), caption('一次谈话四个问题：想去哪、现在在哪、可以怎么走、接下来做什么。', 82, 96, 720)]
  steps.forEach((s, i) => {
    elements.push({ ...block(s, 80 + i * 260, 160, 230, 90, ['#E9E0FF', '#E5F2FF', '#FFF4D8', '#E7F4E9'][i], 'round', 18), id: ids[i] })
    elements.push(note('写下答案…', 80 + i * 260, 280, noteFills[i], 230, 200))
    if (i > 0) elements.push(connect(ids[i - 1], ids[i]))
  })
  return { name: 'GROW 教练模型', updatedAt: Date.now(), elements }
}

const fiveWhyBoard = (): Board => {
  const steps = ['问题现象', 'Why 1', 'Why 2', 'Why 3', 'Why 4', 'Why 5 → 根因']
  const ids = steps.map(() => uidPrefix('y'))
  const elements: BoardElement[] = [heading('5 Why 根因分析', 80, 30, 560), caption('每一步都问「为什么会这样」，直到找到可以采取措施的那一层。', 82, 96, 700)]
  steps.forEach((s, i) => {
    elements.push({
      ...block(s, 80 + (i % 3) * 300, 160 + Math.floor(i / 3) * 220, 260, 90, i === 5 ? '#FDECEA' : ['#FFF4D8', '#E9E0FF', '#E5F2FF', '#E7F4E9', '#FFD8E5'][i % 5], 'round', 16),
      id: ids[i],
    })
    elements.push(note(i === 0 ? '描述具体、可度量的现象' : i === 5 ? '对应对策：...' : '答案 + 证据', 80 + (i % 3) * 300, 270 + Math.floor(i / 3) * 220, '#FFF1A8', 260, 130))
    if (i > 0) elements.push(connect(ids[i - 1], ids[i]))
  })
  return { name: '5 Why 根因分析', updatedAt: Date.now(), elements }
}

const fishboneBoard = (): Board => {
  const spine = uidPrefix('fb')
  const categories = ['人员 People', '方法 Method', '机器 Machine', '材料 Material', '环境 Environment', '测量 Measurement']
  const elements: BoardElement[] = [
    heading('鱼骨图 · 原因分析', 80, 30, 560),
    caption('右侧填问题，六根主骨对应六个维度，小鱼刺写具体原因。', 82, 96, 700),
    { ...block('问题：上线缺陷率偏高 →', 700, 380, 420, 110, '#FDECEA', 'round', 18), id: spine },
  ]
  categories.forEach((text, i) => {
    const id = uidPrefix('fb')
    const y = i < 3 ? 120 + i * 140 : 260 + (i - 3) * 140
    elements.push({ ...block(text, 380, y, 240, 90, ['#E9E0FF', '#E5F2FF', '#FFF4D8', '#E7F4E9', '#FFD8E5', '#E3E8EF'][i], 'round', 16), id })
    elements.push(connect(id, spine))
    elements.push(note('原因 1\n原因 2', 120, y, '#FFF1A8', 220, 90))
  })
  return { name: '鱼骨图', updatedAt: Date.now(), elements }
}

const retrofitBoard = (columns: { title: string; fill: string; seeds: string[] }[], name: string, subtitle: string): Board => {
  const elements: BoardElement[] = [heading(name, 80, 30, 620), caption(subtitle, 82, 96, 700)]
  columns.forEach((col, i) => {
    const x = 80 + i * 320
    elements.push(frame(col.title, x, 140, 280, 560))
    col.seeds.forEach((seed, j) => elements.push(note(seed, x + 16, 200 + j * 170, col.fill, 248, 150)))
  })
  return { name, updatedAt: Date.now(), elements }
}

const retroBoard = (): Board =>
  retrofitBoard(
    [
      { title: '做得好 🌟', fill: '#DDF3DF', seeds: ['继续保留的做法…', '这次协作很顺的环节…'] },
      { title: '待改进 🔧', fill: '#FFD8E5', seeds: ['卡住的地方…', '信息不同步的时刻…'] },
      { title: '下一步行动 🚀', fill: '#D8EEFF', seeds: ['负责人 + 截止时间的行动项…'] },
    ],
    '迭代复盘',
    '时长 30 分钟：先发散，再收敛成不超过 3 条行动项。',
  )

const roadmapBoard = (): Board => {
  const quarters = ['Q1 打基础', 'Q2 抢增长', 'Q3 拓场景', 'Q4 建生态']
  const elements: BoardElement[] = [heading('产品路线图', 80, 30, 560), caption('每一列是一个时间窗口，行代表主题泳道。', 82, 96, 660)]
  quarters.forEach((q, i) => elements.push(caption(q, 200 + i * 220, 140, 200)))
  ;['核心体验', '增长', '生态'].forEach((lane, li) => {
    elements.push({ ...block(lane, 60, 180 + li * 150, 130, 120, ['#E9E0FF', '#E5F2FF', '#E7F4E9'][li], 'round', 15) })
    ;[0, 1, 2, 3].forEach((qi) => {
      elements.push(note(`${lane} · ${quarters[qi].slice(0, 2)}`, 200 + qi * 220, 180 + li * 150, noteFills[(li + qi) % 4], 190, 120))
    })
  })
  return { name: '产品路线图', updatedAt: Date.now(), elements }
}

const flowBoard = (): Board => {
  const start = uidPrefix('fl')
  const step1 = uidPrefix('fl')
  const check = uidPrefix('fl')
  const end = uidPrefix('fl')
  const loop = uidPrefix('fl')
  return {
    name: '基础流程图',
    updatedAt: Date.now(),
    elements: [
      heading('基础流程图', 80, 30, 520),
      caption('拖拽开始/判断等图形即可改写流程，连接线自动跟随元素。', 82, 96, 680),
      { ...block('开始', 80, 160, 200, 90, '#E7F4E9', 'terminator', 16), id: start },
      { ...block('提交申请', 80, 300, 200, 90, '#E5F2FF', 'round', 16), id: step1 },
      { ...block('材料是否齐全？', 80, 440, 200, 110, '#FFF4D8', 'decision', 15), id: check },
      { ...block('补充材料', 360, 440, 180, 90, '#FDECEA', 'round', 15), id: loop },
      { ...block('审批通过并归档', 80, 620, 200, 90, '#E9E0FF', 'terminator', 16), id: end },
      connect(start, step1),
      connect(step1, check),
      connect(check, loop),
      connect(loop, step1),
      connect(check, end),
      { ...baseElement('text', 620, 460), id: uidPrefix('lb'), text: '否 → 退回补充\n是 ↓', w: 160, h: 60, fontSize: 14, textColor: '#8C8699', align: 'left' },
    ],
  }
}

const topologyBoard = (): Board => {
  const client = uidPrefix('tp')
  const web = uidPrefix('tp')
  const api = uidPrefix('tp')
  const db = uidPrefix('tp')
  const cache = uidPrefix('tp')
  return {
    name: '技术架构拓扑',
    updatedAt: Date.now(),
    elements: [
      heading('技术架构拓扑', 80, 30, 520),
      caption('用网络拓扑图形描述系统分层，双击图形改名即可。', 82, 96, 680),
      { ...block('移动端 / Web', 80, 150, 180, 120, '#E5F2FF', 'laptop', 15), id: client },
      { ...block('负载均衡', 340, 150, 180, 110, '#D8EEFF', 'switchNode', 15) },
      { ...block('Web 服务', 600, 150, 180, 110, '#E9E0FF', 'server', 15), id: web },
      { ...block('防火墙', 340, 320, 180, 110, '#FDECEA', 'firewall', 15) },
      { ...block('API 服务', 600, 320, 180, 110, '#E7F4E9', 'server', 15), id: api },
      { ...block('数据库', 860, 240, 150, 160, '#FFF4D8', 'database', 15), id: db },
      { ...block('缓存', 860, 440, 150, 140, '#FFD8E5', 'dataStore', 15), id: cache },
      connect(client, web),
      connect(web, api),
      connect(api, db),
      connect(api, cache),
    ],
  }
}

const orgBoard = (): Board => {
  const ceo = uidPrefix('og')
  const nodes = ['产品', '研发', '设计', '市场']
  const ids = nodes.map(() => uidPrefix('og'))
  return {
    name: '组织结构图',
    updatedAt: Date.now(),
    elements: [
      heading('组织结构图', 80, 30, 520),
      caption('自上而下拖出岗位，连接线随元素自动重连。', 82, 96, 660),
      { ...block('负责人', 400, 140, 220, 90, '#E9E0FF', 'round', 17), id: ceo },
      ...nodes.flatMap((text, i) => [
        { ...block(text, 120 + i * 300, 300, 220, 90, blockFills[i], 'round', 16), id: ids[i] },
        connect(ceo, ids[i]),
        note('成员与职责…', 120 + i * 300, 420, '#FFF1A8', 220, 120),
      ]),
    ],
  }
}

const competitorBoard = (): Board => ({
  name: '竞品对比矩阵',
  updatedAt: Date.now(),
  elements: [
    heading('竞品对比矩阵', 80, 30, 560),
    caption('表格列出维度，便签补充现场观察与结论。', 82, 96, 660),
    {
      ...baseElement('table', 80, 150),
      id: uidPrefix('tb'),
      w: 640,
      h: 260,
      rows: 5,
      cols: 4,
      cells: newCells(),
    },
    note('观察 1：对方上手更快', 760, 150, '#FFF1A8', 220, 130),
    note('观察 2：我们协作更顺', 760, 310, '#DDF3DF', 220, 130),
    note('结论：优先补强首日体验', 760, 470, '#E9E0FF', 220, 130),
  ],
})

/* ---------------- 模板库清单 ---------------- */

export const TEMPLATES: TemplateSpec[] = [
  { id: 'blank', name: '空白白板', desc: '从零开始，自由创作', category: 'blank', accent: '#E3E8EF', build: blankBoard },
  { id: 'launch', name: '产品发布计划', desc: '从想法到上线的三个阶段', category: 'diagram', accent: '#E9E0FF', build: launchBoard },
  { id: 'brainstorm', name: '头脑风暴', desc: '发散收集想法再聚类', category: 'facilitate', accent: '#FFF1A8', build: brainstormBoard },
  { id: 'journey', name: '用户旅程地图', desc: '四个阶段串联用户情绪', category: 'analysis', accent: '#D8EEFF', build: journeyBoard },
  { id: 'mindmap', name: '思维导图', desc: '中心主题逐层展开', category: 'facilitate', accent: '#E9E0FF', build: mindmapBoard },
  { id: 'kanban', name: '卡片看板', desc: '三列泳道跟踪迭代进度', category: 'facilitate', accent: '#E4F1E8', build: () => kanbanBoard() },
  { id: 'retro', name: '迭代复盘', desc: '做得好 / 待改进 / 行动项', category: 'facilitate', accent: '#DDF3DF', build: retroBoard },
  { id: 'cornell', name: '康奈尔笔记', desc: '记录区 + 线索区 + 总结区', category: 'facilitate', accent: '#FFF4D8', build: cornellBoard },
  { id: 'matrix4q', name: '时间管理四象限', desc: '按重要与紧急排序待办', category: 'facilitate', accent: '#E5F2FF', build: matrix4QBoard },
  { id: 'swot', name: 'SWOT 分析', desc: '优势、劣势、机会与威胁', category: 'strategy', accent: '#E7F4E9', build: swotBoard },
  { id: 'businessCanvas', name: '商业模式画布', desc: '九宫格描述价值与收入', category: 'strategy', accent: '#FFF4D8', build: businessCanvasBoard },
  { id: 'porter5', name: '波特五力模型', desc: '评估行业竞争强度', category: 'strategy', accent: '#FFD8E5', build: porterBoard },
  { id: 'bcg', name: '波士顿矩阵', desc: '份额与增长率二维取舍', category: 'strategy', accent: '#D8EEFF', build: bcgBoard },
  { id: 'ansoff', name: '安索夫矩阵', desc: '产品 × 市场的增长路径', category: 'strategy', accent: '#E7F4E9', build: ansoffBoard },
  { id: 'grow', name: 'GROW 教练模型', desc: '目标、现状、方案与行动', category: 'strategy', accent: '#E9E0FF', build: growBoard },
  { id: 'okr', name: 'OKR 目标对齐', desc: '一个目标配三个关键结果', category: 'strategy', accent: '#E5F2FF', build: okrBoard },
  { id: 'persona', name: '用户画像', desc: '动机、痛点与验收标准', category: 'analysis', accent: '#FFD8E5', build: personaBoard },
  { id: 'fiveWhy', name: '5 Why 根因分析', desc: '连问五次直到找到根因', category: 'analysis', accent: '#FFF1A8', build: fiveWhyBoard },
  { id: 'fishbone', name: '鱼骨图', desc: '六个维度拆解原因', category: 'analysis', accent: '#E3E8EF', build: fishboneBoard },
  { id: 'competitor', name: '竞品对比矩阵', desc: '表格对比 + 现场观察', category: 'analysis', accent: '#DDF3DF', build: competitorBoard },
  { id: 'aarrr', name: 'AARRR 增长模型', desc: '获客到推荐的五个环节', category: 'analysis', accent: '#FFF4D8', build: aarrrBoard },
  { id: 'roadmap', name: '产品路线图', desc: '多泳道排期四个季度', category: 'diagram', accent: '#E9E0FF', build: roadmapBoard },
  { id: 'flow', name: '基础流程图', desc: '判断分支与回退循环', category: 'diagram', accent: '#D8EEFF', build: flowBoard },
  { id: 'topology', name: '技术架构拓扑', desc: '网络设备的分层连接', category: 'diagram', accent: '#E7F4E9', build: topologyBoard },
  { id: 'org', name: '组织结构图', desc: '自上而下的岗位树', category: 'diagram', accent: '#FFD8E5', build: orgBoard },
]

export const findTemplate = (id: string) => TEMPLATES.find((t) => t.id === id)
