import { SkillManifest } from './index'

export interface RecentBorrowItem {
  itemId: string
  itemName: string
  action: 'borrow' | 'receive'
  source: 'personal' | 'popular'
  category?: string
  spec?: string
  useType?: number
  quantity?: number
  count?: number
  lastUsedAt?: string
}

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
    operator: { empName: string; empWorkNo: string } | null,
    onChunk: (chunk: string) => void
  ) => Promise<string>
  getSkills: (isAuthenticated: boolean) => Promise<SkillManifest[]>
  loadSkill: (name: string) => Promise<string>
  getRecentBorrowItems: (
    operator: { empName: string; empWorkNo: string },
    limit?: number
  ) => Promise<RecentBorrowItem[]>
  getAppConfig: () => Promise<{
    skipFaceAuth: boolean
    skipFaceAuthUser: { empName: string; empWorkNo: string }
  }>
  toggleFullScreen: () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
