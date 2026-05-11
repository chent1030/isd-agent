import request from './request.js'

export const getLogList = (params) => {
  return request.get('/cabinet/log/list', { params })
}
