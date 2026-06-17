import type {
  AppConfig,
  BorrowRecord,
  CabinetCatalogItem,
  CabinetCategory,
  CabinetOperationPayload,
  CabinetReturnPayload,
  Operator,
} from '@/types/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })

  // 204 或空体
  if (res.status === 204) return undefined as T

  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (!res.ok) {
    const message = data?.message || `请求失败 (${res.status})`
    throw new Error(message)
  }

  return data as T
}

export const api = {
  getAppConfig: () => request<AppConfig>('/api/app/config'),

  recognizeFace: (imageBase64: string) =>
    request<{ empName: string; empWorkNo: string } | null>('/api/face/recognize', {
      method: 'POST',
      body: JSON.stringify({ image: imageBase64 }),
    }),

  getCategories: () => request<CabinetCategory[]>('/api/cabinet/categories'),

  getCatalogItems: (categoryId?: string) =>
    request<CabinetCatalogItem[]>(
      `/api/cabinet/catalog-items${categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : ''}`,
    ),

  operateItem: (payload: CabinetOperationPayload) =>
    request<{ item: CabinetCatalogItem; locations: unknown[]; doorResults: unknown[] }>(
      '/api/cabinet/operate',
      { method: 'POST', body: JSON.stringify(payload) },
    ),

  getBorrowRecords: (operator: Operator) =>
    request<BorrowRecord[]>('/api/cabinet/borrow-records', {
      method: 'POST',
      body: JSON.stringify({ operator }),
    }),

  returnRecord: (payload: CabinetReturnPayload) =>
    request<unknown>('/api/cabinet/return', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}
