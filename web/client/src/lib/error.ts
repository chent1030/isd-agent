/**
 * 从后端 / 浏览器错误中提取用户友好的中文消息。
 * 后端返回 { code, message }，message 已是清洗过的中文。
 */
export function getUserFacingErrorMessage(error: unknown, fallback = '操作失败，请重试') {
  if (!error) return fallback

  // 后端返回的 { code, message } 结构
  const serverMessage = (error as { message?: unknown })?.message
  if (typeof serverMessage === 'string' && serverMessage.trim()) {
    return serverMessage.trim()
  }

  // fetch 网络错误
  const rawMessage = String(error ?? '')
  if (rawMessage === 'TypeError: Failed to fetch' || rawMessage.includes('Failed to fetch')) {
    return '网络连接失败，请检查网络或服务是否可用'
  }

  return rawMessage || fallback
}
