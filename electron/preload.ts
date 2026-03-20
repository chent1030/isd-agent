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

  // LLM（含 skills 注入）
  chatStream: (messages: object[], isAuthenticated: boolean, onChunk: (chunk: string) => void) => {
    const channel = `llm:chunk:${Date.now()}`
    ipcRenderer.on(channel, (_e, chunk) => onChunk(chunk))
    return ipcRenderer.invoke('llm:chat', { messages, channel, isAuthenticated }).finally(() => {
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

  // Skills
  getSkills: (isAuthenticated: boolean) => ipcRenderer.invoke('skills:list', { isAuthenticated }),
  loadSkill: (name: string) => ipcRenderer.invoke('skills:load', { name }),

  // 窗口控制
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  closeWindow: () => ipcRenderer.send('window:close'),
})
