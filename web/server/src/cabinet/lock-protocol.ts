import net from 'node:net'
import { env } from '../env.js'

const LOCK_RESPONSE_TIMEOUT_MS = 3000
const DOOR_CLOSE_TIMEOUT_MS = 30000
const PROTOCOL_HEADER = Buffer.from([0x73, 0x74, 0x61, 0x72])
const PROTOCOL_FOOTER = Buffer.from([0x65, 0x6e, 0x64, 0x6f])
const CMD_OPEN_SINGLE_LOCK = 0x9a
const CMD_LOCK_STATUS = 0x60
const CMD_OPEN_ALL_LOCKS = 0xa0
const MIN_RESPONSE_LENGTH = 10
const BOARD_STATUS_RESPONSE_LENGTH = 12

export interface LockTarget {
  cabinetNo: string | number
  slotNo: number
}

export interface OpenLockResult {
  boardAddr: number
  lockNumber: number
  status: 'closed' | 'open' | 'unknown'
  rawResponseHex?: string
  warning?: string
}

function calculateBCC(dataList: number[]) {
  let checksum = 0
  for (const byte of dataList) checksum ^= byte
  return checksum
}

function buildOpenLockCommand(boardAddr: number, lockNumber: number) {
  const payload = [CMD_OPEN_SINGLE_LOCK, boardAddr, lockNumber, 0x11]
  return Buffer.concat([
    PROTOCOL_HEADER,
    Buffer.from(payload),
    Buffer.from([calculateBCC(payload)]),
    PROTOCOL_FOOTER,
  ])
}

export function bufferToHex(buffer: Buffer) {
  return Array.from(buffer)
    .map(byte => byte.toString(16).padStart(2, '0').toUpperCase())
    .join(' ')
}

function getLockStatusFromBoardSnapshot(frame: Buffer, lockNumber: number): OpenLockResult['status'] {
  if (!Number.isInteger(lockNumber) || lockNumber < 1 || lockNumber > 24) return 'unknown'

  const statusByteIndex = 6 + Math.floor((lockNumber - 1) / 8)
  const bitIndex = (lockNumber - 1) % 8
  const statusByte = frame[statusByteIndex]
  if (statusByte === undefined) return 'unknown'

  return ((statusByte >> bitIndex) & 1) === 1 ? 'open' : 'closed'
}

function hasOpenThenClosed(results: OpenLockResult[]) {
  let sawOpen = false
  for (const result of results) {
    if (result.status === 'open') sawOpen = true
    if (sawOpen && result.status === 'closed') return true
  }
  return false
}

function sendLockCommand(
  commandBytes: Buffer,
  options: {
    timeoutMs?: number
    isComplete?: (buffer: Buffer) => boolean
  } = {},
): Promise<Buffer> {
  const timeoutMs = options.timeoutMs ?? LOCK_RESPONSE_TIMEOUT_MS

  return new Promise<Buffer>((resolve, reject) => {
    const socket = new net.Socket()
    const chunks: Buffer[] = []
    let completed = false

    const finish = (buffer: Buffer) => {
      if (completed) return
      completed = true
      socket.destroy()
      resolve(buffer)
    }

    const fail = (error: Error) => {
      if (completed) return
      completed = true
      socket.destroy()
      reject(error)
    }

    socket.setTimeout(timeoutMs)

    socket.on('connect', () => {
      socket.write(commandBytes)
    })

    socket.on('data', data => {
      chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data))
      const response = Buffer.concat(chunks)
      if (!options.isComplete || options.isComplete(response)) finish(response)
    })

    socket.on('timeout', () => {
      const response = Buffer.concat(chunks)
      if (response.length > 0) finish(response)
      else fail(new Error('锁控板连接超时，未收到响应'))
    })

    socket.on('error', error => {
      fail(error)
    })

    socket.connect(env.lockServerPort, env.lockServerIp)
  })
}

function collectProtocolFrames(response: Buffer) {
  const frames: Buffer[] = []
  for (let index = 0; index <= response.length - MIN_RESPONSE_LENGTH; index += 1) {
    const headerMatched =
      response[index] === PROTOCOL_HEADER[0] &&
      response[index + 1] === PROTOCOL_HEADER[1] &&
      response[index + 2] === PROTOCOL_HEADER[2] &&
      response[index + 3] === PROTOCOL_HEADER[3]
    if (headerMatched) frames.push(response.subarray(index))
  }
  return frames
}

