/** 导图主题：配色层级、示例板与整树换肤。 */

import { baseElement } from '@/model/factories'
import type { Board, BoardElement, MindTheme } from '@/model/types'
import { mindLevelOf, normalizeMindmaps } from './layout'
import { mindSubtreeIds } from './tree'

export interface MindThemeSpec {
  name: string
  levels: { fill: string; stroke: string; textColor: string }[]
}

export const mindThemes: Record<MindTheme, MindThemeSpec> = {
  grape: {
    name: '紫韵',
    levels: [
      { fill: '#6E56CF', stroke: '#4B37A8', textColor: '#FFFFFF' },
      { fill: '#E9E0FF', stroke: '#B9A8EA', textColor: '#3B2F63' },
      { fill: '#FFFFFF', stroke: '#D8D0EE', textColor: '#38324B' },
    ],
  },
  forest: {
    name: '森野',
    levels: [
      { fill: '#2F8F5B', stroke: '#1F6B43', textColor: '#FFFFFF' },
      { fill: '#DCF1E3', stroke: '#8FCBA6', textColor: '#1F5236' },
      { fill: '#FFFFFF', stroke: '#C6E2D2', textColor: '#2E3A33' },
    ],
  },
  sunset: {
    name: '暖阳',
    levels: [
      { fill: '#E16B5B', stroke: '#B94A3C', textColor: '#FFFFFF' },
      { fill: '#FFE0D8', stroke: '#F2B49F', textColor: '#6C2E22' },
      { fill: '#FFFFFF', stroke: '#F3D6CB', textColor: '#40312C' },
    ],
  },
  ocean: {
    name: '沧澜',
    levels: [
      { fill: '#2979A8', stroke: '#1C5A80', textColor: '#FFFFFF' },
      { fill: '#DCEDF8', stroke: '#8FC0DC', textColor: '#173F58' },
      { fill: '#FFFFFF', stroke: '#C7DEEC', textColor: '#2C3640' },
    ],
  },
  slate: {
    name: '石墨',
    levels: [
      { fill: '#25232D', stroke: '#121117', textColor: '#FFFFFF' },
      { fill: '#EDEBF2', stroke: '#B6B0C4', textColor: '#2B2733' },
      { fill: '#FFFFFF', stroke: '#D9D5E4', textColor: '#38333F' },
    ],
  },
  candy: {
    name: '糖果',
    levels: [
      { fill: '#F2B94B', stroke: '#C98A1E', textColor: '#4A3208' },
      { fill: '#FFF3D6', stroke: '#EBD293', textColor: '#5A4620' },
      { fill: '#FFFFFF', stroke: '#F0E3C4', textColor: '#4A4232' },
    ],
  },
}

export const MIND_THEMES = Object.keys(mindThemes) as MindTheme[]

/** 思维导图示例板。 */
export const mindmapBoard = (): Board => {
  const structure: { id: string; text: string; parent?: string }[] = [
    { id: 'm0', text: '在线白板产品规划' },
    { id: 'm1', text: '画布与创作', parent: 'm0' },
    { id: 'm2', text: '结构化内容', parent: 'm0' },
    { id: 'm3', text: '协作与沟通', parent: 'm0' },
    { id: 'm4', text: '演示与交付', parent: 'm0' },
    { id: 'm5', text: '无限画布', parent: 'm1' },
    { id: 'm6', text: '画笔与便签', parent: 'm1' },
    { id: 'm7', text: '思维导图', parent: 'm2' },
    { id: 'm8', text: '表格与看板', parent: 'm2' },
    { id: 'm9', text: '评论与投票', parent: 'm3' },
    { id: 'm10', text: '音视频会议', parent: 'm3' },
    { id: 'm11', text: '演示模式', parent: 'm4' },
    { id: 'm12', text: '导出与分享', parent: 'm4' },
  ]
  const elements = structure.map((item, index) => {
    const level = !item.parent ? 0 : structure.find((s) => s.id === item.parent)?.parent ? 2 : 1
    const spec = mindThemes.grape.levels[level]
    return {
      ...baseElement('mindnode', 0, index * 40),
      id: item.id,
      text: item.text,
      parent: item.parent,
      rootId: 'm0',
      fontSize: level === 0 ? 22 : level === 1 ? 17 : 15,
      bold: level === 0,
      fill: spec.fill,
      stroke: spec.stroke,
      textColor: spec.textColor,
    }
  })
  return { name: '思维导图', elements: normalizeMindmaps(elements), updatedAt: Date.now() }
}

/** 为整棵导图套用主题配色，并同步字号与加粗层级。 */
export const applyMindTheme = (elements: BoardElement[], rootId: string, theme: MindTheme): BoardElement[] => {
  const ids = mindSubtreeIds(elements, rootId)
  const set = new Set(ids)
  return elements.map((el) => {
    if (!set.has(el.id)) return el
    const level = mindLevelOf(elements, el.id)
    const spec = mindThemes[theme].levels[Math.min(level, mindThemes[theme].levels.length - 1)]
    return {
      ...el,
      fill: spec.fill,
      strokeWidth: level === 0 ? 2 : 1.5,
      stroke: spec.stroke,
      textColor: spec.textColor,
      fontSize: level === 0 ? 22 : level === 1 ? 17 : 15,
      bold: level === 0,
      w: 0,
      h: 0,
    }
  })
}
