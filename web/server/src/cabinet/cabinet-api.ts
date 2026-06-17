import { env } from '../env.js'

export interface OperatorIdentity {
  empName?: string
  empWorkNo?: string
}

export interface AvailableItem {
  id: string
  name: string
  categoryId?: string
  category?: string
  spec?: string
  useType?: number
  stock?: number
  itemStock?: number
  restricted?: boolean
  authorized?: boolean
  authRequired?: boolean
  borrowerReminderHours?: number
  adminReminderHours?: number
  cabinetNo?: string
  cabinetName?: string
  slotNo?: number
  slotQuantity?: number
  minQuantity?: number
  enabled?: boolean
  status?: string
}

export interface CabinetItemLocation {
  cabinetNo: string
  cabinetName?: string
  slotNo: number
  quantity: number
  enabled: boolean
  status: string
}

export interface CabinetCatalogItem {
  id: string
  name: string
  categoryId: string
  category: string
  spec?: string
  useType?: number
  stock: number
  cabinetQuantity: number
  restricted: boolean
  authorized: boolean
  authRequired: boolean
  borrowerReminderHours?: number
  adminReminderHours?: number
  locations: CabinetItemLocation[]
}

export interface CabinetCategory {
  id: string
  name: string
  itemCount: number
}

function firstDefined(...values: unknown[]) {
  return values.find(value => value !== undefined && value !== null && value !== '')
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeCabinetNo(value: unknown, fallback: string) {
  const text = String(value ?? '').trim()
  return text || fallback
}

export async function requestCabinet(
  path: string,
  params?: Record<string, string | number | undefined | null>,
  operator?: OperatorIdentity,
  init?: RequestInit,
) {
  const url = new URL(`${env.cabinetApiBaseUrl}${path}`)
  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null || value === '') continue
    url.searchParams.set(key, String(value))
  }

  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
      'X-Operator': operator?.empWorkNo || operator?.empName || '',
    },
  })

  if (!response.ok) throw new Error(`柜机接口请求失败：${response.status}`)
  const payload: any = await response.json()
  if (payload?.code !== undefined && payload.code !== 200) {
    throw new Error(payload?.message || '柜机接口请求失败')
  }
  return payload
}

export function getPageRecords(payload: any): any[] {
  const data = payload?.data ?? payload
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.rows)) return data.rows
  if (Array.isArray(data?.records)) return data.records
  return []
}

function normalizeAvailableItem(item: any): AvailableItem {
  const stock = toNumber(firstDefined(item?.stock, item?.itemStock, item?.totalStock, item?.inventoryQuantity, item?.quantity), 0)
  const slotQuantity = toNumber(firstDefined(item?.slotQuantity, item?.cabinetQuantity, item?.locationQuantity, item?.gridQuantity, item?.availableQuantity, item?.itemQuantity), stock)
  const rawCabinetNo = firstDefined(item?.cabinetNo, item?.cabinetId, item?.cabinetCode, item?.lockerNo)
  const rawSlotNo = firstDefined(item?.slotNo, item?.gridNo, item?.cellNo, item?.doorNo, item?.lockNo)
  const authRequired = Boolean(firstDefined(item?.authRequired, item?.restricted, item?.needAuth, item?.permissionRequired))
  const authorized = firstDefined(item?.authorized, item?.hasPermission, item?.permitted)
  return {
    id: String(item?.id ?? '').trim(),
    name: String(item?.name ?? item?.itemName ?? '').trim(),
    categoryId: String(firstDefined(item?.categoryId, item?.categoryCode, item?.category) || 'default').trim(),
    category: String(firstDefined(item?.categoryName, item?.category, item?.typeName) || '未分类').trim(),
    spec: typeof item?.spec === 'string' ? item.spec : undefined,
    useType: Number.isFinite(Number(item?.useType)) ? Number(item.useType) : undefined,
    stock,
    itemStock: stock,
    slotQuantity,
    restricted: authRequired,
    authRequired,
    authorized: authorized === undefined ? !authRequired : Boolean(authorized),
    borrowerReminderHours: toNumber(firstDefined(item?.borrowerReminderHours, item?.borrower_reminder_hours), 24),
    adminReminderHours: toNumber(firstDefined(item?.adminReminderHours, item?.admin_reminder_hours), 48),
    cabinetNo: normalizeCabinetNo(rawCabinetNo, ''),
    cabinetName: typeof item?.cabinetName === 'string' ? item.cabinetName : undefined,
    slotNo: Number.isFinite(Number(rawSlotNo)) ? Number(rawSlotNo) : undefined,
    minQuantity: Number.isFinite(Number(item?.minQuantity)) ? Number(item.minQuantity) : undefined,
    enabled: item?.enabled === undefined ? true : Boolean(item.enabled),
    status: String(firstDefined(item?.status, item?.slotStatus) || 'available'),
  }
}

