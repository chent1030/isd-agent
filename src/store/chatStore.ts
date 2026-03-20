import { create } from 'zustand'
import { Message } from '../types'

interface ChatState {
  messages: Message[]
  isLoading: boolean

  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => string
  updateMessage: (id: string, patch: Partial<Message>) => void
  clearMessages: () => void
  setLoading: (v: boolean) => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,

  addMessage: (msg) => {
    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`
    set(state => ({
      messages: [...state.messages, { ...msg, id, timestamp: Date.now() }],
    }))
    return id
  },

  updateMessage: (id, patch) => {
    set(state => ({
      messages: state.messages.map(m => m.id === id ? { ...m, ...patch } : m),
    }))
  },

  clearMessages: () => set({ messages: [] }),
  setLoading: (v) => set({ isLoading: v }),
}))
