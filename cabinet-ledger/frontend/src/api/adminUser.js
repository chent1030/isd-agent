import request from './request.js'

export const getAdminUserList = () => {
  return request.get('/cabinet/admin-user/list')
}

export const saveAdminUser = (data) => {
  return request.post('/cabinet/admin-user/save', data)
}
