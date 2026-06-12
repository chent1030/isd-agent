import { ipcMain } from 'electron'
import net from 'net'

interface OperatorIdentity {
  empName?: string
  empWorkNo?: string
}
interface AvailableItem {
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
  cabinetNo?: string
  cabinetName?: string
  slotNo?: number
  slotQuantity?: number
  minQuantity?: number
  enabled?: boolean
  status?: string
}

interface CabinetItemLocation {
  cabinetNo: string
  cabinetName?: string
  slotNo: number
  quantity: number
  enabled: boolean
  status: string
}

interface CabinetCatalogItem {
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
  locations: CabinetItemLocation[]
}

const DEFAULT_CABINET_API_BASE_URL = 'https://cshzeroapi.uabcbattery.com/unify/v1/1'
const DEFAULT_LOCK_SERVER_IP = '10.134.231.111'
const DEFAULT_LOCK_SERVER_PORT = 10123
const DEFAULT_TWIN_LEFT_CABINET_NO = '1'
const DEFAULT_TWIN_RIGHT_CABINET_NO = '2'
const LOCK_SOCKET_TIMEOUT = 3000
const PROTOCOL_HEADER = Buffer.from([0x73, 0x74, 0x61, 0x72])
const PROTOCOL_FOOTER = Buffer.from([0x65, 0x6e, 0x64, 0x6f])
const CMD_OPEN_SINGLE_LOCK = 0x9a

function firstDefined(...values: unknown[]) {
  return values.find(value => value !== undefined && value !== null && value !== '')
}

function getCabinetApiBaseUrl() {
  return (process.env.CABINET_LEDGER_API_BASE_URL || DEFAULT_CABINET_API_BASE_URL).replace(/\/+$/, '')
}

function getLockServerIp() {
  return process.env.CABINET_LOCK_SERVER_IP || process.env.CABINET_SERVER_IP || DEFAULT_LOCK_SERVER_IP
}

function getLockServerPort() {
  const value = Number(process.env.CABINET_LOCK_SERVER_PORT || process.env.CABINET_SERVER_PORT)
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_LOCK_SERVER_PORT
}

