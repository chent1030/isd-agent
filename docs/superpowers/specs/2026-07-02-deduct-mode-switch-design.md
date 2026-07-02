# 库存扣减时机开关（CABINET_DEDUCT_MODE）

- 日期：2026-07-02
- 范围：`web/server/`（后端）
- 状态：待实现

## 背景

当前 web/server 端的柜机业务流程（领用 / 借用 / 归还）在开锁后会**阻塞等待柜门关闭**，只有检测到"门从打开变为关闭"后才执行库存扣减（业务落库）。该逻辑位于 `src/cabinet/lock-protocol.ts` 的 `openLock()`：socket 超时设为 `DOOR_CLOSE_TIMEOUT_MS = 120000`（2 分钟），通过 `hasOpenThenClosed` 判定响应帧序列，超时未关门则抛错 `柜门未关闭，已等待 120 秒`，业务落库不执行。

业务上需要一个开关，能在两种扣减时机之间切换：

- **on-close**（默认，现状）：等待柜门关闭后再扣减。
- **on-open**：开锁应答后立即扣减，不等关门。

## 目标

新增环境变量 `CABINET_DEDUCT_MODE`，控制库存扣减时机，默认值 `on-close` 保持现有行为（零风险向后兼容）。

## 非目标

- 不改动 `sendLockCommand` 的通用语义（"有 `isComplete` 判定函数才提前完成"的约定保持不变）。
- 不改动业务接口契约（`/cabinet/item/receive`、`/cabinet/item/operate/borrow`、`/cabinet/borrow/return` 的入参出参不变）。
- 不改动 `electron/` 端代码（Electron 端实现独立，本次不在范围内）。
- 不做运行时动态切换（仅环境变量，需重启生效）。
- 不为归还与领用/借用区分不同开关（全局一份）。

## 设计

### 1. 配置层（`src/env.ts` + `web/.env.example`）

**`src/env.ts`**

在 `env` 对象中新增：

- `deductMode`：解析 `process.env.CABINET_DEDUCT_MODE`。
  - 合法值：`on-open`、`on-close`。
  - 空值（未设置 / 空串）：默认 `on-close`。
  - 非法值（非以上两值）：**抛错 fail-fast**，避免拼写错误静默 fallback 到错误模式。
- `waitForDoorClose`：派生布尔，`deductMode === 'on-close'`。供 `lock-protocol.ts` 消费，避免它直接理解枚举语义。

解析约定与现有开关（如 `SKIP_FACE_AUTH` 用 `isEnabledEnv`、`TERMINAL_IDLE_TIMEOUT_MINUTES` 用数值解析）风格一致。

**`web/.env.example`**

新增一节：

```
# ===== 库存扣减时机 =====
# on-close: 等待柜门关闭后再扣减库存（默认，最安全）
# on-open:  开锁应答后立即扣减库存，不等关门
CABINET_DEDUCT_MODE=on-close
```

### 2. 锁协议层（`src/cabinet/lock-protocol.ts`）

**`openLock()` 签名调整**：

```ts
export async function openLock(
  target: LockTarget,
  options: { waitForDoorClose?: boolean } = {},
): Promise<OpenLockResult>
```

- `options.waitForDoorClose` 默认 `true`（保持函数自身向后兼容；若调用方不传，行为不变）。

**行为分支**：

- **`waitForDoorClose = true`（on-close，现状）**：逻辑完全不变。
  - `timeoutMs` = `DOOR_CLOSE_TIMEOUT_MS`。
  - `isComplete` 判定 = `hasOpenThenClosed(results)`。
  - 超时未关门抛 `柜门未关闭，已等待 N 秒`。

- **`waitForDoorClose = false`（on-open）**：
  - `timeoutMs` = `LOCK_RESPONSE_TIMEOUT_MS`（3 秒），不再挂 2 分钟。
  - `isComplete` 判定 = `parseOpenLockResponses(currentResponse, boardAddr, lockNumber).length > 0`。
    - 复用现有解析逻辑，收到首个匹配本柜号 + 格口号的有效响应帧即视为完成。
    - 完成判定与 on-close 完全同构，仅完成条件从 `hasOpenThenClosed(results)` 换成 `results.length > 0`。
  - 结果对象的 `status` 字段如实反映首帧解析出的状态（open / closed / unknown），**仅供日志/调试，业务层不依赖它做扣减与否的判定**。
  - 超时仍无有效帧：沿用 `sendLockCommand` 现有 timeout 逻辑中的 `fail(new Error('锁控板连接超时，未收到响应'))`，无需额外处理。

