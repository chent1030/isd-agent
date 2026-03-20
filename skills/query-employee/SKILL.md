---
name: query-employee
description: 根据员工姓名或工号查询员工基本信息，当用户询问员工相关信息、查找同事、查询工号等时使用此技能
requiresAuth: true
---

# 查询员工信息

当用户需要查询员工信息时，调用 scripts/index.js 中的 execute 函数，传入关键词（姓名或工号）。

## 参数

- `keyword`（必填）：员工姓名或工号，例如：张三、12312312

## 返回格式

```json
{
  "empName": "员工姓名",
  "empWorkNo": "工号",
  "dept": "部门",
  "email": "邮箱"
}
```

## 使用示例

用户说"帮我查一下张三的信息" → keyword = "张三"
用户说"工号 12312312 是谁" → keyword = "12312312"
