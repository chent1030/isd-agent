import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // 人脸识别
  recognizeFace: (imageBase64: string) =>
    ipcRenderer.invoke('face:recognize', imageBase64),

  // STT
  transcribeAudio: (audioBuffer: ArrayBuffer) =>
    ipcRenderer.invoke('stt:transcribe', audioBuffer),

  // TTS
  synthesizeSpeech: (text: string) =>
    ipcRenderer.invoke('tts:synthesize', text),

  // LLM
  chatStream: (messages: object[], onChunk: (chunk: string) => void) => {
    const channel = `llm:chunk:${Date.now()}`
    ipcRenderer.on(channel, (_e, chunk) => onChunk(chunk))
    return ipcRenderer.invoke('llm:chat', { messages, channel }).finally(() => {
      ipcRenderer.removeAllListeners(channel)
    })
  },

  // Dify Chat
  difyChat: (query: string, conversationId: string | null, user: string, onChunk: (chunk: string) => void) => {
    const channel = `dify:chunk:${Date.now()}`
    ipcRenderer.on(channel, (_e, chunk) => onChunk(chunk))
    return ipcRenderer
      .invoke('dify:chat', { query, conversationId, channel, user })
      .finally(() => ipcRenderer.removeAllListeners(channel))
  },

  // Skills（只读列表，执行由 LLM 自动触发）
  getSkills: () => ipcRenderer.invoke('skills:list'),

  // 窗口控制
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  closeWindow: () => ipcRenderer.send('window:close'),
})