export async function fetchAvailableItems(operator?: OperatorIdentity): Promise<AvailableItem[]> {
  const payload = await requestCabinet('/cabinet/item/available', undefined, operator)
  const records = getPageRecords(payload)
  return records.map(normalizeAvailableItem).filter(item => item.id && item.name)
}

function isLocationUsable(item: AvailableItem) {
  const status = String(item.status || 'available').toLowerCase()
  return Boolean(
    item.enabled !== false &&
    item.cabinetNo &&
    item.slotNo &&
    (item.slotQuantity ?? 0) > 0 &&
    status !== 'fault' &&
    status !== 'disabled' &&
    status !== 'depleted',
  )
}

export function buildCatalogItems(items: AvailableItem[]): CabinetCatalogItem[] {
  const grouped = new Map<string, CabinetCatalogItem>()

  for (const item of items) {
    const existing = grouped.get(item.id)
    const next = existing || {
      id: item.id,
      name: item.name,
      categoryId: item.categoryId || item.category || 'default',
      category: item.category || '未分类',
      spec: item.spec,
      useType: item.useType,
      stock: item.itemStock ?? item.stock ?? 0,
      cabinetQuantity: 0,
      restricted: Boolean(item.restricted || item.authRequired),
      authorized: item.authorized !== false,
      authRequired: Boolean(item.authRequired || item.restricted),
      borrowerReminderHours: item.borrowerReminderHours,
      adminReminderHours: item.adminReminderHours,
      locations: [],
    }

    next.stock = Math.max(next.stock, item.itemStock ?? item.stock ?? 0)
    next.cabinetQuantity += isLocationUsable(item) ? item.slotQuantity ?? 0 : 0
    next.restricted = next.restricted || Boolean(item.restricted || item.authRequired)
    next.authRequired = next.authRequired || Boolean(item.authRequired || item.restricted)
    next.authorized = next.authorized && item.authorized !== false
    next.borrowerReminderHours = item.borrowerReminderHours ?? next.borrowerReminderHours
    next.adminReminderHours = item.adminReminderHours ?? next.adminReminderHours

    if (isLocationUsable(item)) {
      next.locations.push({
        cabinetNo: item.cabinetNo || '',
        cabinetName: item.cabinetName,
        slotNo: item.slotNo || 0,
        quantity: item.slotQuantity ?? 0,
        enabled: item.enabled !== false,
        status: item.status || 'available',
      })
    }

    grouped.set(item.id, next)
  }

  return Array.from(grouped.values()).sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'))
}

export function buildCategories(items: CabinetCatalogItem[]): CabinetCategory[] {
  const categoryMap = new Map<string, CabinetCategory>()
  for (const item of items) {
    const id = item.categoryId || 'default'
    const current = categoryMap.get(id) || { id, name: item.category || '未分类', itemCount: 0 }
    current.itemCount += 1
    categoryMap.set(id, current)
  }
  return Array.from(categoryMap.values()).sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'))
}

export async function findCatalogItem(itemId: string | number, operator: OperatorIdentity) {
  const items = await fetchAvailableItems(operator)
  const item = buildCatalogItems(items).find(current => String(current.id) === String(itemId))
  if (!item) throw new Error(`未找到物品: ${itemId}`)
  return item
}

export function normalizeOperationLocations(payload: any) {
  return Array.isArray(payload?.locations) ? payload.locations : []
}

export function buildExpectedReturnTime(item: CabinetCatalogItem) {
  const reminderHours = Math.max(Math.floor(item.borrowerReminderHours ?? 24), 1)
  return new Date(Date.now() + reminderHours * 60 * 60 * 1000).toISOString()
}
