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
    <div className="animate-float-up" style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      alignItems: 'flex-start',
      marginBottom: 18,
      gap: 12,
      position: 'relative',
      zIndex: 1,
    }}>
      {!isUser && (
        <div className="sci-brand-mark" style={{ width: 48, height: 48, fontSize: 16, flexShrink: 0, marginTop: 2 }}>
          AI
        </div>
      )}

      <div style={{
        maxWidth: isUser ? '48%' : '54%',
        minWidth: 180,
        padding: '13px 18px',
        border: `1px solid ${isUser ? 'rgba(0,212,255,0.32)' : 'rgba(0,212,255,0.2)'}`,
        background: isUser
          ? 'linear-gradient(135deg, rgba(0,98,154,0.92), rgba(0,54,89,0.92))'
          : 'linear-gradient(135deg, rgba(10,30,45,0.96), rgba(5,18,29,0.94))',
        color: 'var(--text)',
        boxShadow: isUser ? '0 0 18px rgba(0,212,255,0.12)' : '0 10px 24px rgba(0,0,0,0.24)',
        borderRadius: 8,
        fontSize: 13,
        lineHeight: 1.7,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 14,
          marginBottom: 6,
          fontFamily: 'Rajdhani',
          letterSpacing: '0.06em',
          fontSize: 11,
        }}>
          <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>{isUser ? 'YOU' : 'ISD Assistant'}</span>
          <span style={{ color: 'var(--text-muted)' }}>{messageTime}</span>
        </div>
        {isUser ? (
          <div style={{ whiteSpace: 'pre-wrap' }}>
            {msg.content}
            {msg.isStreaming && (
              <span style={{
                display: 'inline-block',
                width: 2,
                height: 13,
                background: 'var(--cyan)',
                marginLeft: 3,
                verticalAlign: 'middle',
                animation: 'blink-cursor 1s step-end infinite',
              }} />
            )}
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
        <div style={{
          width: 40,
          height: 40,
          flexShrink: 0,
          marginTop: 8,
          color: 'var(--text)',
          border: '1px solid rgba(0,212,255,0.35)',
          borderRadius: '50%',
          background: 'rgba(12,28,42,0.82)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
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
    <div style={{ position: 'relative', height: '100%', overflowY: 'auto', padding: '38px 40px 18px', background: 'transparent' }}>
      {messages.length === 0 && (
        <div style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
          color: 'var(--text-muted)',
          position: 'relative',
          zIndex: 1,
        }}>
          <div className="sci-brand-mark" style={{ width: 72, height: 72, fontSize: 16 }}>ISD</div>
          <div className="sci-title" style={{ color: 'var(--cyan)', fontSize: 18 }}>SYSTEM STANDBY</div>
          <div style={{ fontSize: 13, letterSpacing: '0.08em' }}>等待指令输入，支持文本与语音交互。</div>
        </div>
      )}

      {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}

      {isLoading && !hasStreamingAssistant && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 18, position: 'relative', zIndex: 1 }}>
          <div className="sci-brand-mark" style={{ width: 48, height: 48, fontSize: 16, flexShrink: 0 }}>AI</div>
          <div style={{
            padding: '13px 16px',
            border: '1px solid rgba(0,212,255,0.22)',
            background: 'linear-gradient(135deg, rgba(18,34,45,0.92), rgba(7,16,24,0.94))',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            {[0, 0.2, 0.4].map(d => (
              <div key={d} style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--cyan)',
                animation: `pulse-ring 1.2s ease-in-out ${d}s infinite`,
              }} />
            ))}
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
