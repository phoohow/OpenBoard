/** 收藏项：模板与图形的收藏集合，直接持久化到 localStorage（与文档状态无关）。 */

import { useCallback, useState } from 'react'
import { loadFavorites, saveFavorites, type Favorite } from '@/features/storage/favorites'

export interface Favorites {
  favorites: Favorite[]
  toggleFavorite: (type: Favorite['type'], id: string) => void
}

export const useFavorites = (): Favorites => {
  const [favorites, setFavorites] = useState<Favorite[]>(() => loadFavorites())
  const toggleFavorite = useCallback((type: Favorite['type'], id: string) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.type === type && f.id === id)
      const next = exists ? prev.filter((f) => !(f.type === type && f.id === id)) : [...prev, { type, id }]
      saveFavorites(next)
      return next
    })
  }, [])

  return { favorites, toggleFavorite }
}