function getTwinCabinetDefinitions() {
  const leftCabinetNo = normalizeCabinetNo(
    firstDefined(process.env.CABINET_TWIN_LEFT_CABINET_NO, process.env.CABINET_LEFT_CABINET_NO),
    DEFAULT_TWIN_LEFT_CABINET_NO,
  )
  const rightCabinetNo = normalizeCabinetNo(
    firstDefined(process.env.CABINET_TWIN_RIGHT_CABINET_NO, process.env.CABINET_RIGHT_CABINET_NO),
    DEFAULT_TWIN_RIGHT_CABINET_NO,
  )

  return [
    { cabinetNo: leftCabinetNo, name: '双排柜', columnCount: 2, rowCount: 6 },
    { cabinetNo: rightCabinetNo, name: '三排柜', columnCount: 3, rowCount: 6 },
  ]
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

async function requestCabinet(
  path: string,
  params?: Record<string, string | number | undefined | null>,
  operator?: OperatorIdentity,
  init?: RequestInit,
) {
  const url = new URL(`${getCabinetApiBaseUrl()}${path}`)
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
  const payload = await response.json()
  if (payload?.code !== undefined && payload.code !== 200) {
    throw new Error(payload?.message || '柜机接口请求失败')
  }
  return payload
}

async function fetchAvailableItems(operator?: OperatorIdentity): Promise<AvailableItem[]> {
  const payload = await requestCabinet('/cabinet/item/available', undefined, operator)
  const records = getPageRecords(payload)
  return records.map(normalizeAvailableItem).filter(item => item.id && item.name)
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeCabinetNo(value: unknown, fallback: string) {
  const text = String(value ?? '').trim()
  return text || fallback
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
    cabinetNo: normalizeCabinetNo(rawCabinetNo, ''),
    cabinetName: typeof item?.cabinetName === 'string' ? item.cabinetName : undefined,
    slotNo: Number.isFinite(Number(rawSlotNo)) ? Number(rawSlotNo) : undefined,
    minQuantity: Number.isFinite(Number(item?.minQuantity)) ? Number(item.minQuantity) : undefined,
    enabled: item?.enabled === undefined ? true : Boolean(item.enabled),
    status: String(firstDefined(item?.status, item?.slotStatus) || 'available'),
  }
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

function buildCatalogItems(items: AvailableItem[]): CabinetCatalogItem[] {
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
      locations: [],
    }

    next.stock = Math.max(next.stock, item.itemStock ?? item.stock ?? 0)
    next.cabinetQuantity += isLocationUsable(item) ? item.slotQuantity ?? 0 : 0
    next.restricted = next.restricted || Boolean(item.restricted || item.authRequired)
    next.authRequired = next.authRequired || Boolean(item.authRequired || item.restricted)
    next.authorized = next.authorized && item.authorized !== false

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

function buildCategories(items: CabinetCatalogItem[]) {
  const categoryMap = new Map<string, { id: string; name: string; itemCount: number }>()
  for (const item of items) {
    const id = item.categoryId || 'default'
    const current = categoryMap.get(id) || { id, name: item.category || '未分类', itemCount: 0 }
    current.itemCount += 1
    categoryMap.set(id, current)
  }
  return Array.from(categoryMap.values()).sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'))
}

function normalizeOperationLocations(payload: any) {
  return Array.isArray(payload?.locations) ? payload.locations : []
}

function buildTwinCabinets(items: AvailableItem[]) {
  const cabinets = getTwinCabinetDefinitions().map(cabinet => {
    const cabinetNo = cabinet.cabinetNo
    const itemWithName = items.find(item => item.cabinetNo === cabinetNo && item.cabinetName)
    const totalSlots = cabinet.columnCount * cabinet.rowCount
    return {
      ...cabinet,
      cabinetNo,
      name: itemWithName?.cabinetName || cabinet.name,
      slots: Array.from({ length: totalSlots }, (_, slotIndex) => {
        const slotNo = slotIndex + 1
        const item = items.find(current => current.cabinetNo === cabinetNo && current.slotNo === slotNo)
        const quantity = item?.stock ?? 0
        const minQuantity = item?.minQuantity ?? 2
        const status = !item
          ? 'empty'
          : quantity <= 0
            ? 'depleted'
            : quantity <= minQuantity
              ? 'low'
              : 'available'

        return {
          cabinetNo,
          slotNo,
          itemId: item?.id || null,
          itemName: item?.name || '',
          category: item?.category || '',
          spec: item?.spec || '',
          useType: item?.useType ?? null,
          quantity,
          minQuantity,
          status,
        }
      }),
    }
  })

  return {
    cabinets,
    updatedAt: new Date().toISOString(),
  }
}

function normalizeOperator(operator?: OperatorIdentity) {
  const empWorkNo = String(operator?.empWorkNo || '').trim()
  const empName = String(operator?.empName || '').trim()
  if (!empWorkNo || !empName) throw new Error('缺少操作人身份信息，请先完成人脸认证')
  return { empWorkNo, empName }
}

function normalizeAction(action: unknown) {
  const value = String(action || '').trim()
  if (value !== 'receive' && value !== 'borrow' && value !== 'return') {
    throw new Error('不支持的柜体操作')
  }
  return value
}

function calculateBCC(dataList: number[]) {
  let checksum = 0
  for (const byte of dataList) checksum ^= byte
  return checksum
}

function buildOpenLockCommand(boardAddr: number, lockNumber: number) {
  const payload = [CMD_OPEN_SINGLE_LOCK, boardAddr, lockNumber, 0x11]
  return Buffer.concat([
    PROTOCOL_HEADER,
    Buffer.from(payload),
    Buffer.from([calculateBCC(payload)]),
    PROTOCOL_FOOTER,
  ])
}

function sendLockCommand(commandBytes: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    const socket = new net.Socket()
    socket.setTimeout(LOCK_SOCKET_TIMEOUT)

    socket.on('connect', () => {
      socket.write(commandBytes)
    })

    socket.on('data', data => {
      socket.destroy()
      resolve(Buffer.isBuffer(data) ? data : Buffer.from(data))
    })

    socket.on('timeout', () => {
      socket.destroy()
      reject(new Error('锁控板连接超时，未收到响应'))
    })

    socket.on('error', error => {
      socket.destroy()
      reject(error)
    })

    socket.connect(getLockServerPort(), getLockServerIp())
  })
}

function parseOpenLockResponse(response: Buffer, boardAddr: number, lockNumber: number) {
  if (response.length < 10) throw new Error('锁控板响应长度不足')
  const headerMatched =
    response[0] === PROTOCOL_HEADER[0] &&
    response[1] === PROTOCOL_HEADER[1] &&
    response[2] === PROTOCOL_HEADER[2] &&
    response[3] === PROTOCOL_HEADER[3]
  if (!headerMatched) throw new Error('锁控板响应头不匹配')
  if (response[4] !== CMD_OPEN_SINGLE_LOCK) throw new Error('锁控板响应命令码不匹配')
  if (response[5] !== boardAddr) throw new Error('锁控板地址不匹配')
  if (response[6] !== lockNumber) throw new Error('锁号不匹配')

  return {
    boardAddr,
    lockNumber,
    status: response[7] === 0x00 ? 'closed' : 'open',
  }
}

