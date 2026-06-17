import { env, normalizeOperator } from '../env.js'
import {
  type OperatorIdentity,
  type AvailableItem,
  type CabinetCatalogItem,
  fetchAvailableItems,
  findCatalogItem,
  requestCabinet,
  normalizeOperationLocations,
  buildExpectedReturnTime,
  getPageRecords,
} from './cabinet-api.js'
import { openLock } from './lock-protocol.js'
import { normalizeBorrowRecordLocation } from '../shared/cabinet-record.js'

export interface BorrowRecord {
  id: string | number
  itemId: string | number
  itemName: string
  category?: string
  spec?: string
  cabinetName?: string
  cabinetNo?: string | number
  slotNo?: number
  quantity: number
  returnedQuantity: number
  pendingQuantity: number
  borrowTime?: string
  expectedReturnTime?: string
  remark?: string
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeAction(action: unknown) {
  const value = String(action || '').trim()
  if (value !== 'receive' && value !== 'borrow' && value !== 'return') {
    throw new Error('不支持的柜体操作')
  }
  return value
}

export interface ItemActionResult {
  item: CabinetCatalogItem
  locations: any[]
  doorResults: any[]
  businessResult: any
  quantity: number
}

/** 领用/借用：三步编排（plan → TCP 开柜 → 业务落库） */
export async function executeItemAction(params: {
  action: 'receive' | 'borrow'
  itemId: string | number
  quantity?: number
  operator?: OperatorIdentity
}): Promise<ItemActionResult> {
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
    doorResults.push(await openLock({
      cabinetNo: location.cabinetNo,
      slotNo: location.slotNo,
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
        expectedReturnTime: buildExpectedReturnTime(item),
        borrowerReminderHours: item.borrowerReminderHours ?? 24,
        adminReminderHours: item.adminReminderHours ?? 48,
        remark: `终端借用：${operator.empName} ${item.name}`,
      }

  const businessResult = await requestCabinet(endpoint, undefined, operator, {
    method: 'POST',
    body: JSON.stringify(body),
  })

  return { item, locations, doorResults, businessResult, quantity }
}

export async function operateItem(params: {
  action: 'receive' | 'borrow'
  itemId: string | number
  quantity?: number
  operator?: OperatorIdentity
}): Promise<ItemActionResult> {
  const normalizedAction = normalizeAction(params.action)
  if (normalizedAction === 'return') throw new Error('归还请使用借用记录归还接口')
  if (!params.itemId) throw new Error('缺少物品 ID')
  return executeItemAction({ action: normalizedAction, itemId: params.itemId, quantity: params.quantity, operator: params.operator })
}

export async function fetchOpenBorrowRecords(operator: OperatorIdentity): Promise<BorrowRecord[]> {
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
      cabinetName: record?.cabinetName || record?.cabinet_name || '',
      ...normalizeBorrowRecordLocation(record),
      quantity: toNumber(record?.quantity, 0),
      returnedQuantity: toNumber(record?.returnedQuantity, 0),
      pendingQuantity: toNumber(record?.pendingQuantity ?? record?.quantity, 0),
      borrowTime: record?.borrowTime || '',
      expectedReturnTime: record?.expectedReturnTime || '',
      remark: record?.remark || '',
    }))
}

export async function returnBorrowRecord(params: {
  borrowRecordId: string | number
  itemId?: string | number
  quantity?: number
  operator?: OperatorIdentity
  remark?: string
  cabinetNo?: string | number
  slotNo?: number
}) {
  const safeOperator = normalizeOperator(params.operator)
  if (!params.borrowRecordId) throw new Error('缺少借用记录 ID')
  if (!params.itemId) throw new Error('缺少归还物品 ID')

  const recordPayload = await requestCabinet('/cabinet/borrow/list', {
    status: 0,
    page: 1,
    size: 200,
  }, safeOperator)
  const record = getPageRecords(recordPayload)
    .find(current => String(current?.id ?? current?.borrowRecordId ?? '') === String(params.borrowRecordId))
  if (!record) throw new Error('未找到可归还的借用记录')

  const recordLocation = normalizeBorrowRecordLocation(record)
  const selectedLocation = normalizeBorrowRecordLocation({ cabinetNo: params.cabinetNo, slotNo: params.slotNo })
  const returnLocation = {
    cabinetNo: recordLocation.cabinetNo || selectedLocation.cabinetNo,
    slotNo: recordLocation.slotNo || selectedLocation.slotNo,
  }
  if (!returnLocation.cabinetNo || !returnLocation.slotNo) throw new Error('借用记录缺少柜号或格口号')

  await openLock({
    cabinetNo: returnLocation.cabinetNo,
    slotNo: returnLocation.slotNo,
  })

  const quantity = Math.max(Number.parseInt(String(params.quantity ?? 1), 10) || 1, 1)
  return requestCabinet('/cabinet/borrow/return', undefined, safeOperator, {
    method: 'POST',
    body: JSON.stringify({
      borrowRecordId: params.borrowRecordId,
      quantity,
      operatorNo: safeOperator.empWorkNo,
      operatorName: safeOperator.empName,
      remark: params.remark || `终端归还：${safeOperator.empName}`,
    }),
  })
}
