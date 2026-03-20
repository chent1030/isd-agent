# Findings

## 项目约定

### API 接口占位符
所有内部 API 通过 .env 配置，格式：
- `FACE_API_URL` — 人脸识别，POST，body: `{image: base64}`, 返回 `{empName, empWorkNo}`
- `STT_API_URL` — 语音转文字，POST multipart/form-data，body: 音频文件，返回 `{text}`
- `TTS_API_URL` — 文字转语音，POST，body: `{text}`, 返回音频流（binary）
- `LLM_API_URL` — LLM 对话，POST，支持流式，body: `{messages, stream}`
- `LLM_API_KEY` — LLM 鉴权 key

### Skills 规范
每个 skill 是一个目录，包含：
- `manifest.json`: `{id, name, description, keywords[], requiresAuth}`
- `index.ts`: 导出 `execute(params, context) => Promise<string>`

### 会话状态
- 认证用户：`{empName, empWorkNo, authenticatedAt, lastActiveAt}`
- 未认证用户：`{empName: null, empWorkNo: null}`
- 超时：2分钟无操作，清除会话，跳转锁屏

### VAD 实现
使用 Web Audio API：
- `AudioContext` + `AnalyserNode` 实时检测音量
- 音量低于阈值持续 1.5s 判定为停止说话
- 无需第三方库

### TTS 同步
- LLM 流式输出按句子分割（。！？\n）
- 每句完成后立即调用 TTS
- 当前朗读句子高亮显示