function parseHardwareByte(value: unknown, fieldName: string) {
  if (typeof value === 'number') return validateHardwareByte(value, fieldName, value)
  const text = String(value ?? '').trim()
  let parsed = NaN

  if (/^0x[0-9a-f]+$/i.test(text)) {
    parsed = Number.parseInt(text, 16)
  } else if (/^\d+$/.test(text)) {
    parsed = Number.parseInt(text, 10)
  } else if (/^[0-9a-f]{1,2}$/i.test(text) && /[a-f]/i.test(text)) {
    parsed = Number.parseInt(text, 16)
  } else {
    const suffix = text.match(/(\d+)$/)
    if (suffix) parsed = Number.parseInt(suffix[1], 10)
  }

  return validateHardwareByte(parsed, fieldName, value)
}

function validateHardwareByte(parsed: number, fieldName: string, rawValue: unknown) {
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 255) {
    throw new Error(`${fieldName}无法转换为锁控协议数值: ${rawValue}`)
  }
  return parsed
}

async function openSlotDoor(item: AvailableItem) {
  const boardAddr = parseHardwareByte(item.cabinetNo, '柜号')
  const lockNumber = parseHardwareByte(item.slotNo, '格口号')
  const response = await sendLockCommand(buildOpenLockCommand(boardAddr, lockNumber))
  return parseOpenLockResponse(response, boardAddr, lockNumber)
}

async function findCatalogItem(itemId: string | number, operator: OperatorIdentity) {
  const items = await fetchAvailableItems(operator)
  const item = buildCatalogItems(items).find(current => String(current.id) === String(itemId))
  if (!item) throw new Error(`未找到物品: ${itemId}`)
  return item
}

async function executeItemAction(params: {
  action: 'receive' | 'borrow'
  itemId: string | number
  quantity?: number
  operator?: OperatorIdentity
}) {
  const operator = normalizeOperator(params.operator)
  const quantity = Math.max(Number.parseInt(String(params.quantity ?? 1), 10) || 1, 1)
  const item = await findCatalogItem(params.itemId, operator)

  const plan = await requestCabinet('/cabinet/item/operate/plan', undefined, operator, {
    method: 'POST',
    body: JSON.stringify({
      itemId: item.id,
      quantity,
      action: params.action,
      operatorNo: operator.empWorkNo,
      operatorName: operator.empName,
    }),
  })
  const locations = normalizeOperationLocations(plan)
  if (!locations.length) {
    throw new Error(`后台未返回 ${item.name} 的可开格口`)
  }

  const doorResults = []
  for (const location of locations) {
    doorResults.push(await openSlotDoor({
      id: item.id,
      name: item.name,
      cabinetNo: location.cabinetNo,
      slotNo: location.slotNo,
      stock: location.quantity,
    }))
  }

  const endpoint = params.action === 'receive' ? '/cabinet/item/receive' : '/cabinet/item/operate/borrow'
  const body = params.action === 'receive'
    ? {
        itemId: item.id,
        quantity,
        operatorNo: operator.empWorkNo,
        operatorName: operator.empName,
        locations,
        remark: `终端领用：${operator.empName} ${item.name}`,
      }
    : {
        itemId: item.id,
        quantity,
        borrower: operator.empWorkNo,
        operatorNo: operator.empWorkNo,
        operatorName: operator.empName,
        locations,
        remark: `终端借用：${operator.empName} ${item.name}`,
      }

  const businessResult = await requestCabinet(endpoint, undefined, operator, {
    method: 'POST',
    body: JSON.stringify(body),
  })

  return { item, locations, doorResults, businessResult, quantity }
}
async function fetchOpenBorrowRecords(operator: OperatorIdentity) {
  const safeOperator = normalizeOperator(operator)
  const records: any[] = []
  for (const borrower of Array.from(new Set([safeOperator.empWorkNo, safeOperator.empName]))) {
    const payload = await requestCabinet('/cabinet/borrow/list', {
      borrower,
      status: 0,
      page: 1,
      size: 80,
    }, safeOperator)
    records.push(...getPageRecords(payload))
  }

  const seen = new Set<string>()
  return records
    .filter(record => toNumber(record?.pendingQuantity ?? record?.quantity, 0) > 0)
    .filter(record => {
      const id = String(record?.id ?? record?.borrowRecordId ?? '')
      if (!id || seen.has(id)) return false
      seen.add(id)
      return true
    })
    .map(record => ({
      id: record?.id ?? record?.borrowRecordId,
      itemId: record?.itemId,
      itemName: record?.itemName || record?.name || '',
      category: record?.category || '',
      spec: record?.spec || '',
      cabinetName: record?.cabinetName || '',
      cabinetNo: record?.cabinetNo,
      slotNo: record?.slotNo,
      quantity: toNumber(record?.quantity, 0),
      returnedQuantity: toNumber(record?.returnedQuantity, 0),
      pendingQuantity: toNumber(record?.pendingQuantity ?? record?.quantity, 0),
      borrowTime: record?.borrowTime || '',
      expectedReturnTime: record?.expectedReturnTime || '',
      remark: record?.remark || '',
    }))
}

