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
  return text.split(/(?<=[\u3002\uff01\uff1f\n])/).filter(s => s.trim())
}

export default function ChatPanel({ ttsEnabled, isAuthenticated, guestMode, onUpgrade, chatMode, resetKey }: Props) {
  const [input, setInput] = useState('')
  const { messages, isLoading, addMessage, updateMessage, setLoading } = useChatStore()
  const { user } = useAuthStore()
  const touch = useAuthStore(s => s.touch)
  const isSpeakingRef = useRef(false)
  const isSendingRef = useRef(false)
  const speechSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const speechContextRef = useRef<AudioContext | null>(null)
  const speechGenerationRef = useRef(0)
  const conversationIdRef = useRef<string | null>(null)

  const stopSpeech = useCallback(() => {
    speechGenerationRef.current += 1
    isSpeakingRef.current = false
    try { speechSourceRef.current?.stop() } catch {}
    speechSourceRef.current = null
    void speechContextRef.current?.close().catch(() => {})
    speechContextRef.current = null
    for (const msg of useChatStore.getState().messages) {
      if (msg.highlightIndex !== undefined) updateMessage(msg.id, { highlightIndex: undefined })
    }
  }, [updateMessage])

  useEffect(() => {
    setInput('')
    conversationIdRef.current = null
    stopSpeech()
    isSendingRef.current = false
    setLoading(false)
  }, [resetKey, setLoading, stopSpeech])

  useEffect(() => () => {
    stopSpeech()
  }, [stopSpeech])

  const speakNext = useCallback(async (msgId: string, sentences: string[], startIdx: number) => {
    const generation = speechGenerationRef.current
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
      if (generation !== speechGenerationRef.current) {
        await ctx.close()
        return
      }
      speechContextRef.current = ctx
      speechSourceRef.current = source
      source.buffer = decoded
      source.connect(ctx.destination)
      source.start()
      source.onended = () => {
        if (speechSourceRef.current === source) speechSourceRef.current = null
        if (speechContextRef.current === ctx) speechContextRef.current = null
        ctx.close()
        if (generation === speechGenerationRef.current) speakNext(msgId, sentences, startIdx + 1)
      }
    } catch {
      if (generation === speechGenerationRef.current) speakNext(msgId, sentences, startIdx + 1)
    }
  }, [ttsEnabled, updateMessage])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading || isSendingRef.current) return
    isSendingRef.current = true
    touch()
    setInput('')
    addMessage({ role: 'user', content: text })
    setLoading(true)
    const assistantId = addMessage({ role: 'assistant', content: '', isStreaming: true })
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

        const result = await window.electronAPI.chatStream(
          history,
          isAuthenticated,
          user ? { empName: user.empName, empWorkNo: user.empWorkNo } : null,
          (chunk: string) => {
            if (chunk === '[DONE]') return
            if (chunk === '[SKILL_CALLING]') {
              updateMessage(assistantId, { content: '正在调用技能...' })
              return
            }
            fullText += chunk
            updateMessage(assistantId, { content: fullText })
            enqueueSpeech(fullText, false)
          }
        )
        if (result) {
          fullText = result
          updateMessage(assistantId, { content: fullText })
        }
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
      fullText = `[错误] ${e?.message ?? String(e)}`
    }

    const finalText = fullText.trim() || '未收到模型返回内容，请稍后重试。'
    updateMessage(assistantId, { content: finalText, isStreaming: false })
    enqueueSpeech(finalText, true)
    isSendingRef.current = false
    setLoading(false)
  }, [isLoading, touch, addMessage, updateMessage, setLoading, ttsEnabled, speakNext, user, isAuthenticated, chatMode])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, background: 'transparent' }}>
      {guestMode && !isAuthenticated && (
        <div style={{
          padding: '9px 18px',
          background: 'rgba(255,170,0,0.08)',
          borderBottom: '1px solid rgba(255,170,0,0.22)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="status-dot amber" />
            <span style={{ fontSize: 12, color: 'var(--amber)', fontFamily: 'Rajdhani', letterSpacing: '0.12em' }}>GUEST MODE</span>
          </div>
          <button onClick={onUpgrade} className="hud-button" style={{ minHeight: 28, fontSize: 11, color: 'var(--amber)' }}>
            FACE AUTH
          </button>
        </div>
      )}

      <div className="chat-stage">
        <MessageList messages={messages} isLoading={isLoading} />
      </div>

      <div className="composer-dock">
        <button className="hud-button" title="附件" style={{ width: 44, height: 44, minHeight: 44, justifyContent: 'center', padding: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 1 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>

        <div
          className="input-shell"
          onFocusCapture={e => (e.currentTarget.style.borderColor = 'rgba(0,212,255,0.62)')}
          onBlurCapture={e => (e.currentTarget.style.borderColor = 'rgba(0,212,255,0.24)')}
        >
          <textarea
            value={input}
            onChange={e => { setInput(e.target.value); touch() }}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            className="sci-textarea"
            onInput={e => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 116) + 'px'
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="hud-button"
            style={{ width: 42, height: 42, minHeight: 42, justifyContent: 'center', padding: 0, color: input.trim() && !isLoading ? 'var(--cyan)' : 'var(--text-muted)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>

        <div className="composer-wave">
          {Array.from({ length: 96 }, (_, i) => (
            <span key={i} style={{ height: 4 + (Math.sin(i * 0.38) + 1) * 12 }} />
          ))}
        </div>

        <div className="voice-slot" style={{ pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto' }}>
            <VoiceInput
              onRecordingStart={stopSpeech}
              onTranscribed={text => { void sendMessage(text) }}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
