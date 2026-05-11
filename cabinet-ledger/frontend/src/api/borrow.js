import request from './request.js'

export const getBorrowRecordList = (params) => {
  return request.get('/cabinet/borrow/list', { params })
}

export const borrowItem = (data) => {
  return request.post('/cabinet/borrow/borrow', data)
}

export const returnItem = (data) => {
  return request.post('/cabinet/borrow/return', data)
}
