---
name: open-cabinet
description: >
  智能柜物品领用、借用、归还系统。当用户表达领用、领取、借用、归还、拿取等意图时使用。
  必须先确认当前操作人已通过人脸识别，再匹配物品、确认数量和动作，最后在用户确认后执行开柜与业务记录。
---

# 智能柜物品领用/借用系统

## 动作映射

动作必须严格区分：

- `receive`：领用、领取、取用、拿取。领用不需要归还。
- `borrow`：借用。借用需要后续归还。
- `return`：归还。

禁止把“领用”或“领取”映射为 `borrow`。如果用户说“领用矿泉水”，应使用 `receive`。

物品 `useType` 规则：

- `0`：仅支持领用，不能借用。
- `1`：仅支持借用，不能领用。
- `2`：领用和借用都支持，按用户表达的动作执行。

## 流程

1. 先确认宿主应用已经识别到当前操作人，并拿到 `empWorkNo` 和 `empName`。
2. 通过 `run_skill` 调用 `action="list"` 获取可操作物品列表。
3. 根据用户表达匹配物品，并根据用户话术确定动作：
   - 领用/领取/取用/拿取 -> `receive`
   - 借用 -> `borrow`
   - 归还 -> `return`
4. 如果用户没有提供数量，先询问数量，不要保存待执行操作。
5. 数量明确后，调用 `set_pending_cabinet_action` 保存待确认操作，参数必须包含：
   - `skillName: "open-cabinet"`
   - `action: "receive" | "borrow" | "return"`
   - `itemId`
   - `itemName`
   - `quantity`
6. 向用户复述物品、动作、数量并等待确认。
7. 用户确认后，宿主应用会执行已保存的 pending 操作。

## 脚本动作

`execute(params)` 支持：

- `list`：获取所有可操作物品。
- `receive`：领用物品，开柜并调用后端领用接口扣减库存。
- `borrow`：借用物品，开柜并调用后端借用接口生成需归还的借用记录。
- `return`：归还物品。

示例：

```json
{"action":"receive","itemId":"123","quantity":1,"operatorNo":"E001","operatorName":"张三"}
```

```json
{"action":"borrow","itemId":"456","quantity":1,"operatorNo":"E001","operatorName":"张三"}
```

## API 接入

- `GET /cabinet/item/available`：获取物品列表。
- `POST /cabinet/item/receive`：领用物品。
- `POST /cabinet/borrow/borrow`：借用物品。

所有执行动作都必须传入真实操作人工号和姓名，禁止使用 `skill`、`admin`、`guest` 作为业务操作人。
