/** 预设白板：首次启动与模板库使用的示例画布。 */

import { baseElement } from './factories'
import { CONNECTOR_STROKE, CONNECTOR_STROKE_WIDTH, FRAME_STROKE } from './constants'
import type { Board, BoardElement, ShapeKind } from './types'

const node = (id: string, text: string, x: number, y: number, fill: string, shape: ShapeKind = 'round'): BoardElement => ({
  ...baseElement('shape', x, y), id, text, w: 180, h: 88, fill, shape, stroke: '#D8D3E2', fontSize: 15,
})
const link = (id: string, from: string, to: string): BoardElement => ({
  ...baseElement('connector', 0, 0), id, from, to, w: 0, h: 0, stroke: CONNECTOR_STROKE, strokeWidth: CONNECTOR_STROKE_WIDTH,
})
const note = (id: string, text: string, x: number, y: number, fill: string): BoardElement => ({
  ...baseElement('sticky', x, y), id, text, w: 176, h: 144, fill, fontSize: 14, align: 'left',
})

/** 标题类文本：预设画布里的标题只差字号与宽高，粗体与左对齐是共通点。 */
const title = (id: string, text: string, x: number, y: number, w: number, h: number, size: number): BoardElement => ({
  ...baseElement('text', x, y), id, text, w, h, fontSize: size, bold: true, align: 'left',
})

/** 说明类文本：灰色小字，用作副标题与页脚。 */
const caption = (id: string, text: string, x: number, y: number, w: number, h: number, size: number): BoardElement => ({
  ...baseElement('text', x, y), id, text, w, h, fontSize: size, textColor: '#8C8699', align: 'left',
})

export const launchBoard = (): Board => ({
  name: '产品发布计划', updatedAt: Date.now(),
  elements: [
    title('title', '产品发布计划', 80, 20, 620, 60, 36),
    caption('subtitle', 'NOVEMBER  ·  从想法到上线的共创空间', 82, 82, 520, 36, 13),
    title('stage1', '01  探索与定义', 90, 175, 240, 38, 17),
    title('stage2', '02  设计与验证', 410, 175, 240, 38, 17),
    title('stage3', '03  发布与增长', 730, 175, 240, 38, 17),
    node('n1', '明确用户问题', 90, 240, '#F0ECFF'), node('n2', '形成产品方案', 410, 240, '#E5F2FF'), node('n3', '准备正式发布', 730, 240, '#E7F4E9'),
    link('l1', 'n1', 'n2'), link('l2', 'n2', 'n3'),
    note('s1', '用户真正想完成的\n任务是什么？', 90, 390, '#FFF1A8'),
    note('s2', '访谈 5 位目标用户\n整理关键洞察', 285, 410, '#FFD8E5'),
    note('s3', '先完成核心路径\n保持体验简单', 410, 390, '#D8EEFF'),
    note('s4', '邀请 10 位用户\n进行可用性测试', 605, 410, '#E9E0FF'),
    note('s5', '官网 · 邮件 · 社群\n同步发布', 730, 390, '#DDF3DF'),
    note('s6', '关注激活率与\n第一周留存', 925, 410, '#FFF1A8'),
    caption('foot', '把大问题拆成小步骤，把每一步变成共同的进展。', 90, 620, 670, 40, 14),
  ],
})

export const blankBoard = (): Board => ({ name: '未命名白板', elements: [], updatedAt: Date.now() })

export const brainstormBoard = (): Board => ({
  name: '头脑风暴', updatedAt: Date.now(), elements: [
    title('bt', '如何让远程协作更有趣？', 100, 30, 620, 64, 34),
    note('b1', '每周一次\n线上咖啡时间 ☕', 120, 180, '#FFF1A8'),
    note('b2', '一起完成\n一幅团队画作', 340, 130, '#FFD8E5'),
    note('b3', '随机配对\n15 分钟轻聊', 570, 190, '#D8EEFF'),
    note('b4', '分享今天的小成就\n为彼此点赞', 240, 380, '#DDF3DF'),
    note('b5', '每月一次\n兴趣主题分享', 500, 390, '#E9E0FF'),
  ],
})

const card = (
  id: string,
  text: string,
  x: number,
  y: number,
  status: string,
  owner: string,
  due: string,
  desc: string,
  done = false,
): BoardElement => ({
  ...baseElement('card', x, y),
  id,
  text,
  status,
  owner,
  due,
  desc,
  done,
  fontSize: 15,
  align: 'left',
})

/** 卡片看板：三列容器 + 卡片，容器顺序在前保证垫底渲染。 */
export const kanbanBoard = (): Board => {
  const columns = [
    { id: 'kf0', title: '待规划', x: 80, status: '待开始' },
    { id: 'kf1', title: '进行中', x: 400, status: '进行中' },
    { id: 'kf2', title: '已完成', x: 720, status: '已完成' },
  ]
  const frames: BoardElement[] = columns.map((col) => ({
    ...baseElement('frame', col.x, 140),
    id: col.id,
    w: 280,
    h: 640,
    text: col.title,
    stroke: FRAME_STROKE,
  }))
  const titles: BoardElement[] = columns.map((col) => ({
    ...baseElement('text', col.x + 16, 158),
    id: `${col.id}-t`,
    w: 220,
    h: 34,
    text: col.title,
    fontSize: 17,
    bold: true,
    align: 'left',
    textColor: '#4327C4',
  }))
  const items: BoardElement[] = [
    card('c0', '梳理用户访谈提纲', 96, 210, '待开始', '林一', '11-03', '覆盖新用户与流失用户两类人'),
    card('c1', '整理竞品功能对照表', 96, 380, '待开始', '周舟', '11-05', '重点对比费用与协作能力'),
    card('c2', '完成首页视觉稿', 416, 210, '进行中', '李工', '11-01', '含深色模式的对比检查', false),
    card('c3', '补齐组件库文档', 416, 380, '进行中', '李工', '11-04', '补充 12 个高频组件示例'),
    card('c4', '上线支付能力', 736, 210, '已完成', '赵敏', '10-20', '已完成灰度验证', true),
    card('c5', '优化首次加载速度', 736, 380, '已完成', '陈实', '10-26', '首屏加载降到 1.2s', true),
  ]
  return {
    name: '卡片看板',
    updatedAt: Date.now(),
    elements: [
      title('kt', '卡片看板 · 迭代排期', 80, 30, 620, 64, 34),
      caption('ks', '双击卡片修改标题，右侧面板调整状态、负责人与截止时间', 82, 96, 660, 32, 13),
      ...frames,
      ...titles,
      ...items,
    ],
  }
}

export const journeyBoard = (): Board => ({
  name: '用户旅程地图', updatedAt: Date.now(), elements: [
    title('jt', '新用户首次体验旅程', 80, 30, 600, 64, 34),
    ...['发现产品', '注册账号', '首次创作', '邀请伙伴'].map((t, i) => node(`j${i}`, t, 80 + i * 240, 180, ['#F0ECFF','#E5F2FF','#FFF4D8','#E7F4E9'][i])),
    link('jl0', 'j0', 'j1'), link('jl1', 'j1', 'j2'), link('jl2', 'j2', 'j3'),
    ...['看到朋友分享', '快速完成注册', '创建第一块白板', '一起完成项目'].map((t, i) => note(`jn${i}`, t, 82 + i * 240, 350, ['#FFF1A8','#FFD8E5','#D8EEFF','#DDF3DF'][i])),
  ],
})
