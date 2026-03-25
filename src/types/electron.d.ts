import { SkillManifest } from './index'

export interface ElectronAPI {
  recognizeFace: (imageBase64: string) => Promise<{ empName: string; empWorkNo: string } | null>
  transcribeAudio: (audioBuffer: ArrayBuffer) => Promise<{
    text: string
    task?: string
    language?: string
    duration?: number | null
  }>
  synthesizeSpeech: (text: string) => Promise<ArrayBuffer>
  chatStream: (
    messages: Array<{ role: string; content: string }>,
    isAuthenticated: boolean,
    onChunk: (chunk: string) => void
  ) => Promise<void>
  difyChat: (query: string, conversationId: string | null, user: string, onChunk: (chunk: string) => void) => Promise<{ conversationId: string }>
  getSkills: (isAuthenticated: boolean) => Promise<SkillManifest[]>
  loadSkill: (name: string) => Promise<string>
  minimizeWindow: () => void
  closeWindow: () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
