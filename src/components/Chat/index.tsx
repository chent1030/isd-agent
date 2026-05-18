import React, { useState, useRef, useCallback, useEffect } from 'react'
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
  resetKey: number
}

function splitSentences(text: string): string[] {
  return text.split(/(?<=[。！？\n])/).filter(s => s.trim())
}

export default function ChatPanel({ ttsEnabled, isAuthenticated, guestMode, onUpgrade, chatMode, resetKey }: Props) {
  const [input, setInput] = useState('')
  const { messages, isLoading, addMessage, updateMessage, setLoading } = useChatStore()
  const { user } = useAuthStore()
  const touch = useAuthStore(s => s.touch)
  const isSpeakingRef = useRef(false)
  const conversationIdRef = useRef<string | null>(null)

  useEffect(() => {
    setInput('')
    conversationIdRef.current = null
    isSpeakingRef.current = false
    setLoading(false)
  }, [resetKey, setLoading])

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
    const speechSentences: string[] = []
    let spokenSentenceCount = 0
    const enqueueSpeech = (textToSpeak: string, includeLastSentence: boolean) => {
      if (!ttsEnabled) return
      const sentences = splitSentences(textToSpeak)
      const end = includeLastSentence ? sentences.length : Math.max(sentences.length - 1, 0)
      const newSentences = sentences.slice(spokenSentenceCount, end)
      if (newSentences.length === 0) return

      const startIdx = speechSentences.length
      speechSentences.push(...newSentences)
      spokenSentenceCount += newSentences.length
      if (!isSpeakingRef.current) speakNext(assistantId, speechSentences, startIdx)
    }
    const useAgentMode = isAuthenticated && chatMode === 'agent'
    try {
      if (useAgentMode) {
        const history = useChatStore.getState().messages
          .filter(m => !m.isStreaming)
          .map(m => ({ role: m.role, content: m.content }))

        await window.electronAPI.chatStream(
          history,
          isAuthenticated,
          user ? { empName: user.empName, empWorkNo: user.empWorkNo } : null,
          (chunk: string) => {
            if (chunk === '[DONE]') return
            fullText += chunk
            updateMessage(assistantId, { content: fullText })
            enqueueSpeech(fullText, false)
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
            fullText = chunk
            updateMessage(assistantId, { content: fullText })
            enqueueSpeech(fullText, false)
          }
        )
        conversationIdRef.current = result.conversationId
        if (result.answer) {
          fullText = result.answer
          updateMessage(assistantId, { content: fullText })
        }
      }
    } catch (e: any) {
      fullText = `[请求失败] ${e?.message ?? String(e)}`
    }

    updateMessage(assistantId, { content: fullText, isStreaming: false })
    enqueueSpeech(fullText, true)
  }, [isLoading, touch, addMessage, updateMessage, setLoading, ttsEnabled, speakNext, user, isAuthenticated, chatMode])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'transparent' }}>
      {/* 访客提示横幅 */}
      {guestMode && !isAuthenticated && (
        <div style={{
          padding: '8px 20px',
          background: 'rgba(255,247,225,0.82)',
          borderBottom: '1px solid rgba(214,145,0,0.22)',
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
      <div style={{ padding: '12px 16px 118px', borderTop: '1px solid #c9dfea', position: 'relative', background: 'rgba(255,255,255,0.78)' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 8,
          background: 'rgba(255,255,255,0.94)',
          border: '1px solid #a8cfdf',
          borderRadius: 8, padding: '8px 12px',
          transition: 'border-color 0.2s',
        }}
          onFocusCapture={e => (e.currentTarget.style.borderColor = '#57c7e8')}
          onBlurCapture={e => (e.currentTarget.style.borderColor = '#a8cfdf')}
        >
          <textarea
            value={input}
            onChange={e => { setInput(e.target.value); touch() }}
            onKeyDown={handleKeyDown}
            placeholder="输入消息，Enter 发送，Shift+Enter 换行..."
            rows={1}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#102033', fontSize: 15, lineHeight: 1.6, resize: 'none',
              fontFamily: 'Noto Sans SC', minHeight: 36, maxHeight: 120,
            }}
            onInput={e => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 120) + 'px'
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 2 }}>
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
        <div style={{ display: 'none' }}>
          ENTER 发送 · SHIFT+ENTER 换行 · 点击麦克风语音输入
        </div>
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 8,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{ pointerEvents: 'auto' }}>
            <VoiceInput onTranscribed={text => { void sendMessage(text) }} disabled={isLoading} />
          </div>
        </div>
      </div>
    </div>
  )
}
