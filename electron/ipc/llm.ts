import { ipcMain, BrowserWindow } from 'electron'
import * as dotenv from 'dotenv'
import {
  buildSkillsSystemPrompt,
  executeSkillScript,
  getSkillInfos,
  loadSkillContent,
} from './skills'
dotenv.config()

interface Message {
  role: string
  content: string
}

interface LangChainModules {
  ChatOpenAI: any
  HumanMessage: any
  AIMessage: any
  SystemMessage: any
  ToolMessage: any
  DynamicStructuredTool: any
  z: any
}

let langChainModulesPromise: Promise<LangChainModules> | null = null
const dynamicImport = new Function('modulePath', 'return import(modulePath)') as <T>(modulePath: string) => Promise<T>

async function loadLangChainModules(): Promise<LangChainModules> {
  if (!langChainModulesPromise) {
    langChainModulesPromise = (async () => {
      const [{ ChatOpenAI }, messagesMod, toolsMod, zodMod] = await Promise.all([
        dynamicImport<any>('@langchain/openai'),
        dynamicImport<any>('@langchain/core/messages'),
        dynamicImport<any>('@langchain/core/tools'),
        dynamicImport<any>('zod'),
      ])

      return {
        ChatOpenAI,
        HumanMessage: messagesMod.HumanMessage,
        AIMessage: messagesMod.AIMessage,
        SystemMessage: messagesMod.SystemMessage,
        ToolMessage: messagesMod.ToolMessage,
        DynamicStructuredTool: toolsMod.DynamicStructuredTool,
        z: zodMod.z,
      }
    })()
  }
  return langChainModulesPromise
}

function toText(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map(item => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object' && 'text' in item) {
          return String((item as { text?: unknown }).text ?? '')
        }
        return ''
      })
      .join('')
  }
  if (content == null) return ''
  return String(content)
}

function normalizeToolName(rawName: string, used: Set<string>): string {
  const base = rawName
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48)

  let name = base || 'skill_tool'
  if (!used.has(name)) {
    used.add(name)
    return name
  }

  let i = 1
  while (used.has(`${name}_${i}`)) i += 1
  name = `${name}_${i}`
  used.add(name)
  return name
}

function buildSystemPrompt(skillsBlock: string): string {
  return [
    '你是一个智能助手。',
    skillsBlock,
    '你可以通过工具调用 skills，并采用渐进式披露模式。',
    '流程要求：先调用 load_skill 获取该技能完整说明，再决定是否调用 run_skill。',
    '调用 run_skill 时，参数放在 params 对象中，例如：{"skillName":"query-employee","params":{"keyword":"张三"}}。',
    '拿到工具结果后，给用户清晰、简洁的中文回复。',
  ].filter(Boolean).join('\n\n')
}

