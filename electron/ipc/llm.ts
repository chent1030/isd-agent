import { ipcMain, BrowserWindow } from 'electron'
import axios from 'axios'
import * as dotenv from 'dotenv'
import { buildSkillsSystemPrompt, loadSkillContent, executeSkillScript } from './skills'
dotenv.config()

interface Message {
  role: string
  content: string
}

export function registerLLMHandlers() {
  ipcMain.handle('llm:chat', async (
    event,
    { messages, channel, isAuthenticated }: { messages: Message[]; channel: string; isAuthenticated: boolean }
  ) => {
    const url = process.env.LLM_API_URL
    const key = process.env.LLM_API_KEY
    if (!url) throw new Error('LLM_API_URL not configured')

    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) throw new Error('No window found')

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
    }

    // 构建 system prompt，注入可用 skills 列表（只有名称+描述，不注入正文）
    const skillsBlock = await buildSkillsSystemPrompt(isAuthenticated)
    const systemPrompt = [
      '你是一个智能助手。',
      skillsBlock,
      skillsBlock
        ? '当用户的需求匹配某个 skill 时，先回复 <use_skill name="skill名称"/> 让系统加载该 skill 的完整内容，再执行。'
        : '',
    ].filter(Boolean).join('\n\n')

    const fullMessages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ]

    // 流式请求
    const resp = await axios.post(
      url,
      { messages: fullMessages, stream: true },
      { headers, responseType: 'stream', timeout: 60000 }
    )

    let buffer = ''
    let pendingSkillName: string | null = null

    await new Promise<void>((resolve, reject) => {
      resp.data.on('data', async (chunk: Buffer) => {
        buffer += chunk.toString()
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') { resolve(); return }

          try {
            const json = JSON.parse(data)
            const text: string =
              json.choices?.[0]?.delta?.content ??
              json.delta?.text ?? ''

            if (!text) continue

            // 检测 <use_skill name="..."/> 标记
            const skillMatch = text.match(/<use_skill name="([^"]+)"\s*\/>/)
            if (skillMatch) {
              pendingSkillName = skillMatch[1]
              win.webContents.send(channel, `\n[加载技能: ${pendingSkillName}]\n`)

              try {
                // 按需加载 skill 完整内容，追加到消息后再继续（此处简化：通知前端）
                const skillContent = await loadSkillContent(pendingSkillName)
                win.webContents.send(channel, `__SKILL_CONTENT__${skillContent}`)
              } catch (e: any) {
                win.webContents.send(channel, `[技能加载失败: ${e?.message}]\n`)
              }
              pendingSkillName = null
              continue
            }

            // 检测 <run_skill name="..." params='...'/>
            const runMatch = text.match(/<run_skill name="([^"]+)" params='([^']+)'\s*\/>/)
            if (runMatch) {
              const [, name, paramsStr] = runMatch
              win.webContents.send(channel, `\n[执行技能: ${name}]\n`)
              try {
                const params = JSON.parse(paramsStr)
                const result = await executeSkillScript(name, params)
                win.webContents.send(channel, `__SKILL_RESULT__${result}`)
              } catch (e: any) {
                win.webContents.send(channel, `[技能执行失败: ${e?.message}]\n`)
              }
              continue
            }

            win.webContents.send(channel, text)
          } catch {
            // 忽略解析错误
          }
        }
      })

      resp.data.on('end', resolve)
      resp.data.on('error', reject)
    })

    win.webContents.send(channel, '[DONE]')
  })
}
