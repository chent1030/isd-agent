import { SkillManifest } from './index'

export interface ElectronAPI {
  recognizeFace: (imageBase64: string) => Promise<{ empName: string; empWorkNo: string } | null>
  transcribeAudio: (audioBuffer: ArrayBuffer) => Promise<{ text: string }>
  synthesizeSpeech: (text: string) => Promise<ArrayBuffer>
  chatStream: (messages: object[], onChunk: (chunk: string) => void) => Promise<void>
  difyChat: (query: string, conversationId: string | null, user: string, onChunk: (chunk: string) => void) => Promise<{ conversationId: string }>
  getSkills: () => Promise<SkillManifest[]>
  minimizeWindow: () => void
  closeWindow: () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
