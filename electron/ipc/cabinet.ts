import { ipcMain } from 'electron'

interface OperatorIdentity {
  empName?: string
  empWorkNo?: string
}

type QuickAction = 'borrow' | 'receive'

interface AvailableItem {
  id: string
  name: string
  category?: string
  spec?: string
  useType?: number
  stock?: number
}

interface QuickAccessItem {
  itemId: string
  itemName: string
  action: QuickAction
  source: 'personal' | 'popular'
  category?: string
  spec?: string
  useType?: number
  quantity?: number
  count?: number
  lastUsedAt?: string
}

const DEFAULT_CABINET_API_BASE_URL = 'https://cshzeroapi.uabcbattery.com/unify/v1/1'

function getCabinetApiBaseUrl() {
  return (process.env.CABINET_LEDGER_API_BASE_URL || DEFAULT_CABINET_API_BASE_URL).replace(/\/+$/, '')
}

function getPageRecords(payload: any): any[] {
  const data = payload?.data ?? payload
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.rows)) return data.rows
  if (Array.isArray(data?.records)) return data.records
  return []
}

async function requestCabinet(path: string, params?: Record<string, string | number>, operator?: OperatorIdentity) {
  const url = new URL(`${getCabinetApiBaseUrl()}${path}`)
  for (const [key, value] of Object.entries(params || {})) {
    url.searchParams.set(key, String(value))
  }

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'X-Operator': operator?.empWorkNo || operator?.empName || '',
    },
  })

  if (!response.ok) throw new Error(`柜机接口请求失败：${response.status}`)
  const payload = await response.json()
  if (payload?.code !== undefined && payload.code !== 200) {
    throw new Error(payload?.message || '柜机接口请求失败')
  }
  return payload
}

async function fetchAvailableItems(operator?: OperatorIdentity): Promise<AvailableItem[]> {
  const payload = await requestCabinet('/cabinet/item/available', undefined, operator)
  const records = getPageRecords(payload)
  return records.map(item => ({
    id: String(item?.id ?? '').trim(),
    name: String(item?.name ?? '').trim(),
    category: typeof item?.category === 'string' ? item.category : undefined,
    spec: typeof item?.spec === 'string' ? item.spec : undefined,
    useType: Number.isFinite(Number(item?.useType)) ? Number(item.useType) : undefined,
    stock: Number.isFinite(Number(item?.stock)) ? Number(item.stock) : undefined,
  })).filter(item => item.id && item.name)
}

function itemKey(name?: unknown, spec?: unknown) {
  return `${String(name ?? '').trim()}::${String(spec ?? '').trim()}`
}

function findAvailableByRecord(record: any, availableItems: AvailableItem[]) {
  const itemId = String(record?.itemId ?? '').trim()
  if (itemId) {
    const byId = availableItems.find(item => item.id === itemId)
    if (byId) return byId
  }

  const byNameAndSpec = availableItems.find(item => itemKey(item.name, item.spec) === itemKey(record?.itemName, record?.spec))
  if (byNameAndSpec) return byNameAndSpec

  return availableItems.find(item => item.name === String(record?.itemName ?? '').trim())
}

function canReceive(item?: AvailableItem) {
  return item?.useType !== 1 && (item?.stock ?? 0) > 0
}

function canBorrow(item?: AvailableItem) {
  return item?.useType === 1 || item?.useType === 2
}

function pushUnique(items: QuickAccessItem[], seen: Set<string>, item: QuickAccessItem, limit: number) {
  const key = `${item.action}:${item.itemId}`
  if (seen.has(key)) return
  seen.add(key)
  items.push(item)
  if (items.length > limit) items.length = limit
}

