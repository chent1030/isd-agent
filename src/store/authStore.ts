import { create } from 'zustand'
import { User } from '../types'

const SESSION_TIMEOUT = 2 * 60 * 1000 // 2 分钟

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  timerRef: ReturnType<typeof setTimeout> | null

  login: (user: Omit<User, 'authenticatedAt' | 'lastActiveAt'>) => void
  logout: () => void
  resetTimer: () => void
  touch: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  timerRef: null,

  login: (userData) => {
    const { timerRef, resetTimer } = get()
    if (timerRef) clearTimeout(timerRef)

    const now = Date.now()
    set({
      user: { ...userData, authenticatedAt: now, lastActiveAt: now },
      isAuthenticated: true,
    })
    resetTimer()
  },

  logout: () => {
    const { timerRef } = get()
    if (timerRef) clearTimeout(timerRef)
    set({ user: null, isAuthenticated: false, timerRef: null })
  },

  resetTimer: () => {
    const { timerRef, logout } = get()
    if (timerRef) clearTimeout(timerRef)
    const ref = setTimeout(() => {
      logout()
    }, SESSION_TIMEOUT)
    set({ timerRef: ref })
  },

  touch: () => {
    const { isAuthenticated, resetTimer } = get()
    if (!isAuthenticated) return
    set(state => ({
      user: state.user ? { ...state.user, lastActiveAt: Date.now() } : null,
    }))
    resetTimer()
  },
}))
