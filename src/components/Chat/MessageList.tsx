import React, { useRef, useEffect } from 'react'
import { Message } from '../../types'
import MarkdownRenderer from './MarkdownRenderer'

interface Props {
  messages: Message[]
  isLoading: boolean
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'

  return (
    <div className="animate-float-up" style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 16,
      gap: 10,
    }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: 6, flexShrink: 0, marginTop: 2,
          background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,102,255,0.2))',
          border: '1px solid var(--cyan-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 8px var(--cyan-dim)',
        }}>
          <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 9, color: 'var(--cyan)', letterSpacing: '0.05em' }}>AI</span>
        </div>
      )}

      <div style={{
        maxWidth: '72%',
        padding: '10px 14px',
        borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
        fontSize: 13,
        lineHeight: 1.7,
        ...(isUser ? {
          background: 'linear-gradient(135deg, rgba(0,102,255,0.25), rgba(0,212,255,0.15))',
          border: '1px solid rgba(0,212,255,0.25)',
          color: 'var(--text)',
          whiteSpace: 'pre-wrap',
        } : {
          background: 'rgba(13,22,38,0.9)',
          border: '1px solid var(--border-bright)',
          color: 'var(--text)',
        }),
      }}>
        {isUser ? (
          <>
            {msg.content}
            {msg.isStreaming && (
              <span style={{
                display: 'inline-block', width: 2, height: 13,
                background: 'var(--cyan)', marginLeft: 3,
                verticalAlign: 'middle', animation: 'blink-cursor 1s step-end infinite',
              }} />
            )}
          </>
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
          width: 32, height: 32, borderRadius: 6, flexShrink: 0, marginTop: 2,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid var(--border-bright)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--text-dim)">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
      )}
    </div>
  )
}

export default function MessageList({ messages, isLoading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px' }}>
      {messages.length === 0 && (
        <div style={{
          height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16,
          color: 'var(--text-muted)',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,212,255,0.03)',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--text-muted)">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
            </svg>
          </div>
          <div style={{ fontFamily: 'Rajdhani', fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            有什么可以帮你的？
          </div>
        </div>
      )}
      {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
      {isLoading && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 6, flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,102,255,0.2))',
            border: '1px solid var(--cyan-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'Rajdhani', fontWeight: 700, fontSize: 9, color: 'var(--cyan)' }}>AI</span>
          </div>
          <div style={{
            padding: '12px 16px', borderRadius: '12px 12px 12px 4px',
            background: 'rgba(13,22,38,0.9)', border: '1px solid var(--border-bright)',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {[0, 0.2, 0.4].map(d => (
              <div key={d} style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--cyan-glow)',
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
