import React, { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#00d4ff22',
    primaryTextColor: '#c8d8f0',
    primaryBorderColor: '#00d4ff44',
    lineColor: '#00d4ff88',
    secondaryColor: '#0d1626',
    tertiaryColor: '#0d1626',
    background: '#0d1626',
    mainBkg: '#0d1626',
    nodeBorder: '#00d4ff44',
    clusterBkg: '#0d162688',
    titleColor: '#00d4ff',
    edgeLabelBackground: '#0d1626',
    fontFamily: 'Rajdhani, monospace',
  },
})

let mermaidCounter = 0

function MermaidBlock({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const id = useRef(`mermaid-${++mermaidCounter}`)

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    el.innerHTML = ''
    mermaid.render(id.current, code).then(({ svg }) => {
      el.innerHTML = svg
    }).catch(() => {
      el.innerHTML = `<pre style="color:var(--amber);font-size:11px">${code}</pre>`
    })
  }, [code])

  return (
    <div
      ref={ref}
      style={{
        margin: '12px 0',
        padding: '16px',
        background: 'rgba(0,212,255,0.03)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        overflowX: 'auto',
      }}
    />
  )
}

interface Props {
  content: string
  highlightIndex?: number
  isStreaming?: boolean
}

function splitSentences(text: string): string[] {
  return text.split(/(?<=[。！？\n])/).filter(Boolean)
}

export default function MarkdownRenderer({ content, highlightIndex, isStreaming }: Props) {
  const sentences = splitSentences(content)

  // 如果有 TTS 高亮，用纯文本模式渲染（逐句高亮）
  if (highlightIndex !== undefined) {
    return (
      <div style={{ fontSize: 13, lineHeight: 1.8 }}>
        {sentences.map((s, i) => (
          <span key={i} style={{
            transition: 'background 0.3s',
            ...(i === highlightIndex ? {
              background: 'rgba(0,212,255,0.15)',
              borderRadius: 3,
              padding: '0 2px',
            } : {}),
          }}>{s}</span>
        ))}
        {isStreaming && <span style={{
          display: 'inline-block', width: 2, height: 13,
          background: 'var(--cyan)', marginLeft: 3,
          verticalAlign: 'middle', animation: 'blink-cursor 1s step-end infinite',
        }} />}
      </div>
    )
  }

  return (
    <div className="md-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ className, children, ...props }) {
            const lang = /language-(\w+)/.exec(className || '')?.[1]
            const code = String(children).replace(/\n$/, '')
            if (lang === 'mermaid') return <MermaidBlock code={code} />
            return (
              <code className={className} {...props}
                style={{
                  background: 'rgba(0,212,255,0.06)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  padding: '1px 5px',
                  fontSize: '0.88em',
                  fontFamily: '"JetBrains Mono", monospace',
                  color: 'var(--cyan)',
                }}>
                {children}
              </code>
            )
          },
          pre({ children }) {
            return (
              <pre style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '12px 16px',
                overflowX: 'auto',
                fontSize: 12,
                lineHeight: 1.6,
                fontFamily: '"JetBrains Mono", monospace',
                margin: '10px 0',
              }}>
                {children}
              </pre>
            )
          },
          table({ children }) {
            return (
              <div style={{ overflowX: 'auto', margin: '10px 0' }}>
                <table style={{
                  borderCollapse: 'collapse', width: '100%',
                  fontSize: 12, fontFamily: 'Noto Sans SC',
                }}>
                  {children}
                </table>
              </div>
            )
          },
          th({ children }) {
            return <th style={{
              padding: '6px 12px',
              background: 'rgba(0,212,255,0.08)',
              border: '1px solid var(--border)',
              color: 'var(--cyan)', fontWeight: 600,
              textAlign: 'left', fontSize: 11,
              letterSpacing: '0.05em',
            }}>{children}</th>
          },
          td({ children }) {
            return <td style={{
              padding: '6px 12px',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}>{children}</td>
          },
          blockquote({ children }) {
            return (
              <blockquote style={{
                borderLeft: '3px solid var(--cyan-dim)',
                margin: '8px 0',
                paddingLeft: 12,
                color: 'var(--text-dim)',
                fontStyle: 'italic',
              }}>
                {children}
              </blockquote>
            )
          },
          a({ href, children }) {
            return <a href={href} target="_blank" rel="noreferrer"
              style={{ color: 'var(--cyan)', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>
              {children}
            </a>
          },
          h1: ({ children }) => <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--cyan)', margin: '14px 0 8px', fontFamily: 'Rajdhani', letterSpacing: '0.05em' }}>{children}</h1>,
          h2: ({ children }) => <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--cyan)', margin: '12px 0 6px', fontFamily: 'Rajdhani' }}>{children}</h2>,
          h3: ({ children }) => <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: '10px 0 4px' }}>{children}</h3>,
          ul: ({ children }) => <ul style={{ paddingLeft: 18, margin: '6px 0', lineHeight: 1.8 }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ paddingLeft: 18, margin: '6px 0', lineHeight: 1.8 }}>{children}</ol>,
          li: ({ children }) => <li style={{ color: 'var(--text)', marginBottom: 2 }}>{children}</li>,
          p: ({ children }) => <p style={{ margin: '6px 0', lineHeight: 1.8 }}>{children}</p>,
          hr: () => <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />,
        }}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span style={{
          display: 'inline-block', width: 2, height: 13,
          background: 'var(--cyan)', marginLeft: 3,
          verticalAlign: 'middle', animation: 'blink-cursor 1s step-end infinite',
        }} />
      )}
    </div>
  )
}
