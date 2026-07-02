import test from 'node:test'
import assert from 'node:assert/strict'
import { getStockDeductionLockOptions } from '../src/cabinet/cabinet-service.js'

test('uses immediate lock completion for door-open stock deduction mode', () => {
  assert.deepEqual(getStockDeductionLockOptions('door-open'), { waitForClose: false })
})

test('waits for door close for door-close stock deduction mode', () => {
  assert.deepEqual(getStockDeductionLockOptions('door-close'), { waitForClose: true })
})
