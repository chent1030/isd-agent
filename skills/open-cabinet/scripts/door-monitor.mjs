import net from 'net'

const PROTOCOL_HEADER = Buffer.from([0x73, 0x74, 0x61, 0x72])
const PROTOCOL_FOOTER = Buffer.from([0x65, 0x6e, 0x64, 0x6f])
const CMD_OPEN_SINGLE_LOCK = 0x9a

const DEFAULT_SERVER_IP = '10.134.231.111'
const DEFAULT_SERVER_PORT = 10123

const DOOR_CHECK_INTERVAL = 1000
const DOOR_CHECK_TIMEOUT = 60000

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
  } else if (Array.isArray(lockNumOrData)) {
    payload = [cmdCode, boardAddr, ...lockNumOrData]
  } else {
    payload = [cmdCode, boardAddr, lockNumOrData]
  }

  const bcc = calculateBCC(payload)
  return Buffer.concat([
    PROTOCOL_HEADER,
    Buffer.from(payload),
    Buffer.from([bcc]),
    PROTOCOL_FOOTER,
  ])
}

function sendCommand(serverIp, serverPort, commandBytes) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket()
    socket.setTimeout(3000)

    socket.on('connect', () => {
      socket.write(commandBytes)
    })

    socket.on('data', (data) => {
      socket.destroy()
      resolve(data)
    })

    socket.on('timeout', () => {
      socket.destroy()
      reject(new Error('Connection timed out'))
    })

    socket.on('error', (err) => {
      socket.destroy()
      reject(err)
    })

    socket.connect(serverPort, serverIp)
  })
}

function parseLockResponse(response, boardAddr, lockNumber) {
  if (response.length < 10) return null
  const headerMatch =
    response[0] === 0x73 &&
    response[1] === 0x74 &&
    response[2] === 0x61 &&
    response[3] === 0x72

  if (!headerMatch) return null
  if (response[4] !== CMD_OPEN_SINGLE_LOCK) return null
  if (response[5] !== boardAddr) return null
  if (response[6] !== lockNumber) return null
  return response[7] === 0x00 ? 'closed' : 'open'
}

function checkDoorClosed(serverIp, serverPort, boardAddr, lockNumber) {
  const command = buildCommand(CMD_OPEN_SINGLE_LOCK, boardAddr, lockNumber)
  return sendCommand(serverIp, serverPort, command)
    .then(response => parseLockResponse(response, boardAddr, lockNumber))
    .catch(() => null)
}

export async function monitorDoorUntilClosed(boardAddr, lockNumber, options = {}) {
  const {
    serverIp = DEFAULT_SERVER_IP,
    serverPort = DEFAULT_SERVER_PORT,
    checkInterval = DOOR_CHECK_INTERVAL,
    timeout = DOOR_CHECK_TIMEOUT,
    onStatusChange = null,
  } = options

  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    let lastStatus = null
    let timer = null

    function cleanup() {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }

    async function check() {
      try {
        const status = await checkDoorClosed(serverIp, serverPort, boardAddr, lockNumber)

        if (status && status !== lastStatus) {
          lastStatus = status
          if (onStatusChange) {
            onStatusChange({ boardAddr, lockNumber, status, elapsed: Date.now() - startTime })
          }
        }

        if (status === 'closed') {
          cleanup()
          resolve({
            boardAddr,
            lockNumber,
            status: 'closed',
            elapsed: Date.now() - startTime,
          })
          return
        }

        if (Date.now() - startTime > timeout) {
          cleanup()
          reject(new Error(`Monitor timed out (${timeout}ms); door was not closed`))
        }
      } catch {
        if (Date.now() - startTime > timeout) {
          cleanup()
          reject(new Error(`Monitor timed out (${timeout}ms); door was not closed`))
        }
      }
    }

    timer = setInterval(check, checkInterval)
    check()
  })
}

export async function openAndWaitForClose(boardAddr, lockNumber, options = {}) {
  const {
    serverIp = DEFAULT_SERVER_IP,
    serverPort = DEFAULT_SERVER_PORT,
    onStatusChange = null,
  } = options

  console.log(`Opening cabinet door: board ${boardAddr}, lock ${lockNumber}`)

  const command = buildCommand(CMD_OPEN_SINGLE_LOCK, boardAddr, lockNumber)
  const response = await sendCommand(serverIp, serverPort, command)
  if (!response) throw new Error('Open command did not receive a response')

  const initialStatus = parseLockResponse(response, boardAddr, lockNumber)
  console.log(`Open response lock status: ${initialStatus || 'unknown'}`)

  if (onStatusChange) {
    onStatusChange({ boardAddr, lockNumber, status: initialStatus, phase: 'opened' })
  }

  console.log('Door close monitoring is disabled; skipping wait.')
  return {
    boardAddr,
    lockNumber,
    status: initialStatus || 'unknown',
    phase: 'monitor_skipped',
    elapsed: 0,
  }
}
