import React, { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from './store/authStore'
import { useSkillsStore } from './store/skillsStore'
import { useChatStore } from './store/chatStore'
import FaceAuth from './components/FaceAuth'
import ChatPanel from './components/Chat'

export default function App() {
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [chatResetKey, setChatResetKey] = useState(0)
  const [now, setNow] = useState(new Date())

  const { user, isAuthenticated, login, logout } = useAuthStore()
  const setSkills = useSkillsStore(s => s.setSkills)
  const clearMessages = useChatStore(s => s.clearMessages)

  const resetChat = useCallback(() => {
    clearMessages()
    setChatResetKey(key => key + 1)
  }, [clearMessages])

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    window.electronAPI.getAppConfig()
      .then(config => {
        if (config.skipFaceAuth) {
          const { empName, empWorkNo } = config.skipFaceAuthUser
          if (!empName || !empWorkNo) {
            console.error('SKIP_FACE_AUTH is enabled, but SKIP_FACE_AUTH_EMP_NAME or SKIP_FACE_AUTH_EMP_WORK_NO is missing')
            return
          }
          login({ empName, empWorkNo })
        }
      })
      .catch(console.error)
  }, [login])

  useEffect(() => {
    if (!isAuthenticated) {
      setSkills([])
      return
    }
    window.electronAPI.getSkills(true).then(setSkills).catch(console.error)
  }, [isAuthenticated, setSkills])

  useEffect(() => {
    if (isAuthenticated) resetChat()
  }, [isAuthenticated, resetChat])

  const handleLock = () => {
    logout()
    resetChat()
    setSkills([])
  }

  if (!isAuthenticated) {
    return <FaceAuth />
  }

  const timeText = now.toLocaleTimeString('zh-CN', { hour12: false })
  const dateText = now.toLocaleDateString('zh-CN')

  return (
    <div className="sci-shell clean-console" style={{ display: 'flex', flexDirection: 'column' }}>
      <header className="top-console-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 260 }}>
          <div className="isd-wordmark">行小助</div>
          <div className="sci-title app-title" style={{ fontSize: 20, letterSpacing: 0 }}>智能体助手</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="hud-chip status-chip">
            <span className="status-dot" />
            在线
          </div>

          {user && (
            <div className="hud-chip">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--text-dim)' }}>
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              {user.empName || '操作员'} <span style={{ color: 'var(--text-muted)' }}>{user.empWorkNo}</span>
            </div>
          )}

          <button onClick={handleLock} className="hud-button icon-button" title="锁定" aria-label="锁定">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
            </svg>
          </button>
        </div>
      </header>

      <section className="console-body">
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, gap: 14 }}>
          <div className="mode-label">智能体模式</div>

          <button onClick={() => setTtsEnabled(v => !v)} className={ttsEnabled ? 'hud-button voice-toggle is-on' : 'hud-button voice-toggle'}>
            {ttsEnabled ? '语音开启' : '语音关闭'}
            <span className={ttsEnabled ? 'toggle-led active' : 'toggle-led'} />
          </button>
        </div>

        <main className="chat-console clean-chat-frame">
          <ChatPanel
            ttsEnabled={ttsEnabled}
            isAuthenticated={isAuthenticated}
            resetKey={chatResetKey}
          />
        </main>
      </section>

      <footer className="footer-strip bottom-console-bar">
        <span>{timeText}</span>
        <span>{dateText}</span>
      </footer>
    </div>
  )
}
