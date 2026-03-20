# ISD Robot 桌面应用 - 任务计划

## 项目目标
基于 Electron + React + TypeScript 的桌面端智能助手，支持人脸识别鉴权、问答对话、Agent Skills 技能库调用、语音输入输出。

## 技术栈
- **框架**: Electron + Vite + React + TypeScript
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **LLM**: 公司内部 LLM（HTTP REST）
- **人脸识别**: 公司内部 API（HTTP REST，返回 `{empName, empWorkNo}`）
- **STT**: 公司内部 API（HTTP REST，上传音频文件）
- **TTS**: 公司内部 API（HTTP REST，返回音频流）

## 阶段计划

### Phase 1: 项目初始化 [ ]
- [ ] 初始化 Electron + Vite + React + TypeScript 项目
- [ ] 配置 Tailwind CSS
- [ ] 配置 Electron 主进程 + preload
- [ ] 配置 .env 环境变量占位符
- [ ] 验证开发环境可启动

### Phase 2: 主进程 IPC 通道 [ ]
- [ ] `ipc/face.ts` — 人脸识别（摄像头截图 → base64 → API）
- [ ] `ipc/stt.ts` — 语音转文字（音频文件 → API）
- [ ] `ipc/tts.ts` — 文字转语音（文字 → API → 音频流播放）
- [ ] `ipc/llm.ts` — LLM 调用（流式输出）
- [ ] `ipc/skills.ts` — Skills 加载器（启动时扫描 skills/ 目录）
- [ ] preload.ts 暴露所有 IPC 接口

### Phase 3: 状态管理 [ ]
- [ ] `authStore.ts` — 用户会话（empName, empWorkNo, 2min TTL, 主动锁定）
- [ ] `chatStore.ts` — 对话历史
- [ ] `skillsStore.ts` — 已加载的 Skills 列表

### Phase 4: 锁屏 / 人脸识别界面 [ ]
- [ ] 锁屏页面（显示时钟、点击按钮触发识别）
- [ ] 摄像头预览组件
- [ ] 识别中状态（loading）
- [ ] 识别成功 → 跳转主界面
- [ ] 识别失败 → 提示 + 仅进入问答

### Phase 5: 主界面布局 [ ]
- [ ] 顶部栏（用户信息、主动锁定按钮、TTS 开关）
- [ ] 左侧 Skills 面板（仅认证用户可见）
- [ ] 右侧对话区域
- [ ] 底部输入栏（文字输入 + 语音按钮）

### Phase 6: 问答对话模块 [ ]
- [ ] 对话消息列表（用户/AI 气泡）
- [ ] 文字输入发送
- [ ] LLM 流式输出（逐字显示）
- [ ] TTS 同步朗读（文字高亮 + 语音）
- [ ] TTS 开关控制

### Phase 7: 语音输入模块 [ ]
- [ ] 录音按钮（按住录音 / 点击开始-停止）
- [ ] VAD 静音检测自动停止（Web Audio API 音量检测）
- [ ] 录音完成 → 调用 STT API → 填入输入框

### Phase 8: Agent Skills 模块 [ ]
- [ ] Skills 目录结构定义（manifest.json + index.ts）
- [ ] 启动时加载所有 Skills 到内存
- [ ] Skills 列表面板 UI
- [ ] 意图识别（LLM 判断是否触发 skill）
- [ ] Skill 执行 + 结果展示
- [ ] 示例 Skill（查询员工信息）

### Phase 9: 会话超时逻辑 [ ]
- [ ] 2分钟无操作计时器
- [ ] 任意交互重置计时器
- [ ] 超时 → 清除会话 → 跳转锁屏
- [ ] 主动锁定按钮

### Phase 10: 收尾 [ ]
- [ ] .env.example 文件
- [ ] README 使用说明
- [ ] 构建配置（electron-builder）

## 错误记录
| 错误 | 尝试 | 解决 |
|------|------|------|
| - | - | - |

## 关键决策
- 锁屏状态下不自动触发摄像头，用户点击按钮触发
- 识别失败仅进入问答，无 Skills 权限
- Skills 放在项目根目录 `skills/` 下，启动时加载
- 会话超时 2 分钟，用户可主动锁定
- TTS 支持开关，文字+语音同步输出
- VAD 用 Web Audio API 音量检测实现静音自动停止
