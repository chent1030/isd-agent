# ISD Web — 柜机物品领用终端（Web 版）

基于 **Fastify + React 19 + Tailwind v4 + shadcn/ui** 的 Web 端柜机领用终端。
与原 Electron 桌面版功能对齐，逻辑不变，UI 用 shadcn 重构。

> 原 Electron 项目（仓库根 `electron/`、`src/`）完全保留不动，本 Web 版位于 `web/` 独立目录。

## 功能

- 类别 → 物品浏览（带库存、授权标记）
- 领用 / 借用（数量选择 + 模式切换）
- 人脸认证（摄像头实时识别 + 工号兜底）
- TCP 开柜（后端与锁控板同内网直连）
- 借用归还（扫脸查询未归还记录 → 选记录 → 开柜归还）
- 闲置自动返回首页

## 架构

```
浏览器 (Vite + React + shadcn)
   │  fetch /api/...
   ▼
Fastify 后端 (server/)
   ├─ /api/face/*           人脸识别代理
   ├─ /api/cabinet/*        柜机业务代理 + 编排
   ├─ /api/app/config       应用配置
   └─ TCP 锁控 (net.Socket)  裸 TCP + 自定义二进制协议开柜
```

**关键约束**：锁控板（默认 `10.134.231.111:10123`）走裸 TCP，浏览器无法直连，
因此开柜逻辑（领用/借用/归还）必须在后端编排：
`查询 plan → TCP 开柜 → 业务落库` 三步原子化在后端完成。

查询类接口（分类/物品/借用记录）虽前端可直连，但统一走后端，
省去 CORS 配置、隐藏工号注入、统一错误处理。

## 目录

```
web/
├── server/    Fastify 后端（API + TCP 开柜 + 生产期静态托管）
└── client/    Vite + React + shadcn 前端
```

## 开发

### 1. 配置环境变量

```bash
cd web
cp .env.example .env   # Windows: copy .env.example .env
```

编辑 `.env`，确认锁控板、柜机 API、人脸 API 地址（默认值已预填）。
**注意**：服务端口默认 `3100`（避开 3000 常用端口）。

### 2. 安装依赖

```bash
cd web
pnpm install
```

### 3. 开发模式（前后端分离 + 代理）

```bash
pnpm dev:all
```

- 后端：`http://localhost:3100`（tsx watch 热重载）
- 前端：`http://localhost:5173`（Vite，已配 `/api` 代理到 3100）
- 浏览器打开 `http://localhost:5173`，可正常调摄像头（localhost 免 HTTPS）

也可分别启动：

```bash
pnpm dev          # 仅后端
pnpm dev:client   # 仅前端
```

### 4. 生产构建

```bash
pnpm build
```

构建产物：
- `server/dist/` — 后端编译后的 JS
- `client/dist/` — 前端静态资源

### 5. 生产部署（单端口）

```bash
pnpm start
```

后端启动时会自动检测 `WEB_CLIENT_DIST`（默认 `../client/dist`），
若存在则用 `@fastify/static` 托管前端，**单端口**提供 API + 页面，
无需 Nginx，无跨域。

访问 `http://<服务器IP>:3100` 即可使用。

## 部署注意事项

1. **锁控板内网**：后端必须部署在与锁控板（`CABINET_LOCK_SERVER_IP`）同一内网的机器上，
   否则 TCP 开柜无法连通。
2. **HTTPS**：生产环境调用摄像头（`getUserMedia`）要求 HTTPS。
   推荐用 Nginx 反代 + 证书，或自签证书直接给 Fastify。
   localhost 不受此限制。
3. **进程守护**：用 pm2 或 systemd 保持服务常驻。

   ```bash
   pm2 start "node dist/index.js" --name isd-web
   ```

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/app/config` | GET | 应用配置（闲置超时等非敏感项） |
| `/api/face/recognize` | POST | 人脸识别，body `{ image: base64 }` |
| `/api/cabinet/categories` | GET | 物品分类列表 |
| `/api/cabinet/catalog-items` | GET | 物品列表，`?categoryId=` 过滤 |
| `/api/cabinet/operate` | POST | 领用/借用（含 TCP 开柜 + 业务落库） |
| `/api/cabinet/borrow-records` | POST | 查询未归还记录，body `{ operator }` |
| `/api/cabinet/return` | POST | 归还（含 TCP 开柜 + 业务落库） |

错误统一返回 `{ code, message }`，`message` 为中文用户友好提示。

## 与桌面版的差异

| 方面 | 桌面版 (Electron) | Web 版 |
|------|-------------------|--------|
| 外壳 | Electron 无边框全屏 | 浏览器，支持全屏 API |
| 后端 | IPC 进程内 | 独立 Fastify 服务 |
| 开柜 | 主进程 TCP | 后端服务 TCP |
| 摄像头权限 | setPermissionRequestHandler | 浏览器 getUserMedia（需 HTTPS） |
| 全局快捷键 | F11 等 | 无（浏览器限制） |
| 日志 | electron-log | pino |
| 配置 | .env（resources 目录） | .env（server 目录） |

## 开发提示

- 前端业务组件在 `client/src/components/terminal/`，shadcn 基础组件在 `client/src/components/ui/`
- 新增 shadcn 组件：`cd client && pnpm dlx shadcn@latest add <component>`
- 后端锁控协议在 `server/src/cabinet/lock-protocol.ts`，业务逻辑在 `cabinet-service.ts`
- 后端热重载基于 `tsx watch`，改代码自动重启
