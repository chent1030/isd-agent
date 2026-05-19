import { ipcMain, BrowserWindow } from 'electron'
import * as dotenv from 'dotenv'
dotenv.config()

interface DifyChatArgs {
  query: string
  conversationId: string | null
  channel: string
  user: string
}

export function registerDifyHandlers() {
  ipcMain.handle(
    'dify:chat',
    async (event, { query, conversationId, channel, user }: DifyChatArgs) => {
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

      const url = new URL(baseUrl.endsWith('/') ? `${baseUrl}v1/chat-messages` : `${baseUrl}/v1/chat-messages`)
      const isHttps = url.protocol === 'https:'
      const transport = isHttps ? await import('https') : await import('http')

      return new Promise<{ conversationId: string; answer: string }>((resolve, reject) => {
        let settled = false
        const fail = (err: Error) => {
          if (settled) return
          settled = true
          win.webContents.send(channel, '[DONE]')
          reject(err)
        }

        const req = transport.request(
          {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: `${url.pathname}${url.search}`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
              'Content-Length': Buffer.byteLength(body),
            },
          },
          (res) => {
            let newConversationId = conversationId ?? ''
            let fullAnswer = ''
            let buffer = ''

            const processLine = (line: string) => {
              if (!line.startsWith('data: ')) return
              const data = line.slice(6).trim()
              if (data === '[DONE]') return

              try {
                const parsed = JSON.parse(data)
                if (parsed.event === 'message' || parsed.event === 'agent_message') {
                  const text = String(parsed.answer ?? '')
                  if (text) {
                    fullAnswer += text
                    win.webContents.send(channel, fullAnswer)
                  }
                  if (parsed.conversation_id) newConversationId = parsed.conversation_id
                } else if (parsed.event === 'message_end') {
                  if (parsed.conversation_id) newConversationId = parsed.conversation_id
                } else if (parsed.event === 'error') {
                  fail(new Error(parsed.message ?? 'Dify error'))
                }
              } catch {
                // Ignore malformed SSE payloads.
              }
            }

            res.on('data', (chunk: Buffer) => {
              buffer += chunk.toString()
              const lines = buffer.split(/\r?\n/)
              buffer = lines.pop() ?? ''
              for (const line of lines) processLine(line)
            })

            res.on('end', () => {
              if (settled) return
              if (buffer.trim()) processLine(buffer)
              if (settled) return
              settled = true
              win.webContents.send(channel, '[DONE]')
              resolve({ conversationId: newConversationId, answer: fullAnswer })
            })

            res.on('error', fail)
          },
        )

        req.on('error', fail)
        req.write(body)
        req.end()
      })
    },
  )
}
