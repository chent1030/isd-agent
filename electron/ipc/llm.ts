import { ipcMain, BrowserWindow } from 'electron'
import axios from 'axios'
import * as dotenv from 'dotenv'
import { getSkillsAsTools, executeSkill } from './skills'
dotenv.config()

interface Message {
  role: string
  content: string | object
}

// 递归处理 tool_use：LLM 返回 tool_use → 执行 skill → 把结果作为 tool_result 再次调用 LLM
async function chatWithTools(
  messages: Message[],
  url: string,
  headers: Record<string, string>,
  onChunk: (chunk: string) => void,
  depth = 0
): Promise<void> {
  if (depth > 5) return // 防止无限循环

  const tools = getSkillsAsTools()

  // 先用非流式请求检测是否有 tool_use（流式 + tool_use 处理复杂，分两步）
  const checkResp = await axios.post(
    url,
    { messages, tools: tools.length > 0 ? tools : undefined, stream: false },
    { headers, timeout: 60000 }
  )

  const respData = checkResp.data
  const stopReason = respData.stop_reason ?? respData.finish_reason ?? ''
  const content = respData.content ?? respData.choices?.[0]?.message?.content ?? ''

  // 判断是否触发了 tool_use
  const toolUseBlocks = Array.isArray(respData.content)
    ? respData.content.filter((b: any) => b.type === 'tool_use')
    : []

  if (toolUseBlocks.length > 0 && (stopReason === 'tool_use' || stopReason === 'tool_calls')) {
    // 先把 LLM 的 assistant 消息（含 tool_use）加入历史
    const assistantMsg: Message = { role: 'assistant', content: respData.content }

    // 执行所有 tool_use
    const toolResults: object[] = []
    for (const block of toolUseBlocks) {
      onChunk(`\n[调用技能: ${block.name}]\n`)
      try {
        const result = await executeSkill(block.name, block.input ?? {})
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: result,
        })
      } catch (e: any) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: `Error: ${e?.message ?? 'unknown'}`,
          is_error: true,
        })
      }
    }

    // 把 tool_result 加入消息，再次调用 LLM（流式输出最终回答）
    const nextMessages: Message[] = [
      ...messages,
      assistantMsg,
      { role: 'user', content: toolResults },
    ]
    return chatWithTools(nextMessages, url, headers, onChunk, depth + 1)
  }

  // 没有 tool_use，直接流式输出（或把非流式结果分块发出）
  const textContent = typeof content === 'string'
    ? content
    : Array.isArray(content)
      ? content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('')
      : ''

  if (textContent) {
    // 模拟流式：按句子分块发送
    const chunks = textContent.match(/[\s\S]{1,30}/g) ?? [textContent]
    for (const chunk of chunks) {
      onChunk(chunk)
      await new Promise(r => setTimeout(r, 8))
    }
  }
}

export function registerLLMHandlers() {
  ipcMain.handle('llm:chat', async (event, { messages, channel }: { messages: Message[], channel: string }) => {
    const url = process.env.LLM_API_URL
    const key = process.env.LLM_API_KEY
    if (!url) throw new Error('LLM_API_URL not configured')

    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) throw new Error('No window found')

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
    }

    await chatWithTools(
      messages,
      url,
      headers,
      (chunk) => win.webContents.send(channel, chunk),
    )

    win.webContents.send(channel, '[DONE]')
  })
}
