import React, { useRef, useEffect } from 'react'
import { Message } from '../../types'
import MarkdownRenderer from './MarkdownRenderer'

interface Props {
  messages: Message[]
  isLoading: boolean
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  const messageTime = new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour12: false })

  return (
    <div className={`message-row ${isUser ? 'message-row-user' : 'message-row-assistant'}`}>
      {!isUser && <div className="message-avatar">助</div>}

      <div className={`message-bubble ${isUser ? 'message-bubble-user' : 'message-bubble-assistant'}`}>
        <div className="message-meta">
          <span>{isUser ? '我' : '行小助'}</span>
          <span>{messageTime}</span>
        </div>
        {isUser ? (
          <div style={{ whiteSpace: 'pre-wrap' }}>
            {msg.content}
            {msg.isStreaming && <span className="stream-caret" />}
          </div>
        ) : (
          <MarkdownRenderer
            content={msg.content}
            highlightIndex={msg.highlightIndex}
            isStreaming={msg.isStreaming}
          />
        )}
      </div>

      {isUser && (
        <div className="message-avatar message-avatar-user">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z" />
          </svg>
        </div>
      )}
    </div>
  )
}

export default function MessageList({ messages, isLoading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const hasStreamingAssistant = messages.some(msg => msg.role === 'assistant' && msg.isStreaming)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="message-list">
      {messages.length === 0 && (
        <div className="empty-chat">
          <div className="empty-chat-mark">行小助</div>
          <div className="empty-chat-title">行小助待命</div>
          <div className="empty-chat-subtitle">请按住语音按钮开始对话。</div>
        </div>
      )}

      {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}

      {isLoading && !hasStreamingAssistant && (
        <div className="message-row message-row-assistant">
          <div className="message-avatar">助</div>
          <div className="typing-indicator" aria-label="正在思考">
            {[0, 0.2, 0.4].map(d => <span key={d} style={{ animationDelay: `${d}s` }} />)}
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
