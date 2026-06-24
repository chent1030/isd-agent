import test from 'node:test'
import assert from 'node:assert/strict'
import { parseOpenLockResponse } from '../src/cabinet/lock-protocol.js'

test('keeps business flow alive when lock board ack command differs after opening', () => {
  const response = Buffer.from([
    0x73, 0x74, 0x61, 0x72,
    0x01, 0x02, 0x03, 0x11, 0x15,
    0x65, 0x6e, 0x64, 0x6f,
  ])

  const result = parseOpenLockResponse(response, 0x02, 0x03)

  assert.equal(result.status, 'unknown')
  assert.equal(result.boardAddr, 0x02)
  assert.equal(result.lockNumber, 0x03)
  assert.ok(result.warning)
  assert.equal(result.rawResponseHex, '73 74 61 72 01 02 03 11 15 65 6E 64 6F')
})

test('parses board status snapshot response for the target lock', () => {
  const response = Buffer.from([
    0x73, 0x74, 0x61, 0x72,
    0xa0, 0x02, 0b00000100, 0x00, 0x00, 0xa6,
    0x65, 0x6e, 0x64, 0x6f,
  ])

  const result = parseOpenLockResponse(response, 0x02, 0x03)

  assert.equal(result.status, 'open')
  assert.equal(result.boardAddr, 0x02)
  assert.equal(result.lockNumber, 0x03)
})

test('still rejects responses without a protocol header', () => {
  const response = Buffer.from([
    0x00, 0x01, 0x02, 0x03,
    0x01, 0x02, 0x03, 0x11, 0x15, 0x65,
  ])

  assert.throws(
    () => parseOpenLockResponse(response, 0x02, 0x03),
    /响应头不匹配/,
  )
})
