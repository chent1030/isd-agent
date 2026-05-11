import request from './request.js'

export const getWeightList = (cabinetId) => {
  return request.get('/cabinet/weight/list', { params: { cabinetId } })
}

export const reportWeight = (data) => {
  return request.post('/cabinet/weight/report', data)
}

// 导出称重记录
export const exportWeight = (cabinetId) => {
  return request.get('/cabinet/weight/export', {
    params: { cabinetId },
    responseType: 'blob'
  })
}
