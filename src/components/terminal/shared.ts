export const CATEGORY_ACCENTS = ['#2f8f67', '#1f7da5', '#9a6f2f', '#8a6eb8', '#c35f4c', '#4f7d51']
export const ITEM_ACCENTS = ['#2f8f67', '#1f7da5', '#9a6f2f', '#c35f4c']

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
