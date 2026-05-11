---
name: open-cabinet
description: >
  智能柜物品领取/归还系统。当用户说出"领取""领用""借用""归还""取""拿"等意图要获取或归还物品时，
  必须使用此 skill。即使用户说法模糊（如"我需要一把螺丝刀""给我个工具"），只要涉及物品的领用或归还操作，都应触发。
  触发后先从 API 获取所有物品列表，由 AI 匹配用户意图找到对应物品，展示给用户确认后，再执行开柜门→监控→扣减库存流程。
---

# 智能柜物品领用系统

用户想领取或归还物品时，按以下流程操作。整个流程的核心原则是**先确认再执行**——任何开锁操作都必须经过用户明确确认后才能进行。

## 完整流程

### 第一步：获取物品列表并匹配

当用户表达要领取/借用/归还某物品时：

1. 运行 `node scripts/cli.mjs list` 从 API 获取所有物品信息（列表中已包含每个物品的柜号、板地址、锁号）
2. 根据用户的描述（可能模糊、不精确），在物品列表中找到最匹配的物品
3. 如果匹配到多个候选物品，全部列出让用户选择
4. 如果没有匹配到，告诉用户当前可用的物品列表

### 第二步：展示信息并等待用户确认

找到匹配物品后，向用户展示以下信息并等待确认：

```
物品名称: 螺丝刀
存放位置: 板1 锁5
库存数量: 3

确认要领取该物品吗？
```

**这一步非常关键——必须等待用户明确回复"确认""是的""好的"等肯定回答后才能继续。**

如果用户否认或犹豫，停止流程。

### 第三步：打开柜门

用户确认后，运行开锁指令：

```bash
node scripts/cli.mjs unlock <板地址> <锁号>
```

告诉用户柜门已打开，请取走物品。

### 第四步：监控柜门关闭

运行监控指令等待门关上：

```bash
node scripts/cli.mjs monitor <板地址> <锁号>
```

这个命令会持续轮询锁状态，直到检测到门关闭（默认超时60秒）。也可以通过代码调用：

```javascript
import { openAndWaitForClose } from './scripts/door-monitor.mjs'
const result = await openAndWaitForClose(boardAddr, lockNumber)
```

### 第五步：扣减库存

门关闭后，运行扣减指令：

```bash
node scripts/cli.mjs deduct <物品ID> [数量]
```

如果是归还操作，这里应该调用归还/增加库存的 API 而非扣减。

## 归还流程

归还和领取共用同一个 skill，区别在于最后一步：
- 领取 → 扣减库存
- 归还 → 增加库存（API 调用逻辑不同）

当用户说"归还"时，在确认信息中展示"确认归还该物品？"，并在最后一步调用归还接口。

## 脚本说明

```
scripts/
├── index.mjs              ← 主入口，编排完整流程
├── cabinet-control.mjs    ← 底层锁控板 TCP 通信
├── door-monitor.mjs       ← 门状态监控（轮询检测关门）
├── api-service.mjs        ← API 接口（包含 TODO 需要填写）
└── cli.mjs                ← 命令行工具
```

**硬件通信**：TCP 协议，服务器 `10.134.231.111:10123`，自定义二进制格式，已用纯 Node.js 实现，无需 Python。

## 需要完成的 TODO

`scripts/api-service.mjs` 中有三个函数需要根据实际后端 API 填写：

1. **`getAllItems()`** — 获取所有物品列表（含柜号、板地址、锁号，一个接口搞定）
2. **`deductInventory(itemId, quantity)`** — 扣减库存（领取时用）
3. **`returnInventory(itemId, quantity)`** — 增加库存（归还时用）

函数签名和返回值结构已定义好，填写 `fetch` 调用即可。

## 配置

锁控板地址在 `cabinet-control.mjs` / `door-monitor.mjs` 顶部：
- `DEFAULT_SERVER_IP = '10.134.231.111'`
- `DEFAULT_SERVER_PORT = 10123`

修改常量或通过 options 覆盖。