export function registerLLMHandlers() {
  ipcMain.handle('llm:chat', async (
    event,
    { messages, channel, isAuthenticated }: { messages: Message[]; channel: string; isAuthenticated: boolean }
  ) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) throw new Error('No window found')

    const url = process.env.LLM_API_URL
    const key = process.env.LLM_API_KEY
    const model = process.env.LLM_MODEL || 'gpt-4o-mini'
    if (!url) throw new Error('LLM_API_URL not configured')

    try {
      const {
        ChatOpenAI,
        HumanMessage,
        AIMessage,
        SystemMessage,
        ToolMessage,
        DynamicStructuredTool,
        z,
      } = await loadLangChainModules()

      const skills = await getSkillInfos(isAuthenticated)
      const allowedSkills = new Map(skills.map(s => [s.name, s]))
      const availableSkillText = skills.length > 0
        ? skills.map(s => `- ${s.name}: ${s.description}`).join('\n')
        : '- (无可用技能)'

      const loadSkillTool = new DynamicStructuredTool({
        name: normalizeToolName('load_skill', new Set()),
        description: `Load a specialized skill by name. Available skills:\n${availableSkillText}`,
        schema: z.object({
          skillName: z.string().describe('Name of skill to load'),
        }),
        func: async (input: { skillName?: string }) => {
          const skillName = String(input?.skillName ?? '').trim()
          if (!skillName) return '技能名不能为空。'
          if (!allowedSkills.has(skillName)) return `技能不可用或无权限: ${skillName}`
          try {
            return await loadSkillContent(skillName)
          } catch (e: any) {
            return `技能加载失败(${skillName}): ${e?.message ?? String(e)}`
          }
        },
      })

      const runSkillTool = new DynamicStructuredTool({
        name: normalizeToolName('run_skill', new Set(['load_skill'])),
        description: 'Execute a loaded skill script with params.',
        schema: z.object({
          skillName: z.string().describe('Name of skill to execute'),
          params: z.record(z.any()).default({}).describe('参数对象'),
        }),
        func: async (input: { skillName?: string; params?: Record<string, unknown> }) => {
          const skillName = String(input?.skillName ?? '').trim()
          if (!skillName) return '技能名不能为空。'
          if (!allowedSkills.has(skillName)) return `技能不可用或无权限: ${skillName}`
          const params = input?.params && typeof input.params === 'object' ? input.params : {}
          try {
            const result = await executeSkillScript(skillName, params)
            return typeof result === 'string' ? result : JSON.stringify(result)
          } catch (e: any) {
            return `技能执行失败(${skillName}): ${e?.message ?? String(e)}`
          }
        },
      })

      const tools = [loadSkillTool, runSkillTool]

      const llm = new ChatOpenAI({
        model,
        apiKey: key || 'EMPTY_KEY',
        temperature: 0.2,
        configuration: { baseURL: url },
      })

      const modelWithTools = tools.length > 0 ? llm.bindTools(tools) : llm
      const skillsBlock = await buildSkillsSystemPrompt(isAuthenticated)
      const systemPrompt = buildSystemPrompt(skillsBlock)

      const lcMessages: any[] = [new SystemMessage(systemPrompt)]
      for (const msg of messages) {
        if (!msg?.content) continue
        if (msg.role === 'user') lcMessages.push(new HumanMessage(msg.content))
        else if (msg.role === 'assistant') lcMessages.push(new AIMessage(msg.content))
      }

      let aiMessage = await modelWithTools.invoke(lcMessages)
      let loop = 0
      while (loop < 6) {
        const toolCalls: Array<{ id?: string; name: string; args?: unknown }> =
          Array.isArray(aiMessage?.tool_calls) ? aiMessage.tool_calls : []
        if (toolCalls.length === 0) break

        lcMessages.push(aiMessage)

        for (const call of toolCalls) {
          const tool = tools.find(t => t.name === call.name)
          const args = call.args && typeof call.args === 'object'
            ? (call.args as Record<string, unknown>)
            : {}
          const skillName = typeof args.skillName === 'string' ? args.skillName : ''
          if (call.name === 'load_skill') {
            win.webContents.send(channel, `\n[加载技能: ${skillName || '(未指定)'}]\n`)
          } else if (call.name === 'run_skill') {
            win.webContents.send(channel, `\n[执行技能: ${skillName || '(未指定)'}]\n`)
          } else {
            win.webContents.send(channel, `\n[调用工具: ${call.name}]\n`)
          }

          let toolResult = ''
          if (!tool) {
            toolResult = `未找到可用工具: ${call.name}`
          } else {
            try {
              toolResult = await tool.invoke(args as Record<string, unknown>)
            } catch (e: any) {
              toolResult = `工具调用失败: ${e?.message ?? String(e)}`
            }
          }

          lcMessages.push(new ToolMessage({
            tool_call_id: call.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            content: toolResult,
          }))
        }

        aiMessage = await modelWithTools.invoke(lcMessages)
        loop += 1
      }

      const finalText = toText(aiMessage?.content).trim() || '没有可返回的内容。'
      win.webContents.send(channel, finalText)
      win.webContents.send(channel, '[DONE]')
    } catch (e: any) {
      win.webContents.send(channel, `[LLM 错误] ${e?.message ?? String(e)}`)
      win.webContents.send(channel, '[DONE]')
    }
  })
}
