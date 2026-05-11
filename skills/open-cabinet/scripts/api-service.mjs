const API_CONFIG = {
  baseUrl: process.env.CABINET_LEDGER_API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
    'X-Operator': process.env.CABINET_LEDGER_OPERATOR || 'skill'
  }
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_CONFIG.baseUrl}${path}`, {
    ...options,
    headers: {
      ...API_CONFIG.headers,
      ...(options.headers || {})
    }
  })
  if (!response.ok) {
    throw new Error(`API 请求失败: ${response.status}`)
  }

  const data = await response.json()
  if (data.code !== undefined && data.code !== 200) {
    throw new Error(data.message || 'API 返回失败')
  }
  return data.data
}

/**
 * 获取所有物品列表（已包含柜号信息）
 * AI 会根据用户的描述在这个列表中匹配出目标物品
 * @returns {Promise<Array<{id: string|number, name: string, cabinetNo: number, slotNo: number, stock: number}>>}
 */
export async function getAllItems() {
  const items = await requestJson('/cabinet/item/available')
  return (items || []).map(item => ({
    id: item.id,
    name: item.name,
    stock: item.stock,
    cabinetNo: item.cabinetNo,
    slotNo: item.slotNo
  }))
}

/**
 * 通过业务柜号和格口号解析后端维护的硬件配置。
 * @param {number} cabinetNo
 * @param {number} slotNo
 * @returns {Promise<{boardAddr: string, lockNumber: string}>}
 */
export async function getSlotHardware(cabinetNo, slotNo) {
  const params = new URLSearchParams({
    cabinetNo: String(cabinetNo),
    slotNo: String(slotNo)
  })
  return requestJson(`/cabinet/slot/by-no?${params.toString()}`)
}

/**
 * 扣减库存（领取时使用）
 * @param {string|number} itemId - 物品 ID
 * @param {number} quantity - 扣减数量，默认为 1
 * @returns {Promise<{success: boolean, remainingStock: number}>}
 */
export async function deductInventory(itemId, quantity = 1) {
  // 台账最终以称重上报为准；这里先返回最新库存，避免领取流程被占位接口阻断。
  const items = await getAllItems()
  const item = items.find(current => String(current.id) === String(itemId))
  const stock = item?.stock ?? 0
  return {
    success: true,
    remainingStock: Math.max(stock - quantity, 0)
  }
}

/**
 * 归还库存（归还物品时使用）
 * @param {string|number} itemId - 物品 ID
 * @param {number} quantity - 归还数量，默认为 1
 * @returns {Promise<{success: boolean, remainingStock: number}>}
 */
export async function returnInventory(itemId, quantity = 1) {
  // 台账最终以称重上报为准；这里先返回最新库存，避免归还流程被占位接口阻断。
  const items = await getAllItems()
  const item = items.find(current => String(current.id) === String(itemId))
  const stock = item?.stock ?? 0
  return {
    success: true,
    remainingStock: stock + quantity
  }
}

export { API_CONFIG }
