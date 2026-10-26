/** 载入与导入时的元素校验：严格校验用于本地存储，宽松校验用于外部 JSON。 */

import type { BoardElement } from './types'

/** 严格校验：本地存储的数据必须字段完整，缺失的元素直接丢弃。 */
export const isValidElement = (e: unknown): e is BoardElement => {
  const el = e as Partial<BoardElement> | null
  return (
    !!el &&
    typeof el.id === 'string' &&
    typeof el.kind === 'string' &&
    Number.isFinite(el.x) &&
    Number.isFinite(el.y) &&
    Number.isFinite(el.w) &&
    Number.isFinite(el.h)
  )
}

/** 宽松校验：外部导入只要求定位字段可用，其余交由默认值兜底。 */
export const normalizeImported = (raw: unknown): BoardElement[] => {
  const list = Array.isArray(raw) ? raw : []
  return list.filter((item): item is BoardElement => {
    const el = item as Partial<BoardElement> | null
    return !!el && typeof el.id === 'string' && typeof el.kind === 'string' && Number.isFinite(el.x) && Number.isFinite(el.y)
  })
}
