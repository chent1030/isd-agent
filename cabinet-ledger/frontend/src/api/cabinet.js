import request from './request.js'

export const getCabinetList = () => {
  return request.get('/cabinet/list')
}

export const getCabinetDetail = (id) => {
  return request.get('/cabinet/detail', { params: { id } })
}

export const saveCabinet = (data) => {
  return request.post('/cabinet/save', data)
}

export const getCabinetSlots = (cabinetId) => {
  return request.get('/cabinet/slots', { params: { cabinetId } })
}

export const getCabinetSlotByItem = (itemId) => {
  return request.get('/cabinet/slot/by-item', { params: { itemId } })
}

export const saveCabinetSlot = (data) => {
  return request.post('/cabinet/slot/save', data)
}

export const updateCabinetStatus = (id, status) => {
  return request.post('/cabinet/status', null, { params: { id, status } })
}

export const deleteCabinet = (id) => {
  return request.post('/cabinet/delete', null, { params: { id } })
}

// 导出柜子列表
export const exportCabinet = () => {
  return request.get('/cabinet/export', {
    responseType: 'blob'
  })
}
