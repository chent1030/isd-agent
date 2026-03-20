import { ipcMain, BrowserWindow } from 'electron'
import * as dotenv from 'dotenv'
dotenv.config()

// Dify Chat API (SSE streaming)
// POST /v1/chat-messages
// Headers: Authorization: Bearer <API_KEY>
// Body: { query, inputs, conversation_id, response_mode: 'streaming', user }

export function registerDifyHandlers() {
  ipcMain.handle(
    'dify:chat',
    async (
      event,
      {
        query,
        conversationId,
        channel,
        user,
      }: { query: string; conversationId: string | null; channel: string; user: string }
    ) => {
      const baseUrl = process.env.DIFY_API_URL
      const apiKey = process.env.DIFY_API_KEY
      if (!baseUrl) throw new Error('DIFY_API_URL not configured')
      if (!apiKey) throw new Error('DIFY_API_KEY not configured')

      const win = BrowserWindow.fromWebContents(event.sender)
      if (!win) throw new Error('No window found')

      const body = JSON.stringify({
        query,
        inputs: {},
        response_mode: 'streaming',
        conversation_id: conversationId ?? '',
        user,
      })

      // 使用 Node.js 原生 https/http 处理 SSE，避免 axios 缓冲问题
      const url = new URL('/v1/chat-messages', baseUrl)
      const isHttps = url.protocol === 'https:'
      const transport = isHttps ? await import('https') : await import('http')

      return new Promise<{ conversationId: string }>((resolve, reject) => {
        const req = transport.request(
          {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
              'Content-Length': Buffer.byteLength(body),
            },
          },
          (res) => {
            let newConversationId = conversationId ?? ''
            let buffer = ''

            res.on('data', (chunk: Buffer) => {
              buffer += chunk.toString()
              const lines = buffer.split('\n')
              buffer = lines.pop() ?? '' // 保留不完整的行

              for (const line of lines) {
                if (!line.startsWith('data: ')) continue
                const data = line.slice(6).trim()
                if (data === '[DONE]') continue

                try {
                  const parsed = JSON.parse(data)
                  const event = parsed.event

                  if (event === 'message' || event === 'agent_message') {
                    const text: string = parsed.answer ?? ''
                    if (text) win.webContents.send(channel, text)
                    if (parsed.conversation_id) newConversationId = parsed.conversation_id
                  } else if (event === 'message_end') {
                    if (parsed.conversation_id) newConversationId = parsed.conversation_id
                  } else if (event === 'error') {
                    win.webContents.send(channel, '[DONE]')
                    reject(new Error(parsed.message ?? 'Dify error'))
                    return
                  }
                } catch {
                  // 忽略非 JSON 行
                }
              }
            })

            res.on('end', () => {
              win.webContents.send(channel, '[DONE]')
              resolve({ conversationId: newConversationId })
            })

            res.on('error', (err) => {
              win.webContents.send(channel, '[DONE]')
              reject(err)
            })
          }
        )

        req.on('error', (err) => {
          win.webContents.send(channel, '[DONE]')
          reject(err)
        })

        req.write(body)
        req.end()
      })
    }
  )
}
