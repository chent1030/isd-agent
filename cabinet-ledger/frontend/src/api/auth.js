import request from './request.js'

export const login = (data) => {
  return request.post('/auth/login', data)
}
