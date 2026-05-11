import request from './request.js'

export const getLedgerList = (params) => {
  return request.get('/cabinet/ledger/list', { params })
}

export const saveLedger = (data) => {
  return request.post('/cabinet/ledger/save', data)
}

export const updateLedger = (data) => {
  return request.post('/cabinet/ledger/update', data)
}

export const checkInventory = (data) => {
  return request.post('/cabinet/ledger/inventory/check', data)
}

// 导出物品台账
export const exportLedger = (params) => {
  return request.get('/cabinet/ledger/export', {
    params,
    responseType: 'blob'
  })
}
