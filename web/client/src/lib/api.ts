import type {
  AppConfig,
  BorrowRecord,
  CabinetCatalogItem,
  CabinetCategory,
  CabinetOperationPayload,
  CabinetReturnPayload,
  Operator,
} from '@/types/api'

const API_BASE_PATH = normalizeApiBasePath(import.meta.env.VITE_API_BASE_PATH)

function normalizeApiBasePath(value: unknown) {
  const raw = String(value || '/isd-api').trim()
  const withLeadingSlash = raw.startsWith('/') ? raw : `/${raw}`
  return withLeadingSlash.replace(/\/+$/, '')
}

function apiPath(path: string) {
  return `${API_BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })

  // 204 或空响应
  if (res.status === 204) return undefined as T

  const text = await res.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text ? { message: text } : null
  }

  if (!res.ok) {
    const message = typeof data === 'object' && data && 'message' in data && typeof data.message === 'string'
      ? data.message
      : `请求失败 (${res.status})`
    throw new Error(message)
  }

  return data as T
}

export const api = {
  getAppConfig: () => request<AppConfig>(apiPath('/app/config')),

  recognizeFace: (imageBase64: string) =>
    request<{ empName: string; empWorkNo: string } | null>(apiPath('/face/recognize'), {
      method: 'POST',
      body: JSON.stringify({ image: imageBase64 }),
    }),

  getCategories: () => request<CabinetCategory[]>(apiPath('/cabinet/categories')),

  getCatalogItems: (categoryId?: string) =>
    request<CabinetCatalogItem[]>(
      apiPath(`/cabinet/catalog-items${categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : ''}`),
    ),

  operateItem: (payload: CabinetOperationPayload) =>
    request<{ item: CabinetCatalogItem; locations: unknown[]; doorResults: unknown[] }>(
      apiPath('/cabinet/operate'),
      { method: 'POST', body: JSON.stringify(payload) },
    ),

  getBorrowRecords: (operator: Operator) =>
    request<BorrowRecord[]>(apiPath('/cabinet/borrow-records'), {
      method: 'POST',
      body: JSON.stringify({ operator }),
    }),

  returnRecord: (payload: CabinetReturnPayload) =>
    request<unknown>(apiPath('/cabinet/return'), {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}
