# ISD Robot

基于 Electron + React + TypeScript 的桌面智能助手。

## 功能

- 人脸识别登录（公司内部 API）
- 问答对话（流式输出 + TTS 语音同步）
- Agent Skills 技能库（仅认证用户）
- 语音输入（VAD 自动停止）
- 会话超时自动锁定（2分钟）

## 快速开始

### 1. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，填入实际 API 地址：

```
FACE_API_URL=http://your-internal-api/face/recognize
STT_API_URL=http://your-internal-api/stt/transcribe
TTS_API_URL=http://your-internal-api/tts/synthesize
LLM_API_URL=http://your-internal-api/llm/chat
LLM_API_KEY=your-key-here
```

### 2. 安装依赖

```bash
npm install
```

### 3. 开发模式

```bash
npm run dev
```

### 4. 打包

```bash
npm run dist
```

## Skills 开发

在 `skills/` 目录下新建文件夹，包含两个文件：

**manifest.json**
```json
{
  "id": "my-skill",
  "name": "技能名称",
  "description": "技能描述",
  "keywords": ["关键词1", "关键词2"],
  "requiresAuth": true
}
```

**index.js**
```js
async function execute(params, context) {
  // 实现技能逻辑
  return '返回结果字符串'
}
module.exports = { execute }
```

程序启动时自动加载所有 skills。

## API 接口约定

| 接口 | 方法 | 请求 | 响应 |
|------|------|------|------|
| 人脸识别 | POST | `{image: base64}` | `{empName, empWorkNo}` |
| STT | POST multipart | 音频文件 | `{text}` |
| TTS | POST | `{text}` | 音频流 (binary) |
| LLM | POST | `{messages, stream: true}` | SSE 流 |
