import net from 'node:net'
import { env } from '../env.js'

const LOCK_SOCKET_TIMEOUT = 3000
const PROTOCOL_HEADER = Buffer.from([0x73, 0x74, 0x61, 0x72])
const PROTOCOL_FOOTER = Buffer.from([0x65, 0x6e, 0x64, 0x6f])
const CMD_OPEN_SINGLE_LOCK = 0x9a

export interface LockTarget {
  cabinetNo: string | number
  slotNo: number
}

export interface OpenLockResult {
  boardAddr: number
  lockNumber: number
  status: 'closed' | 'open'
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

function sendLockCommand(commandBytes: Buffer): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const socket = new net.Socket()
    socket.setTimeout(LOCK_SOCKET_TIMEOUT)

    socket.on('connect', () => {
      socket.write(commandBytes)
    })

    socket.on('data', data => {
      socket.destroy()
      resolve(Buffer.isBuffer(data) ? data : Buffer.from(data))
    })

    socket.on('timeout', () => {
      socket.destroy()
      reject(new Error('锁控板连接超时，未收到响应'))
    })

    socket.on('error', error => {
      socket.destroy()
      reject(error)
    })

    socket.connect(env.lockServerPort, env.lockServerIp)
  })
}

function parseOpenLockResponse(response: Buffer, boardAddr: number, lockNumber: number): OpenLockResult {
  if (response.length < 10) throw new Error('锁控板响应长度不足')
  const headerMatched =
    response[0] === PROTOCOL_HEADER[0] &&
    response[1] === PROTOCOL_HEADER[1] &&
    response[2] === PROTOCOL_HEADER[2] &&
    response[3] === PROTOCOL_HEADER[3]
  if (!headerMatched) throw new Error('锁控板响应头不匹配')
  if (response[4] !== CMD_OPEN_SINGLE_LOCK) throw new Error('锁控板响应命令码不匹配')
  if (response[5] !== boardAddr) throw new Error('锁控板地址不匹配')
  if (response[6] !== lockNumber) throw new Error('锁号不匹配')

  return {
    boardAddr,
    lockNumber,
    status: response[7] === 0x00 ? 'closed' : 'open',
  }
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

/** 开单个格口的门 */
export async function openLock(target: LockTarget): Promise<OpenLockResult> {
  const boardAddr = parseHardwareByte(target.cabinetNo, '柜号')
  const lockNumber = parseHardwareByte(target.slotNo, '格口号')
  const response = await sendLockCommand(buildOpenLockCommand(boardAddr, lockNumber))
  return parseOpenLockResponse(response, boardAddr, lockNumber)
}
