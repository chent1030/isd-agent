import React, { useState, useRef, useCallback } from 'react'
import { useChatStore } from '../../store/chatStore'
import { useAuthStore } from '../../store/authStore'
import MessageList from './MessageList'
import VoiceInput from '../VoiceInput'

interface Props {
  ttsEnabled: boolean
  isAuthenticated: boolean
  guestMode: boolean
  onUpgrade: () => void
  chatMode: 'qa' | 'agent'
}

function splitSentences(text: string): string[] {
  return text.split(/(?<=[。！？\n])/).filter(s => s.trim())
}

export default function ChatPanel({ ttsEnabled, isAuthenticated, guestMode, onUpgrade, chatMode }: Props) {
  const [input, setInput] = useState('')
  const { messages, isLoading, addMessage, updateMessage, setLoading } = useChatStore()
  const { user } = useAuthStore()
  const touch = useAuthStore(s => s.touch)
  const isSpeakingRef = useRef(false)
  const conversationIdRef = useRef<string | null>(null)

  const speakNext = useCallback(async (msgId: string, sentences: string[], startIdx: number) => {
    if (!ttsEnabled || startIdx >= sentences.length) {
      isSpeakingRef.current = false
      updateMessage(msgId, { highlightIndex: undefined })
      return
    }
    isSpeakingRef.current = true
    updateMessage(msgId, { highlightIndex: startIdx })
    try {
      const audioBuffer = await window.electronAPI.synthesizeSpeech(sentences[startIdx])
      const ctx = new AudioContext()
      const decoded = await ctx.decodeAudioData(audioBuffer)
      const source = ctx.createBufferSource()
      source.buffer = decoded
      source.connect(ctx.destination)
      source.start()
      source.onended = () => { ctx.close(); speakNext(msgId, sentences, startIdx + 1) }
    } catch {
      speakNext(msgId, sentences, startIdx + 1)
    }
  }, [ttsEnabled, updateMessage])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return
    touch()
    setInput('')
    addMessage({ role: 'user', content: text })
    setLoading(true)
    const assistantId = addMessage({ role: 'assistant', content: '', isStreaming: true })
    setLoading(false)
    let fullText = ''
    let spokenSentences: string[] = []
    const useAgentMode = isAuthenticated && chatMode === 'agent'
    try {
      if (useAgentMode) {
        const history = useChatStore.getState().messages
          .filter(m => !m.isStreaming)
          .map(m => ({ role: m.role, content: m.content }))

        await window.electronAPI.chatStream(
          history,
          isAuthenticated,
          (chunk: string) => {
            if (chunk === '[DONE]') return
            fullText += chunk
            updateMessage(assistantId, { content: fullText })
            if (ttsEnabled && !isSpeakingRef.current) {
              const sentences = splitSentences(fullText)
              const newSentences = sentences.slice(spokenSentences.length, -1)
              if (newSentences.length > 0) {
                spokenSentences = [...spokenSentences, ...newSentences]
                speakNext(assistantId, spokenSentences, spokenSentences.length - newSentences.length)
              }
            }
          }
        )
      } else {
        const difyUser = user?.empWorkNo ?? 'guest'
        const result = await window.electronAPI.difyChat(
          text,
          conversationIdRef.current,
          difyUser,
          (chunk: string) => {
            if (chunk === '[DONE]') return
            fullText += chunk
            updateMessage(assistantId, { content: fullText })
            if (ttsEnabled && !isSpeakingRef.current) {
              const sentences = splitSentences(fullText)
              const newSentences = sentences.slice(spokenSentences.length, -1)
              if (newSentences.length > 0) {
                spokenSentences = [...spokenSentences, ...newSentences]
                speakNext(assistantId, spokenSentences, spokenSentences.length - newSentences.length)
              }
            }
          }
        )
        conversationIdRef.current = result.conversationId
      }
    } catch (e: any) {
      fullText = `[请求失败] ${e?.message ?? String(e)}`
    }

    updateMessage(assistantId, { content: fullText, isStreaming: false })
    if (ttsEnabled) {
      const finalSentences = splitSentences(fullText)
      const remaining = finalSentences.slice(spokenSentences.length)
      if (remaining.length > 0) {
        spokenSentences = [...spokenSentences, ...remaining]
        if (!isSpeakingRef.current) speakNext(assistantId, spokenSentences, spokenSentences.length - remaining.length)
      }
    }
  }, [isLoading, touch, addMessage, updateMessage, setLoading, ttsEnabled, speakNext, user, isAuthenticated, chatMode])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 访客提示横幅 */}
      {guestMode && !isAuthenticated && (
        <div style={{
          padding: '8px 20px',
          background: 'rgba(255,170,0,0.06)',
          borderBottom: '1px solid rgba(255,170,0,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--amber)', boxShadow: '0 0 6px var(--amber)' }} />
            <span style={{ fontSize: 11, color: 'var(--amber)', fontFamily: 'Rajdhani', letterSpacing: '0.1em' }}>
              访客模式
            </span>
          </div>
          <button onClick={onUpgrade}
            style={{
              padding: '3px 12px', borderRadius: 3, fontSize: 10,
              fontFamily: 'Rajdhani', letterSpacing: '0.1em', cursor: 'pointer',
              background: 'rgba(255,170,0,0.1)', border: '1px solid rgba(255,170,0,0.3)',
              color: 'var(--amber)', transition: 'all 0.2s',
            }}>
            ▶ 人脸识别登录
          </button>
        </div>
      )}

      <MessageList messages={messages} isLoading={isLoading} />

      {/* 输入区 */}
      <div style={{ padding: '12px 16px 16px', borderTop: '1px solid var(--border)' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 8,
          background: 'rgba(13,22,38,0.8)',
          border: '1px solid var(--border-bright)',
          borderRadius: 8, padding: '8px 12px',
          transition: 'border-color 0.2s',
        }}
          onFocusCapture={e => (e.currentTarget.style.borderColor = 'var(--cyan-dim)')}
          onBlurCapture={e => (e.currentTarget.style.borderColor = 'var(--border-bright)')}
        >
          <textarea
            value={input}
            onChange={e => { setInput(e.target.value); touch() }}
            onKeyDown={handleKeyDown}
            placeholder="输入消息，Enter 发送，Shift+Enter 换行..."
            rows={1}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text)', fontSize: 13, lineHeight: 1.6, resize: 'none',
              fontFamily: 'Noto Sans SC', minHeight: 36, maxHeight: 120,
            }}
            onInput={e => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 120) + 'px'
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 2 }}>
            <VoiceInput onTranscribed={text => setInput(prev => prev + text)} disabled={isLoading} />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              style={{
                width: 34, height: 34, borderRadius: 6, cursor: 'pointer',
                background: input.trim() && !isLoading
                  ? 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,102,255,0.2))'
                  : 'transparent',
                border: `1px solid ${input.trim() && !isLoading ? 'var(--cyan-glow)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: input.trim() && !isLoading ? 'var(--cyan)' : 'var(--text-muted)',
                transition: 'all 0.2s',
                boxShadow: input.trim() && !isLoading ? '0 0 12px var(--cyan-dim)' : 'none',
              }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
        <div style={{ marginTop: 6, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', letterSpacing: '0.08em', fontFamily: 'Rajdhani' }}>
          ENTER 发送 · SHIFT+ENTER 换行 · 点击麦克风语音输入
        </div>
      </div>
    </div>
  )
}