export function registerCabinetHandlers() {
  ipcMain.handle('cabinet:twin-data', async (_event, { operator }: { operator?: OperatorIdentity } = {}) => {
    const items = await fetchAvailableItems(operator)
    return buildTwinCabinets(items)
  })

  ipcMain.handle('cabinet:categories', async () => {
    const items = buildCatalogItems(await fetchAvailableItems())
    return buildCategories(items)
  })

  ipcMain.handle('cabinet:catalog-items', async (_event, { categoryId }: { categoryId?: string } = {}) => {
    const items = buildCatalogItems(await fetchAvailableItems())
    return categoryId ? items.filter(item => item.categoryId === categoryId) : items
  })

  ipcMain.handle('cabinet:operate-slot', async (_event, {
    action,
    itemId,
    quantity = 1,
    operator,
  }: {
    action: 'receive' | 'borrow'
    itemId: string | number
    quantity?: number
    operator?: OperatorIdentity
  }) => {
    const normalizedAction = normalizeAction(action)
    if (normalizedAction === 'return') throw new Error('归还请使用借用记录归还接口')
    if (!itemId) throw new Error('缺少物品 ID')
    return executeItemAction({ action: normalizedAction, itemId, quantity, operator })
  })

  ipcMain.handle('cabinet:operate-item', async (_event, {
    action,
    itemId,
    quantity = 1,
    operator,
  }: {
    action: 'receive' | 'borrow'
    itemId: string | number
    quantity?: number
    operator?: OperatorIdentity
  }) => {
    const normalizedAction = normalizeAction(action)
    if (normalizedAction === 'return') throw new Error('归还请使用借用记录归还接口')
    if (!itemId) throw new Error('缺少物品 ID')
    return executeItemAction({ action: normalizedAction, itemId, quantity, operator })
  })

  ipcMain.handle('cabinet:open-borrow-records', async (_event, { operator }: { operator?: OperatorIdentity }) => {
    return fetchOpenBorrowRecords(operator || {})
  })

  ipcMain.handle('cabinet:return-record', async (_event, {
    borrowRecordId,
    itemId,
    quantity = 1,
    operator,
    remark,
  }: {
    borrowRecordId: string | number
    itemId?: string | number
    quantity?: number
    operator?: OperatorIdentity
    remark?: string
  }) => {
    const safeOperator = normalizeOperator(operator)
    if (!borrowRecordId) throw new Error('缺少借用记录 ID')
    if (!itemId) throw new Error('缺少归还物品 ID')

    const recordPayload = await requestCabinet('/cabinet/borrow/list', {
      status: 0,
      page: 1,
      size: 200,
    }, safeOperator)
    const record = getPageRecords(recordPayload)
      .find(current => String(current?.id ?? current?.borrowRecordId ?? '') === String(borrowRecordId))
    if (!record) throw new Error('未找到可归还的借用记录')
    if (!record.cabinetNo || !record.slotNo) throw new Error('借用记录缺少柜号或格口号')

    await openSlotDoor({
      id: String(itemId),
      name: String(record.itemName || '归还物品'),
      cabinetNo: record.cabinetNo,
      slotNo: record.slotNo,
      stock: quantity,
    })
    return requestCabinet('/cabinet/borrow/return', undefined, safeOperator, {
      method: 'POST',
      body: JSON.stringify({
        borrowRecordId,
        quantity,
        operatorNo: safeOperator.empWorkNo,
        operatorName: safeOperator.empName,
        remark: remark || `终端归还：${safeOperator.empName}`,
      }),
    })
  })
}
