import request from './request.js'

export const getItemList = () => {
  return request.get('/cabinet/item/list')
}

export const getItemStockReminders = () => {
  return request.get('/cabinet/item/reminders/stock')
}

export const saveItem = (data) => {
  return request.post('/cabinet/item/save', data)
}

export const saveItemStock = (data) => {
  return request.post('/cabinet/item/stock/save', data)
}

export const getItemAuthList = (params) => {
  return request.get('/cabinet/item-auth/list', { params })
}

export const saveItemAuth = (data) => {
  return request.post('/cabinet/item-auth/save', data)
}

export const deleteItemAuth = (id) => {
  return request.post('/cabinet/item-auth/delete', null, { params: { id } })
}

export const exportItem = () => {
  return request.get('/cabinet/item/export', {
    responseType: 'blob'
  })
}
export const exportItemImportTemplate = () => {
  return request.get('/cabinet/item/import-template', {
    responseType: 'blob'
  })
}

export const importItem = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/cabinet/item/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
