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
  chatStream: (messages: object[], isAuthenticated: boolean, operator: object | null, onChunk: (chunk: string) => void) => {
    const channel = `llm:chunk:${Date.now()}-${Math.random().toString(36).slice(2)}`
    const handler = (_e: Electron.IpcRendererEvent, chunk: string) => onChunk(chunk)
    ipcRenderer.on(channel, handler)
    return ipcRenderer.invoke('llm:chat', { messages, channel, isAuthenticated, operator }).finally(() => {
      ipcRenderer.removeListener(channel, handler)
    })
  },

  // Skills
  getSkills: (isAuthenticated: boolean) => ipcRenderer.invoke('skills:list', { isAuthenticated }),
  loadSkill: (name: string) => ipcRenderer.invoke('skills:load', { name }),
  getRecentBorrowItems: (operator: object, limit?: number) =>
    ipcRenderer.invoke('cabinet:recent-borrow-items', { operator, limit }),
  getAppConfig: () => ipcRenderer.invoke('app:get-config'),

  // 窗口控制
  toggleFullScreen: () => ipcRenderer.send('window:toggle-fullscreen'),
})
