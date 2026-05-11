#!/usr/bin/env node

import { fetchAndMatchItems, borrowItem, returnItem, openSingleLock, openAllLocks, parseHardwareCode } from './index.mjs'
import { openAndWaitForClose } from './door-monitor.mjs'

const args = process.argv.slice(2)

if (args.length === 0) {
  console.log(`用法:
  node cli.mjs list                          -- 获取所有物品列表
  node cli.mjs borrow <物品ID> [数量]         -- 领取物品（开柜→监控→扣减）
  node cli.mjs return <物品ID> [数量]         -- 归还物品（开柜→监控→增加库存）
  node cli.mjs unlock <板地址> <锁号>         -- 仅打开指定锁
  node cli.mjs unlock-all <板地址>            -- 打开板上所有锁
  node cli.mjs monitor <板地址> <锁号>        -- 监控门状态直到关闭
`)
  process.exit(0)
}

const command = args[0]

async function main() {
  try {
    switch (command) {
      case 'list': {
        const items = await fetchAndMatchItems()
        console.log(JSON.stringify(items, null, 2))
        break
      }
      case 'borrow': {
        const itemId = args[1]
        const quantity = parseInt(args[2]) || 1
        if (!itemId) {
          console.error('请提供物品 ID')
          process.exit(1)
        }
        const result = await borrowItem(itemId, quantity)
        console.log('领取完成:', JSON.stringify(result, null, 2))
        break
      }
      case 'return': {
        const itemId = args[1]
        const quantity = parseInt(args[2]) || 1
        if (!itemId) {
          console.error('请提供物品 ID')
          process.exit(1)
        }
        const result = await returnItem(itemId, quantity)
        console.log('归还完成:', JSON.stringify(result, null, 2))
        break
      }
      case 'unlock': {
        if (!args[1] || !args[2]) {
          console.error('请提供有效的板地址和锁号')
          process.exit(1)
        }
        const boardAddr = parseHardwareCode(args[1], '板地址')
        const lockNumber = parseHardwareCode(args[2], '锁号')
        const result = await openSingleLock(boardAddr, lockNumber)
        console.log('开锁结果:', JSON.stringify(result, null, 2))
        break
      }
      case 'unlock-all': {
        if (!args[1]) {
          console.error('请提供有效的板地址')
          process.exit(1)
        }
        const boardAddr = parseHardwareCode(args[1], '板地址')
        const result = await openAllLocks(boardAddr)
        console.log('全部开锁结果:', JSON.stringify(result, null, 2))
        break
      }
      case 'monitor': {
        if (!args[1] || !args[2]) {
          console.error('请提供有效的板地址和锁号')
          process.exit(1)
        }
        const boardAddr = parseHardwareCode(args[1], '板地址')
        const lockNumber = parseHardwareCode(args[2], '锁号')
        const result = await openAndWaitForClose(boardAddr, lockNumber, {
          onStatusChange: (info) => {
            console.log(`[状态] 板${info.boardAddr} 锁${info.lockNumber}: ${info.status}`)
          }
        })
        console.log('监控完成:', JSON.stringify(result, null, 2))
        break
      }
      default:
        console.error(`未知命令: ${command}`)
        process.exit(1)
    }
  } catch (err) {
    console.error(`错误: ${err.message}`)
    process.exit(1)
  }
}

main()
