export const CATEGORY_ACCENTS = ['#14b8a6', '#60a5fa', '#f97373']
export const ITEM_ACCENTS = ['#0f766e', '#2563eb', '#ca8a04', '#dc2626']

export function formatDateTime(value?: string) {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', { hour12: false })
}

export function useTypeLabel(useType: number | null | undefined) {
  if (useType === 0) return '领用'
  if (useType === 1) return '借用'
  if (useType === 2) return '领用 / 借用'
  return '未配置'
}

export function getDisplayInitial(value?: string) {
  return (value || '物').trim().slice(0, 1)
}

export function clampQuantity(value: number, maxQuantity: number) {
  const max = Math.max(Math.floor(maxQuantity) || 1, 1)
  return Math.min(Math.max(Math.floor(value) || 1, 1), max)
}