**`openLock` 主体结构**：

```ts
export async function openLock(
  target: LockTarget,
  options: { waitForDoorClose?: boolean } = {},
): Promise<OpenLockResult> {
  const waitForDoorClose = options.waitForDoorClose ?? true
  const boardAddr = parseHardwareByte(target.cabinetNo, '柜号')
  const lockNumber = parseHardwareByte(target.slotNo, '格口号')
  const response = await sendLockCommand(buildOpenLockCommand(boardAddr, lockNumber), {
    timeoutMs: waitForDoorClose ? DOOR_CLOSE_TIMEOUT_MS : LOCK_RESPONSE_TIMEOUT_MS,
    isComplete: currentResponse => {
      try {
        const results = parseOpenLockResponses(currentResponse, boardAddr, lockNumber)
        return waitForDoorClose ? hasOpenThenClosed(results) : results.length > 0
      } catch {
        return false
      }
    },
  })
  const result = parseOpenLockResponse(response, boardAddr, lockNumber)
  if (result.warning) {
    console.warn('[lock] %s; response=%s', result.warning, result.rawResponseHex)
  }
  if (waitForDoorClose && !hasOpenThenClosed(parseOpenLockResponses(response, boardAddr, lockNumber))) {
    throw new Error(`柜门未关闭，已等待 ${Math.round(DOOR_CLOSE_TIMEOUT_MS / 1000)} 秒`)
  }
  return result
}
```

### 3. 业务编排层（`src/cabinet/cabinet-service.ts`）

`executeItemAction`（领用 / 借用）与 `returnBorrowRecord`（归还）中调用 `openLock` 的两处，透传配置：

```ts
await openLock(
  { cabinetNo: location.cabinetNo, slotNo: location.slotNo },
  { waitForDoorClose: env.waitForDoorClose },
)
```

业务编排层**不做任何扣减时机的判定**——只把配置透传给 `openLock`，扣减时机逻辑收敛在 `lock-protocol.ts` 一处。

### 4. 测试（`test/lock-protocol.test.ts`）

现状：测试均为 `parseOpenLockResponse(s)` 的纯解析用例，不涉及网络。

`openLock` 内部直连 TCP（`socket.connect(env.lockServerIp, env.lockServerPort)`），测试框架无网络 mock 层，端到端测试会真实连 `10.134.231.111`，无法在 CI/本地跑通。

策略：**只补解析层覆盖，不测 `openLock` 端到端**。

on-open / on-close 的差异本质是传给 `sendLockCommand` 的 `isComplete` 判定不同，而该判定依赖 `parseOpenLockResponses`——解析逻辑已被现有用例覆盖。新增 1-2 个解析边界用例（例如单帧 open 状态、单帧 closed 状态），补强 `parseOpenLockResponses` 在非"开→关"完整序列下的覆盖。

不重构 `openLock` 把网络层抽出来做 mock——超出"加开关"范围，YAGNI。

## 向后兼容性

- `CABINET_DEDUCT_MODE` 默认 `on-close`，现有部署不改配置则行为完全不变。
- `openLock` 的 `options` 参数可选且 `waitForDoorClose` 默认 `true`，现有任何不传该参数的调用方行为不变。

## 影响范围

| 文件 | 改动类型 |
|------|---------|
| `web/server/src/env.ts` | 新增 `deductMode` / `waitForDoorClose` 解析 |
| `web/server/src/cabinet/lock-protocol.ts` | `openLock` 新增参数与分支 |
| `web/server/src/cabinet/cabinet-service.ts` | 两处 `openLock` 调用透传配置 |
| `web/server/.env.example` | 新增配置项与注释 |
| `web/server/test/lock-protocol.test.ts` | 新增解析边界用例 |

## 风险

- **on-open 模式下，门未真正打开就扣减**：on-open 模式的判定是"锁控板有应答帧"，而非"门物理打开"。若锁控板应答但门实际未开，库存仍会扣减。这是该模式的固有取舍（用速度换严格性），由运维通过配置显式选择，非缺陷。
- **fail-fast 阻断启动**：非法的 `CABINET_DEDUCT_MODE` 值会让服务启动抛错。这是有意为之，避免拼写错误导致错误模式静默运行；启动失败比错误扣减更易被发现。
