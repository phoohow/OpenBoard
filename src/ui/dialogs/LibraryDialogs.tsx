/** 模板库与素材库弹层。 */

import { useState } from 'react'
import { Search } from 'lucide-react'
import { ASSET_LIBRARY, type AssetItem } from '@/features/assets/library'
import { TEMPLATE_CATEGORIES, findTemplate } from '@/features/templates/library'
import type { Favorite } from '@/features/storage/favorites'
import { MiniBoard } from '../common/MiniBoard'
import { Modal } from '../common/Modal'
import type { TemplateMeta } from '@/model/types'

export const TemplatesDialog = ({
  templates,
  favorites,
  onApply,
  onToggleFavorite,
  onClose,
}: {
  templates: (TemplateMeta & { category: string })[]
  favorites: Favorite[]
  onApply: (id: string) => void
  onToggleFavorite: (id: string) => void
  onClose: () => void
}) => {
  const [category, setCategory] = useState<string>('all')
  const [term, setTerm] = useState('')
  const favIds = new Set(favorites.filter((f) => f.type === 'template').map((f) => f.id))
  const list = templates.filter((t) => {
    const matchCategory = category === 'all' || (category === 'favorites' ? favIds.has(t.id) : t.category === category)
    const key = term.trim().toLowerCase()
    const matchTerm = !key || t.name.toLowerCase().includes(key) || t.desc.toLowerCase().includes(key)
    return matchCategory && matchTerm
  })
  return (
    <Modal title="模板库" subtitle={`共 ${templates.length} 套模板 · 套用会替换当前白板的全部内容`} onClose={onClose} width={760}>
      <label className="search-field">
        <Search size={14} />
        <input value={term} placeholder="搜索模板名称或用途" onChange={(e) => setTerm(e.target.value)} />
      </label>
      <div className="shape-tabs">
        <button type="button" className={category === 'all' ? 'chip active' : 'chip'} onClick={() => setCategory('all')}>
          全部
        </button>
        {TEMPLATE_CATEGORIES.map((c) => (
          <button key={c.id} type="button" className={category === c.id ? 'chip active' : 'chip'} onClick={() => setCategory(c.id)}>
            {c.label}
          </button>
        ))}
        <button type="button" className={category === 'favorites' ? 'chip active' : 'chip'} onClick={() => setCategory('favorites')}>
          收藏
        </button>
      </div>
      <div className="template-grid">
        {list.map((t) => (
          <div className="template-card" key={t.id}>
            <button type="button" className="template-apply" onClick={() => onApply(t.id)}>
              <span className="template-preview">
                {t.id === 'blank' ? (
                  <span className="template-empty">空白画布</span>
                ) : (
                  <MiniBoard elements={findTemplate(t.id)?.build().elements ?? []} />
                )}
              </span>
              <strong>{t.name}</strong>
              <em>{t.desc}</em>
              <span className="template-count">{t.count ? `${t.count} 个元素` : '空画布'}</span>
            </button>
            <button
              type="button"
              className={favIds.has(t.id) ? 'fav-star on template-fav' : 'fav-star template-fav'}
              title={favIds.has(t.id) ? '取消收藏' : '收藏'}
              onClick={() => onToggleFavorite(t.id)}
            >
              {favIds.has(t.id) ? '★' : '☆'}
            </button>
          </div>
        ))}
      </div>
      {!list.length && <p className="confirm-text">没有匹配的模板，换个关键词试试。</p>}
    </Modal>
  )
}

export const AssetsDialog = ({
  onPick,
  onClose,
}: {
  onPick: (group: 'emoji' | 'symbol' | 'stamp', item: AssetItem) => void
  onClose: () => void
}) => {
  const [group, setGroup] = useState<'emoji' | 'symbol' | 'stamp'>('emoji')
  const current = ASSET_LIBRARY.find((g) => g.id === group) ?? ASSET_LIBRARY[0]
  return (
    <Modal title="素材库" subtitle="点击即可插入到画布中央" onClose={onClose} width={620}>
      <div className="shape-tabs">
        {ASSET_LIBRARY.map((g) => (
          <button key={g.id} type="button" className={group === g.id ? 'chip active' : 'chip'} onClick={() => setGroup(g.id)}>
            {g.label}
          </button>
        ))}
      </div>
      <div className="asset-lib">
        {current.items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="asset-card"
            title={item.label}
            onClick={() => onPick(current.id, item)}
          >
            <span style={{ color: item.color }}>{item.glyph}</span>
            <em>{item.label}</em>
          </button>
        ))}
      </div>
    </Modal>
  )
}
