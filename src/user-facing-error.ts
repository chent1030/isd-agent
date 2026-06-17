function trimNoise(value: string) {
  return value
    .replace(/^Error invoking remote method ['"][^'"]+['"]:\s*/i, '')
    .replace(/^Error:\s*/i, '')
    .replace(/^参数异常[:：]\s*/, '')
    .replace(/^柜机接口请求失败[:：]\s*/, '')
    .trim()
}

function keepChineseMessage(value: string) {
  const firstChineseIndex = value.search(/[\u4e00-\u9fff]/)
  if (firstChineseIndex < 0) return ''
  return trimNoise(value.slice(firstChineseIndex))
}

export function getUserFacingErrorMessage(error: unknown, fallback = '操作失败，请重试') {
  const rawMessage = typeof (error as { message?: unknown })?.message === 'string'
    ? String((error as { message: string }).message)
    : String(error ?? '')
  let message = trimNoise(rawMessage)

  for (let index = 0; index < 4; index += 1) {
    const next = trimNoise(message)
    if (next === message) break
    message = next
  }

  const chineseMessage = keepChineseMessage(message)
  return chineseMessage || fallback
}
