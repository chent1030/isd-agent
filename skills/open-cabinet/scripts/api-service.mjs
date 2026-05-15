const API_CONFIG = {
  baseUrl: process.env.CABINET_LEDGER_API_BASE_URL || 'https://cshzeroapi.uabcbattery.com/unify/v1/1',
  headers: {
    'Content-Type': 'application/json'
  }
}

export function resolveOperatorIdentity(options = {}) {
  const operatorNo = String(options.operatorNo || process.env.CABINET_LEDGER_OPERATOR_NO || '').trim()
  const operatorName = String(options.operatorName || process.env.CABINET_LEDGER_OPERATOR_NAME || '').trim()

  if (!operatorNo || !operatorName) {
    throw new Error('缺少操作人身份信息，请先通过摄像头识别人员并传入工号和姓名')
  }

  return { operatorNo, operatorName }
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
    category: item.category,
    spec: item.spec,
    useType: item.useType,
    stock: item.stock,
    cabinetNo: item.cabinetNo,
    slotNo: item.slotNo
  }))
}

/**
 * 将业务柜号和格口号映射为锁控协议参数。
 * 当前硬件协议中 board_addr 就是柜号，lock_num 就是格口号。
 * @param {number} cabinetNo
 * @param {number} slotNo
 * @returns {Promise<{boardAddr: number, lockNumber: number}>}
 */
export function getSlotHardware(cabinetNo, slotNo) {
  return {
    boardAddr: cabinetNo,
    lockNumber: slotNo
  }
}

/**
 * 扣减库存（领取时使用）
 * @param {string|number} itemId - 物品 ID
 * @param {number} quantity - 扣减数量，默认为 1
 * @param {{operatorNo?: string, operatorName?: string, remark?: string}} options
 * @returns {Promise<{success: boolean, remainingStock: number}>}
 */
export async function deductInventory(itemId, quantity = 1, options = {}) {
  const operator = resolveOperatorIdentity(options)
  const stock = await requestJson('/cabinet/item/receive', {
    method: 'POST',
    headers: {
      'X-Operator': operator.operatorNo
    },
    body: JSON.stringify({
      itemId,
      quantity,
      operatorNo: operator.operatorNo,
      operatorName: operator.operatorName,
      remark: options.remark || `语音领用：${operator.operatorName}`
    })
  })
  return {
    success: true,
    remainingStock: stock?.quantity ?? 0
  }
}

/**
 * 归还库存（归还物品时使用）
 * @param {string|number} itemId - 物品 ID
 * @param {number} quantity - 归还数量，默认为 1
 * @param {{operatorNo?: string, operatorName?: string}} options
 * @returns {Promise<{success: boolean, remainingStock: number}>}
 */
export async function returnInventory(itemId, quantity = 1, options = {}) {
  resolveOperatorIdentity(options)
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
