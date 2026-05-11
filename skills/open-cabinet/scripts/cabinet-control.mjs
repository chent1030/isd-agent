import net from 'net'

const PROTOCOL_HEADER = Buffer.from([0x73, 0x74, 0x61, 0x72])
const PROTOCOL_FOOTER = Buffer.from([0x65, 0x6e, 0x64, 0x6f])
const CMD_OPEN_SINGLE_LOCK = 0x9a
const CMD_OPEN_ALL_LOCKS = 0xa0

const DEFAULT_SERVER_IP = '10.134.231.111'
const DEFAULT_SERVER_PORT = 10123
const SOCKET_TIMEOUT = 3000

function calculateBCC(dataList) {
  let checksum = 0
  for (const byte of dataList) {
    checksum ^= byte
  }
  return checksum
}

function buildCommand(cmdCode, boardAddr, lockNumOrData) {
  let payload
  if (cmdCode === CMD_OPEN_SINGLE_LOCK) {
    payload = [cmdCode, boardAddr, lockNumOrData, 0x11]
  } else if (cmdCode === CMD_OPEN_ALL_LOCKS) {
    payload = [cmdCode, boardAddr]
  } else {
    if (Array.isArray(lockNumOrData)) {
      payload = [cmdCode, boardAddr, ...lockNumOrData]
    } else {
      payload = [cmdCode, boardAddr, lockNumOrData]
    }
  }
  const bcc = calculateBCC(payload)
  return Buffer.concat([
    PROTOCOL_HEADER,
    Buffer.from(payload),
    Buffer.from([bcc]),
    PROTOCOL_FOOTER
  ])
}

function sendCommand(serverIp, serverPort, commandBytes) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket()
    socket.setTimeout(SOCKET_TIMEOUT)

    socket.on('connect', () => {
      socket.write(commandBytes)
    })

    socket.on('data', (data) => {
      socket.destroy()
      resolve(data)
    })

    socket.on('timeout', () => {
      socket.destroy()
      reject(new Error('连接超时，未收到响应'))
    })

    socket.on('error', (err) => {
      socket.destroy()
      reject(err)
    })

    socket.connect(serverPort, serverIp)
  })
}

function parseSingleLockResponse(response, boardAddr, lockNumber) {
  if (response.length < 10) return { valid: false, error: '响应长度不足' }

  const headerMatch =
    response[0] === 0x73 &&
    response[1] === 0x74 &&
    response[2] === 0x61 &&
    response[3] === 0x72

  if (!headerMatch) return { valid: false, error: '响应头不匹配' }
  if (response[4] !== CMD_OPEN_SINGLE_LOCK) return { valid: false, error: '命令码不匹配' }
  if (response[5] !== boardAddr) return { valid: false, error: '板地址不匹配' }
  if (response[6] !== lockNumber) return { valid: false, error: '锁号不匹配' }

  const statusByte = response[7]
  if (statusByte === 0x00) {
    return { valid: true, status: 'closed', description: `锁控板 ${boardAddr} 的锁 ${lockNumber} 状态：关门（接触开关导通）` }
  } else if (statusByte === 0x11) {
    return { valid: true, status: 'open', description: `锁控板 ${boardAddr} 的锁 ${lockNumber} 状态：开门（接触开关断开）` }
  }
  return { valid: false, error: `未知状态字节：0x${statusByte.toString(16).padStart(2, '0')}` }
}

function parseAllLocksResponse(response, boardAddr) {
  if (response.length < 12) return { valid: false, error: '响应长度不足' }

  const headerMatch =
    response[0] === 0x73 &&
    response[1] === 0x74 &&
    response[2] === 0x61 &&
    response[3] === 0x72

  if (!headerMatch) return { valid: false, error: '响应头不匹配' }
  if (response[4] !== CMD_OPEN_ALL_LOCKS) return { valid: false, error: '命令码不匹配' }
  if (response[5] !== boardAddr) return { valid: false, error: '板地址不匹配' }

  const status1 = response[6]
  const status2 = response[7]
  const status3 = response[8]

  const locks = []
  for (let i = 0; i < 8; i++) locks.push((status1 >> i) & 1)
  for (let i = 0; i < 8; i++) locks.push((status2 >> i) & 1)
  for (let i = 0; i < 8; i++) locks.push((status3 >> i) & 1)

  return {
    valid: true,
    boardAddress: boardAddr,
    locks: locks.map((s, i) => ({
      lockNumber: i + 1,
      status: s ? 'open' : 'closed'
    }))
  }
}

export async function openSingleLock(boardAddr, lockNumber, serverIp = DEFAULT_SERVER_IP, serverPort = DEFAULT_SERVER_PORT) {
  const command = buildCommand(CMD_OPEN_SINGLE_LOCK, boardAddr, lockNumber)
  const hexStr = Array.from(command).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
  console.log(`发送命令: ${hexStr}`)

  const response = await sendCommand(serverIp, serverPort, command)
  if (!response) throw new Error('未收到响应')

  const respHexStr = Array.from(response).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
  console.log(`收到响应: ${respHexStr}`)

  const result = parseSingleLockResponse(response, boardAddr, lockNumber)
  if (!result.valid) throw new Error(result.error)
  console.log(result.description)
  return result
}

export async function openAllLocks(boardAddr, serverIp = DEFAULT_SERVER_IP, serverPort = DEFAULT_SERVER_PORT) {
  const command = buildCommand(CMD_OPEN_ALL_LOCKS, boardAddr, [])
  const hexStr = Array.from(command).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
  console.log(`发送命令: ${hexStr}`)

  const response = await sendCommand(serverIp, serverPort, command)
  if (!response) throw new Error('未收到响应')

  const respHexStr = Array.from(response).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
  console.log(`收到响应: ${respHexStr}`)

  const result = parseAllLocksResponse(response, boardAddr)
  if (!result.valid) throw new Error(result.error)
  return result
}

export async function queryLockStatus(boardAddr, lockNumber, serverIp = DEFAULT_SERVER_IP, serverPort = DEFAULT_SERVER_PORT) {
  const command = buildCommand(CMD_OPEN_SINGLE_LOCK, boardAddr, lockNumber)
  const response = await sendCommand(serverIp, serverPort, command)
  if (!response) throw new Error('未收到响应')

  const result = parseSingleLockResponse(response, boardAddr, lockNumber)
  if (!result.valid) throw new Error(result.error)
  return result
}
