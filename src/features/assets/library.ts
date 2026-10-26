/** 素材库：可拖入画布的表情、符号与评议印章。 */

export interface AssetItem {
  id: string
  label: string
  glyph: string
  color?: string
}

export const ASSET_LIBRARY: { id: 'emoji' | 'symbol' | 'stamp'; label: string; items: AssetItem[] }[] = [
  {
    id: 'emoji',
    label: '表情贴纸',
    items: [
      { id: 'e-smile', label: '开心', glyph: '😀' },
      { id: 'e-think', label: '思考', glyph: '🤔' },
      { id: 'e-fire', label: '很赞', glyph: '🔥' },
      { id: 'e-clap', label: '鼓掌', glyph: '👏' },
      { id: 'e-heart', label: '喜欢', glyph: '❤️' },
      { id: 'e-star', label: '星星', glyph: '⭐' },
      { id: 'e-bulb', label: '灵感', glyph: '💡' },
      { id: 'e-rocket', label: '加速', glyph: '🚀' },
      { id: 'e-target', label: '目标', glyph: '🎯' },
      { id: 'e-warn', label: '风险', glyph: '⚠️' },
      { id: 'e-check', label: '完成', glyph: '✅' },
      { id: 'e-question', label: '疑问', glyph: '❓' },
    ],
  },
  {
    id: 'symbol',
    label: '符号图标',
    items: [
      { id: 's-star', label: '星标', glyph: '★', color: '#F2B94B' },
      { id: 's-heart', label: '心形', glyph: '♥', color: '#E0493B' },
      { id: 's-diamond', label: '菱形', glyph: '◆', color: '#6E56CF' },
      { id: 's-circle', label: '圆形', glyph: '●', color: '#2979A8' },
      { id: 's-triangle', label: '三角', glyph: '▲', color: '#56A477' },
      { id: 's-arrow', label: '箭头', glyph: '➜', color: '#4A7BD6' },
      { id: 's-check', label: '勾选', glyph: '✔', color: '#17A673' },
      { id: 's-cross', label: '叉号', glyph: '✖', color: '#E0493B' },
      { id: 's-flag', label: '旗帜', glyph: '⚑', color: '#C94F26' },
      { id: 's-gear', label: '设置', glyph: '⚙', color: '#7C8AA0' },
      { id: 's-clock', label: '时间', glyph: '⏱', color: '#8A54A1' },
      { id: 's-mail', label: '邮件', glyph: '✉', color: '#2979A8' },
    ],
  },
  {
    id: 'stamp',
    label: '评议印章',
    items: [
      { id: 't-pass', label: '通过', glyph: '✓ 通过', color: '#17A673' },
      { id: 't-reject', label: '驳回', glyph: '✗ 驳回', color: '#E0493B' },
      { id: 't-todo', label: '待确认', glyph: '? 待确认', color: '#C2860A' },
      { id: 't-focus', label: '重点', glyph: '★ 重点', color: '#F2B94B' },
      { id: 't-review', label: '待评审', glyph: '⌛ 待评审', color: '#6E56CF' },
      { id: 't-final', label: '已定稿', glyph: '✔ 已定稿', color: '#2979A8' },
    ],
  },
]
