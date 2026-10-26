/** 收藏：图形与模板的星标，独立于白板文件存储。 */

export interface Favorite {
  type: 'shape' | 'template'
  id: string
}

const FAV_KEY = 'OpenBoard:favorites'

export const loadFavorites = (): Favorite[] => {
  try {
    const raw = localStorage.getItem(FAV_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr.filter(
      (f): f is Favorite => !!f && typeof f.id === 'string' && (f.type === 'shape' || f.type === 'template'),
    )
  } catch {
    return []
  }
}

export const saveFavorites = (favs: Favorite[]): void => {
  localStorage.setItem(FAV_KEY, JSON.stringify(favs))
}
