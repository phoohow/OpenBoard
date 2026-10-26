/** 形状库面板：按分组切换图形并支持收藏。 */

import { useState } from 'react'
import type { Favorite } from '@/features/storage/favorites'
import { SHAPE_GROUPS } from '@/model/constants'
import type { ShapeKind } from '@/model/types'

export const ShapeLibraryPanel = ({
  value,
  onChange,
  favorites = [],
  onToggleFavorite,
}: {
  value: ShapeKind
  onChange: (v: ShapeKind) => void
  favorites?: Favorite[]
  onToggleFavorite?: (id: string) => void
}) => {
  const [openId, setOpenId] = useState<string | null>(null)
  const activeGroup = SHAPE_GROUPS.find((g) => g.items.some((i) => i.id === value))
  const current = openId ?? activeGroup?.id ?? 'basic'
  const favShapeIds = new Set(favorites.filter((f) => f.type === 'shape').map((f) => f.id))
  const allItems = SHAPE_GROUPS.flatMap((g) => g.items)
  const items =
    current === 'fav'
      ? allItems.filter((i) => favShapeIds.has(i.id))
      : SHAPE_GROUPS.find((g) => g.id === current)?.items ?? []
  return (
    <section className="shape-library">
      <h4>图形形状</h4>
      <div className="shape-tabs">
        {SHAPE_GROUPS.map((g) => (
          <button key={g.id} type="button" className={current === g.id ? 'chip active' : 'chip'} onClick={() => setOpenId(g.id)}>
            {g.label}
          </button>
        ))}
        <button type="button" className={current === 'fav' ? 'chip active' : 'chip'} onClick={() => setOpenId('fav')}>
          收藏
        </button>
      </div>
      <div className="btn-row wrap shape-items">
        {items.length === 0 ? (
          <p className="confirm-text">还没有收藏的图形，点击图形右侧的星标即可收藏。</p>
        ) : (
          items.map((item) => (
            <div className="shape-item" key={item.id}>
              <button
                type="button"
                className={value === item.id ? 'chip wide active' : 'chip wide'}
                onClick={() => onChange(item.id)}
              >
                {item.label}
              </button>
              <button
                type="button"
                className={favShapeIds.has(item.id) ? 'fav-star on' : 'fav-star'}
                title={favShapeIds.has(item.id) ? '取消收藏' : '收藏'}
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleFavorite?.(item.id)
                }}
              >
                {favShapeIds.has(item.id) ? '★' : '☆'}
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
