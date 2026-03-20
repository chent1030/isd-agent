import React, { useState, useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { useSkillsStore } from './store/skillsStore'
import FaceAuth from './components/FaceAuth'
import ChatPanel from './components/Chat'
import SkillsPanel from './components/Skills'

type View = 'lock' | 'app'

export default function App() {
  const [view, setView] = useState<View>('lock')
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [guestMode, setGuestMode] = useState(false)
  const [skillsOpen, setSkillsOpen] = useState(true)

  const { user, isAuthenticated, logout } = useAuthStore()
  const setSkills = useSkillsStore(s => s.setSkills)

  useEffect(() => {
    window.electronAPI.getSkills().then(setSkills).catch(console.error)
  }, [])

  useEffect(() => {
    if (isAuthenticated) { setGuestMode(false); setView('app') }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated && view === 'app' && !guestMode) setView('lock')
  }, [isAuthenticated, view, guestMode])

  const handleUnmatched = () => { setGuestMode(true); setView('app') }

  const handleLock = () => { logout(); setGuestMode(false); setView('lock') }

  // 访客 → 识别（在主界面内触发识别，不跳回锁屏）
  const handleUpgrade = () => {
    // 触发人脸识别流程：直接跳回锁屏让用户识别
    logout(); setGuestMode(false); setView('lock')
  }

  if (view === 'lock') {
    return <FaceAuth onUnmatched={handleUnmatched} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--surface)', position: 'relative', overflow: 'hidden' }}>

      {/* 背景网格 */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />

      {/* 顶部光晕 */}
      <div style={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: 800, height: 200, background: 'radial-gradient(ellipse, rgba(0,212,255,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* ── 顶部栏 ── */}
      <header className="glass" style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: 52,
        borderLeft: 'none', borderRight: 'none', borderTop: 'none',
        borderBottom: '1px solid var(--border)',
      }}>
        {/* 左：Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 6,
            background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,102,255,0.2))',
            border: '1px solid var(--cyan-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 12px var(--cyan-dim)',
          }}>
            <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 11, color: 'var(--cyan)', letterSpacing: '0.05em' }}>ISD</span>
          </div>
          <div>
            <div style={{ fontFamily: 'Rajdhani', fontWeight: 600, fontSize: 14, letterSpacing: '0.15em', color: 'var(--text)' }}>INTELLIGENT ASSISTANT</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.1em', marginTop: -2 }}>智能助手系统 v1.0</div>
          </div>
        </div>

        {/* 中：模式指示 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isAuthenticated && user ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 14px', borderRadius: 4,
              background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }} />
              <span style={{ fontFamily: 'Rajdhani', fontSize: 13, color: 'var(--green)', letterSpacing: '0.1em' }}>{user.empName}</span>
              <span style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.05em' }}>{user.empWorkNo}</span>
            </div>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 14px', borderRadius: 4,
              background: 'rgba(255,170,0,0.06)', border: '1px solid rgba(255,170,0,0.2)',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--amber)', boxShadow: '0 0 6px var(--amber)' }} />
              <span style={{ fontFamily: 'Rajdhani', fontSize: 13, color: 'var(--amber)', letterSpacing: '0.1em' }}>访客模式</span>
            </div>
          )}
        </div>

        {/* 右：操作按钮 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* 访客升级 / 用户切换访客 */}
          {!isAuthenticated ? (
            <button onClick={handleUpgrade} className="btn-primary"
              style={{ padding: '5px 14px', borderRadius: 4, fontSize: 11 }}>
              ▶ 人脸识别登录
            </button>
          ) : (
            <button onClick={handleLock} className="btn-ghost"
              style={{ padding: '5px 14px', borderRadius: 4, fontSize: 11 }}>
              切换账号
            </button>
          )}

          {/* TTS 开关 */}
          <button onClick={() => setTtsEnabled(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 4, fontSize: 11,
              fontFamily: 'Rajdhani', letterSpacing: '0.08em', cursor: 'pointer',
              background: ttsEnabled ? 'rgba(0,212,255,0.08)' : 'transparent',
              border: `1px solid ${ttsEnabled ? 'var(--cyan-dim)' : 'var(--border)'}`,
              color: ttsEnabled ? 'var(--cyan)' : 'var(--text-dim)',
              transition: 'all 0.2s',
            }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              {ttsEnabled
                ? <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                : <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              }
            </svg>
            {ttsEnabled ? 'VOICE ON' : 'VOICE OFF'}
          </button>

          {/* 锁定 */}
          <button onClick={handleLock}
            style={{
              width: 32, height: 32, borderRadius: 4, cursor: 'pointer',
              background: 'transparent', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-dim)', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--red)'; (e.currentTarget as HTMLElement).style.color = 'var(--red)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)' }}
            title="锁定">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── 主体 ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative', zIndex: 1 }}>

        {/* 左侧 Skills 面板 */}
        {isAuthenticated && (
          <aside style={{
            width: skillsOpen ? 260 : 0,
            overflow: 'hidden',
            transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
            borderRight: '1px solid var(--border)',
            background: 'rgba(8,14,26,0.6)',
            flexShrink: 0,
          }}>
            <div style={{ width: 260, height: '100%', overflowY: 'auto' }}>
              <SkillsPanel />
            </div>
          </aside>
        )}

        {/* Skills 折叠按钮 */}
        {isAuthenticated && (
          <button onClick={() => setSkillsOpen(v => !v)}
            style={{
              position: 'absolute', left: skillsOpen ? 252 : 0, top: '50%', transform: 'translateY(-50%)',
              zIndex: 20, width: 16, height: 48, borderRadius: '0 4px 4px 0',
              background: 'var(--surface-3)', border: '1px solid var(--border)',
              borderLeft: 'none', cursor: 'pointer', color: 'var(--text-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)',
            }}>
            <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
              <path d={skillsOpen ? 'M5 1L2 4l3 3' : 'M3 1l3 3-3 3'} stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
          </button>
        )}

        {/* 对话区 */}
        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <ChatPanel ttsEnabled={ttsEnabled} isAuthenticated={isAuthenticated} guestMode={guestMode} onUpgrade={handleUpgrade} />
        </main>
      </div>

      {/* 底部状态栏 */}
      <div style={{
        position: 'relative', zIndex: 10, height: 24,
        borderTop: '1px solid var(--border)',
        background: 'rgba(8,14,26,0.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px',
        fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em',
        fontFamily: 'Rajdhani',
      }}>
        <span>ISD ROBOT SYSTEM</span>
        <span style={{ color: 'var(--cyan-dim)' }}>● ONLINE</span>
        <span>{isAuthenticated ? `AUTH: ${user?.empWorkNo}` : 'GUEST MODE'}</span>
      </div>
    </div>
  )
}