async function fetchPersonalBorrowItems(operator: OperatorIdentity, availableItems: AvailableItem[]) {
  const borrowers = [operator.empWorkNo, operator.empName].map(v => String(v || '').trim()).filter(Boolean)
  const records: any[] = []

  for (const borrower of Array.from(new Set(borrowers))) {
    const payload = await requestCabinet('/cabinet/borrow/list', {
      borrower,
      page: 1,
      size: 20,
    }, operator)
    records.push(...getPageRecords(payload))
  }

  const items: QuickAccessItem[] = []
  for (const record of records) {
    const item = findAvailableByRecord(record, availableItems)
    if (!item || !canBorrow(item)) continue
    items.push({
      itemId: item.id,
      itemName: item.name,
      action: 'borrow',
      source: 'personal',
      category: item.category,
      spec: item.spec,
      useType: item.useType,
      quantity: Number.isFinite(Number(record?.quantity)) ? Number(record.quantity) : undefined,
      lastUsedAt: typeof record?.borrowTime === 'string' ? record.borrowTime : undefined,
    })
  }
  return items
}

async function fetchReceiveLedgers(operator: OperatorIdentity | undefined, pageSize: number) {
  const payload = await requestCabinet('/cabinet/ledger/list', {
    operationType: 1,
    page: 0,
    size: pageSize,
  }, operator)
  return getPageRecords(payload)
}

async function fetchPersonalReceiveItems(operator: OperatorIdentity, availableItems: AvailableItem[]) {
  const records = await fetchReceiveLedgers(operator, 80)
  const empWorkNo = String(operator.empWorkNo || '').trim()
  const empName = String(operator.empName || '').trim()

  const items: QuickAccessItem[] = []
  for (const record of records) {
    const operatorNo = String(record?.operatorNo || '').trim()
    const operatorName = String(record?.operatorName || '').trim()
    const isCurrentOperator = (empWorkNo && operatorNo === empWorkNo) || (empName && operatorName === empName)
    if (!isCurrentOperator) continue

    const item = findAvailableByRecord(record, availableItems)
    if (!item || !canReceive(item)) continue
    items.push({
      itemId: item.id,
      itemName: item.name,
      action: 'receive',
      source: 'personal',
      category: item.category,
      spec: item.spec,
      useType: item.useType,
      quantity: Number.isFinite(Number(record?.quantity)) ? Number(record.quantity) : undefined,
      lastUsedAt: typeof record?.storedAt === 'string' ? record.storedAt : undefined,
    })
  }
  return items
}

async function fetchPopularReceiveItems(operator: OperatorIdentity | undefined, availableItems: AvailableItem[], limit: number) {
  const records = await fetchReceiveLedgers(operator, 120)
  const counts = new Map<string, { item: AvailableItem; count: number; lastUsedAt?: string }>()

  for (const record of records) {
    const item = findAvailableByRecord(record, availableItems)
    if (!item || !canReceive(item)) continue
    const current = counts.get(item.id) || { item, count: 0, lastUsedAt: undefined }
    current.count += Number.isFinite(Number(record?.quantity)) ? Math.max(Number(record.quantity), 1) : 1
    if (!current.lastUsedAt && typeof record?.storedAt === 'string') current.lastUsedAt = record.storedAt
    counts.set(item.id, current)
  }

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(({ item, count, lastUsedAt }) => ({
      itemId: item.id,
      itemName: item.name,
      action: 'receive' as const,
      source: 'popular' as const,
      category: item.category,
      spec: item.spec,
      useType: item.useType,
      count,
      lastUsedAt,
    }))
}

async function fetchQuickAccessItems(operator: OperatorIdentity, limit: number): Promise<QuickAccessItem[]> {
  const availableItems = await fetchAvailableItems(operator)
  const personalItems = [
    ...(await fetchPersonalBorrowItems(operator, availableItems)),
    ...(await fetchPersonalReceiveItems(operator, availableItems)),
  ].sort((a, b) => String(b.lastUsedAt || '').localeCompare(String(a.lastUsedAt || '')))

  const items: QuickAccessItem[] = []
  const seen = new Set<string>()
  for (const item of personalItems) pushUnique(items, seen, item, limit)

  if (items.length > 0) return items
  return fetchPopularReceiveItems(operator, availableItems, limit)
}

export function registerCabinetHandlers() {
  ipcMain.handle('cabinet:recent-borrow-items', async (_event, {
    operator,
    limit = 5,
  }: {
    operator?: OperatorIdentity
    limit?: number
  }) => {
    const safeLimit = Math.min(Math.max(Number(limit) || 5, 1), 8)
    return fetchQuickAccessItems(operator || {}, safeLimit)
  })
}
