export interface User {
  empName: string
  empWorkNo: string
  authenticatedAt: number
  lastActiveAt: number
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  isStreaming?: boolean
  highlightIndex?: number // TTS 当前朗读到第几句
}

export interface SkillManifest {
  name: string
  description: string
}

export type AppView = 'lock' | 'chat' | 'main'