export function parseOpenLockResponses(response: Buffer, boardAddr: number, lockNumber: number): OpenLockResult[] {
  if (response.length < MIN_RESPONSE_LENGTH) throw new Error('锁控板响应长度不足')

  const frames = collectProtocolFrames(response)
  if (!frames.length) throw new Error('锁控板响应头不匹配')

  const results: OpenLockResult[] = []
  for (const frame of frames) {
    if (
      (frame[4] === CMD_OPEN_SINGLE_LOCK || frame[4] === CMD_LOCK_STATUS) &&
      frame[5] === boardAddr &&
      frame[6] === lockNumber
    ) {
      results.push({
        boardAddr,
        lockNumber,
        status: frame[7] === 0x00 ? 'closed' : 'open',
      })
      continue
    }

    if (
      frame.length >= BOARD_STATUS_RESPONSE_LENGTH &&
      frame[4] === CMD_OPEN_ALL_LOCKS &&
      frame[5] === boardAddr
    ) {
      results.push({
        boardAddr,
        lockNumber,
        status: getLockStatusFromBoardSnapshot(frame, lockNumber),
        rawResponseHex: bufferToHex(response),
      })
      continue
    }

    if (frame[5] === boardAddr && frame[6] === lockNumber) {
      results.push({
        boardAddr,
        lockNumber,
        status: 'unknown',
        rawResponseHex: bufferToHex(response),
        warning: `锁控板已响应但命令码不匹配，期望 0x${CMD_OPEN_SINGLE_LOCK.toString(16).toUpperCase()}，实际 0x${frame[4].toString(16).toUpperCase()}`,
      })
    }
  }

  if (results.length > 0) return results
  if (!frames.some(frame => frame[5] === boardAddr)) throw new Error('锁控板地址不匹配')
  throw new Error('锁号不匹配')
}

export function parseOpenLockResponse(response: Buffer, boardAddr: number, lockNumber: number): OpenLockResult {
  return parseOpenLockResponses(response, boardAddr, lockNumber).at(-1) as OpenLockResult
}

function validateHardwareByte(parsed: number, fieldName: string, rawValue: unknown) {
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 255) {
    throw new Error(`${fieldName}无法转换为锁控协议数值: ${rawValue}`)
  }
  return parsed
}

function parseHardwareByte(value: unknown, fieldName: string) {
  if (typeof value === 'number') return validateHardwareByte(value, fieldName, value)
  const text = String(value ?? '').trim()
  let parsed = NaN

  if (/^0x[0-9a-f]+$/i.test(text)) {
    parsed = Number.parseInt(text, 16)
  } else if (/^\d+$/.test(text)) {
    parsed = Number.parseInt(text, 10)
  } else if (/^[0-9a-f]{1,2}$/i.test(text) && /[a-f]/i.test(text)) {
    parsed = Number.parseInt(text, 16)
  } else {
    const suffix = text.match(/(\d+)$/)
    if (suffix) parsed = Number.parseInt(suffix[1], 10)
  }

  return validateHardwareByte(parsed, fieldName, value)
}

export async function openLock(target: LockTarget): Promise<OpenLockResult> {
  const boardAddr = parseHardwareByte(target.cabinetNo, '柜号')
  const lockNumber = parseHardwareByte(target.slotNo, '格口号')
  const response = await sendLockCommand(
    buildOpenLockCommand(boardAddr, lockNumber),
    {
      timeoutMs: DOOR_CLOSE_TIMEOUT_MS,
      isComplete: currentResponse => {
        try {
          return hasOpenThenClosed(parseOpenLockResponses(currentResponse, boardAddr, lockNumber))
        } catch {
          return false
        }
      },
    },
  )
  const result = parseOpenLockResponse(response, boardAddr, lockNumber)
  if (result.warning) {
    console.warn('[lock] %s; response=%s', result.warning, result.rawResponseHex)
  }
  if (!hasOpenThenClosed(parseOpenLockResponses(response, boardAddr, lockNumber))) {
    throw new Error(`柜门未关闭，已等待 ${Math.round(DOOR_CLOSE_TIMEOUT_MS / 1000)} 秒`)
  }
  return result
}
