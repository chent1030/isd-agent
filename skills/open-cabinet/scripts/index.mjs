import { openAndWaitForClose } from './door-monitor.mjs'
import { getAllItems, getSlotHardware, deductInventory, returnInventory, resolveOperatorIdentity } from './api-service.mjs'

export async function fetchAllItems() {
  console.log(`[Step 1] 获取物品列表...`)
  const items = await getAllItems()
  console.log(`[Step 1] 共获取 ${items.length} 个物品`)
  return items
}

export const fetchAndMatchItems = fetchAllItems

async function resolveItem(itemOrId) {
  if (itemOrId && typeof itemOrId === 'object') {
    return itemOrId
  }

  const items = await getAllItems()
  const item = items.find(current => String(current.id) === String(itemOrId))
  if (!item) {
    throw new Error(`未找到物品: ${itemOrId}`)
  }
  return item
}

export function parseHardwareCode(value, fieldName) {
  if (typeof value === 'number') {
    return validateHardwareByte(value, fieldName, value)
  }
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
    if (suffix) {
      parsed = Number.parseInt(suffix[1], 10)
    }
  }

  return validateHardwareByte(parsed, fieldName, value)
}

function validateHardwareByte(parsed, fieldName, rawValue) {
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 255) {
    throw new Error(`${fieldName}无法转换为锁控协议数值: ${rawValue}`)
  }
  return parsed
}

export async function borrowItem(item, quantity = 1, options = {}) {
  const { serverIp, serverPort, onStatusChange } = options
  const operator = resolveOperatorIdentity(options)
  item = await resolveItem(item)
  if (item.useType === 1) {
    throw new Error(`物品 ${item.name} 仅支持借用，不能领用`)
  }
  if ((item.stock ?? 0) < quantity) {
    throw new Error(`库存不足: ${item.name} 当前库存 ${item.stock ?? 0}, 请求数量 ${quantity}`)
  }
  const hardware = getSlotHardware(item.cabinetNo, item.slotNo)
  const boardAddr = parseHardwareCode(hardware.boardAddr, '柜号')
  const lockNumber = parseHardwareCode(hardware.lockNumber, '格口号')

  console.log(`=== 领取物品: ${item.name} (${item.id}) ===`)
  console.log(`操作人: ${operator.operatorName} (${operator.operatorNo})`)
  console.log(`柜号信息: 柜号${item.cabinetNo} 格口${item.slotNo}`)

  const doorResult = await openAndWaitForClose(boardAddr, lockNumber, {
    serverIp, serverPort, onStatusChange
  })
  console.log(`柜门关闭，耗时 ${doorResult.elapsed}ms`)

  const deductResult = await deductInventory(item.id, quantity, {
    ...operator,
    remark: `语音领用：${operator.operatorName} ${item.name}`
  })
  console.log(`库存扣减: 成功=${deductResult.success}, 剩余=${deductResult.remainingStock}`)

  return { item, doorResult, deductResult, quantity }
}

export async function returnItem(item, quantity = 1, options = {}) {
  const { serverIp, serverPort, onStatusChange } = options
  const operator = resolveOperatorIdentity(options)
  item = await resolveItem(item)
  const hardware = getSlotHardware(item.cabinetNo, item.slotNo)
  const boardAddr = parseHardwareCode(hardware.boardAddr, '柜号')
  const lockNumber = parseHardwareCode(hardware.lockNumber, '格口号')

  console.log(`=== 归还物品: ${item.name} (${item.id}) ===`)
  console.log(`操作人: ${operator.operatorName} (${operator.operatorNo})`)
  console.log(`柜号信息: 柜号${item.cabinetNo} 格口${item.slotNo}`)

  const doorResult = await openAndWaitForClose(boardAddr, lockNumber, {
    serverIp, serverPort, onStatusChange
  })
  console.log(`柜门关闭，耗时 ${doorResult.elapsed}ms`)

  const returnResult = await returnInventory(item.id, quantity, operator)
  console.log(`库存归还: 成功=${returnResult.success}, 剩余=${returnResult.remainingStock}`)

  return { item, doorResult, returnResult, quantity }
}

export { openAndWaitForClose } from './door-monitor.mjs'
export { getAllItems, getSlotHardware, deductInventory, returnInventory, resolveOperatorIdentity } from './api-service.mjs'
export { openSingleLock, openAllLocks, queryLockStatus } from './cabinet-control.mjs'

export async function execute(params = {}) {
  const action = String(params.action || params.command || '').trim()
  const itemId = params.itemId ?? params.id
  const quantity = Number.parseInt(String(params.quantity ?? 1), 10) || 1
  const operator = {
    operatorNo: params.operatorNo || params.empWorkNo,
    operatorName: params.operatorName || params.empName
  }

  switch (action) {
    case 'list': {
      return JSON.stringify(await fetchAllItems(), null, 2)
    }
    case 'borrow':
    case 'receive': {
      if (!itemId) throw new Error('缺少物品 ID')
      const result = await borrowItem(itemId, quantity, operator)
      return JSON.stringify(result, null, 2)
    }
    case 'return': {
      if (!itemId) throw new Error('缺少物品 ID')
      const result = await returnItem(itemId, quantity, operator)
      return JSON.stringify(result, null, 2)
    }
    default:
      throw new Error('缺少或不支持的 action，请使用 list、borrow/receive、return')
  }
}
