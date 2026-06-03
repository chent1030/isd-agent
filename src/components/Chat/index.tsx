import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useChatStore } from '../../store/chatStore'
import { useAuthStore } from '../../store/authStore'
import type { RecentBorrowItem } from '../../types/electron'
import MessageList from './MessageList'
import VoiceInput from '../VoiceInput'

interface Props {
  ttsEnabled: boolean
  isAuthenticated: boolean
  resetKey: number
}

function splitSentences(text: string): string[] {
  return text.split(/(?<=[\u3002\uff01\uff1f\n])/).filter(s => s.trim())
}

export default function ChatPanel({ ttsEnabled, isAuthenticated, resetKey }: Props) {
  const [input, setInput] = useState('')
  const [recentBorrowItems, setRecentBorrowItems] = useState<RecentBorrowItem[]>([])
  const { messages, isLoading, addMessage, updateMessage, setLoading } = useChatStore()
  const { user } = useAuthStore()
  const touch = useAuthStore(s => s.touch)
  const isSpeakingRef = useRef(false)
  const isSendingRef = useRef(false)
  const speechSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const speechContextRef = useRef<AudioContext | null>(null)
  const speechGenerationRef = useRef(0)

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
    stopSpeech()
    isSendingRef.current = false
    setLoading(false)
  }, [resetKey, setLoading, stopSpeech])

  useEffect(() => {
    let cancelled = false
    if (!isAuthenticated || !user?.empWorkNo || !user?.empName) {
      setRecentBorrowItems([])
      return
    }

    window.electronAPI.getRecentBorrowItems({ empName: user.empName, empWorkNo: user.empWorkNo }, 5)
      .then(items => {
        if (!cancelled) setRecentBorrowItems(items)
      })
      .catch(error => {
        console.error('Get recent borrow items failed:', error)
        if (!cancelled) setRecentBorrowItems([])
      })

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, user?.empName, user?.empWorkNo, resetKey])

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
    if (!text.trim() || isLoading || isSendingRef.current || !isAuthenticated) return
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

    try {
      const history = useChatStore.getState().messages
        .filter(m => !m.isStreaming)
        .map(m => ({ role: m.role, content: m.content }))

      const result = await window.electronAPI.chatStream(
        history,
        true,
        user ? { empName: user.empName, empWorkNo: user.empWorkNo } : null,
        (chunk: string) => {
          if (chunk === '[DONE]') return
          if (chunk === '[SKILL_CALLING]') {
            updateMessage(assistantId, { content: '正在调用技能，请稍候...' })
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
    } catch (e: any) {
      fullText = `[错误] ${e?.message ?? String(e)}`
    }

    const finalText = fullText.trim() || '未收到模型返回内容，请稍后重试。'
    updateMessage(assistantId, { content: finalText, isStreaming: false })
    enqueueSpeech(finalText, true)
    isSendingRef.current = false
    setLoading(false)
  }, [isLoading, isAuthenticated, touch, addMessage, updateMessage, setLoading, ttsEnabled, speakNext, user])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void sendMessage(input)
    }
  }

  const handleQuickBorrow = (item: RecentBorrowItem) => {
    const actionText = item.action === 'borrow' ? '借用' : '领用'
    const specText = item.spec ? `，规格：${item.spec}` : ''
    void sendMessage(`我想${actionText}${item.itemName}${specText}，物品ID为${item.itemId}。请先询问我需要的数量。`)
  }

  return (
    <div className="chat-panel">
      <div className="chat-stage">
        <MessageList messages={messages} isLoading={isLoading} />
      </div>

      <div className="composer-dock">
        {recentBorrowItems.length > 0 && (
          <div className="quick-borrow-bar" aria-label="物品快捷操作">
            <span className="quick-borrow-label">
              {recentBorrowItems.some(item => item.source === 'personal') ? '我的常用' : '热门领用'}
            </span>
            <div className="quick-borrow-list">
              {recentBorrowItems.map(item => (
                <button
                  key={`${item.action}-${item.itemId}`}
                  type="button"
                  className="quick-borrow-button"
                  onClick={() => handleQuickBorrow(item)}
                  disabled={isLoading}
                  title={`${item.action === 'borrow' ? '借用' : '领用'}${item.itemName}`}
                >
                  <span className={`quick-borrow-action quick-borrow-action-${item.action}`}>
                    {item.action === 'borrow' ? '借' : '领'}
                  </span>
                  <span className="quick-borrow-name">{item.itemName}</span>
                  {item.spec && <span className="quick-borrow-spec">{item.spec}</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="input-shell">
          <textarea
            value={input}
            onChange={e => { setInput(e.target.value); touch() }}
            onKeyDown={handleKeyDown}
            placeholder="按住语音开始物品领用流程"
            readOnly
            rows={1}
            className="sci-textarea"
            aria-label="输入指令"
            onInput={e => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 116) + 'px'
            }}
          />
          <button
            onClick={() => void sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="hud-button send-button"
            title="发送"
            aria-label="发送"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
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
